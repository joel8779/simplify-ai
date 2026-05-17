from typing import List

from app.core.config import get_settings
from app.core.exceptions import NotFoundError, ValidationAppError
from app.core.logging import get_logger
from app.models.chat import ChatMessageInDB, ChatSessionInDB, MessageRole
from app.repositories.chat_repository import ChatMessageRepository, ChatSessionRepository
from app.repositories.document_repository import DocumentRepository
from app.schemas.chat import (
    ChatCompletionResponse,
    ChatMessageCreate,
    ChatMessageResponse,
    ChatSessionCreate,
    ChatSessionResponse,
    Citation,
)
from app.services.rag.orchestrator import RAGOrchestrator
from app.services.rag.retriever import RetrievedChunk

logger = get_logger(__name__)


class ChatService:
    def __init__(
        self,
        session_repo: ChatSessionRepository,
        message_repo: ChatMessageRepository,
        document_repo: DocumentRepository,
        rag: RAGOrchestrator,
    ) -> None:
        self._sessions = session_repo
        self._messages = message_repo
        self._documents = document_repo
        self._rag = rag

    async def create_session(
        self, user_id: str, payload: ChatSessionCreate
    ) -> ChatSessionResponse:
        await self._validate_document_scope(user_id, payload.document_ids)
        session = ChatSessionInDB(
            user_id=user_id,
            title=payload.title or "New chat",
            document_ids=payload.document_ids,
        )
        session = await self._sessions.create(session)
        return self._session_response(session)

    async def list_sessions(self, user_id: str) -> List[ChatSessionResponse]:
        sessions = await self._sessions.list_by_user(user_id)
        return [self._session_response(s) for s in sessions]

    async def get_messages(
        self, user_id: str, session_id: str
    ) -> List[ChatMessageResponse]:
        session = await self._sessions.find_by_id(session_id, user_id)
        if not session:
            raise NotFoundError("Chat session")
        messages = await self._messages.list_by_session(session_id, user_id)
        return [self._message_response(m) for m in messages]

    async def send_message(
        self,
        user_id: str,
        session_id: str,
        payload: ChatMessageCreate,
    ) -> ChatCompletionResponse:
        session = await self._sessions.find_by_id(session_id, user_id)
        if not session:
            raise NotFoundError("Chat session")

        document_ids = payload.document_ids or session.document_ids
        await self._validate_document_scope(user_id, document_ids)

        if not document_ids:
            raise ValidationAppError(
                "At least one indexed document must be attached to send a message"
            )

        # History before persisting the new turn (avoids duplicating the user message)
        history = await self._build_history(session_id, user_id)

        user_message = ChatMessageInDB(
            session_id=session_id,
            user_id=user_id,
            role=MessageRole.USER,
            content=payload.content,
            document_ids=document_ids,
        )
        user_message = await self._messages.create(user_message)

        logger.info(
            "RAG chat user=%s session=%s documents=%s",
            user_id,
            session_id,
            document_ids,
        )

        answer_text, chunks = await self._rag.generate_answer(
            user_id=user_id,
            query=payload.content,
            document_ids=document_ids,
            history=history,
        )

        citations = self._chunks_to_citations(chunks)
        assistant_message = ChatMessageInDB(
            session_id=session_id,
            user_id=user_id,
            role=MessageRole.ASSISTANT,
            content=answer_text,
            document_ids=document_ids,
            citations=[c.model_dump() for c in citations],
        )
        assistant_message = await self._messages.create(assistant_message)

        await self._sessions.update(
            session_id,
            user_id,
            {"document_ids": document_ids, "title": self._derive_title(session, payload)},
        )

        return ChatCompletionResponse(
            session_id=session_id,
            message=self._message_response(assistant_message),
            citations=citations,
        )

    async def _validate_document_scope(
        self, user_id: str, document_ids: List[str]
    ) -> None:
        if not document_ids:
            return
        found = await self._documents.find_many_by_ids(user_id, document_ids)
        if len(found) != len(document_ids):
            raise ValidationAppError(
                "One or more documents are invalid, not indexed, or not owned by you"
            )

    async def _build_history(self, session_id: str, user_id: str) -> List[dict]:
        settings = get_settings()
        messages = await self._messages.list_by_session(
            session_id, user_id, limit=settings.chat_history_limit
        )
        return [
            {"role": m.role.value, "content": m.content}
            for m in messages
        ]

    @staticmethod
    def _derive_title(session: ChatSessionInDB, payload: ChatMessageCreate) -> str:
        if session.title and session.title != "New chat":
            return session.title
        snippet = payload.content.strip()[:60]
        return snippet or "New chat"

    @staticmethod
    def _chunks_to_citations(chunks: List[RetrievedChunk]) -> List[Citation]:
        return [
            Citation(
                document_id=c.document_id,
                document_name=c.original_name,
                chunk_index=c.chunk_index,
                excerpt=c.content[:280],
                page_number=c.page_number,
            )
            for c in chunks
        ]

    @staticmethod
    def _session_response(session: ChatSessionInDB) -> ChatSessionResponse:
        return ChatSessionResponse(
            id=str(session.id),
            title=session.title,
            document_ids=session.document_ids,
            created_at=session.created_at,
            updated_at=session.updated_at,
        )

    @staticmethod
    def _message_response(message: ChatMessageInDB) -> ChatMessageResponse:
        citations = [Citation(**c) for c in message.citations]
        return ChatMessageResponse(
            id=str(message.id),
            role=message.role,
            content=message.content,
            document_ids=message.document_ids,
            citations=citations,
            created_at=message.created_at,
        )

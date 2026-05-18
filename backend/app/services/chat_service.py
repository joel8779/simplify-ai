import json
from typing import AsyncGenerator, List

from app.core.config import get_settings
from app.core.exceptions import NotFoundError, ValidationAppError
from app.core.logging import get_logger
from app.models.chat import ChatMessageInDB, ChatSessionInDB, MessageRole
from app.db.repositories.chat_repo import ChatMessageRepository, ChatSessionRepository
from app.db.repositories.document_repo import DocumentRepository
from app.schemas.chat import (
    ChatCompletionResponse,
    ChatMessageCreate,
    ChatMessageResponse,
    ChatSessionCreate,
    ChatSessionResponse,
    ChatSessionUpdate,
    ChatStatsResponse,
    Citation,
    ResponseMode,
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
        document_ids = self._normalize_document_ids(payload.document_ids)
        settings = get_settings()
        if await self._sessions.count_by_user(user_id) >= settings.max_chats_per_user:
            raise ValidationAppError(
                f"You have reached the limit of {settings.max_chats_per_user} chats.",
                details={"limit": settings.max_chats_per_user},
            )
        self._validate_document_limit(document_ids)
        await self._validate_document_scope(user_id, document_ids)
        session = ChatSessionInDB(
            user_id=user_id,
            title=payload.title or "New chat",
            document_ids=document_ids,
        )
        session = await self._sessions.create(session)
        return self._session_response(session)

    async def list_sessions(self, user_id: str) -> List[ChatSessionResponse]:
        sessions = await self._sessions.list_by_user(user_id)
        message_counts = await self._messages.count_by_sessions(user_id)
        return [
            self._session_response(s, message_counts.get(str(s.id), 0))
            for s in sessions
        ]

    async def update_session(
        self, user_id: str, session_id: str, payload: ChatSessionUpdate
    ) -> ChatSessionResponse:
        existing = await self._sessions.find_by_id(session_id, user_id)
        if not existing:
            raise NotFoundError("Chat session")

        updates: dict = {}
        if payload.title is not None:
            updates["title"] = payload.title.strip()
        if payload.document_ids is not None:
            document_ids = self._normalize_document_ids(payload.document_ids)
            self._validate_document_limit(document_ids)
            await self._validate_document_scope(user_id, document_ids)
            updates["document_ids"] = document_ids

        if not updates:
            message_count = await self._messages.count_by_session(session_id, user_id)
            return self._session_response(existing, message_count)

        session = await self._sessions.update(session_id, user_id, updates)
        if not session:
            raise NotFoundError("Chat session")
        message_count = await self._messages.count_by_session(session_id, user_id)
        return self._session_response(session, message_count)

    async def delete_session(self, user_id: str, session_id: str) -> None:
        session = await self._sessions.find_by_id(session_id, user_id)
        if not session:
            raise NotFoundError("Chat session")
        await self._messages.delete_by_session(session_id, user_id)
        await self._sessions.delete(session_id, user_id)

    async def clear_history(self, user_id: str) -> None:
        await self._messages.delete_by_user(user_id)
        await self._sessions.delete_by_user(user_id)

    async def get_stats(self, user_id: str) -> ChatStatsResponse:
        return ChatStatsResponse(
            total_documents=await self._documents.count_by_user(user_id),
            total_chats=await self._sessions.count_by_user(user_id),
            total_messages=await self._messages.count_by_user(user_id),
        )

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

        document_ids = self._normalize_document_ids(
            payload.document_ids or session.document_ids
        )
        self._validate_document_limit(document_ids)
        await self._validate_document_scope(user_id, document_ids)
        await self._validate_message_limit(session_id, user_id)

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

        rag_answer = await self._rag.generate_answer(
            user_id=user_id,
            query=payload.content,
            document_ids=document_ids,
            history=history,
        )

        citations = (
            self._chunks_to_citations(rag_answer.chunks)
            if rag_answer.response_mode == ResponseMode.RAG
            else []
        )
        assistant_message = ChatMessageInDB(
            session_id=session_id,
            user_id=user_id,
            role=MessageRole.ASSISTANT,
            content=rag_answer.content,
            document_ids=document_ids,
            citations=[c.model_dump() for c in citations],
            response_mode=rag_answer.response_mode.value,
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
            response_mode=rag_answer.response_mode,
        )

    async def stream_message(
        self,
        user_id: str,
        session_id: str,
        payload: ChatMessageCreate,
    ) -> AsyncGenerator[str, None]:
        session = await self._sessions.find_by_id(session_id, user_id)
        if not session:
            raise NotFoundError("Chat session")

        document_ids = self._normalize_document_ids(
            payload.document_ids or session.document_ids
        )
        self._validate_document_limit(document_ids)
        await self._validate_document_scope(user_id, document_ids)
        await self._validate_message_limit(session_id, user_id)
        history = await self._build_history(session_id, user_id)

        user_message = ChatMessageInDB(
            session_id=session_id,
            user_id=user_id,
            role=MessageRole.USER,
            content=payload.content,
            document_ids=document_ids,
        )
        await self._messages.create(user_message)

        plan = await self._rag.stream_answer(
            user_id=user_id,
            query=payload.content,
            document_ids=document_ids,
            history=history,
        )

        citations = (
            self._chunks_to_citations(plan.chunks)
            if plan.response_mode == ResponseMode.RAG
            else []
        )

        content_parts: list[str] = []
        yield self._sse(
            "meta",
            {
                "session_id": session_id,
                "response_mode": plan.response_mode.value,
                "citations": [c.model_dump() for c in citations],
            },
        )

        async for token in plan.token_stream:
            content_parts.append(token)
            yield self._sse("delta", {"content": token})

        content = "".join(content_parts).strip()
        assistant_message = ChatMessageInDB(
            session_id=session_id,
            user_id=user_id,
            role=MessageRole.ASSISTANT,
            content=content,
            document_ids=document_ids,
            citations=[c.model_dump() for c in citations],
            response_mode=plan.response_mode.value,
        )
        assistant_message = await self._messages.create(assistant_message)

        await self._sessions.update(
            session_id,
            user_id,
            {"document_ids": document_ids, "title": self._derive_title(session, payload)},
        )

        response = ChatCompletionResponse(
            session_id=session_id,
            message=self._message_response(assistant_message),
            citations=citations,
            response_mode=plan.response_mode,
        )
        yield self._sse("done", response.model_dump(mode="json"))

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

    @staticmethod
    def _validate_document_limit(document_ids: List[str]) -> None:
        settings = get_settings()
        if len(document_ids) > settings.max_documents_per_chat:
            raise ValidationAppError(
                f"You can attach up to {settings.max_documents_per_chat} documents to a chat.",
                details={"limit": settings.max_documents_per_chat},
            )

    @staticmethod
    def _normalize_document_ids(document_ids: List[str]) -> List[str]:
        return list(dict.fromkeys(document_ids))

    async def _validate_message_limit(self, session_id: str, user_id: str) -> None:
        settings = get_settings()
        current_count = await self._messages.count_by_session(session_id, user_id)
        if current_count + 2 > settings.max_messages_per_chat:
            raise ValidationAppError(
                f"This chat has reached the limit of {settings.max_messages_per_chat} messages.",
                details={"limit": settings.max_messages_per_chat},
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
    def _session_response(
        session: ChatSessionInDB, message_count: int = 0
    ) -> ChatSessionResponse:
        return ChatSessionResponse(
            id=str(session.id),
            title=session.title,
            document_ids=session.document_ids,
            message_count=message_count,
            created_at=session.created_at,
            updated_at=session.updated_at,
        )

    @staticmethod
    def _message_response(message: ChatMessageInDB) -> ChatMessageResponse:
        citations = [Citation(**c) for c in message.citations]
        return ChatMessageResponse(
            id=str(message.id),
            session_id=message.session_id,
            role=message.role,
            content=message.content,
            document_ids=message.document_ids,
            citations=citations,
            response_mode=(
                ResponseMode(message.response_mode)
                if message.response_mode
                else None
            ),
            created_at=message.created_at,
        )

    @staticmethod
    def _sse(event: str, payload: dict) -> str:
        return f"event: {event}\ndata: {json.dumps(payload, default=str)}\n\n"

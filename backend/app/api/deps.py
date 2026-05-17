from typing import Annotated, AsyncGenerator

from fastapi import Depends, Header
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.exceptions import UnauthorizedError
from app.core.security import decode_access_token
from app.db.mongodb import get_database
from app.services.gemini_service import GeminiService
from app.models.user import UserInDB
from app.repositories.chat_repository import ChatMessageRepository, ChatSessionRepository
from app.repositories.document_repository import DocumentChunkRepository, DocumentRepository
from app.repositories.refresh_token_repository import RefreshTokenRepository
from app.repositories.user_repository import UserRepository
from app.services.auth_service import AuthService
from app.services.chat_service import ChatService
from app.services.document_service import DocumentService
from app.services.rag.embeddings import EmbeddingService
from app.services.rag.orchestrator import RAGOrchestrator
from app.services.rag.retriever import RAGRetriever
from app.services.rag.vector_store import VectorStore
from app.services.user_service import UserService

# ─── Infrastructure singletons (per-process) ─────────────────
_vector_store = VectorStore()
_embedding_service = EmbeddingService()
_gemini_service = GeminiService()


async def get_db() -> AsyncGenerator[AsyncIOMotorDatabase, None]:
    yield get_database()


# ─── Repositories ──────────────────────────────────────────────
def get_user_repo(db: Annotated[AsyncIOMotorDatabase, Depends(get_db)]) -> UserRepository:
    return UserRepository(db)


def get_refresh_repo(
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
) -> RefreshTokenRepository:
    return RefreshTokenRepository(db)


def get_document_repo(
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
) -> DocumentRepository:
    return DocumentRepository(db)


def get_chunk_repo(
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
) -> DocumentChunkRepository:
    return DocumentChunkRepository(db)


def get_session_repo(
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
) -> ChatSessionRepository:
    return ChatSessionRepository(db)


def get_message_repo(
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
) -> ChatMessageRepository:
    return ChatMessageRepository(db)


# ─── Services ──────────────────────────────────────────────────
def get_auth_service(
    user_repo: Annotated[UserRepository, Depends(get_user_repo)],
    refresh_repo: Annotated[RefreshTokenRepository, Depends(get_refresh_repo)],
) -> AuthService:
    return AuthService(user_repo, refresh_repo)


def get_user_service(
    user_repo: Annotated[UserRepository, Depends(get_user_repo)],
) -> UserService:
    return UserService(user_repo)


def get_document_service(
    document_repo: Annotated[DocumentRepository, Depends(get_document_repo)],
    chunk_repo: Annotated[DocumentChunkRepository, Depends(get_chunk_repo)],
) -> DocumentService:
    return DocumentService(
        document_repo, chunk_repo, _vector_store, _embedding_service
    )


def get_rag_orchestrator() -> RAGOrchestrator:
    retriever = RAGRetriever(_vector_store, _embedding_service)
    return RAGOrchestrator(retriever, _gemini_service)


def get_chat_service(
    session_repo: Annotated[ChatSessionRepository, Depends(get_session_repo)],
    message_repo: Annotated[ChatMessageRepository, Depends(get_message_repo)],
    document_repo: Annotated[DocumentRepository, Depends(get_document_repo)],
    rag: Annotated[RAGOrchestrator, Depends(get_rag_orchestrator)],
) -> ChatService:
    return ChatService(session_repo, message_repo, document_repo, rag)


# ─── Auth dependency ───────────────────────────────────────────
async def get_current_user(
    authorization: Annotated[str | None, Header()] = None,
    user_repo: UserRepository = Depends(get_user_repo),
) -> UserInDB:
    if not authorization or not authorization.startswith("Bearer "):
        raise UnauthorizedError("Missing bearer token")
    token = authorization.removeprefix("Bearer ").strip()
    try:
        payload = decode_access_token(token)
    except ValueError as exc:
        raise UnauthorizedError("Invalid access token") from exc

    user = await user_repo.find_by_id(str(payload["sub"]))
    if not user or not user.is_active:
        raise UnauthorizedError("User not found or inactive")
    return user


CurrentUser = Annotated[UserInDB, Depends(get_current_user)]

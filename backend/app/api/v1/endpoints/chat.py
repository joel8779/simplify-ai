from typing import List

from fastapi import APIRouter, Depends, status

from app.api.deps import CurrentUser, get_chat_service
from app.schemas.chat import (
    ChatCompletionResponse,
    ChatMessageCreate,
    ChatMessageResponse,
    ChatSessionCreate,
    ChatSessionResponse,
)
from app.services.chat_service import ChatService

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("/sessions", response_model=ChatSessionResponse, status_code=status.HTTP_201_CREATED)
async def create_session(
    payload: ChatSessionCreate,
    current_user: CurrentUser,
    chat_service: ChatService = Depends(get_chat_service),
) -> ChatSessionResponse:
    return await chat_service.create_session(str(current_user.id), payload)


@router.get("/sessions", response_model=List[ChatSessionResponse])
async def list_sessions(
    current_user: CurrentUser,
    chat_service: ChatService = Depends(get_chat_service),
) -> List[ChatSessionResponse]:
    return await chat_service.list_sessions(str(current_user.id))


@router.get("/sessions/{session_id}/messages", response_model=List[ChatMessageResponse])
async def get_messages(
    session_id: str,
    current_user: CurrentUser,
    chat_service: ChatService = Depends(get_chat_service),
) -> List[ChatMessageResponse]:
    return await chat_service.get_messages(str(current_user.id), session_id)


@router.post(
    "/sessions/{session_id}/messages",
    response_model=ChatCompletionResponse,
    status_code=status.HTTP_201_CREATED,
)
async def send_message(
    session_id: str,
    payload: ChatMessageCreate,
    current_user: CurrentUser,
    chat_service: ChatService = Depends(get_chat_service),
) -> ChatCompletionResponse:
    """
    Document-scoped RAG completion.

    Pass `document_ids` on each message to scope retrieval, or rely on
    session-level defaults set at session creation.
    """
    return await chat_service.send_message(
        str(current_user.id), session_id, payload
    )

# Phase 3: POST /sessions/{session_id}/messages/stream (SSE)

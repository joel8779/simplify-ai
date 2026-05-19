from typing import List

from fastapi import APIRouter, Depends, status
from fastapi.responses import StreamingResponse

from app.api.deps import CurrentUser, get_chat_service
from app.schemas.chat import (
    ChatCompletionResponse,
    ChatMessageCreate,
    ChatMessageResponse,
    ChatSessionCreate,
    ChatSessionResponse,
    ChatSessionUpdate,
    ChatStatsResponse,
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


@router.get("/stats", response_model=ChatStatsResponse)
async def get_chat_stats(
    current_user: CurrentUser,
    chat_service: ChatService = Depends(get_chat_service),
) -> ChatStatsResponse:
    return await chat_service.get_stats(str(current_user.id))


@router.patch("/sessions/{session_id}", response_model=ChatSessionResponse)
async def rename_session(
    session_id: str,
    payload: ChatSessionUpdate,
    current_user: CurrentUser,
    chat_service: ChatService = Depends(get_chat_service),
) -> ChatSessionResponse:
    return await chat_service.update_session(str(current_user.id), session_id, payload)


@router.delete("/sessions/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_session(
    session_id: str,
    current_user: CurrentUser,
    chat_service: ChatService = Depends(get_chat_service),
) -> None:
    await chat_service.delete_session(str(current_user.id), session_id)


@router.delete("/sessions", status_code=status.HTTP_204_NO_CONTENT)
async def clear_chat_history(
    current_user: CurrentUser,
    chat_service: ChatService = Depends(get_chat_service),
) -> None:
    await chat_service.clear_history(str(current_user.id))


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


@router.post("/sessions/{session_id}/messages/stream")
async def stream_message(
    session_id: str,
    payload: ChatMessageCreate,
    current_user: CurrentUser,
    chat_service: ChatService = Depends(get_chat_service),
) -> StreamingResponse:
    stream = await chat_service.stream_message(str(current_user.id), session_id, payload)
    return StreamingResponse(
        stream,
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )

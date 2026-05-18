from datetime import datetime
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field

from app.models.chat import MessageRole


class ResponseMode(str, Enum):
    RAG = "rag_mode"
    GENERAL = "general_mode"


class Citation(BaseModel):
    document_id: str
    document_name: str
    chunk_index: int
    excerpt: str
    page_number: Optional[int] = None


class ChatSessionCreate(BaseModel):
    title: Optional[str] = Field(default=None, max_length=200)
    document_ids: List[str] = Field(default_factory=list)


class ChatSessionResponse(BaseModel):
    id: str
    title: str
    document_ids: List[str]
    message_count: int = 0
    created_at: datetime
    updated_at: datetime


class ChatSessionUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=200)
    document_ids: Optional[List[str]] = None


class ChatStatsResponse(BaseModel):
    total_documents: int
    total_chats: int
    total_messages: int


class ChatMessageCreate(BaseModel):
    content: str = Field(min_length=1, max_length=32000)
    document_ids: List[str] = Field(
        default_factory=list,
        description="Scopes retrieval to these document IDs for this turn",
    )


class ChatMessageResponse(BaseModel):
    id: str
    session_id: str
    role: MessageRole
    content: str
    document_ids: List[str]
    citations: List[Citation] = Field(default_factory=list)
    response_mode: Optional[ResponseMode] = None
    created_at: datetime


class ChatCompletionResponse(BaseModel):
    session_id: str
    message: ChatMessageResponse
    citations: List[Citation] = Field(default_factory=list)
    response_mode: ResponseMode

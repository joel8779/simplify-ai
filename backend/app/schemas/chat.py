from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field

from app.models.chat import MessageRole


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
    created_at: datetime
    updated_at: datetime


class ChatMessageCreate(BaseModel):
    content: str = Field(min_length=1, max_length=32000)
    document_ids: List[str] = Field(
        default_factory=list,
        description="Scopes retrieval to these document IDs for this turn",
    )


class ChatMessageResponse(BaseModel):
    id: str
    role: MessageRole
    content: str
    document_ids: List[str]
    citations: List[Citation] = Field(default_factory=list)
    created_at: datetime


class ChatCompletionResponse(BaseModel):
    session_id: str
    message: ChatMessageResponse
    citations: List[Citation] = Field(default_factory=list)

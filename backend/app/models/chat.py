from datetime import datetime
from enum import Enum
from typing import List, Optional

from pydantic import Field

from app.models.common import MongoModel, utc_now


class MessageRole(str, Enum):
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"


class ChatSessionInDB(MongoModel):
    user_id: str
    title: str = "New chat"
    document_ids: List[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)


class ChatMessageInDB(MongoModel):
    session_id: str
    user_id: str
    role: MessageRole
    content: str
    document_ids: List[str] = Field(default_factory=list)
    citations: List[dict] = Field(default_factory=list)
    response_mode: Optional[str] = None
    created_at: datetime = Field(default_factory=utc_now)


class RefreshTokenInDB(MongoModel):
    user_id: str
    token_hash: str
    expires_at: datetime
    created_at: datetime = Field(default_factory=utc_now)
    revoked: bool = False

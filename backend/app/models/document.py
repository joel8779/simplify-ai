from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import Field

from app.models.common import MongoModel, utc_now


class DocumentStatus(str, Enum):
    PROCESSING = "processing"
    INDEXED = "indexed"
    FAILED = "failed"


class DocumentInDB(MongoModel):
    user_id: str
    filename: str
    original_name: str
    mime_type: str
    size_bytes: int
    status: DocumentStatus = DocumentStatus.PROCESSING
    error_message: Optional[str] = None
    chunk_count: int = 0
    storage_provider: str = "supabase"
    storage_path: str
    file_url: Optional[str] = None
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)


class DocumentChunkInDB(MongoModel):
    user_id: str
    document_id: str
    chunk_index: int
    content: str
    vector_id: str
    page_number: Optional[int] = None
    created_at: datetime = Field(default_factory=utc_now)

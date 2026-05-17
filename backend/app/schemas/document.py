from datetime import datetime
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field


class ProcessingStatus(str, Enum):
    PROCESSING = "processing"
    INDEXED = "indexed"
    FAILED = "failed"


class DocumentResponse(BaseModel):
    id: str
    filename: str
    original_name: str
    mime_type: str
    size_bytes: int
    status: ProcessingStatus
    chunk_count: int
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class DocumentUploadResponse(BaseModel):
    uploaded: List[DocumentResponse]
    failed: List[dict]


class DocumentListResponse(BaseModel):
    items: List[DocumentResponse]
    total: int


class DocumentMetadata(BaseModel):
    id: str
    original_name: str
    mime_type: str
    size_bytes: int
    status: ProcessingStatus
    chunk_count: int
    created_at: datetime

from typing import List

from fastapi import APIRouter, Depends, File, UploadFile, status

from app.api.deps import CurrentUser, get_document_service
from app.core.logging import get_logger
from app.schemas.document import DocumentListResponse, DocumentResponse, DocumentUploadResponse
from app.services.document_service import DocumentService

router = APIRouter(prefix="/documents", tags=["documents"])
logger = get_logger(__name__)


@router.get("", response_model=DocumentListResponse)
async def list_documents(
    current_user: CurrentUser,
    document_service: DocumentService = Depends(get_document_service),
) -> DocumentListResponse:
    items = await document_service.list_documents(str(current_user.id))
    return DocumentListResponse(items=items, total=len(items))


@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: str,
    current_user: CurrentUser,
    document_service: DocumentService = Depends(get_document_service),
) -> DocumentResponse:
    return await document_service.get_document(str(current_user.id), document_id)


@router.post(
    "/upload",
    response_model=DocumentUploadResponse,
    status_code=status.HTTP_201_CREATED,
)
async def upload_documents(
    current_user: CurrentUser,
    files: List[UploadFile] = File(...),
    document_service: DocumentService = Depends(get_document_service),
) -> DocumentUploadResponse:
    logger.info(f"Upload request received from user {current_user.id}")
    logger.info(f"Files received: {len(files)}")
    for f in files:
        logger.info(f"  - {f.filename} ({f.content_type})")
    return await document_service.upload_documents(str(current_user.id), files)


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    document_id: str,
    current_user: CurrentUser,
    document_service: DocumentService = Depends(get_document_service),
) -> None:
    await document_service.delete_document(str(current_user.id), document_id)

import uuid
from pathlib import Path
from typing import List

from fastapi import UploadFile

from app.core.config import get_settings
from app.core.exceptions import (
    AppError,
    GeminiServiceError,
    NotFoundError,
    ValidationAppError,
)
from app.core.logging import get_logger
from app.models.document import DocumentInDB, DocumentStatus
from app.repositories.document_repository import DocumentChunkRepository, DocumentRepository
from app.schemas.document import DocumentResponse, DocumentUploadResponse
from app.services.rag.chunking import split_text
from app.services.rag.embeddings import EmbeddingService
from app.services.rag.vector_store import VectorStore
from app.utils.file_parsers import extract_text_from_file

logger = get_logger(__name__)


class DocumentService:
    def __init__(
        self,
        document_repo: DocumentRepository,
        chunk_repo: DocumentChunkRepository,
        vector_store: VectorStore,
        embedding_service: EmbeddingService,
    ) -> None:
        self._documents = document_repo
        self._chunks = chunk_repo
        self._vector_store = vector_store
        self._embeddings = embedding_service

    async def list_documents(self, user_id: str) -> List[DocumentResponse]:
        docs = await self._documents.list_by_user(user_id)
        return [self._to_response(d) for d in docs]

    async def get_document(self, user_id: str, document_id: str) -> DocumentResponse:
        doc = await self._documents.find_by_id(document_id, user_id)
        if not doc:
            raise NotFoundError("Document")
        return self._to_response(doc)

    async def upload_documents(
        self, user_id: str, files: List[UploadFile]
    ) -> DocumentUploadResponse:
        if not files:
            raise ValidationAppError("At least one file is required")

        settings = get_settings()
        upload_root = Path(settings.upload_dir) / user_id
        upload_root.mkdir(parents=True, exist_ok=True)

        uploaded: List[DocumentResponse] = []
        failed: List[dict] = []

        for file in files:
            try:
                doc_resp = await self._process_upload(user_id, file, upload_root)
                uploaded.append(doc_resp)
            except AppError as exc:
                logger.warning(
                    "Upload failed file=%s user=%s error=%s",
                    file.filename,
                    user_id,
                    exc.message,
                )
                failed.append({"filename": file.filename, "error": exc.message})
            except Exception as exc:  # noqa: BLE001
                logger.exception(
                    "Unexpected upload error file=%s user=%s", file.filename, user_id
                )
                failed.append({"filename": file.filename, "error": str(exc)})

        logger.info(
            "Upload batch complete user=%s uploaded=%s failed=%s",
            user_id,
            len(uploaded),
            len(failed),
        )
        return DocumentUploadResponse(uploaded=uploaded, failed=failed)

    async def delete_document(self, user_id: str, document_id: str) -> None:
        doc = await self._documents.find_by_id(document_id, user_id)
        if not doc:
            raise NotFoundError("Document")

        await self._vector_store.delete_by_document(user_id, document_id)
        await self._chunks.delete_by_document(document_id, user_id)
        await self._documents.delete(document_id, user_id)

        storage = Path(doc.storage_path)
        if storage.exists():
            storage.unlink()
        logger.info("Deleted document id=%s user=%s", document_id, user_id)

    async def _process_upload(
        self, user_id: str, file: UploadFile, upload_root: Path
    ) -> DocumentResponse:
        settings = get_settings()
        if not file.filename:
            raise ValidationAppError("Filename is required")

        ext = Path(file.filename).suffix.lower()
        if ext not in settings.allowed_extension_set:
            raise ValidationAppError(f"File type {ext} is not allowed")

        content = await file.read()
        if len(content) > settings.max_upload_bytes:
            raise ValidationAppError("File exceeds maximum upload size")

        stored_name = f"{uuid.uuid4()}{ext}"
        storage_path = upload_root / stored_name
        storage_path.write_bytes(content)

        document = DocumentInDB(
            user_id=user_id,
            filename=stored_name,
            original_name=file.filename,
            mime_type=file.content_type or "application/octet-stream",
            size_bytes=len(content),
            status=DocumentStatus.PROCESSING,
            storage_path=str(storage_path),
        )
        document = await self._documents.create(document)
        doc_id = str(document.id)

        logger.info(
            "Processing upload id=%s name=%s user=%s", doc_id, file.filename, user_id
        )

        try:
            chunk_count = await self._index_document(user_id, document, storage_path)
            updated = await self._documents.update(
                doc_id,
                user_id,
                {
                    "status": DocumentStatus.INDEXED.value,
                    "chunk_count": chunk_count,
                    "error_message": None,
                },
            )
        except (GeminiServiceError, ValidationAppError):
            raise
        except Exception as exc:  # noqa: BLE001
            await self._documents.update(
                doc_id,
                user_id,
                {"status": DocumentStatus.FAILED.value, "error_message": str(exc)[:500]},
            )
            logger.exception("Indexing failed document_id=%s", doc_id)
            raise GeminiServiceError(
                f"Failed to index document: {exc}",
                details={"document_id": doc_id},
            ) from exc

        if not updated:
            raise NotFoundError("Document")
        return self._to_response(updated)

    async def _index_document(
        self, user_id: str, document: DocumentInDB, path: Path
    ) -> int:
        doc_id = str(document.id)
        text = extract_text_from_file(path, document.mime_type)
        chunks = split_text(text)
        if not chunks:
            raise ValidationAppError("No extractable text in document")

        logger.info("Chunked document_id=%s into %s chunks", doc_id, len(chunks))
        embeddings = await self._embeddings.embed_documents(chunks)

        ids: list[str] = []
        metadatas: list[dict] = []
        mongo_chunks: list[dict] = []

        for idx, chunk_text in enumerate(chunks):
            chroma_id = f"{doc_id}_{idx}"
            ids.append(chroma_id)
            metadatas.append(
                {
                    "user_id": user_id,
                    "document_id": doc_id,
                    "chunk_index": idx,
                    "original_name": document.original_name,
                    "page_number": None,
                }
            )
            mongo_chunks.append(
                {
                    "user_id": user_id,
                    "document_id": doc_id,
                    "chunk_index": idx,
                    "content": chunk_text,
                    "chroma_id": chroma_id,
                }
            )

        await self._vector_store.upsert_chunks(
            user_id,
            ids=ids,
            embeddings=embeddings,
            documents=chunks,
            metadatas=metadatas,
        )
        await self._chunks.insert_many(mongo_chunks)
        logger.info("Indexed document_id=%s vectors=%s", doc_id, len(chunks))
        return len(chunks)

    @staticmethod
    def _to_response(doc: DocumentInDB) -> DocumentResponse:
        return DocumentResponse(
            id=str(doc.id),
            filename=doc.filename,
            original_name=doc.original_name,
            mime_type=doc.mime_type,
            size_bytes=doc.size_bytes,
            status=doc.status,
            chunk_count=doc.chunk_count,
            error_message=doc.error_message,
            created_at=doc.created_at,
            updated_at=doc.updated_at,
        )

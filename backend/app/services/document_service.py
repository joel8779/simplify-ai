import uuid
from pathlib import Path
from tempfile import NamedTemporaryFile
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
from app.db.repositories.document_repo import DocumentChunkRepository, DocumentRepository
from app.schemas.document import DocumentResponse, DocumentUploadResponse
from app.services.rag.chunking import split_pages
from app.services.rag.embeddings import EmbeddingService
from app.services.rag.vector_store import VectorStore
from app.services.storage_service import StorageService
from app.utils.file_parsers import parse_file

logger = get_logger(__name__)


class DocumentService:
    def __init__(
        self,
        document_repo: DocumentRepository,
        chunk_repo: DocumentChunkRepository,
        vector_store: VectorStore,
        embedding_service: EmbeddingService,
        storage_service: StorageService,
    ) -> None:
        self._documents = document_repo
        self._chunks = chunk_repo
        self._vector_store = vector_store
        self._embeddings = embedding_service
        self._storage = storage_service

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
        await self._storage.delete_file(doc.storage_path)
        await self._documents.delete(document_id, user_id)
        logger.info("Deleted document id=%s user=%s", document_id, user_id)

    async def _process_upload(
        self, user_id: str, file: UploadFile, upload_root: Path
    ) -> DocumentResponse:
        settings = get_settings()
        if not file.filename:
            raise ValidationAppError("Filename is required")

        content = await file.read()
        ext = self._storage.validate_upload(file.filename, len(content))
        mime_type = file.content_type or "application/octet-stream"

        stored_name = f"{uuid.uuid4()}{ext}"
        stored_file = await self._storage.upload_file(
            user_id=user_id,
            original_name=file.filename,
            content=content,
            content_type=mime_type,
        )

        document = DocumentInDB(
            user_id=user_id,
            filename=stored_name,
            original_name=file.filename,
            mime_type=mime_type,
            size_bytes=len(content),
            status=DocumentStatus.PROCESSING,
            storage_provider=stored_file.provider,
            storage_path=stored_file.path,
            file_url=stored_file.url,
        )
        try:
            document = await self._documents.create(document)
        except Exception:
            await self._storage.delete_file(stored_file.path)
            raise
        doc_id = str(document.id)

        logger.info(
            "Processing upload id=%s name=%s user=%s", doc_id, file.filename, user_id
        )

        temp_path: Path | None = None
        try:
            with NamedTemporaryFile(
                delete=False, suffix=ext, dir=upload_root
            ) as tmp:
                tmp.write(content)
                temp_path = Path(tmp.name)

            chunk_count = await self._index_document(user_id, document, temp_path)
            updated = await self._documents.update(
                doc_id,
                user_id,
                {
                    "status": DocumentStatus.INDEXED.value,
                    "chunk_count": chunk_count,
                    "error_message": None,
                },
            )
        except (GeminiServiceError, ValidationAppError) as exc:
            await self._documents.update(
                doc_id,
                user_id,
                {
                    "status": DocumentStatus.FAILED.value,
                    "error_message": exc.message[:500],
                },
            )
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
        finally:
            if temp_path and temp_path.exists():
                temp_path.unlink()

        if not updated:
            raise NotFoundError("Document")
        return self._to_response(updated)

    async def _index_document(
        self, user_id: str, document: DocumentInDB, path: Path
    ) -> int:
        parsed = parse_file(path, document.mime_type)
        if not parsed.text.strip():
            raise ValidationAppError("No text could be extracted from this file")

        chunks = split_pages(parsed.pages)
        if not chunks:
            raise ValidationAppError("No indexable text chunks were produced")

        doc_id = str(document.id)
        logger.info("Chunked document_id=%s into %s chunks", doc_id, len(chunks))

        texts = [chunk.content for chunk in chunks]
        vectors = await self._embeddings.embed_documents(texts)
        if len(vectors) != len(chunks):
            raise GeminiServiceError(
                "Embedding count mismatch",
                details={"expected": len(chunks), "received": len(vectors)},
            )

        chroma_ids = [f"{doc_id}_chunk_{chunk.chunk_index}" for chunk in chunks]
        metadatas = []
        for chunk in chunks:
            metadata = {
                "user_id": user_id,
                "document_id": doc_id,
                "chunk_index": chunk.chunk_index,
                "original_name": document.original_name,
                "filename": document.filename,
                "mime_type": document.mime_type,
            }
            if chunk.page_number is not None:
                metadata["page_number"] = chunk.page_number
            metadatas.append(metadata)

        vectors_inserted = False
        try:
            await self._vector_store.upsert_chunks(
                user_id,
                ids=chroma_ids,
                embeddings=vectors,
                documents=texts,
                metadatas=metadatas,
            )
            vectors_inserted = True

            await self._chunks.insert_many(
                [
                    {
                        "user_id": user_id,
                        "document_id": doc_id,
                        "chunk_index": chunk.chunk_index,
                        "content": chunk.content,
                        "chroma_id": chroma_id,
                        "page_number": chunk.page_number,
                    }
                    for chunk, chroma_id in zip(chunks, chroma_ids)
                ]
            )
        except Exception:
            if vectors_inserted:
                try:
                    await self._vector_store.delete_by_document(user_id, doc_id)
                except Exception:  # noqa: BLE001
                    logger.exception(
                        "Rollback vector cleanup failed document_id=%s user=%s",
                        doc_id,
                        user_id,
                    )
            raise

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
            storage_provider=doc.storage_provider,
            storage_path=doc.storage_path,
            file_url=doc.file_url,
            created_at=doc.created_at,
            updated_at=doc.updated_at,
        )

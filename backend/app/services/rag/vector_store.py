"""ChromaDB vector storage — per-user collections with document-scoped metadata."""

from __future__ import annotations

import asyncio
from typing import Any, List, Optional

import chromadb
from chromadb.config import Settings as ChromaSettings

from app.core.config import get_settings
from app.core.logging import get_logger

logger = get_logger(__name__)


class VectorStore:
    """
    Per-user Chroma collections: simplify_user_{user_id}
    Metadata: user_id, document_id, chunk_index, page_number, original_name
    """

    def __init__(self) -> None:
        settings = get_settings()
        self._client = chromadb.PersistentClient(
            path=settings.chroma_persist_dir,
            settings=ChromaSettings(anonymized_telemetry=False),
        )

    def _collection_name(self, user_id: str) -> str:
        safe_id = user_id.replace("-", "_")
        return f"simplify_user_{safe_id}"

    def _get_or_create_collection(self, user_id: str):
        return self._client.get_or_create_collection(
            name=self._collection_name(user_id),
            metadata={"hnsw:space": "cosine"},
        )

    async def upsert_chunks(
        self,
        user_id: str,
        *,
        ids: List[str],
        embeddings: List[List[float]],
        documents: List[str],
        metadatas: List[dict[str, Any]],
    ) -> None:
        collection = self._get_or_create_collection(user_id)

        def _upsert() -> None:
            collection.upsert(
                ids=ids,
                embeddings=embeddings,
                documents=documents,
                metadatas=metadatas,
            )

        await asyncio.to_thread(_upsert)
        logger.info(
            "Upserted %s vectors for user=%s collection=%s",
            len(ids),
            user_id,
            self._collection_name(user_id),
        )

    async def query(
        self,
        user_id: str,
        *,
        query_embedding: List[float],
        document_ids: List[str],
        top_k: Optional[int] = None,
    ) -> dict:
        settings = get_settings()
        k = top_k or settings.rag_top_k
        collection = self._get_or_create_collection(user_id)

        where_filter: dict[str, Any] | None = None
        if document_ids:
            where_filter = {"document_id": {"$in": document_ids}}

        def _query() -> dict:
            return collection.query(
                query_embeddings=[query_embedding],
                n_results=min(k, max(len(document_ids) * 10, k)) if document_ids else k,
                where=where_filter,
                include=["documents", "metadatas", "distances"],
            )

        return await asyncio.to_thread(_query)

    async def delete_by_document(self, user_id: str, document_id: str) -> None:
        collection = self._get_or_create_collection(user_id)

        def _delete() -> None:
            collection.delete(where={"document_id": document_id})

        await asyncio.to_thread(_delete)
        logger.info("Deleted vectors document_id=%s user=%s", document_id, user_id)

"""Pinecone-backed vector storage for the RAG pipeline."""

from __future__ import annotations

import asyncio
from typing import Any, List, Optional, Protocol

from app.core.config import get_settings
from app.core.exceptions import GeminiServiceError
from app.core.logging import get_logger
from app.integrations.pinecone import PineconeClient

logger = get_logger(__name__)


class VectorStoreBackend(Protocol):
    async def upsert_chunks(
        self,
        user_id: str,
        *,
        ids: List[str],
        embeddings: List[List[float]],
        documents: List[str],
        metadatas: List[dict[str, Any]],
    ) -> None:
        ...

    async def query(
        self,
        user_id: str,
        *,
        query_embedding: List[float],
        document_ids: List[str],
        top_k: Optional[int] = None,
    ) -> dict:
        ...

    async def delete_by_document(self, user_id: str, document_id: str) -> None:
        ...

    async def delete_by_user(self, user_id: str) -> None:
        ...


class PineconeVectorStore:
    """
    Pinecone dense-vector storage using existing Gemini embeddings.
    Metadata keeps document scope and citation fields filterable.
    """

    def __init__(self, client: PineconeClient | None = None) -> None:
        self._client = client or PineconeClient()
        settings = get_settings()
        self._dimension = settings.pinecone_dimension
        self._batch_size = settings.pinecone_upsert_batch_size

    async def upsert_chunks(
        self,
        user_id: str,
        *,
        ids: List[str],
        embeddings: List[List[float]],
        documents: List[str],
        metadatas: List[dict[str, Any]],
    ) -> None:
        self._validate_upsert_payload(ids, embeddings, documents, metadatas)
        index = self._client.index()
        namespace = self._client.namespace

        vectors = []
        for vector_id, embedding, document, metadata in zip(
            ids, embeddings, documents, metadatas
        ):
            safe_metadata = self._metadata_with_defaults(
                user_id=user_id,
                vector_id=vector_id,
                metadata=metadata,
                content=document,
            )
            vectors.append(
                {"id": vector_id, "values": embedding, "metadata": safe_metadata}
            )

        def _upsert() -> None:
            for start in range(0, len(vectors), self._batch_size):
                batch = vectors[start : start + self._batch_size]
                index.upsert(vectors=batch, namespace=namespace)

        try:
            await asyncio.to_thread(_upsert)
        except Exception as exc:  # noqa: BLE001
            logger.exception("Pinecone upsert failed user=%s vectors=%s", user_id, len(ids))
            raise GeminiServiceError(
                "Failed to upsert vectors into Pinecone",
                details={"user_id": user_id, "vector_count": len(ids)},
            ) from exc

        logger.info(
            "Upserted %s Pinecone vectors user=%s namespace=%s",
            len(ids),
            user_id,
            namespace,
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
        index = self._client.index()
        namespace = self._client.namespace
        filter_expression = self._build_filter(user_id, document_ids)

        def _query() -> Any:
            return index.query(
                vector=query_embedding,
                top_k=k,
                namespace=namespace,
                filter=filter_expression,
                include_metadata=True,
            )

        try:
            results = await asyncio.to_thread(_query)
        except Exception as exc:  # noqa: BLE001
            logger.exception("Pinecone retrieval failed user=%s", user_id)
            raise GeminiServiceError(
                "Failed to retrieve vectors from Pinecone",
                details={"user_id": user_id, "document_ids": document_ids},
            ) from exc

        return self._to_retriever_results(results)

    async def delete_by_document(self, user_id: str, document_id: str) -> None:
        await self._delete(filter_expression=self._build_filter(user_id, [document_id]))
        logger.info("Deleted Pinecone vectors document_id=%s user=%s", document_id, user_id)

    async def delete_by_user(self, user_id: str) -> None:
        await self._delete(filter_expression={"user_id": {"$eq": user_id}})
        logger.info("Deleted Pinecone vectors user=%s", user_id)

    async def _delete(self, *, filter_expression: dict[str, Any]) -> None:
        index = self._client.index()
        namespace = self._client.namespace

        def _delete() -> None:
            index.delete(filter=filter_expression, namespace=namespace)

        try:
            await asyncio.to_thread(_delete)
        except Exception as exc:  # noqa: BLE001
            logger.exception("Pinecone delete failed filter=%s", filter_expression)
            raise GeminiServiceError(
                "Failed to delete vectors from Pinecone",
                details={"filter": filter_expression},
            ) from exc

    def _validate_upsert_payload(
        self,
        ids: List[str],
        embeddings: List[List[float]],
        documents: List[str],
        metadatas: List[dict[str, Any]],
    ) -> None:
        expected = len(ids)
        if not (expected == len(embeddings) == len(documents) == len(metadatas)):
            raise GeminiServiceError(
                "Vector payload count mismatch",
                details={
                    "ids": len(ids),
                    "embeddings": len(embeddings),
                    "documents": len(documents),
                    "metadatas": len(metadatas),
                },
            )
        bad_dimensions = [
            {"id": vector_id, "dimension": len(vector)}
            for vector_id, vector in zip(ids, embeddings)
            if len(vector) != self._dimension
        ]
        if bad_dimensions:
            raise GeminiServiceError(
                "Embedding dimension mismatch for Pinecone",
                details={
                    "expected_dimension": self._dimension,
                    "bad_vectors": bad_dimensions[:5],
                },
            )

    @staticmethod
    def _metadata_with_defaults(
        *,
        user_id: str,
        vector_id: str,
        metadata: dict[str, Any],
        content: str,
    ) -> dict[str, Any]:
        document_id = str(metadata.get("document_id") or "")
        if not document_id:
            raise GeminiServiceError(
                "Missing document_id metadata for vector",
                details={"vector_id": vector_id},
            )

        chunk_index = metadata.get("chunk_index")
        if chunk_index is None:
            raise GeminiServiceError(
                "Missing chunk_index metadata for vector",
                details={"vector_id": vector_id, "document_id": document_id},
            )

        clean_metadata = {
            "user_id": str(metadata.get("user_id") or user_id),
            "document_id": document_id,
            "filename": str(
                metadata.get("filename")
                or metadata.get("original_name")
                or "Unknown document"
            ),
            "original_name": str(
                metadata.get("original_name")
                or metadata.get("filename")
                or "Unknown document"
            ),
            "chunk_index": int(chunk_index),
            "content": content,
        }
        if metadata.get("page_number") is not None:
            clean_metadata["page_number"] = int(metadata["page_number"])
        if metadata.get("mime_type") is not None:
            clean_metadata["mime_type"] = str(metadata["mime_type"])

        return clean_metadata

    @staticmethod
    def _build_filter(user_id: str, document_ids: List[str]) -> dict[str, Any]:
        filter_expression: dict[str, Any] = {"user_id": {"$eq": user_id}}
        if document_ids:
            filter_expression["document_id"] = {"$in": document_ids}
        return filter_expression

    @staticmethod
    def _to_retriever_results(results: Any) -> dict:
        matches = getattr(results, "matches", None)
        if matches is None and isinstance(results, dict):
            matches = results.get("matches")
        matches = matches or []

        ids: list[str] = []
        docs: list[str] = []
        metas: list[dict[str, Any]] = []
        scores: list[float] = []

        for match in matches:
            if isinstance(match, dict):
                vector_id = match.get("id")
                score = match.get("score", 0.0)
                metadata = match.get("metadata") or {}
            else:
                vector_id = getattr(match, "id", None)
                score = getattr(match, "score", 0.0)
                metadata = getattr(match, "metadata", {}) or {}

            content = str(metadata.get("content") or "")
            if not vector_id or not content:
                logger.warning(
                    "Skipping Pinecone match with missing id/content metadata id=%s",
                    vector_id,
                )
                continue

            ids.append(str(vector_id))
            docs.append(content)
            metas.append(metadata)
            scores.append(float(score or 0.0))

        return {
            "ids": [ids],
            "documents": [docs],
            "metadatas": [metas],
            "scores": [scores],
        }


class VectorStore(PineconeVectorStore):
    """Compatibility alias for the app's existing vector-store dependency."""

    def __init__(self) -> None:
        super().__init__()
        logger.info("Vector store provider=pinecone")

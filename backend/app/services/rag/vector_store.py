"""Vector storage facade with Chroma fallback and Pinecone support."""

from __future__ import annotations

import asyncio
from typing import Any, List, Optional, Protocol

import chromadb
from chromadb.config import Settings as ChromaSettings

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


class ChromaVectorStore:
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
            "Upserted %s Chroma vectors user=%s collection=%s",
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
        logger.info("Deleted Chroma vectors document_id=%s user=%s", document_id, user_id)

    async def delete_by_user(self, user_id: str) -> None:
        collection_name = self._collection_name(user_id)

        def _delete() -> None:
            try:
                self._client.delete_collection(collection_name)
            except ValueError:
                logger.info("Chroma collection already absent user=%s", user_id)

        await asyncio.to_thread(_delete)
        logger.info("Deleted Chroma vectors user=%s", user_id)


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


class VectorStore:
    """Facade selected by VECTOR_STORE_PROVIDER while preserving the old API."""

    def __init__(self) -> None:
        settings = get_settings()
        self._provider = settings.vector_store_provider
        self._chroma = ChromaVectorStore()
        self._pinecone: PineconeVectorStore | None = None

        if self._provider in {"pinecone", "pinecone_with_chroma_fallback"}:
            self._pinecone = PineconeVectorStore()

        logger.info("Vector store provider=%s", self._provider)

    async def upsert_chunks(
        self,
        user_id: str,
        *,
        ids: List[str],
        embeddings: List[List[float]],
        documents: List[str],
        metadatas: List[dict[str, Any]],
    ) -> None:
        if self._provider == "chroma":
            await self._chroma.upsert_chunks(
                user_id,
                ids=ids,
                embeddings=embeddings,
                documents=documents,
                metadatas=metadatas,
            )
            return

        if not self._pinecone:
            raise GeminiServiceError("Pinecone vector store is not configured")

        try:
            await self._pinecone.upsert_chunks(
                user_id,
                ids=ids,
                embeddings=embeddings,
                documents=documents,
                metadatas=metadatas,
            )
        except GeminiServiceError:
            if self._provider != "pinecone_with_chroma_fallback":
                raise
            logger.warning(
                "Pinecone upsert failed in fallback mode; writing Chroma only user=%s",
                user_id,
            )
            await self._chroma.upsert_chunks(
                user_id,
                ids=ids,
                embeddings=embeddings,
                documents=documents,
                metadatas=metadatas,
            )
            return

        if self._provider == "pinecone_with_chroma_fallback":
            await self._chroma.upsert_chunks(
                user_id,
                ids=ids,
                embeddings=embeddings,
                documents=documents,
                metadatas=metadatas,
            )

    async def query(
        self,
        user_id: str,
        *,
        query_embedding: List[float],
        document_ids: List[str],
        top_k: Optional[int] = None,
    ) -> dict:
        if self._provider == "chroma":
            return await self._chroma.query(
                user_id,
                query_embedding=query_embedding,
                document_ids=document_ids,
                top_k=top_k,
            )

        if not self._pinecone:
            raise GeminiServiceError("Pinecone vector store is not configured")

        try:
            return await self._pinecone.query(
                user_id,
                query_embedding=query_embedding,
                document_ids=document_ids,
                top_k=top_k,
            )
        except GeminiServiceError:
            if self._provider != "pinecone_with_chroma_fallback":
                raise
            logger.warning("Falling back to Chroma retrieval user=%s", user_id)
            return await self._chroma.query(
                user_id,
                query_embedding=query_embedding,
                document_ids=document_ids,
                top_k=top_k,
            )

    async def delete_by_document(self, user_id: str, document_id: str) -> None:
        errors: list[Exception] = []
        chroma_deleted = False
        if self._provider in {"pinecone", "pinecone_with_chroma_fallback"}:
            if not self._pinecone:
                raise GeminiServiceError("Pinecone vector store is not configured")
            try:
                await self._pinecone.delete_by_document(user_id, document_id)
            except Exception as exc:  # noqa: BLE001
                errors.append(exc)

        if self._provider in {"chroma", "pinecone_with_chroma_fallback"}:
            try:
                await self._chroma.delete_by_document(user_id, document_id)
                chroma_deleted = True
            except Exception as exc:  # noqa: BLE001
                errors.append(exc)

        if errors:
            if self._provider == "pinecone_with_chroma_fallback" and chroma_deleted:
                logger.warning(
                    "Continuing after vector delete fallback document_id=%s user=%s errors=%s",
                    document_id,
                    user_id,
                    [str(e) for e in errors],
                )
                return
            raise GeminiServiceError(
                "Failed to delete one or more vector stores for document",
                details={"document_id": document_id, "errors": [str(e) for e in errors]},
            )

    async def delete_by_user(self, user_id: str) -> None:
        errors: list[Exception] = []
        chroma_deleted = False
        if self._provider in {"pinecone", "pinecone_with_chroma_fallback"}:
            if not self._pinecone:
                raise GeminiServiceError("Pinecone vector store is not configured")
            try:
                await self._pinecone.delete_by_user(user_id)
            except Exception as exc:  # noqa: BLE001
                errors.append(exc)

        if self._provider in {"chroma", "pinecone_with_chroma_fallback"}:
            try:
                await self._chroma.delete_by_user(user_id)
                chroma_deleted = True
            except Exception as exc:  # noqa: BLE001
                errors.append(exc)

        if errors:
            if self._provider == "pinecone_with_chroma_fallback" and chroma_deleted:
                logger.warning(
                    "Continuing after vector delete fallback user=%s errors=%s",
                    user_id,
                    [str(e) for e in errors],
                )
                return
            raise GeminiServiceError(
                "Failed to delete one or more vector stores for user",
                details={"user_id": user_id, "errors": [str(e) for e in errors]},
            )

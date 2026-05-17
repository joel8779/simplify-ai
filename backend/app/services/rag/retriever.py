"""Semantic retrieval with document-scoped filtering."""

from __future__ import annotations

from dataclasses import dataclass
from typing import List

from app.core.config import get_settings
from app.core.logging import get_logger
from app.services.rag.embeddings import EmbeddingService
from app.services.rag.vector_store import VectorStore

logger = get_logger(__name__)


@dataclass
class RetrievedChunk:
    document_id: str
    chunk_index: int
    content: str
    score: float
    page_number: int | None
    original_name: str
    chroma_id: str | None = None


class RAGRetriever:
    """
    Top-k semantic search scoped to document_ids.
    Ownership is enforced upstream via DocumentRepository before retrieval runs.
    """

    def __init__(
        self,
        vector_store: VectorStore,
        embedding_service: EmbeddingService,
    ) -> None:
        self._vector_store = vector_store
        self._embeddings = embedding_service

    async def retrieve(
        self,
        user_id: str,
        query: str,
        document_ids: List[str],
    ) -> List[RetrievedChunk]:
        if not document_ids:
            logger.warning("Retrieval skipped: no document_ids for user=%s", user_id)
            return []

        settings = get_settings()
        logger.info(
            "Retrieving top_k=%s for user=%s across %s documents",
            settings.rag_top_k,
            user_id,
            len(document_ids),
        )

        query_vector = await self._embeddings.embed_query(query)
        results = await self._vector_store.query(
            user_id,
            query_embedding=query_vector,
            document_ids=document_ids,
            top_k=settings.rag_top_k,
        )

        chunks = self._parse_results(results, document_ids, settings.rag_min_relevance_score)
        logger.info("Retrieved %s chunks for user=%s", len(chunks), user_id)
        return chunks

    @staticmethod
    def _parse_results(
        results: dict,
        allowed_document_ids: List[str],
        min_score: float,
    ) -> List[RetrievedChunk]:
        allowed = set(allowed_document_ids)
        chunks: List[RetrievedChunk] = []

        docs = results.get("documents") or [[]]
        metas = results.get("metadatas") or [[]]
        distances = results.get("distances") or [[]]
        ids = results.get("ids") or [[]]

        doc_list = docs[0] if docs else []
        meta_list = metas[0] if metas else []
        dist_list = distances[0] if distances else []
        id_list = ids[0] if ids else []

        for doc_text, meta, dist, chroma_id in zip(doc_list, meta_list, dist_list, id_list):
            if not meta:
                continue

            document_id = str(meta.get("document_id", ""))
            if document_id not in allowed:
                logger.debug("Skipping chunk outside allowed scope: %s", document_id)
                continue

            score = max(0.0, 1.0 - float(dist))
            if score < min_score:
                continue

            chunk_index = int(meta.get("chunk_index", 0))
            page_raw = meta.get("page_number")
            page_number = int(page_raw) if page_raw is not None else None

            chunks.append(
                RetrievedChunk(
                    document_id=document_id,
                    chunk_index=chunk_index,
                    content=doc_text or "",
                    score=round(score, 4),
                    page_number=page_number,
                    original_name=str(meta.get("original_name", "")),
                    chroma_id=chroma_id,
                )
            )

        chunks.sort(key=lambda c: c.score, reverse=True)
        return chunks

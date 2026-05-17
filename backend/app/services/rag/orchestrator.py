"""RAG orchestration: retrieval → prompt assembly → grounded Gemini generation."""

from __future__ import annotations

from typing import List

from app.core.exceptions import ValidationAppError
from app.core.logging import get_logger
from app.services.gemini_service import GeminiService
from app.services.rag.retriever import RAGRetriever, RetrievedChunk

logger = get_logger(__name__)

NO_CONTEXT_MESSAGE = (
    "No relevant passages were found in the selected documents for this question. "
    "Try rephrasing your question or attach different documents."
)


class RAGOrchestrator:
    """
    Coordinates retrieval → prompt assembly → LLM generation.
    Phase 3: add stream_answer() yielding tokens via GeminiClient streaming.
    """

    def __init__(
        self,
        retriever: RAGRetriever,
        gemini: GeminiService,
    ) -> None:
        self._retriever = retriever
        self._gemini = gemini

    @staticmethod
    def build_context_block(chunks: List[RetrievedChunk]) -> str:
        if not chunks:
            return "No document context was retrieved."
        parts = []
        for i, chunk in enumerate(chunks, start=1):
            page = f", page {chunk.page_number}" if chunk.page_number else ""
            parts.append(
                f"[{i}] {chunk.original_name} (chunk {chunk.chunk_index}{page})\n"
                f"{chunk.content}"
            )
        return "\n\n---\n\n".join(parts)

    @staticmethod
    def build_citation_metadata(chunks: List[RetrievedChunk]) -> list[dict]:
        """Structured citation payloads persisted on assistant messages."""
        return [
            {
                "document_id": c.document_id,
                "document_name": c.original_name,
                "chunk_index": c.chunk_index,
                "excerpt": c.content[:280],
                "page_number": c.page_number,
                "score": c.score,
            }
            for c in chunks
        ]

    async def generate_answer(
        self,
        *,
        user_id: str,
        query: str,
        document_ids: List[str],
        history: List[dict],
    ) -> tuple[str, List[RetrievedChunk]]:
        if not document_ids:
            raise ValidationAppError(
                "Attach at least one indexed document to scope this conversation"
            )

        chunks = await self._retriever.retrieve(user_id, query, document_ids)

        if not chunks:
            logger.warning(
                "No chunks retrieved user=%s documents=%s", user_id, document_ids
            )
            return NO_CONTEXT_MESSAGE, []

        context = self.build_context_block(chunks)
        history_for_llm = [
            {"role": m["role"], "content": m["content"]}
            for m in history
            if m.get("role") in ("user", "assistant")
        ]

        answer = await self._gemini.generate_grounded_reply(
            context_block=context,
            question=query,
            history=history_for_llm,
        )
        return answer, chunks

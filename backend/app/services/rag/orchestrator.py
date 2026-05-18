"""RAG orchestration: retrieval → prompt assembly → grounded Gemini generation."""

from __future__ import annotations

from dataclasses import dataclass
from typing import AsyncGenerator, List

from app.core.config import get_settings
from app.core.logging import get_logger
from app.schemas.chat import ResponseMode
from app.services.gemini_service import GeminiService
from app.services.rag.retriever import RAGRetriever, RetrievedChunk

logger = get_logger(__name__)


@dataclass(frozen=True)
class RAGAnswer:
    content: str
    chunks: List[RetrievedChunk]
    response_mode: ResponseMode


@dataclass(frozen=True)
class RAGStreamPlan:
    chunks: List[RetrievedChunk]
    response_mode: ResponseMode
    token_stream: AsyncGenerator[str, None]


class RAGOrchestrator:
    """
    Coordinates retrieval → prompt assembly → LLM generation.
    Supports both full-response generation and streaming generation.
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
    ) -> RAGAnswer:
        if not document_ids:
            answer = await self._gemini.generate_simple_reply(question=query)
            return RAGAnswer(
                content=answer,
                chunks=[],
                response_mode=ResponseMode.GENERAL,
            )

        chunks = await self._retriever.retrieve(user_id, query, document_ids)
        settings = get_settings()
        relevant_chunks = [
            chunk
            for chunk in chunks
            if chunk.score >= settings.rag_fallback_relevance_threshold
        ]
        history_for_llm = [
            {"role": m["role"], "content": m["content"]}
            for m in history
            if m.get("role") in ("user", "assistant")
        ]

        if not relevant_chunks:
            best_score = max((chunk.score for chunk in chunks), default=0.0)
            logger.info(
                "Falling back to general mode user=%s documents=%s retrieved=%s best_score=%.4f threshold=%.4f",
                user_id,
                document_ids,
                len(chunks),
                best_score,
                settings.rag_fallback_relevance_threshold,
            )
            answer = await self._gemini.generate_general_reply(
                question=query,
                history=history_for_llm,
            )
            return RAGAnswer(
                content=answer,
                chunks=[],
                response_mode=ResponseMode.GENERAL,
            )

        logger.info(
            "Using RAG mode user=%s documents=%s chunks=%s top_score=%.4f threshold=%.4f",
            user_id,
            document_ids,
            len(relevant_chunks),
            relevant_chunks[0].score,
            settings.rag_fallback_relevance_threshold,
        )

        context = self.build_context_block(relevant_chunks)
        answer = await self._gemini.generate_grounded_reply(
            context_block=context,
            question=query,
            history=history_for_llm,
        )
        return RAGAnswer(
            content=answer,
            chunks=relevant_chunks,
            response_mode=ResponseMode.RAG,
        )

    async def stream_answer(
        self,
        *,
        user_id: str,
        query: str,
        document_ids: List[str],
        history: List[dict],
    ) -> RAGStreamPlan:
        history_for_llm = [
            {"role": m["role"], "content": m["content"]}
            for m in history
            if m.get("role") in ("user", "assistant")
        ]

        if not document_ids:
            return RAGStreamPlan(
                chunks=[],
                response_mode=ResponseMode.GENERAL,
                token_stream=self._gemini.stream_simple_reply(
                    question=query,
                    history=history_for_llm,
                ),
            )

        chunks = await self._retriever.retrieve(user_id, query, document_ids)
        settings = get_settings()
        relevant_chunks = [
            chunk
            for chunk in chunks
            if chunk.score >= settings.rag_fallback_relevance_threshold
        ]

        if not relevant_chunks:
            best_score = max((chunk.score for chunk in chunks), default=0.0)
            logger.info(
                "Streaming general mode user=%s documents=%s retrieved=%s best_score=%.4f threshold=%.4f",
                user_id,
                document_ids,
                len(chunks),
                best_score,
                settings.rag_fallback_relevance_threshold,
            )
            return RAGStreamPlan(
                chunks=[],
                response_mode=ResponseMode.GENERAL,
                token_stream=self._gemini.stream_general_reply(
                    question=query,
                    history=history_for_llm,
                ),
            )

        context = self.build_context_block(relevant_chunks)
        return RAGStreamPlan(
            chunks=relevant_chunks,
            response_mode=ResponseMode.RAG,
            token_stream=self._gemini.stream_grounded_reply(
                context_block=context,
                question=query,
                history=history_for_llm,
            ),
        )

"""Centralized Gemini service — chat completion helpers for RAG orchestration."""

from __future__ import annotations

from typing import List

from app.core.logging import get_logger
from app.integrations.gemini import GeminiClient

logger = get_logger(__name__)

RAG_SYSTEM_INSTRUCTION = """You are Simplify, an AI assistant for document-grounded Q&A.

Rules:
- Answer ONLY using the document context provided in the user's message.
- If the context is insufficient, say you cannot find that information in the selected documents.
- Reference sources by their bracketed index numbers (e.g. [1], [2]) when citing facts.
- Do not invent information outside the provided context.
- Be concise, accurate, and professional."""


class GeminiService:
    """High-level Gemini operations used by the RAG orchestrator."""

    def __init__(self, client: GeminiClient | None = None) -> None:
        self._client = client or GeminiClient()

    async def generate_grounded_reply(
        self,
        *,
        context_block: str,
        question: str,
        history: List[dict[str, str]],
    ) -> str:
        """
        Generate an assistant reply given retrieved context and conversation history.
        History must NOT include the current user turn (orchestrator adds it).
        """
        user_message = (
            f"Document context:\n{context_block}\n\n"
            f"Question: {question}\n\n"
            "Answer using only the context above. Cite sources with [n] notation."
        )
        logger.info("Generating grounded Gemini reply history_len=%s", len(history))
        return await self._client.generate_chat(
            system_instruction=RAG_SYSTEM_INSTRUCTION,
            history=history,
            user_message=user_message,
        )

    async def generate_simple_reply(self, question: str) -> str:
        """Fallback when no documents are attached to the session."""
        return await self._client.generate_chat(
            system_instruction="You are Simplify, a helpful AI assistant.",
            history=[],
            user_message=question,
        )

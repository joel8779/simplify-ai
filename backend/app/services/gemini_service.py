"""Centralized Gemini service — chat completion helpers for RAG orchestration."""

from __future__ import annotations

from typing import AsyncGenerator, List

from app.core.logging import get_logger
from app.integrations.gemini import GeminiClient

logger = get_logger(__name__)

RAG_SYSTEM_INSTRUCTION = """You are Simplify, a polished conversational AI assistant for document-grounded work.

Behavior:
- Lead with the useful answer, then add supporting detail only when it helps.
- Use uploaded document context as grounding when it is relevant, but do not force every answer to be document-only.
- Synthesize across passages instead of dumping extracted snippets.
- You may make reasonable inferences, recommendations, and syntheses from the retrieved context.
- Clearly distinguish factual claims from inferred recommendations.
- For inferred answers, use wording such as "Based on your uploaded documents..." or "From your projects and skills..."
- Do not invent experience, employers, education, certifications, skills, metrics, dates, or tools that are not supported by the context.
- If the context is too thin to support a useful inference, say what is missing and answer only at a high level from the available evidence.
- For resume, project, skills, career, and recommendation questions, infer suitable options from documented evidence and cite the supporting passages.

Citation style:
- Use bracketed source numbers like [1] only for important factual claims, direct document-backed statements, and recommendation evidence.
- Avoid citation clutter. Do not cite every sentence, repeated claim, greeting, transition, or general reasoning.
- Prefer one citation at the end of a sentence or compact paragraph over multiple citations scattered through the same idea.

Writing style:
- Sound like a helpful senior teammate, not a report generator.
- Keep the tone natural, direct, and premium.
- Use short paragraphs by default.
- Use bullets only when they make scanning easier.
- Avoid excessive markdown. Do not overuse bold text, headings, asterisks, or long nested lists.
- Keep answers concise unless the user asks for depth."""

GENERAL_SYSTEM_INSTRUCTION = (
    "You are Simplify, a polished conversational AI assistant. "
    "Answer naturally and directly. Use markdown sparingly, with short paragraphs "
    "and bullets only when they improve readability. Avoid excessive bold text, "
    "asterisks, and report-like formatting."
)


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
            "Answer conversationally. Use the document context where it helps, and combine it "
            "with careful general reasoning when the user is asking for advice, explanation, "
            "planning, or recommendations. "
            "If the question asks for recommendations, suitability, summaries, career guidance, "
            "or analysis, infer from the documented skills, projects, experience, and facts. "
            "Synthesize the answer instead of pasting or restating raw passages. "
            "Use [n] citations sparingly for the key claims that rely on retrieved sources. "
            "Do not cite anything that is not supported by a retrieved source."
        )
        logger.info("Generating grounded Gemini reply history_len=%s", len(history))
        return await self._client.generate_chat(
            system_instruction=RAG_SYSTEM_INSTRUCTION,
            history=history,
            user_message=user_message,
        )

    async def stream_grounded_reply(
        self,
        *,
        context_block: str,
        question: str,
        history: List[dict[str, str]],
    ) -> AsyncGenerator[str, None]:
        user_message = (
            f"Document context:\n{context_block}\n\n"
            f"Question: {question}\n\n"
            "Answer conversationally. Use the document context where it helps, and combine it "
            "with careful general reasoning when useful. Synthesize instead of extracting. "
            "Use [n] citations sparingly for key document-backed claims only."
        )
        async for token in self._client.generate_chat_stream(
            system_instruction=RAG_SYSTEM_INSTRUCTION,
            history=history,
            user_message=user_message,
        ):
            yield token

    async def generate_simple_reply(self, question: str) -> str:
        """Fallback when no documents are attached to the session."""
        return await self._client.generate_chat(
            system_instruction=GENERAL_SYSTEM_INSTRUCTION,
            history=[],
            user_message=question,
        )

    async def stream_simple_reply(
        self,
        *,
        question: str,
        history: List[dict[str, str]],
    ) -> AsyncGenerator[str, None]:
        async for token in self._client.generate_chat_stream(
            system_instruction=GENERAL_SYSTEM_INSTRUCTION,
            history=history,
            user_message=question,
        ):
            yield token

    async def generate_general_reply(
        self,
        *,
        question: str,
        history: List[dict[str, str]],
    ) -> str:
        """Fallback answer when retrieved documents are not relevant enough."""
        return await self._client.generate_chat(
            system_instruction=(
                "You are Simplify, a polished conversational AI assistant. "
                "The selected uploaded documents did not contain relevant context. "
                "Answer from general knowledge and do not cite uploaded documents. "
                "Use natural prose, short paragraphs, and restrained markdown."
            ),
            history=history,
            user_message=(
                "The document search did not find relevant passages for this question. "
                "Provide a helpful general AI answer. Briefly mention only if useful that "
                "the answer is based on general AI knowledge rather than uploaded documents."
                f"\n\nQuestion: {question}"
            ),
        )

    async def stream_general_reply(
        self,
        *,
        question: str,
        history: List[dict[str, str]],
    ) -> AsyncGenerator[str, None]:
        async for token in self._client.generate_chat_stream(
            system_instruction=(
                "You are Simplify, a polished conversational AI assistant. "
                "The selected uploaded documents did not contain relevant context. "
                "Answer from general knowledge and do not cite uploaded documents. "
                "Use natural prose, short paragraphs, and restrained markdown."
            ),
            history=history,
            user_message=(
                "The document search did not find relevant passages for this question. "
                "Provide a helpful general AI answer. Briefly mention only if useful that "
                "the answer is based on general AI knowledge rather than uploaded documents."
                f"\n\nQuestion: {question}"
            ),
        ):
            yield token

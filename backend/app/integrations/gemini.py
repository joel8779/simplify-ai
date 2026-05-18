"""Low-level Gemini SDK wrapper (isolated from routes and business logic)."""

from __future__ import annotations

import asyncio
import time
from typing import Any, List, Optional

import google.generativeai as genai
from google.api_core import exceptions as google_exceptions

from app.core.config import get_settings
from app.core.exceptions import GeminiServiceError
from app.core.logging import get_logger

logger = get_logger(__name__)


class GeminiClient:
    """
    Thin async wrapper around google-generativeai.
    Streaming extension point: add `generate_content_stream` in Phase 3.
    """

    def __init__(self) -> None:
        settings = get_settings()
        self._api_key = settings.gemini_api_key
        self._model_name = settings.gemini_chat_model
        self._embedding_model = settings.gemini_embedding_model
        self._temperature = settings.gemini_temperature
        self._max_retries = settings.gemini_max_retries
        self._retry_base_delay = settings.gemini_retry_base_delay_seconds
        self._configured = False

    def _ensure_configured(self) -> None:
        if not self._api_key:
            raise GeminiServiceError("GEMINI_API_KEY is not configured")
        if not self._configured:
            genai.configure(api_key=self._api_key)
            self._configured = True

    @staticmethod
    def _is_retryable(exc: Exception) -> bool:
        retryable_types = (
            google_exceptions.ResourceExhausted,
            google_exceptions.ServiceUnavailable,
            google_exceptions.DeadlineExceeded,
            google_exceptions.InternalServerError,
        )
        return isinstance(exc, retryable_types)

    async def _with_retry(self, operation: str, fn):
        last_error: Optional[Exception] = None
        for attempt in range(1, self._max_retries + 1):
            try:
                return await asyncio.to_thread(fn)
            except Exception as exc:  # noqa: BLE001
                last_error = exc
                logger.error(
                    "Gemini %s attempt %s/%s failed: %s (type: %s, retryable: %s)",
                    operation,
                    attempt,
                    self._max_retries,
                    str(exc),
                    type(exc).__name__,
                    self._is_retryable(exc),
                )
                if attempt >= self._max_retries or not self._is_retryable(exc):
                    break
                delay = self._retry_base_delay * (2 ** (attempt - 1))
                logger.warning(
                    "Gemini %s failed (attempt %s/%s), retrying in %.1fs",
                    operation,
                    attempt,
                    self._max_retries,
                    delay,
                )
                await asyncio.sleep(delay)
        raise GeminiServiceError(
            f"Gemini {operation} failed after {self._max_retries} attempts",
            details={"error": str(last_error), "error_type": type(last_error).__name__},
        ) from last_error

    async def generate_chat(
        self,
        *,
        system_instruction: str,
        history: List[dict[str, str]],
        user_message: str,
    ) -> str:
        """Generate a completion from system prompt, prior turns, and final user turn."""

        def _call() -> str:
            self._ensure_configured()
            gemini_history = _to_gemini_history(history)
            model = genai.GenerativeModel(
                model_name=self._model_name,
                system_instruction=system_instruction,
                generation_config=genai.GenerationConfig(temperature=self._temperature),
            )
            chat = model.start_chat(history=gemini_history)
            response = chat.send_message(user_message)
            return (response.text or "").strip()

        logger.debug("Gemini chat request model=%s", self._model_name)
        return await self._with_retry("chat", _call)

    async def embed_texts(self, texts: List[str]) -> List[List[float]]:
        if not texts:
            return []

        def _call() -> List[List[float]]:
            self._ensure_configured()
            settings = get_settings()
            result = genai.embed_content(
                model=settings.gemini_embedding_model,
                content=texts,
                task_type="retrieval_document",
            )
            return _normalize_embedding_result(result.get("embedding"), len(texts))

        logger.debug("Gemini embed batch size=%s", len(texts))
        return await self._with_retry("embed", _call)

    async def embed_query(self, text: str) -> List[float]:
        def _call() -> List[float]:
            self._ensure_configured()
            settings = get_settings()
            result = genai.embed_content(
                model=settings.gemini_embedding_model,
                content=text,
                task_type="retrieval_query",
            )
            return result["embedding"]

        return await self._with_retry("embed_query", _call)


def _normalize_embedding_result(
    embedding: Any, count: int
) -> List[List[float]]:
    if embedding is None:
        return []
    if count == 1:
        if embedding and isinstance(embedding[0], (int, float)):
            return [embedding]  # type: ignore[list-item]
        if embedding and isinstance(embedding[0], list):
            return embedding  # type: ignore[return-value]
    if embedding and isinstance(embedding[0], list):
        return embedding  # type: ignore[return-value]
    return [embedding]  # type: ignore[list-item]


def _to_gemini_history(messages: List[dict[str, str]]) -> List[dict[str, Any]]:
    """Convert OpenAI-style roles to Gemini chat history (user/model only)."""
    history: List[dict[str, Any]] = []
    for msg in messages:
        role = msg.get("role", "user")
        content = msg.get("content", "")
        if role == "system":
            continue
        if role == "assistant":
            history.append({"role": "model", "parts": [content]})
        else:
            history.append({"role": "user", "parts": [content]})
    return history

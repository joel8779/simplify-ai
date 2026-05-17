"""Gemini embedding generation with batching."""

from __future__ import annotations

import asyncio
from typing import List

from app.core.config import get_settings
from app.core.exceptions import GeminiServiceError
from app.core.logging import get_logger
from app.integrations.gemini import GeminiClient

logger = get_logger(__name__)


class EmbeddingService:
    """
    Reusable embedding abstraction.
    Delegates to GeminiClient; swap provider here without touching retrieval.
    """

    def __init__(self, client: GeminiClient | None = None) -> None:
        self._client = client or GeminiClient()
        settings = get_settings()
        self._batch_size = settings.embedding_batch_size

    async def embed_documents(self, texts: List[str]) -> List[List[float]]:
        if not texts:
            return []

        vectors: List[List[float]] = []
        total_batches = (len(texts) + self._batch_size - 1) // self._batch_size

        for batch_idx in range(0, len(texts), self._batch_size):
            batch = texts[batch_idx : batch_idx + self._batch_size]
            batch_num = batch_idx // self._batch_size + 1
            logger.info(
                "Embedding batch %s/%s (%s chunks)",
                batch_num,
                total_batches,
                len(batch),
            )
            batch_vectors = await self._client.embed_texts(batch)
            if len(batch_vectors) != len(batch):
                raise GeminiServiceError(
                    "Embedding count mismatch",
                    details={"expected": len(batch), "received": len(batch_vectors)},
                )
            vectors.extend(batch_vectors)

        return vectors

    async def embed_query(self, text: str) -> List[float]:
        if not text.strip():
            raise GeminiServiceError("Cannot embed an empty query")
        return await self._client.embed_query(text)

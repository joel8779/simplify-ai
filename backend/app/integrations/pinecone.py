"""Reusable Pinecone client helpers for vector storage."""

from __future__ import annotations

from typing import Any

from pinecone import Pinecone

from app.core.config import get_settings
from app.core.exceptions import ValidationAppError
from app.core.logging import get_logger

logger = get_logger(__name__)


class PineconeClient:
    """Thin wrapper that centralizes Pinecone configuration and index access."""

    def __init__(self) -> None:
        settings = get_settings()
        if not settings.pinecone_api_key:
            raise ValidationAppError("PINECONE_API_KEY is required for Pinecone vectors")
        if not settings.pinecone_index_name and not settings.pinecone_index_host:
            raise ValidationAppError(
                "PINECONE_INDEX_NAME or PINECONE_INDEX_HOST is required for Pinecone vectors"
            )

        self._settings = settings
        self._client = Pinecone(api_key=settings.pinecone_api_key)
        self._index: Any | None = None

    @property
    def namespace(self) -> str:
        return self._settings.pinecone_namespace

    def index(self) -> Any:
        if self._index is None:
            index_host = self._normalized_index_host()
            if index_host:
                self._index = self._client.Index(host=index_host)
                target = index_host
            else:
                self._index = self._client.Index(self._settings.pinecone_index_name)
                target = self._settings.pinecone_index_name

            logger.info("Connected Pinecone index target=%s", target)

        return self._index

    def _normalized_index_host(self) -> str:
        host = self._settings.pinecone_index_host.strip()
        if not host:
            return ""
        if host.startswith("https://"):
            host = host.removeprefix("https://")
        if host.startswith("http://"):
            host = host.removeprefix("http://")
        host = host.strip("/")

        if "." not in host:
            logger.warning(
                "Ignoring PINECONE_INDEX_HOST=%s because it does not look like a full Pinecone host. "
                "Set PINECONE_INDEX_NAME for index names, or use the full host from Pinecone.",
                host,
            )
            return ""

        return host

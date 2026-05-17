import re
from typing import Any, Optional

import certifi
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo.errors import ConfigurationError, ServerSelectionTimeoutError

from app.core.config import get_settings
from app.core.logging import get_logger

logger = get_logger(__name__)

_client: Optional[AsyncIOMotorClient] = None
_db: Optional[AsyncIOMotorDatabase] = None


def _mask_uri(uri: str) -> str:
    """Hide credentials in logs."""
    return re.sub(r"://([^:]+):([^@]+)@", r"://\1:***@", uri)


def is_mongodb_connected() -> bool:
    return _db is not None


async def connect_mongodb() -> bool:
    """Connect to MongoDB. Returns False when optional dev skip is enabled."""
    global _client, _db
    settings = get_settings()
    uri = settings.mongodb_uri

    logger.info("Connecting to MongoDB (%s)", _mask_uri(uri))

    client_kwargs: dict[str, Any] = {
        "serverSelectionTimeoutMS": 10_000,
        "tlsCAFile": certifi.where(),
    }

    try:
        _client = AsyncIOMotorClient(uri, **client_kwargs)
        _db = _client[settings.mongodb_db_name]
        await _client.admin.command("ping")
    except ConfigurationError as exc:
        hint = (
            "Check MONGODB_URI in backend/.env — use your Atlas host "
            "(e.g. cluster0.xxxxx.mongodb.net), not <cluster> placeholders."
        )
        if "<cluster>" in uri:
            hint = (
                "MONGODB_URI still uses the .env.example placeholder <cluster>. "
                "Replace it with your Atlas connection string, save .env, and restart the server."
            )
        raise RuntimeError(f"MongoDB configuration error: {exc}. {hint}") from exc
    except ServerSelectionTimeoutError as exc:
        detail = str(exc)
        ssl_failed = "SSL handshake failed" in detail or "TLSV1_ALERT_INTERNAL_ERROR" in detail
        message = (
            "MongoDB Atlas rejected the TLS connection (SSL handshake failed). "
            "Fix: Atlas → Network Access → Add IP Address → allow your public IP "
            "(or 0.0.0.0/0 for local dev). Wait 1–2 minutes, restart the API. "
            "Also verify Database Access user/password in backend/.env; disable VPN "
            "and antivirus HTTPS scanning if it still fails."
            if ssl_failed
            else "Could not reach MongoDB Atlas. Check Network Access (IP allowlist), "
            "credentials, and that the cluster is running."
        )
        if settings.mongodb_optional and settings.app_env == "development":
            logger.warning("MongoDB unavailable — starting without DB (%s)", message)
            if _client is not None:
                _client.close()
            _client = None
            _db = None
            return False
        raise RuntimeError(message) from exc

    logger.info("MongoDB connected database=%s", settings.mongodb_db_name)
    return True


async def close_mongodb() -> None:
    global _client, _db
    if _client is not None:
        _client.close()
    _client = None
    _db = None


def get_database() -> AsyncIOMotorDatabase:
    if _db is None:
        raise RuntimeError("MongoDB is not initialized")
    return _db

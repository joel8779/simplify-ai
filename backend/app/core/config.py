from functools import lru_cache
from pathlib import Path
from typing import List

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# Always load backend/.env (fixes uvicorn --reload subprocess cwd issues)
_BACKEND_ROOT = Path(__file__).resolve().parents[2]
_ENV_FILE = _BACKEND_ROOT / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(_ENV_FILE),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    app_name: str = "Simplify API"
    app_env: str = "development"
    debug: bool = False
    api_v1_prefix: str = "/api/v1"

    host: str = "0.0.0.0"
    port: int = 8000
    cors_origins: str = "http://localhost:3000"

    mongodb_uri: str = Field(..., description="MongoDB Atlas connection string")
    mongodb_db_name: str = "simplify"
    # Dev-only: start API even when Atlas is unreachable (auth/DB routes will fail)
    mongodb_optional: bool = False

    jwt_secret_key: str = Field(..., min_length=32)
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    gemini_api_key: str = ""
    gemini_chat_model: str = "gemini-2.0-flash"
    gemini_embedding_model: str = "models/text-embedding-004"
    gemini_temperature: float = 0.2
    gemini_max_retries: int = 3
    gemini_retry_base_delay_seconds: float = 1.0

    chroma_persist_dir: str = "./data/chroma"
    rag_chunk_size: int = 800
    rag_chunk_overlap: int = 120
    rag_top_k: int = 6
    rag_min_relevance_score: float = 0.0
    embedding_batch_size: int = 32
    chat_history_limit: int = 20

    upload_dir: str = "./data/uploads"
    max_upload_size_mb: int = 25
    allowed_extensions: str = ".pdf,.docx,.txt,.md"

    @field_validator("mongodb_uri")
    @classmethod
    def validate_mongodb_uri(cls, value: str) -> str:
        placeholders = ("<cluster>", "<user>", "<password>", "YOUR_CLUSTER", "YOUR_USER")
        if any(p in value for p in placeholders):
            raise ValueError(
                "MONGODB_URI contains template placeholders (<user>, <cluster>, etc.). "
                "Set the real URI in backend/.env, or remove a stale MONGODB_URI Windows "
                "environment variable that overrides the file."
            )
        if "mongodb+srv://" in value and "@" not in value.split("mongodb+srv://", 1)[-1]:
            raise ValueError("MONGODB_URI is missing credentials (user:password@).")
        return value

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors(cls, value: str | List[str]) -> str:
        if isinstance(value, list):
            return ",".join(value)
        return value

    @property
    def cors_origin_list(self) -> List[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def allowed_extension_set(self) -> set[str]:
        return {ext.strip().lower() for ext in self.allowed_extensions.split(",")}

    @property
    def max_upload_bytes(self) -> int:
        return self.max_upload_size_mb * 1024 * 1024


@lru_cache
def get_settings() -> Settings:
    if not _ENV_FILE.is_file():
        raise FileNotFoundError(
            f"Missing {_ENV_FILE}. Copy .env.example to .env and fill in your values."
        )
    return Settings()

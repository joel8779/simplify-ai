from fastapi import APIRouter

from app.core.config import get_settings
from app.db.mongodb import is_mongodb_connected
from app.schemas.common import HealthResponse

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    settings = get_settings()
    mongo_ok = is_mongodb_connected()
    return HealthResponse(
        status="ok" if mongo_ok or settings.mongodb_optional else "degraded",
        app=settings.app_name,
        environment=settings.app_env,
        details={"mongodb": "connected" if mongo_ok else "disconnected"},
    )

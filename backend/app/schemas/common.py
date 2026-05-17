from typing import Any, Optional

from pydantic import BaseModel


class ErrorResponse(BaseModel):
    code: str
    message: str
    details: Optional[Any] = None


class HealthResponse(BaseModel):
    status: str
    app: str
    environment: str
    details: Optional[dict[str, Any]] = None

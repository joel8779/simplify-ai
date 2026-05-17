from typing import Any, Optional


class AppError(Exception):
    """Base application error mapped to HTTP responses."""

    def __init__(
        self,
        message: str,
        *,
        status_code: int = 400,
        code: str = "app_error",
        details: Optional[Any] = None,
    ) -> None:
        self.message = message
        self.status_code = status_code
        self.code = code
        self.details = details
        super().__init__(message)


class NotFoundError(AppError):
    def __init__(self, resource: str = "Resource") -> None:
        super().__init__(f"{resource} not found", status_code=404, code="not_found")


class UnauthorizedError(AppError):
    def __init__(self, message: str = "Not authenticated") -> None:
        super().__init__(message, status_code=401, code="unauthorized")


class ForbiddenError(AppError):
    def __init__(self, message: str = "Forbidden") -> None:
        super().__init__(message, status_code=403, code="forbidden")


class ConflictError(AppError):
    def __init__(self, message: str = "Conflict") -> None:
        super().__init__(message, status_code=409, code="conflict")


class ValidationAppError(AppError):
    def __init__(self, message: str, details: Optional[Any] = None) -> None:
        super().__init__(message, status_code=422, code="validation_error", details=details)


class ExternalServiceError(AppError):
    """Upstream provider failure (Gemini, embeddings, etc.)."""

    def __init__(
        self,
        message: str,
        *,
        service: str = "external",
        details: Optional[Any] = None,
    ) -> None:
        super().__init__(
            message,
            status_code=502,
            code=f"{service}_error",
            details=details,
        )


class GeminiServiceError(ExternalServiceError):
    def __init__(self, message: str, details: Optional[Any] = None) -> None:
        super().__init__(message, service="gemini", details=details)

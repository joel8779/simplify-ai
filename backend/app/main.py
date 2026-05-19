from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1.router import api_router
from app.core.config import get_settings
from app.core.exceptions import AppError, ExternalServiceError
from app.core.logging import get_logger, setup_logging
from app.db.indexes import ensure_indexes
from app.db.mongodb import close_mongodb, connect_mongodb, is_mongodb_connected
from app.schemas.common import ErrorResponse


@asynccontextmanager
async def lifespan(_: FastAPI):
    settings = get_settings()
    setup_logging(debug=settings.debug)
    if await connect_mongodb():
        await ensure_indexes()
    elif not is_mongodb_connected():
        get_logger(__name__).warning(
            "API running without MongoDB. Set MONGODB_OPTIONAL=false after fixing Atlas access."
        )
    yield
    await close_mongodb()


def create_app() -> FastAPI:
    settings = get_settings()
    logger = get_logger(__name__)
    app = FastAPI(
        title=settings.app_name,
        version="1.0.0",
        docs_url="/docs" if settings.debug else None,
        redoc_url="/redoc" if settings.debug else None,
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.effective_cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.middleware("http")
    async def cors_diagnostics(request: Request, call_next):
        origin = request.headers.get("origin")
        is_preflight = (
            request.method == "OPTIONS"
            and "access-control-request-method" in request.headers
        )
        if origin or is_preflight:
            logger.info(
                "CORS diagnostic: method=%s path=%s origin=%s "
                "preflight=%s requested_method=%s requested_headers=%s "
                "configured_origins=%s",
                request.method,
                request.url.path,
                origin,
                is_preflight,
                request.headers.get("access-control-request-method"),
                request.headers.get("access-control-request-headers"),
                settings.effective_cors_origins,
            )

        response = await call_next(request)

        if origin or is_preflight:
            logger.info(
                "CORS diagnostic response: method=%s path=%s status=%s "
                "allow_origin=%s allow_methods=%s allow_headers=%s",
                request.method,
                request.url.path,
                response.status_code,
                response.headers.get("access-control-allow-origin"),
                response.headers.get("access-control-allow-methods"),
                response.headers.get("access-control-allow-headers"),
            )

        return response

    @app.exception_handler(AppError)
    async def app_error_handler(_: Request, exc: AppError) -> JSONResponse:
        body = ErrorResponse(code=exc.code, message=exc.message, details=exc.details)
        return JSONResponse(status_code=exc.status_code, content=body.model_dump())

    @app.exception_handler(ExternalServiceError)
    async def external_error_handler(
        _: Request, exc: ExternalServiceError
    ) -> JSONResponse:
        body = ErrorResponse(code=exc.code, message=exc.message, details=exc.details)
        return JSONResponse(status_code=exc.status_code, content=body.model_dump())

    app.include_router(api_router, prefix=settings.api_v1_prefix)
    return app


app = create_app()

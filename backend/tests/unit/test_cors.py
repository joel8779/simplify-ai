from fastapi.testclient import TestClient

from app.core.config import Settings
from app.main import app


PRODUCTION_ORIGIN = "https://simplify-ai-lilac.vercel.app"


def test_cors_preflight_allows_production_origin() -> None:
    client = TestClient(app)

    response = client.options(
        "/api/v1/auth/login",
        headers={
            "Origin": PRODUCTION_ORIGIN,
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type,authorization",
        },
    )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == PRODUCTION_ORIGIN
    assert "POST" in response.headers["access-control-allow-methods"]
    assert "content-type" in response.headers["access-control-allow-headers"]
    assert "authorization" in response.headers["access-control-allow-headers"]


def test_cors_origin_parser_accepts_json_list_and_trailing_slash() -> None:
    settings = Settings(
        mongodb_uri="mongodb://user:password@example.com:27017",
        jwt_secret_key="x" * 32,
        cors_origins='["https://simplify-ai-lilac.vercel.app/"]',
    )

    assert settings.cors_origin_list == [PRODUCTION_ORIGIN]

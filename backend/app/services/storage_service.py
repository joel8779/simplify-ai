from dataclasses import dataclass
from pathlib import Path
from uuid import uuid4

import httpx

from app.core.config import get_settings
from app.core.exceptions import ExternalServiceError, ValidationAppError


@dataclass(frozen=True)
class StoredFile:
    provider: str
    path: str
    url: str | None


class StorageService:
    provider = "supabase"

    def __init__(self) -> None:
        self._settings = get_settings()

    @property
    def _base_url(self) -> str:
        return self._settings.supabase_url.rstrip("/")

    @property
    def _headers(self) -> dict[str, str]:
        key = self._settings.supabase_service_key
        return {"Authorization": f"Bearer {key}", "apikey": key}

    def validate_upload(self, filename: str, size_bytes: int) -> str:
        ext = Path(filename).suffix.lower()
        if ext not in self._settings.allowed_extension_set:
            raise ValidationAppError(f"File type {ext} is not allowed")
        if size_bytes > self._settings.max_upload_bytes:
            raise ValidationAppError("File exceeds maximum upload size")
        return ext

    async def upload_file(
        self,
        *,
        user_id: str,
        original_name: str,
        content: bytes,
        content_type: str,
    ) -> StoredFile:
        self._ensure_configured()
        ext = self.validate_upload(original_name, len(content))
        storage_path = f"{user_id}/{uuid4()}{ext}"
        url = (
            f"{self._base_url}/storage/v1/object/"
            f"{self._settings.supabase_bucket}/{storage_path}"
        )
        headers = {
            **self._headers,
            "Content-Type": content_type,
            "x-upsert": "false",
        }

        async with httpx.AsyncClient(timeout=60) as client:
            response = await client.post(url, headers=headers, content=content)

        if response.status_code >= 400:
            detail = self._response_detail(response)
            raise ExternalServiceError(
                f"Failed to upload file to Supabase Storage: {detail}",
                service="supabase_storage",
                details={"status_code": response.status_code, "body": detail},
            )

        return StoredFile(
            provider=self.provider,
            path=storage_path,
            url=self.public_url(storage_path),
        )

    async def delete_file(self, storage_path: str | None) -> None:
        if not storage_path:
            return
        self._ensure_configured()
        url = (
            f"{self._base_url}/storage/v1/object/"
            f"{self._settings.supabase_bucket}"
        )
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.request(
                "DELETE",
                url,
                headers={**self._headers, "Content-Type": "application/json"},
                json={"prefixes": [storage_path]},
            )
        if response.status_code in {400, 404}:
            return
        if response.status_code >= 400:
            detail = self._response_detail(response)
            raise ExternalServiceError(
                f"Failed to delete file from Supabase Storage: {detail}",
                service="supabase_storage",
                details={"status_code": response.status_code, "body": detail},
            )

    def public_url(self, storage_path: str) -> str:
        return (
            f"{self._base_url}/storage/v1/object/public/"
            f"{self._settings.supabase_bucket}/{storage_path}"
        )

    async def signed_url(self, storage_path: str) -> str:
        self._ensure_configured()
        url = (
            f"{self._base_url}/storage/v1/object/sign/"
            f"{self._settings.supabase_bucket}/{storage_path}"
        )
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(
                url,
                headers={**self._headers, "Content-Type": "application/json"},
                json={
                    "expiresIn": self._settings.supabase_signed_url_expiry_seconds
                },
            )
        if response.status_code >= 400:
            detail = self._response_detail(response)
            raise ExternalServiceError(
                f"Failed to create Supabase signed URL: {detail}",
                service="supabase_storage",
                details={"status_code": response.status_code, "body": detail},
            )
        data = response.json()
        signed = data.get("signedURL") or data.get("signedUrl") or data.get("signed_url")
        if not signed:
            raise ExternalServiceError(
                "Supabase did not return a signed URL",
                service="supabase_storage",
            )
        return f"{self._base_url}{signed}" if signed.startswith("/") else signed

    def _ensure_configured(self) -> None:
        if (
            not self._settings.supabase_url
            or not self._settings.supabase_service_key
            or not self._settings.supabase_bucket
        ):
            raise ValidationAppError(
                "Supabase Storage is not configured. Set SUPABASE_URL, "
                "SUPABASE_SERVICE_KEY, and SUPABASE_BUCKET."
            )

    @staticmethod
    def _response_detail(response: httpx.Response) -> str:
        try:
            data = response.json()
        except ValueError:
            return response.text[:300] or response.reason_phrase

        if isinstance(data, dict):
            message = data.get("message") or data.get("error") or data.get("msg")
            if message:
                return str(message)
        return str(data)[:300]

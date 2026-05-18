import hashlib
from datetime import datetime, timedelta, timezone

from app.core.config import get_settings
from app.core.exceptions import ConflictError, UnauthorizedError
from app.core.logging import get_logger
from app.core.security import (
    create_access_token,
    create_refresh_token_value,
    hash_password,
    verify_password,
)
from app.models.chat import RefreshTokenInDB
from app.models.user import UserInDB
from app.repositories.refresh_token_repository import RefreshTokenRepository
from app.repositories.user_repository import UserRepository
from app.schemas.auth import LoginRequest, SignupRequest, TokenResponse
from app.schemas.user import UserPublic

logger = get_logger(__name__)


def _hash_refresh_token(raw: str) -> str:
    return hashlib.sha256(raw.encode()).hexdigest()


class AuthService:
    def __init__(
        self,
        user_repo: UserRepository,
        refresh_repo: RefreshTokenRepository,
    ) -> None:
        self._users = user_repo
        self._refresh = refresh_repo

    async def signup(self, payload: SignupRequest) -> TokenResponse:
        existing = await self._users.find_by_email(payload.email)
        if existing:
            raise ConflictError("Email already registered")

        user = UserInDB(
            email=payload.email.lower(),
            hashed_password=hash_password(payload.password),
            full_name=payload.full_name,
        )
        user = await self._users.create(user)
        return await self._issue_tokens(user)

    async def login(self, payload: LoginRequest) -> TokenResponse:
        user = await self._users.find_by_email(payload.email)
        if not user or not verify_password(payload.password, user.hashed_password):
            raise UnauthorizedError("Invalid email or password")
        if not user.is_active:
            raise UnauthorizedError("Account is disabled")
        return await self._issue_tokens(user)

    async def refresh(self, raw_refresh_token: str) -> TokenResponse:
        token_hash = _hash_refresh_token(raw_refresh_token)
        stored = await self._refresh.find_by_hash(token_hash)
        if not stored:
            raise UnauthorizedError("Invalid refresh token")

        if stored.expires_at < datetime.now(timezone.utc):
            raise UnauthorizedError("Refresh token expired")

        user = await self._users.find_by_id(stored.user_id)
        if not user or not user.is_active:
            raise UnauthorizedError("User not found")

        await self._refresh.revoke(token_hash)
        return await self._issue_tokens(user)

    async def logout(self, raw_refresh_token: str) -> None:
        await self._refresh.revoke(_hash_refresh_token(raw_refresh_token))

    async def _issue_tokens(self, user: UserInDB) -> TokenResponse:
        settings = get_settings()
        access = create_access_token(str(user.id))
        raw_refresh = create_refresh_token_value()
        expires = datetime.now(timezone.utc) + timedelta(
            days=settings.refresh_token_expire_days
        )
        await self._refresh.create(
            RefreshTokenInDB(
                user_id=str(user.id),
                token_hash=_hash_refresh_token(raw_refresh),
                expires_at=expires,
            )
        )
        return TokenResponse(access_token=access, refresh_token=raw_refresh)

    @staticmethod
    def to_public(user: UserInDB) -> UserPublic:
        return UserPublic(
            id=str(user.id),
            email=user.email,
            full_name=user.full_name,
            is_active=user.is_active,
            created_at=user.created_at,
        )

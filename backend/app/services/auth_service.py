import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from app.core.config import get_settings
from app.core.exceptions import ConflictError, UnauthorizedError, ValidationAppError
from app.core.logging import get_logger
from app.core.security import (
    create_access_token,
    create_refresh_token_value,
    hash_password,
    verify_password,
)
from app.models.chat import RefreshTokenInDB
from app.models.pending_password_reset import PendingPasswordResetInDB
from app.models.pending_signup import PendingSignupInDB
from app.models.user import UserInDB
from app.db.repositories.access_token_repo import AccessTokenDenylistRepository
from app.db.repositories.pending_password_reset_repo import (
    PendingPasswordResetRepository,
)
from app.db.repositories.pending_signup_repo import PendingSignupRepository
from app.db.repositories.refresh_token_repo import RefreshTokenRepository
from app.db.repositories.user_repo import UserRepository
from app.schemas.auth import (
    LoginRequest,
    PasswordResetResponse,
    ResetPasswordRequest,
    SignupRequest,
    SignupResponse,
    TokenResponse,
    VerifyOtpRequest,
)
from app.schemas.user import UserPublic
from app.services.email_service import EmailService

logger = get_logger(__name__)


def _hash_refresh_token(raw: str) -> str:
    return hashlib.sha256(raw.encode()).hexdigest()


def _hash_otp(email: str, otp: str) -> str:
    settings = get_settings()
    value = f"{email.lower()}:{otp}:{settings.jwt_secret_key}"
    return hashlib.sha256(value.encode()).hexdigest()


def _as_aware(value: datetime | None) -> datetime | None:
    if value and value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value


class AuthService:
    def __init__(
        self,
        user_repo: UserRepository,
        pending_signup_repo: PendingSignupRepository,
        pending_password_reset_repo: PendingPasswordResetRepository,
        refresh_repo: RefreshTokenRepository,
        access_denylist_repo: AccessTokenDenylistRepository,
        email_service: EmailService,
    ) -> None:
        self._users = user_repo
        self._pending_signups = pending_signup_repo
        self._pending_password_resets = pending_password_reset_repo
        self._refresh = refresh_repo
        self._access_denylist = access_denylist_repo
        self._email = email_service

    async def signup(self, payload: SignupRequest) -> SignupResponse:
        email = payload.email.lower()
        existing = await self._users.find_by_email(email)
        if existing and existing.email_verified:
            raise ConflictError("Email already registered")

        if existing:
            await self._users.delete_by_email(email)

        pending = await self._pending_signups.find_by_email(email)
        hashed_password = hash_password(payload.password)

        return await self._send_verification_otp(
            email=email,
            hashed_password=hashed_password,
            full_name=payload.full_name,
            pending=pending,
            enforce_cooldown=pending is not None,
        )

    async def login(self, payload: LoginRequest) -> TokenResponse:
        user = await self._users.find_by_email(payload.email)
        if not user or not verify_password(payload.password, user.hashed_password):
            raise UnauthorizedError("Invalid email or password")
        if not user.email_verified:
            raise UnauthorizedError("Please verify your email before signing in")
        if not user.is_active:
            raise UnauthorizedError("Account is disabled")
        return await self._issue_tokens(user)

    async def verify_otp(self, payload: VerifyOtpRequest) -> TokenResponse:
        email = payload.email.lower()
        pending = await self._pending_signups.find_by_email(email)
        if not pending:
            raise UnauthorizedError("Invalid verification code")
        otp_expires_at = _as_aware(pending.otp_expires_at)
        if not pending.otp_hash or not otp_expires_at:
            raise ValidationAppError("Verification code expired. Request a new code.")
        if otp_expires_at < datetime.now(timezone.utc):
            raise ValidationAppError("Verification code expired. Request a new code.")
        if not secrets.compare_digest(
            pending.otp_hash, _hash_otp(pending.email, payload.otp)
        ):
            raise UnauthorizedError("Invalid verification code")

        existing = await self._users.find_by_email(email)
        if existing and existing.email_verified:
            await self._pending_signups.delete_by_email(email)
            raise ConflictError("Email already registered")
        if existing:
            await self._users.delete_by_email(email)

        verified = await self._users.create(
            UserInDB(
                email=pending.email,
                hashed_password=pending.hashed_password,
                full_name=pending.full_name,
                is_active=True,
                email_verified=True,
                email_verified_at=datetime.now(timezone.utc),
            )
        )
        await self._pending_signups.delete_by_email(email)
        return await self._issue_tokens(verified)

    async def resend_otp(self, email: str) -> SignupResponse:
        normalized_email = email.lower()
        user = await self._users.find_by_email(normalized_email)
        if user and user.email_verified:
            raise ConflictError("Email is already verified")
        pending = await self._pending_signups.find_by_email(normalized_email)
        if not pending:
            raise UnauthorizedError("Verification session not found")
        return await self._send_verification_otp(
            email=pending.email,
            hashed_password=pending.hashed_password,
            full_name=pending.full_name,
            pending=pending,
            enforce_cooldown=True,
        )

    async def forgot_password(self, email: str) -> PasswordResetResponse:
        normalized_email = email.lower()
        user = await self._users.find_by_email(normalized_email)
        if not user or not user.email_verified or not user.is_active:
            raise UnauthorizedError("No active account found for this email")

        pending = await self._pending_password_resets.find_by_email(normalized_email)
        return await self._send_password_reset_otp(
            email=normalized_email,
            pending=pending,
            enforce_cooldown=pending is not None,
        )

    async def reset_password(self, payload: ResetPasswordRequest) -> None:
        email = payload.email.lower()
        pending = await self._pending_password_resets.find_by_email(email)
        if not pending:
            raise UnauthorizedError("Invalid password reset code")

        otp_expires_at = _as_aware(pending.otp_expires_at)
        if not pending.otp_hash or not otp_expires_at:
            raise ValidationAppError("Password reset code expired. Request a new code.")
        if otp_expires_at < datetime.now(timezone.utc):
            raise ValidationAppError("Password reset code expired. Request a new code.")
        if not secrets.compare_digest(
            pending.otp_hash, _hash_otp(pending.email, payload.otp)
        ):
            raise UnauthorizedError("Invalid password reset code")

        user = await self._users.find_by_email(email)
        if not user or not user.email_verified or not user.is_active:
            raise UnauthorizedError("No active account found for this email")

        await self._users.update(
            str(user.id), {"hashed_password": hash_password(payload.new_password)}
        )
        await self._users.increment_session_version(str(user.id))
        await self._refresh.revoke_all_for_user(str(user.id))
        await self._pending_password_resets.delete_by_email(email)

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

    async def logout(
        self,
        *,
        user_id: str,
        access_payload: dict | None = None,
        raw_refresh_token: str | None = None,
        all_devices: bool = False,
    ) -> None:
        if all_devices:
            await self._refresh.revoke_all_for_user(user_id)
            await self._users.increment_session_version(user_id)
            return

        if raw_refresh_token:
            await self._refresh.revoke(_hash_refresh_token(raw_refresh_token))

        if access_payload and access_payload.get("jti"):
            expires_at = datetime.fromtimestamp(
                int(access_payload["exp"]), tz=timezone.utc
            )
            await self._access_denylist.add(
                str(access_payload["jti"]), user_id, expires_at
            )

    async def _issue_tokens(self, user: UserInDB) -> TokenResponse:
        settings = get_settings()
        access = create_access_token(
            str(user.id),
            extra_claims={"sv": getattr(user, "session_version", 0)},
        )
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

    async def _send_verification_otp(
        self,
        *,
        email: str,
        hashed_password: str,
        full_name: str | None,
        pending: PendingSignupInDB | None,
        enforce_cooldown: bool,
    ) -> SignupResponse:
        settings = get_settings()
        now = datetime.now(timezone.utc)
        window_started = _as_aware(
            pending.otp_window_started_at if pending else None
        )
        if (
            not window_started
            or window_started
            < now - timedelta(minutes=settings.otp_rate_limit_window_minutes)
        ):
            window_started = now
            send_count = 0
        else:
            send_count = pending.otp_send_count if pending else 0

        otp_last_sent_at = _as_aware(pending.otp_last_sent_at if pending else None)
        if enforce_cooldown and otp_last_sent_at:
            elapsed = (now - otp_last_sent_at).total_seconds()
            if elapsed < settings.otp_resend_cooldown_seconds:
                retry_after = settings.otp_resend_cooldown_seconds - int(elapsed)
                raise ValidationAppError(
                    "Please wait before requesting another code.",
                    details={"retry_after_seconds": retry_after},
                )

        if send_count >= settings.otp_max_requests_per_window:
            raise ValidationAppError(
                "Too many verification codes requested. Try again later.",
                details={
                    "retry_after_seconds": settings.otp_rate_limit_window_minutes * 60
                },
            )

        otp = f"{secrets.randbelow(1_000_000):06d}"
        expires_at = now + timedelta(minutes=settings.otp_expire_minutes)
        await self._pending_signups.upsert_by_email(
            PendingSignupInDB(
                email=email,
                hashed_password=hashed_password,
                full_name=full_name,
                otp_hash=_hash_otp(email, otp),
                otp_expires_at=expires_at,
                otp_last_sent_at=now,
                otp_send_count=send_count + 1,
                otp_window_started_at=window_started,
            )
        )

        await self._email.send_otp(
            to_email=email,
            otp=otp,
            expires_minutes=settings.otp_expire_minutes,
        )
        return SignupResponse(
            email=email,
            expires_in_seconds=settings.otp_expire_minutes * 60,
            resend_after_seconds=settings.otp_resend_cooldown_seconds,
        )

    async def _send_password_reset_otp(
        self,
        *,
        email: str,
        pending: PendingPasswordResetInDB | None,
        enforce_cooldown: bool,
    ) -> PasswordResetResponse:
        settings = get_settings()
        now = datetime.now(timezone.utc)
        window_started = _as_aware(
            pending.otp_window_started_at if pending else None
        )
        if (
            not window_started
            or window_started
            < now - timedelta(minutes=settings.otp_rate_limit_window_minutes)
        ):
            window_started = now
            send_count = 0
        else:
            send_count = pending.otp_send_count if pending else 0

        otp_last_sent_at = _as_aware(pending.otp_last_sent_at if pending else None)
        if enforce_cooldown and otp_last_sent_at:
            elapsed = (now - otp_last_sent_at).total_seconds()
            if elapsed < settings.otp_resend_cooldown_seconds:
                retry_after = settings.otp_resend_cooldown_seconds - int(elapsed)
                raise ValidationAppError(
                    "Please wait before requesting another code.",
                    details={"retry_after_seconds": retry_after},
                )

        if send_count >= settings.otp_max_requests_per_window:
            raise ValidationAppError(
                "Too many password reset codes requested. Try again later.",
                details={
                    "retry_after_seconds": settings.otp_rate_limit_window_minutes * 60
                },
            )

        otp = f"{secrets.randbelow(1_000_000):06d}"
        expires_at = now + timedelta(minutes=settings.otp_expire_minutes)
        await self._pending_password_resets.upsert_by_email(
            PendingPasswordResetInDB(
                email=email,
                otp_hash=_hash_otp(email, otp),
                otp_expires_at=expires_at,
                otp_last_sent_at=now,
                otp_send_count=send_count + 1,
                otp_window_started_at=window_started,
            )
        )

        await self._email.send_password_reset_otp(
            to_email=email,
            otp=otp,
            expires_minutes=settings.otp_expire_minutes,
        )
        return PasswordResetResponse(
            email=email,
            expires_in_seconds=settings.otp_expire_minutes * 60,
            resend_after_seconds=settings.otp_resend_cooldown_seconds,
        )

    @staticmethod
    def to_public(user: UserInDB) -> UserPublic:
        return UserPublic(
            id=str(user.id),
            email=user.email,
            full_name=user.full_name,
            is_active=user.is_active,
            created_at=user.created_at,
        )

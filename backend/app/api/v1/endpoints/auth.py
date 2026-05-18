from typing import Annotated

from fastapi import APIRouter, Depends, Header, status

from app.api.deps import CurrentUser, get_auth_service
from app.core.exceptions import UnauthorizedError
from app.core.security import decode_access_token
from app.schemas.auth import (
    LoginRequest,
    LogoutRequest,
    RefreshRequest,
    ResendOtpRequest,
    SignupRequest,
    SignupResponse,
    TokenResponse,
    VerifyOtpRequest,
)
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", response_model=SignupResponse, status_code=status.HTTP_201_CREATED)
async def signup(
    payload: SignupRequest,
    auth_service: AuthService = Depends(get_auth_service),
) -> SignupResponse:
    return await auth_service.signup(payload)


@router.post("/login", response_model=TokenResponse)
async def login(
    payload: LoginRequest,
    auth_service: AuthService = Depends(get_auth_service),
) -> TokenResponse:
    return await auth_service.login(payload)


@router.post("/verify-otp", response_model=TokenResponse)
async def verify_otp(
    payload: VerifyOtpRequest,
    auth_service: AuthService = Depends(get_auth_service),
) -> TokenResponse:
    return await auth_service.verify_otp(payload)


@router.post("/resend-otp", response_model=SignupResponse)
async def resend_otp(
    payload: ResendOtpRequest,
    auth_service: AuthService = Depends(get_auth_service),
) -> SignupResponse:
    return await auth_service.resend_otp(payload.email)


@router.post("/refresh", response_model=TokenResponse)
async def refresh(
    payload: RefreshRequest,
    auth_service: AuthService = Depends(get_auth_service),
) -> TokenResponse:
    return await auth_service.refresh(payload.refresh_token)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    payload: LogoutRequest,
    current_user: CurrentUser,
    authorization: Annotated[str | None, Header()] = None,
    auth_service: AuthService = Depends(get_auth_service),
) -> None:
    if not authorization or not authorization.startswith("Bearer "):
        raise UnauthorizedError("Missing bearer token")
    access_payload = decode_access_token(
        authorization.removeprefix("Bearer ").strip()
    )
    await auth_service.logout(
        user_id=str(current_user.id),
        access_payload=access_payload,
        raw_refresh_token=payload.refresh_token,
        all_devices=payload.all_devices,
    )

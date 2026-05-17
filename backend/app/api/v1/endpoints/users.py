from fastapi import APIRouter, Depends, status

from app.api.deps import CurrentUser, get_user_service
from app.schemas.user import PasswordChangeRequest, UserPublic, UserUpdateRequest
from app.services.auth_service import AuthService
from app.services.user_service import UserService

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserPublic)
async def get_me(current_user: CurrentUser) -> UserPublic:
    return AuthService.to_public(current_user)


@router.patch("/me", response_model=UserPublic)
async def update_me(
    payload: UserUpdateRequest,
    current_user: CurrentUser,
    user_service: UserService = Depends(get_user_service),
) -> UserPublic:
    return await user_service.update_profile(str(current_user.id), payload)


@router.post("/me/password", status_code=status.HTTP_204_NO_CONTENT)
async def change_password(
    payload: PasswordChangeRequest,
    current_user: CurrentUser,
    user_service: UserService = Depends(get_user_service),
) -> None:
    await user_service.change_password(str(current_user.id), payload)

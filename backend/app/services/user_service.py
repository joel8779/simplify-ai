from app.core.exceptions import UnauthorizedError
from app.core.security import hash_password, verify_password
from app.models.user import UserInDB
from app.repositories.user_repository import UserRepository
from app.schemas.user import PasswordChangeRequest, UserPublic, UserUpdateRequest
from app.services.auth_service import AuthService


class UserService:
    def __init__(self, user_repo: UserRepository) -> None:
        self._users = user_repo

    async def get_profile(self, user_id: str) -> UserPublic:
        user = await self._users.find_by_id(user_id)
        if not user:
            raise UnauthorizedError("User not found")
        return AuthService.to_public(user)

    async def update_profile(
        self, user_id: str, payload: UserUpdateRequest
    ) -> UserPublic:
        updates = payload.model_dump(exclude_unset=True)
        user = await self._users.update(user_id, updates)
        if not user:
            raise UnauthorizedError("User not found")
        return AuthService.to_public(user)

    async def change_password(
        self, user_id: str, payload: PasswordChangeRequest
    ) -> None:
        user = await self._users.find_by_id(user_id)
        if not user or not verify_password(payload.current_password, user.hashed_password):
            raise UnauthorizedError("Current password is incorrect")
        await self._users.update(
            user_id, {"hashed_password": hash_password(payload.new_password)}
        )

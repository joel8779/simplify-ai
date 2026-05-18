from typing import Any, Optional

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.models.common import utc_now
from app.models.user import UserInDB
from app.db.repositories.base import BaseRepository


class UserRepository(BaseRepository):
    collection_name = "users"

    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        super().__init__(db)

    async def create(self, user: UserInDB) -> UserInDB:
        payload = user.to_mongo(exclude_id=True)
        result = await self._collection.insert_one(payload)
        user.id = str(result.inserted_id)
        return user

    async def find_by_email(self, email: str) -> Optional[UserInDB]:
        doc = await self._collection.find_one({"email": email.lower()})
        return UserInDB.from_mongo(doc)  # type: ignore[return-value]

    async def find_by_id(self, user_id: str) -> Optional[UserInDB]:
        doc = await super().find_by_id(user_id)
        return UserInDB.from_mongo(doc)  # type: ignore[return-value]

    async def update(self, user_id: str, updates: dict[str, Any]) -> Optional[UserInDB]:
        updates["updated_at"] = utc_now()
        await self._collection.update_one(
            {"_id": self._object_id(user_id)},
            {"$set": updates},
        )
        return await self.find_by_id(user_id)

    async def delete_by_email(self, email: str) -> bool:
        result = await self._collection.delete_one({"email": email.lower()})
        return result.deleted_count > 0

    async def increment_session_version(self, user_id: str) -> Optional[UserInDB]:
        await self._collection.update_one(
            {"_id": self._object_id(user_id)},
            {"$inc": {"session_version": 1}, "$set": {"updated_at": utc_now()}},
        )
        return await self.find_by_id(user_id)

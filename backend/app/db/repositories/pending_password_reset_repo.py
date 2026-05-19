from typing import Any, Optional

from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo import ReturnDocument

from app.db.repositories.base import BaseRepository
from app.models.common import utc_now
from app.models.pending_password_reset import PendingPasswordResetInDB


class PendingPasswordResetRepository(BaseRepository):
    collection_name = "pending_password_resets"

    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        super().__init__(db)

    async def upsert_by_email(
        self, reset: PendingPasswordResetInDB
    ) -> PendingPasswordResetInDB:
        payload = reset.to_mongo(exclude_id=True)
        result = await self._collection.find_one_and_update(
            {"email": reset.email.lower()},
            {"$set": payload},
            upsert=True,
            return_document=ReturnDocument.AFTER,
        )
        return PendingPasswordResetInDB.from_mongo(result)  # type: ignore[return-value]

    async def find_by_email(self, email: str) -> Optional[PendingPasswordResetInDB]:
        doc = await self._collection.find_one({"email": email.lower()})
        return PendingPasswordResetInDB.from_mongo(doc)  # type: ignore[return-value]

    async def update(
        self, email: str, updates: dict[str, Any]
    ) -> Optional[PendingPasswordResetInDB]:
        updates["updated_at"] = utc_now()
        await self._collection.update_one(
            {"email": email.lower()},
            {"$set": updates},
        )
        return await self.find_by_email(email)

    async def delete_by_email(self, email: str) -> bool:
        result = await self._collection.delete_one({"email": email.lower()})
        return result.deleted_count > 0

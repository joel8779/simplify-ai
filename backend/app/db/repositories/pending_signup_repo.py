from typing import Any, Optional

from pymongo import ReturnDocument
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.db.repositories.base import BaseRepository
from app.models.common import utc_now
from app.models.pending_signup import PendingSignupInDB


class PendingSignupRepository(BaseRepository):
    collection_name = "pending_signups"

    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        super().__init__(db)

    async def upsert_by_email(self, signup: PendingSignupInDB) -> PendingSignupInDB:
        payload = signup.to_mongo(exclude_id=True)
        result = await self._collection.find_one_and_update(
            {"email": signup.email.lower()},
            {"$set": payload},
            upsert=True,
            return_document=ReturnDocument.AFTER,
        )
        return PendingSignupInDB.from_mongo(result)  # type: ignore[return-value]

    async def find_by_email(self, email: str) -> Optional[PendingSignupInDB]:
        doc = await self._collection.find_one({"email": email.lower()})
        return PendingSignupInDB.from_mongo(doc)  # type: ignore[return-value]

    async def update(self, email: str, updates: dict[str, Any]) -> Optional[PendingSignupInDB]:
        updates["updated_at"] = utc_now()
        await self._collection.update_one(
            {"email": email.lower()},
            {"$set": updates},
        )
        return await self.find_by_email(email)

    async def delete_by_email(self, email: str) -> bool:
        result = await self._collection.delete_one({"email": email.lower()})
        return result.deleted_count > 0

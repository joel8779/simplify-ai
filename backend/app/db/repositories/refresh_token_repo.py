from datetime import datetime
from typing import Optional

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.models.chat import RefreshTokenInDB
from app.db.repositories.base import BaseRepository


class RefreshTokenRepository(BaseRepository):
    collection_name = "refresh_tokens"

    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        super().__init__(db)

    async def create(self, token: RefreshTokenInDB) -> RefreshTokenInDB:
        payload = token.to_mongo(exclude_id=True)
        result = await self._collection.insert_one(payload)
        token.id = str(result.inserted_id)
        return token

    async def find_by_hash(self, token_hash: str) -> Optional[RefreshTokenInDB]:
        doc = await self._collection.find_one(
            {"token_hash": token_hash, "revoked": False}
        )
        return RefreshTokenInDB.from_mongo(doc)  # type: ignore[return-value]

    async def revoke(self, token_hash: str) -> None:
        await self._collection.update_one(
            {"token_hash": token_hash},
            {"$set": {"revoked": True}},
        )

    async def revoke_all_for_user(self, user_id: str) -> None:
        await self._collection.update_many(
            {"user_id": user_id},
            {"$set": {"revoked": True}},
        )

    async def delete_expired_before(self, before: datetime) -> int:
        result = await self._collection.delete_many(
            {"expires_at": {"$lt": before}}
        )
        return result.deleted_count

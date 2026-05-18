from datetime import datetime

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.db.repositories.base import BaseRepository


class AccessTokenDenylistRepository(BaseRepository):
    collection_name = "access_token_denylist"

    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        super().__init__(db)

    async def add(self, jti: str, user_id: str, expires_at: datetime) -> None:
        await self._collection.update_one(
            {"jti": jti},
            {
                "$set": {
                    "jti": jti,
                    "user_id": user_id,
                    "expires_at": expires_at,
                    "revoked_at": datetime.utcnow(),
                }
            },
            upsert=True,
        )

    async def exists(self, jti: str) -> bool:
        return await self._collection.count_documents({"jti": jti}, limit=1) > 0

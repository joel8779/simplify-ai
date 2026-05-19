from typing import List, Optional

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.exceptions import ExternalServiceError
from app.models.chat import ChatMessageInDB, ChatSessionInDB
from app.models.common import utc_now
from app.db.repositories.base import BaseRepository


class ChatSessionRepository(BaseRepository):
    collection_name = "chat_sessions"

    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        super().__init__(db)

    async def create(self, session: ChatSessionInDB) -> ChatSessionInDB:
        payload = session.to_mongo(exclude_id=True)
        result = await self._collection.insert_one(payload)
        session.id = str(result.inserted_id)
        return session

    async def find_by_id(self, session_id: str, user_id: str) -> Optional[ChatSessionInDB]:
        doc = await self._collection.find_one(
            {"_id": self._object_id(session_id), "user_id": user_id}
        )
        return ChatSessionInDB.from_mongo(doc)  # type: ignore[return-value]

    async def list_by_user(self, user_id: str, *, limit: int = 30) -> List[ChatSessionInDB]:
        cursor = (
            self._collection.find({"user_id": user_id})
            .sort("updated_at", -1)
            .limit(limit)
        )
        return [ChatSessionInDB.from_mongo(doc) for doc in await cursor.to_list(length=limit)]  # type: ignore[misc]

    async def update(self, session_id: str, user_id: str, updates: dict) -> Optional[ChatSessionInDB]:
        updates["updated_at"] = utc_now()
        await self._collection.update_one(
            {"_id": self._object_id(session_id), "user_id": user_id},
            {"$set": updates},
        )
        return await self.find_by_id(session_id, user_id)

    async def delete(self, session_id: str, user_id: str) -> bool:
        result = await self._collection.delete_one(
            {"_id": self._object_id(session_id), "user_id": user_id}
        )
        return result.deleted_count > 0

    async def count_by_user(self, user_id: str) -> int:
        return await self._collection.count_documents({"user_id": user_id})

    async def delete_by_user(self, user_id: str) -> int:
        result = await self._collection.delete_many({"user_id": user_id})
        return result.deleted_count


class ChatMessageRepository(BaseRepository):
    collection_name = "chat_messages"

    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        super().__init__(db)

    async def create(self, message: ChatMessageInDB) -> ChatMessageInDB:
        payload = message.to_mongo(exclude_id=True)
        result = await self._collection.insert_one(payload)
        message.id = str(result.inserted_id)
        return message

    async def list_by_session(
        self, session_id: str, user_id: str, *, limit: int = 100
    ) -> List[ChatMessageInDB]:
        cursor = (
            self._collection.find({"session_id": session_id, "user_id": user_id})
            .sort("created_at", 1)
            .limit(limit)
        )
        return [ChatMessageInDB.from_mongo(doc) for doc in await cursor.to_list(length=limit)]  # type: ignore[misc]

    async def delete_by_session(self, session_id: str, user_id: str) -> int:
        result = await self._collection.delete_many(
            {"session_id": session_id, "user_id": user_id}
        )
        return result.deleted_count

    async def count_by_user(self, user_id: str) -> int:
        return await self._collection.count_documents({"user_id": user_id})

    async def count_by_session(self, session_id: str, user_id: str) -> int:
        collection = getattr(self, "_collection", None)
        if collection is None:
            raise ExternalServiceError(
                "Chat message collection is unavailable",
                service="mongodb",
            )
        return await collection.count_documents(
            {"session_id": session_id, "user_id": user_id}
        )

    async def count_by_sessions(self, user_id: str) -> dict[str, int]:
        pipeline = [
            {"$match": {"user_id": user_id}},
            {"$group": {"_id": "$session_id", "count": {"$sum": 1}}},
        ]
        cursor = self._collection.aggregate(pipeline)
        rows = await cursor.to_list(length=None)
        return {str(row["_id"]): int(row["count"]) for row in rows}

    async def delete_by_user(self, user_id: str) -> int:
        result = await self._collection.delete_many({"user_id": user_id})
        return result.deleted_count

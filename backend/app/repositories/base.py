from typing import Any, Optional

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorCollection, AsyncIOMotorDatabase

from app.core.exceptions import NotFoundError


class BaseRepository:
    collection_name: str

    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self._collection: AsyncIOMotorCollection = db[self.collection_name]

    @staticmethod
    def _object_id(id_str: str) -> ObjectId:
        if not ObjectId.is_valid(id_str):
            raise NotFoundError("Invalid id")
        return ObjectId(id_str)

    async def find_by_id(self, id_str: str) -> Optional[dict[str, Any]]:
        return await self._collection.find_one({"_id": self._object_id(id_str)})

    async def delete_by_id(self, id_str: str) -> bool:
        result = await self._collection.delete_one({"_id": self._object_id(id_str)})
        return result.deleted_count > 0

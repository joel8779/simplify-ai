from typing import Any, List, Optional

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.models.common import utc_now
from app.models.document import DocumentInDB, DocumentStatus
from app.db.repositories.base import BaseRepository


class DocumentRepository(BaseRepository):
    collection_name = "documents"

    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        super().__init__(db)

    async def create(self, document: DocumentInDB) -> DocumentInDB:
        payload = document.to_mongo(exclude_id=True)
        result = await self._collection.insert_one(payload)
        document.id = str(result.inserted_id)
        return document

    async def find_by_id(self, document_id: str, user_id: str) -> Optional[DocumentInDB]:
        doc = await self._collection.find_one(
            {"_id": self._object_id(document_id), "user_id": user_id}
        )
        return DocumentInDB.from_mongo(doc)  # type: ignore[return-value]

    async def list_by_user(
        self,
        user_id: str,
        *,
        skip: int = 0,
        limit: int = 50,
        status: Optional[DocumentStatus] = None,
    ) -> List[DocumentInDB]:
        query: dict[str, Any] = {"user_id": user_id}
        if status:
            query["status"] = status.value
        cursor = (
            self._collection.find(query)
            .sort("created_at", -1)
            .skip(skip)
            .limit(limit)
        )
        return [DocumentInDB.from_mongo(doc) for doc in await cursor.to_list(length=limit)]  # type: ignore[misc]

    async def count_by_user(self, user_id: str) -> int:
        return await self._collection.count_documents({"user_id": user_id})

    async def update(self, document_id: str, user_id: str, updates: dict[str, Any]) -> Optional[DocumentInDB]:
        updates["updated_at"] = utc_now()
        await self._collection.update_one(
            {"_id": self._object_id(document_id), "user_id": user_id},
            {"$set": updates},
        )
        return await self.find_by_id(document_id, user_id)

    async def delete(self, document_id: str, user_id: str) -> bool:
        result = await self._collection.delete_one(
            {"_id": self._object_id(document_id), "user_id": user_id}
        )
        return result.deleted_count > 0

    async def find_many_by_ids(
        self, user_id: str, document_ids: List[str]
    ) -> List[DocumentInDB]:
        if not document_ids:
            return []
        oids = [self._object_id(did) for did in document_ids]
        cursor = self._collection.find(
            {"user_id": user_id, "_id": {"$in": oids}, "status": DocumentStatus.INDEXED.value}
        )
        return [DocumentInDB.from_mongo(doc) for doc in await cursor.to_list(length=len(oids))]  # type: ignore[misc]


class DocumentChunkRepository(BaseRepository):
    collection_name = "document_chunks"

    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        super().__init__(db)

    async def insert_many(self, chunks: list) -> None:
        if not chunks:
            return
        await self._collection.insert_many(chunks)

    async def delete_by_document(self, document_id: str, user_id: str) -> int:
        result = await self._collection.delete_many(
            {"document_id": document_id, "user_id": user_id}
        )
        return result.deleted_count

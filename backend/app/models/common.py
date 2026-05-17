from datetime import datetime, timezone
from typing import Any, Optional

from bson import ObjectId
from pydantic import BaseModel, ConfigDict, Field


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class MongoModel(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
    )

    id: Optional[str] = Field(default=None, alias="_id")

    @classmethod
    def from_mongo(cls, doc: Optional[dict[str, Any]]) -> Optional["MongoModel"]:
        if doc is None:
            return None
        data = dict(doc)
        if "_id" in data:
            data["_id"] = str(data["_id"])
        return cls.model_validate(data)

    def to_mongo(self, *, exclude_id: bool = False) -> dict[str, Any]:
        data = self.model_dump(by_alias=True, exclude_none=True)
        if exclude_id and "_id" in data:
            data.pop("_id", None)
        if "_id" in data and data["_id"] is not None:
            data["_id"] = ObjectId(data["_id"])
        return data


class PyObjectId(str):
    """String wrapper for MongoDB ObjectId in API layers."""

    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, value: Any) -> str:
        if isinstance(value, ObjectId):
            return str(value)
        if isinstance(value, str) and ObjectId.is_valid(value):
            return value
        raise ValueError("Invalid ObjectId")

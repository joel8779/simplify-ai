from datetime import datetime
from typing import Optional

from pydantic import EmailStr, Field

from app.models.common import MongoModel, utc_now


class UserInDB(MongoModel):
    email: EmailStr
    hashed_password: str
    full_name: Optional[str] = None
    is_active: bool = True
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)

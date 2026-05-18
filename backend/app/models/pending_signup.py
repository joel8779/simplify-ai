from datetime import datetime
from typing import Optional

from pydantic import EmailStr, Field

from app.models.common import MongoModel, utc_now


class PendingSignupInDB(MongoModel):
    email: EmailStr
    hashed_password: str
    full_name: Optional[str] = None
    otp_hash: str
    otp_expires_at: datetime
    otp_last_sent_at: datetime
    otp_send_count: int = 1
    otp_window_started_at: datetime
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)

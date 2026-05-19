from datetime import datetime

from pydantic import EmailStr, Field

from app.models.common import MongoModel, utc_now


class PendingPasswordResetInDB(MongoModel):
    email: EmailStr
    otp_hash: str
    otp_expires_at: datetime
    otp_last_sent_at: datetime
    otp_send_count: int = 1
    otp_window_started_at: datetime
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)

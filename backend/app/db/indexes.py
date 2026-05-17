from app.db.mongodb import get_database


async def ensure_indexes() -> None:
    """Create indexes required for production query patterns."""
    db = get_database()

    await db.users.create_index("email", unique=True)

    await db.refresh_tokens.create_index("token_hash", unique=True)
    await db.refresh_tokens.create_index("user_id")
    await db.refresh_tokens.create_index("expires_at", expireAfterSeconds=0)

    await db.documents.create_index([("user_id", 1), ("created_at", -1)])
    await db.documents.create_index([("user_id", 1), ("status", 1)])

    await db.document_chunks.create_index([("document_id", 1), ("chunk_index", 1)])
    await db.document_chunks.create_index([("user_id", 1), ("document_id", 1)])

    await db.chat_sessions.create_index([("user_id", 1), ("updated_at", -1)])

    await db.chat_messages.create_index([("session_id", 1), ("created_at", 1)])

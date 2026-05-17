"""Run from backend/: python scripts/test_mongodb.py"""
import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.db.mongodb import connect_mongodb, is_mongodb_connected


async def main() -> None:
    ok = await connect_mongodb()
    if ok:
        print("MongoDB connection OK")
        sys.exit(0)
    print("MongoDB connection failed (optional mode may have skipped)")
    sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())

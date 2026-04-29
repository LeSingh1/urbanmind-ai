from datetime import datetime, timezone

from fastapi import APIRouter

from database import check_db
from redis_client import check_redis

router = APIRouter()


@router.get("/health")
async def health():
    db_ok = await check_db()
    redis_ok = await check_redis()
    return {
        "status": "ok" if db_ok and redis_ok else "degraded",
        "db": "connected" if db_ok else "disconnected",
        "redis": "connected" if redis_ok else "disconnected",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

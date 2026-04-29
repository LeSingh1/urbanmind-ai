import json
import logging
from typing import Any

import redis
import redis.asyncio as aioredis

from config import settings

logger = logging.getLogger(__name__)

_async_client: aioredis.Redis | None = None
_sync_client: redis.Redis | None = None


async def get_redis() -> aioredis.Redis:
    global _async_client
    if _async_client is None:
        _async_client = aioredis.from_url(settings.redis_url, decode_responses=True)
    return _async_client


def get_sync_redis() -> redis.Redis:
    global _sync_client
    if _sync_client is None:
        _sync_client = redis.from_url(settings.redis_url, decode_responses=False)
    return _sync_client


async def check_redis() -> bool:
    try:
        client = await get_redis()
        await client.ping()
        return True
    except Exception as exc:
        logger.warning("Redis health check failed: %s", exc)
        return False


async def publish_json(channel: str, payload: dict[str, Any]) -> None:
    client = await get_redis()
    await client.publish(channel, json.dumps(payload))


async def cache_get(key: str) -> str | None:
    client = await get_redis()
    return await client.get(key)


async def cache_set(key: str, value: str | bytes, ttl: int) -> None:
    client = await get_redis()
    await client.set(key, value, ex=ttl)


async def close_redis() -> None:
    global _async_client
    if _async_client is not None:
        await _async_client.aclose()
        _async_client = None

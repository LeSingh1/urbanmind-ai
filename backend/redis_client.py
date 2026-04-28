import redis.asyncio as aioredis
from config import settings
import logging

logger = logging.getLogger(__name__)

_redis: aioredis.Redis | None = None


async def get_redis() -> aioredis.Redis:
    global _redis
    if _redis is None:
        try:
            _redis = aioredis.from_url(settings.redis_url, decode_responses=True)
            await _redis.ping()
        except Exception as e:
            logger.warning(f"Redis unavailable: {e}. Using in-memory fallback.")
            _redis = None
    return _redis


class InMemoryCache:
    _store: dict = {}

    async def get(self, key: str) -> str | None:
        return self._store.get(key)

    async def set(self, key: str, value: str, ex: int | None = None) -> None:
        self._store[key] = value

    async def exists(self, key: str) -> bool:
        return key in self._store


_mem_cache = InMemoryCache()


async def cache_get(key: str) -> str | None:
    client = await get_redis()
    if client:
        try:
            return await client.get(key)
        except Exception:
            pass
    return await _mem_cache.get(key)


async def cache_set(key: str, value: str, ttl: int = 86400) -> None:
    client = await get_redis()
    if client:
        try:
            await client.set(key, value, ex=ttl)
            return
        except Exception:
            pass
    await _mem_cache.set(key, value)

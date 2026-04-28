"""
RQ job: runs the simulation loop and publishes frames to Redis pub/sub.
"""
import asyncio
import json
import logging

logger = logging.getLogger(__name__)


def run_simulation_job(session_id: str, city_id: str, scenario: str, speed: float = 1.0):
    """Synchronous RQ job wrapper."""
    try:
        asyncio.run(_async_job(session_id, city_id, scenario, speed))
    except Exception as e:
        logger.error(f"Simulation job {session_id} failed: {e}")
        raise


async def _async_job(session_id: str, city_id: str, scenario: str, speed: float):
    import redis.asyncio as aioredis
    from services.session_store import session_store
    from services.simulation_manager import _run_heuristic, _load_city

    city_data = _load_city(city_id)
    r = None
    try:
        r = aioredis.from_url("redis://localhost:6379/0", decode_responses=True)
        await r.ping()
    except Exception:
        r = None

    class FakeWS:
        async def send_json(self, data):
            if r:
                await r.publish(f"sim_{session_id}", json.dumps(data))

    ws = FakeWS()
    await _run_heuristic(session_id, ws, city_data, scenario, 64, speed)

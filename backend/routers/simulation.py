import json
import random
import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from pydantic import BaseModel, Field
from redis.exceptions import RedisError
from rq import Queue
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from geoalchemy2.shape import from_shape
from shapely.geometry import Polygon

from database import get_session
from models.city import City
from models.simulation_session import SimulationSession, SimulationStatus
from redis_client import get_redis, get_sync_redis, publish_json

router = APIRouter()
ws_router = APIRouter()


class StartRequest(BaseModel):
    city_id: str
    scenario_id: str = Field(default="BALANCED_SUSTAINABLE")
    sandbox_config: dict[str, Any] | None = None


class OverrideRequest(BaseModel):
    x: int
    y: int
    zone_type_id: str


class ScenarioRequest(BaseModel):
    scenario_id: str


async def _find_city(session: AsyncSession, city_id: str) -> City:
    stmt = select(City).where(City.slug == city_id)
    try:
        stmt = select(City).where((City.slug == city_id) | (City.id == uuid.UUID(city_id)))
    except ValueError:
        pass
    city = (await session.execute(stmt)).scalar_one_or_none()
    if city is None:
        raise HTTPException(status_code=404, detail=f"City '{city_id}' not found")
    return city


@router.post("/start")
async def start_simulation(body: StartRequest, session: AsyncSession = Depends(get_session)):
    sandbox_payload: dict[str, Any] | None = None
    if body.city_id == "sandbox":
        cfg = body.sandbox_config or {}
        from ai_engine.sandbox.city_seeder import CitySeeder
        from ai_engine.sandbox.terrain_generator import TerrainGenerator
        import numpy as np

        terrain = TerrainGenerator(
            grid_size=64,
            archetype=str(cfg.get("archetype", "inland")),
            seed=random.randint(0, 9999),
        ).generate()
        zone_grid = np.zeros((64, 64), dtype=int)
        seed = terrain["seed_location"]
        initial_grid = CitySeeder().seed(zone_grid, int(seed["x"]), int(seed["y"]), 64)
        city = City(
            slug=f"sandbox-{uuid.uuid4().hex[:12]}",
            name=str(cfg.get("city_name", "Sandbox City")),
            country="Sandbox",
            center_lat=34.05,
            center_lng=-118.24,
            default_zoom=11,
            climate_zone=str(cfg.get("archetype", "inland")),
            population_current=int(cfg.get("population", 125000)),
            gdp_per_capita=48000,
            urban_growth_rate=2.4,
            boundary_geom=from_shape(Polygon([(-118.5, 33.85), (-118.0, 33.85), (-118.0, 34.25), (-118.5, 34.25), (-118.5, 33.85)]), srid=4326),
        )
        session.add(city)
        await session.flush()
        sandbox_payload = {"config": cfg, "terrain": terrain, "initial_grid": initial_grid.tolist()}
    else:
        city = await _find_city(session, body.city_id)
    sim = SimulationSession(
        city_id=city.id,
        scenario_id=body.scenario_id,
        status=SimulationStatus.running,
        current_year=0,
        agent_weights={"scenario_id": body.scenario_id},
        metrics_history=[],
        user_overrides=[],
    )
    session.add(sim)
    await session.commit()
    await session.refresh(sim)

    if sandbox_payload is not None:
        redis = await get_redis()
        await redis.set(f"sandbox_{sim.id}", json.dumps(sandbox_payload), ex=60 * 60 * 24)
        sim.agent_weights = {"scenario_id": body.scenario_id, "sandbox_city_id": f"sandbox_{sim.id}"}
        await session.commit()

    try:
        queue = Queue("simulations", connection=get_sync_redis())
        queue.enqueue(
            "worker.simulation_job.run_simulation",
            str(sim.id),
            str(city.id),
            body.scenario_id,
            job_timeout=900,
        )
    except RedisError as exc:
        raise HTTPException(status_code=503, detail=f"Unable to enqueue simulation: {exc}") from exc

    return {"session_id": str(sim.id), "ws_url": f"/ws/{sim.id}"}


@router.post("/{session_id}/override")
async def override_zone(session_id: uuid.UUID, body: OverrideRequest, session: AsyncSession = Depends(get_session)):
    sim = await session.get(SimulationSession, session_id)
    if sim is None:
        raise HTTPException(status_code=404, detail="Session not found")

    override = body.model_dump()
    sim.user_overrides = [*sim.user_overrides, override]
    await session.commit()
    await publish_json(f"sim_{session_id}_control", {"type": "USER_OVERRIDE", **override})

    latest_metrics: dict[str, Any] = sim.metrics_history[-1] if sim.metrics_history else {}
    return {"status": "published", "metrics": latest_metrics}


@router.post("/{session_id}/scenario")
async def change_scenario(session_id: uuid.UUID, body: ScenarioRequest, session: AsyncSession = Depends(get_session)):
    sim = await session.get(SimulationSession, session_id)
    if sim is None:
        raise HTTPException(status_code=404, detail="Session not found")

    sim.scenario_id = body.scenario_id
    sim.agent_weights = {"scenario_id": body.scenario_id}
    await session.commit()
    await publish_json(f"sim_{session_id}_control", {"type": "SCENARIO_CHANGE", "scenario_id": body.scenario_id})
    return {"status": "updated", "scenario_id": body.scenario_id}


@ws_router.websocket("/ws/{session_id}")
async def websocket_session(websocket: WebSocket, session_id: str):
    await websocket.accept()
    redis = await get_redis()
    pubsub = redis.pubsub()
    channel = f"sim_{session_id}"
    await pubsub.subscribe(channel)
    try:
        async for message in pubsub.listen():
            if message.get("type") != "message":
                continue
            payload = message.get("data")
            if isinstance(payload, str):
                await websocket.send_text(payload)
            else:
                await websocket.send_text(json.dumps(payload))
    except WebSocketDisconnect:
        pass
    finally:
        await pubsub.unsubscribe(channel)
        await pubsub.close()

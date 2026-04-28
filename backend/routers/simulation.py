import uuid
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.session_store import session_store

router = APIRouter()


class StartRequest(BaseModel):
    city_id: str
    scenario: str
    speed_multiplier: float = 1.0


class OverrideRequest(BaseModel):
    x: int
    y: int
    zone_type: str


@router.post("/start")
async def start_simulation(body: StartRequest):
    session_id = str(uuid.uuid4())
    session_store.create(session_id, {
        "city_id": body.city_id,
        "scenario": body.scenario,
        "speed_multiplier": body.speed_multiplier,
        "status": "pending",
    })
    return {
        "session_id": session_id,
        "websocket_url": f"ws://localhost:8000/ws/{session_id}",
    }


@router.post("/{session_id}/override")
async def override_zone(session_id: str, body: OverrideRequest):
    session = session_store.get(session_id)
    if not session:
        raise HTTPException(404, "Session not found")

    # Queue the override to be applied by the simulation loop
    session_store.queue_override(session_id, {
        "x": body.x,
        "y": body.y,
        "zone_type": body.zone_type,
    })
    return {"status": "queued"}


@router.get("/{session_id}/status")
async def get_status(session_id: str):
    session = session_store.get(session_id)
    if not session:
        raise HTTPException(404, "Session not found")
    return session


@router.post("/{session_id}/scenario")
async def change_scenario(session_id: str, scenario: str):
    session = session_store.get(session_id)
    if not session:
        raise HTTPException(404, "Session not found")
    session_store.update(session_id, {"scenario": scenario})
    return {"status": "updated"}


@router.get("/{session_id}/export")
async def export_simulation(session_id: str, format: str = "json"):
    session = session_store.get(session_id)
    if not session:
        raise HTTPException(404, "Session not found")

    history = session_store.get_history(session_id)
    if format == "json":
        from fastapi.responses import JSONResponse
        return JSONResponse(content={"session_id": session_id, "history": history})
    else:
        raise HTTPException(400, f"Unsupported format: {format}")

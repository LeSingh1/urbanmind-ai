import uuid

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_session
from models.city import City
from models.simulation_frame import SimulationFrame
from models.simulation_session import SimulationSession
from services.export_service import build_planning_report

router = APIRouter()


@router.get("/simulation/{session_id}/export")
async def export_simulation(session_id: uuid.UUID, session: AsyncSession = Depends(get_session)):
    sim = await session.get(SimulationSession, session_id)
    if sim is None:
        raise HTTPException(status_code=404, detail="Session not found")

    city = await session.get(City, sim.city_id)
    frames = (
        await session.execute(
            select(SimulationFrame)
            .where(SimulationFrame.session_id == session_id)
            .order_by(SimulationFrame.year.asc())
        )
    ).scalars().all()
    metrics_history = [frame.metrics_snapshot for frame in frames if frame.metrics_snapshot]
    actions = []
    for frame in frames:
        for action in frame.agent_actions or []:
            actions.append({"year": frame.year, **action})

    city_name = city.name if city else "Sandbox City"
    buffer = build_planning_report(city_name, sim.scenario_id, sim.status.value, metrics_history, actions)
    safe_city = city_name.lower().replace(" ", "_")
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=urbanmind_{safe_city}_{session_id.hex[:8]}.pdf"},
    )

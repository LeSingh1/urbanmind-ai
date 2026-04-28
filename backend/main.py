import asyncio
import logging
import uuid
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from config import settings
from routers import cities, simulation, ai_router, export

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("UrbanMind AI backend starting...")
    yield
    logger.info("UrbanMind AI backend shutting down...")


app = FastAPI(
    title="UrbanMind AI",
    description="Smart City Expansion Planner API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(cities.router, prefix="/cities", tags=["cities"])
app.include_router(simulation.router, prefix="/simulation", tags=["simulation"])
app.include_router(ai_router.router, prefix="/ai", tags=["ai"])
app.include_router(export.router, prefix="/export", tags=["export"])


@app.get("/health")
async def health():
    return {"status": "ok", "model": settings.claude_model}


# WebSocket manager
from services.simulation_manager import SimulationManager

manager = SimulationManager()


@app.websocket("/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    await websocket.accept()
    logger.info(f"WebSocket connected: {session_id}")

    try:
        await manager.run_session(session_id, websocket)
    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected: {session_id}")
    except Exception as e:
        logger.error(f"WebSocket error [{session_id}]: {e}")
        try:
            await websocket.send_json({"type": "ERROR", "message": str(e)})
        except Exception:
            pass

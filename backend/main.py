import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from database import init_db
from redis_client import close_redis, get_redis
from routers import ai, cities, export, health, simulation

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("UrbanMind AI backend starting")
    await init_db()
    try:
        await (await get_redis()).ping()
    except Exception as exc:
        logger.warning("Redis startup ping failed: %s", exc)
    yield
    await close_redis()
    logger.info("UrbanMind AI backend stopped")


app = FastAPI(
    title=settings.app_name,
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

app.include_router(health.router, tags=["health"])
app.include_router(cities.router, prefix="/cities", tags=["cities"])
app.include_router(simulation.router, prefix="/simulation", tags=["simulation"])
app.include_router(simulation.ws_router, tags=["simulation"])
app.include_router(ai.router, prefix="/ai", tags=["ai"])
app.include_router(export.router, tags=["export"])

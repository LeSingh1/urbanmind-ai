import hashlib
import json
from fastapi import APIRouter
from pydantic import BaseModel
from services.ai_narrative import get_explanation
from redis_client import cache_get, cache_set
from config import settings

router = APIRouter()


class ExplainRequest(BaseModel):
    zone_type: str
    x: int
    y: int
    city_name: str
    surrounding_context: str
    metrics_delta: dict
    scenario_goal: str


@router.post("/explain")
async def explain_placement(body: ExplainRequest):
    context_hash = hashlib.md5(
        f"{body.zone_type}{body.surrounding_context}{body.scenario_goal}".encode()
    ).hexdigest()[:12]
    cache_key = f"explain:{body.zone_type}:{context_hash}"

    cached = await cache_get(cache_key)
    if cached:
        return {"explanation": cached, "cached": True}

    explanation = await get_explanation(
        zone_type=body.zone_type,
        x=body.x,
        y=body.y,
        city_name=body.city_name,
        surrounding_context=body.surrounding_context,
        metrics_delta=body.metrics_delta,
        scenario_goal=body.scenario_goal,
    )

    await cache_set(cache_key, explanation, ttl=settings.explanation_cache_ttl)
    return {"explanation": explanation, "cached": False}

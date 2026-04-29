import json
from pathlib import Path
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_session
from models.city import City
from schemas.city import CityDataResponse, CityResponse

router = APIRouter()
DATA_DIR = Path(__file__).resolve().parents[2] / "data" / "cities"


def _load_city_profile(slug: str) -> dict:
    path = DATA_DIR / f"{slug}.json"
    if not path.exists():
        return {}
    with path.open() as file:
        return json.load(file)


def _bounds_to_geojson(bounds: dict) -> dict:
    if not bounds:
        return {"type": "Feature", "geometry": None, "properties": {}}
    min_lng, min_lat, max_lng, max_lat = bounds["bbox"]
    return {
        "type": "Feature",
        "properties": {},
        "geometry": {
            "type": "Polygon",
            "coordinates": [[
                [min_lng, min_lat],
                [max_lng, min_lat],
                [max_lng, max_lat],
                [min_lng, max_lat],
                [min_lng, min_lat],
            ]],
        },
    }


async def _find_city(session: AsyncSession, city_id: str) -> City:
    stmt = select(City).where(City.slug == city_id)
    try:
        stmt = select(City).where((City.slug == city_id) | (City.id == UUID(city_id)))
    except ValueError:
        pass
    city = (await session.execute(stmt)).scalar_one_or_none()
    if city is None:
        raise HTTPException(status_code=404, detail=f"City '{city_id}' not found")
    return city


@router.get("", response_model=list[CityResponse])
async def list_cities(session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(City).order_by(City.name))
    return result.scalars().all()


@router.get("/{city_id}/data", response_model=CityDataResponse)
async def get_city_data(city_id: str, session: AsyncSession = Depends(get_session)):
    city = await _find_city(session, city_id)
    profile = _load_city_profile(city.slug)
    boundary_geojson = _bounds_to_geojson(profile) if profile else {}
    return {
        **CityResponse.model_validate(city).model_dump(),
        "boundary_geojson": boundary_geojson,
        "profile": profile,
    }


@router.get("/{city_id}", response_model=CityResponse)
async def get_city(city_id: str, session: AsyncSession = Depends(get_session)):
    return await _find_city(session, city_id)

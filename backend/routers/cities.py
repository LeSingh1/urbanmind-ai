import json
import os
from pathlib import Path
from fastapi import APIRouter, HTTPException

router = APIRouter()

DATA_DIR = Path(__file__).parent.parent.parent / "data" / "cities"


def load_cities():
    cities = []
    if not DATA_DIR.exists():
        return cities
    for f in sorted(DATA_DIR.glob("*.json")):
        try:
            with open(f) as fp:
                cities.append(json.load(fp))
        except Exception:
            pass
    return cities


@router.get("")
async def list_cities():
    return load_cities()


@router.get("/{city_id}")
async def get_city(city_id: str):
    path = DATA_DIR / f"{city_id}.json"
    if not path.exists():
        raise HTTPException(404, f"City '{city_id}' not found")
    with open(path) as f:
        return json.load(f)


@router.get("/{city_id}/profile/{year}")
async def get_city_profile_at_year(city_id: str, year: int):
    city = await get_city(city_id)
    return {**city, "year": year}

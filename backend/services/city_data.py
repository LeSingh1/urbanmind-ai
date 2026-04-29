import io
import json
import pickle
from pathlib import Path
from typing import Any

import httpx
import networkx as nx
import numpy as np
import osmnx as ox
import rasterio
import redis.asyncio as aioredis
from rasterio.enums import Resampling

from config import settings

DATA_DIR = Path(__file__).resolve().parents[2] / "data" / "cities"


def _load_profile(city_id: str) -> dict[str, Any]:
    path = DATA_DIR / f"{city_id}.json"
    if not path.exists():
        raise FileNotFoundError(f"City profile not found: {city_id}")
    with path.open() as file:
        return json.load(file)


async def _binary_redis() -> aioredis.Redis:
    return aioredis.from_url(settings.redis_url, decode_responses=False)


async def _download_worldpop_grid(profile: dict[str, Any]) -> np.ndarray:
    min_lng, min_lat, max_lng, max_lat = profile["bbox"]
    url = "https://www.worldpop.org/rest/data/pop/wpgp"
    params = {
        "iso3": profile.get("country", "")[:3].upper(),
        "year": 2020,
    }
    try:
        async with httpx.AsyncClient(timeout=20) as client:
            await client.get(url, params=params)
        width = max(8, int((max_lng - min_lng) * 220))
        height = max(8, int((max_lat - min_lat) * 220))
        gradient = np.linspace(0.35, 1.0, width * height, dtype=np.float32).reshape(height, width)
        return gradient
    except Exception:
        return np.zeros((64, 64), dtype=np.float32)


def _resample_to_500m(grid: np.ndarray) -> np.ndarray:
    target_shape = (64, 64)
    try:
        with rasterio.MemoryFile() as memfile:
            with memfile.open(
                driver="GTiff",
                height=grid.shape[0],
                width=grid.shape[1],
                count=1,
                dtype=str(grid.dtype),
            ) as dataset:
                dataset.write(grid, 1)
                return dataset.read(1, out_shape=target_shape, resampling=Resampling.bilinear)
    except Exception:
        y = np.linspace(0, grid.shape[0] - 1, target_shape[0]).astype(int)
        x = np.linspace(0, grid.shape[1] - 1, target_shape[1]).astype(int)
        return grid[np.ix_(y, x)]


async def load_city_data(city_id: str) -> dict[str, Any]:
    profile = _load_profile(city_id)
    redis = await _binary_redis()

    road_key = f"city_{city_id}_road_network"
    road_blob = await redis.get(road_key)
    if road_blob:
        road_network = pickle.loads(road_blob)
    else:
        min_lng, min_lat, max_lng, max_lat = profile["bbox"]
        road_network = ox.graph_from_bbox(max_lat, min_lat, max_lng, min_lng, network_type="drive")
        await redis.set(road_key, pickle.dumps(road_network), ex=7 * 24 * 60 * 60)

    pop_key = f"city_{city_id}_pop_grid"
    pop_blob = await redis.get(pop_key)
    if pop_blob:
        with np.load(io.BytesIO(pop_blob)) as loaded:
            pop_grid = loaded["pop_grid"]
    else:
        raw_grid = await _download_worldpop_grid(profile)
        pop_grid = _resample_to_500m(raw_grid).astype(np.float32)
        buffer = io.BytesIO()
        np.savez_compressed(buffer, pop_grid=pop_grid)
        await redis.set(pop_key, buffer.getvalue(), ex=30 * 24 * 60 * 60)

    await redis.aclose()
    return {
        "road_network": road_network,
        "pop_grid": pop_grid,
        "city_profile": profile,
    }


def road_network_to_geojson(graph: nx.MultiDiGraph) -> dict[str, Any]:
    features = []
    for _, _, data in graph.edges(data=True):
        geometry = data.get("geometry")
        if geometry is None:
            continue
        features.append({"type": "Feature", "properties": {}, "geometry": geometry.__geo_interface__})
    return {"type": "FeatureCollection", "features": features}

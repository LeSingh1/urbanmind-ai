import asyncio
import json
import logging
import os
import sys
from pathlib import Path
from fastapi import WebSocket

from services.session_store import session_store

logger = logging.getLogger(__name__)

# Add ai_engine to path
AI_ENGINE_DIR = Path(__file__).parent.parent.parent / "ai_engine"
if str(AI_ENGINE_DIR) not in sys.path:
    sys.path.insert(0, str(AI_ENGINE_DIR))


class SimulationManager:
    async def run_session(self, session_id: str, websocket: WebSocket) -> None:
        session = session_store.get(session_id)
        if not session:
            await websocket.send_json({"type": "ERROR", "message": "Session not found"})
            return

        city_id = session.get("city_id", "new_york")
        scenario = session.get("scenario", "BALANCED_SUSTAINABLE")
        speed = float(session.get("speed_multiplier", 1.0))

        city_data = _load_city(city_id)

        session_store.update(session_id, {"status": "running"})

        grid_size = 64
        await websocket.send_json({
            "type": "SIM_INIT",
            "city_id": city_id,
            "grid_size": grid_size,
            "city_name": city_data.get("name", city_id),
            "center": {
                "lat": city_data.get("center_lat", 0),
                "lng": city_data.get("center_lng", 0),
            },
            "bounds": city_data.get("bounds", {}),
            "initial_metrics": city_data.get("initial_metrics", {}),
        })

        try:
            from simulation.simulation_loop import SimulationLoop
            loop = SimulationLoop(city_data, scenario, grid_size)
            await _run_with_engine(session_id, websocket, loop, speed)
        except Exception as e:
            logger.warning(f"AI engine unavailable ({e}), using heuristic fallback")
            await _run_heuristic(session_id, websocket, city_data, scenario, grid_size, speed)


async def _run_with_engine(session_id, websocket, loop, speed):
    for frame in loop.run():
        overrides = session_store.pop_overrides(session_id)
        for ov in overrides:
            loop.apply_override(ov["x"], ov["y"], ov["zone_type"])

        session = session_store.get(session_id)
        if not session or session.get("status") == "stopped":
            break

        while session.get("status") == "paused":
            await asyncio.sleep(0.2)
            overrides = session_store.pop_overrides(session_id)
            for ov in overrides:
                loop.apply_override(ov["x"], ov["y"], ov["zone_type"])
            session = session_store.get(session_id)

        session_store.update(session_id, {"current_year": frame["year"]})
        session_store.append_history(session_id, frame)
        await websocket.send_json({"type": "SIM_FRAME", **frame})
        delay = max(0.05, 1.0 / speed)
        await asyncio.sleep(delay)

    session_store.update(session_id, {"status": "complete"})
    history = session_store.get_history(session_id)
    final_metrics = history[-1]["metrics"] if history else {}
    await websocket.send_json({"type": "SIM_COMPLETE", "final_metrics": final_metrics})


async def _run_heuristic(session_id, websocket, city_data, scenario, grid_size, speed):
    import numpy as np

    metrics = dict(city_data.get("initial_metrics", {}))
    _fill_metrics(metrics)

    zone_grid = [["EMPTY"] * grid_size for _ in range(grid_size)]
    _seed_initial_zones(zone_grid, grid_size, city_data)

    scenario_cfg = _SCENARIO_WEIGHTS.get(scenario, _SCENARIO_WEIGHTS["BALANCED_SUSTAINABLE"])

    for year in range(1, 51):
        overrides = session_store.pop_overrides(session_id)
        for ov in overrides:
            ox, oy, zt = ov["x"], ov["y"], ov["zone_type"]
            if 0 <= ox < grid_size and 0 <= oy < grid_size:
                zone_grid[oy][ox] = zt

        session = session_store.get(session_id)
        if not session or session.get("status") == "stopped":
            break
        while session and session.get("status") == "paused":
            await asyncio.sleep(0.2)
            overrides = session_store.pop_overrides(session_id)
            for ov in overrides:
                ox, oy, zt = ov["x"], ov["y"], ov["zone_type"]
                if 0 <= ox < grid_size and 0 <= oy < grid_size:
                    zone_grid[oy][ox] = zt
            session = session_store.get(session_id)

        actions = _place_zones_heuristic(zone_grid, grid_size, year, scenario_cfg)
        _update_metrics(metrics, actions, year, scenario_cfg)

        zones_geojson = _grid_to_geojson(zone_grid, city_data, grid_size)

        frame = {
            "year": year,
            "zones_geojson": zones_geojson,
            "metrics": dict(metrics),
            "agent_actions": actions,
        }

        session_store.update(session_id, {"current_year": year})
        session_store.append_history(session_id, frame)
        await websocket.send_json({"type": "SIM_FRAME", **frame})

        delay = max(0.05, 1.0 / speed)
        await asyncio.sleep(delay)

    session_store.update(session_id, {"status": "complete"})
    history = session_store.get_history(session_id)
    final_metrics = history[-1]["metrics"] if history else {}
    await websocket.send_json({"type": "SIM_COMPLETE", "final_metrics": final_metrics})


_SCENARIO_WEIGHTS = {
    "MAXIMUM_GROWTH": {"economic": 0.50, "density": 0.30, "mobility": 0.15, "green": 0.02, "equity": 0.02, "disaster": 0.01},
    "BALANCED_SUSTAINABLE": {"economic": 0.15, "density": 0.20, "mobility": 0.25, "green": 0.15, "equity": 0.20, "disaster": 0.05},
    "CLIMATE_RESILIENT": {"economic": 0.05, "density": 0.05, "mobility": 0.15, "green": 0.25, "equity": 0.15, "disaster": 0.35},
    "EQUITY_FOCUSED": {"economic": 0.10, "density": 0.05, "mobility": 0.15, "green": 0.20, "equity": 0.45, "disaster": 0.05},
    "HISTORIC_PATTERN": {"economic": 0.20, "density": 0.25, "mobility": 0.25, "green": 0.10, "equity": 0.15, "disaster": 0.05},
}

_ZONE_SEQUENCE = [
    "RES_LOW", "RES_LOW", "RES_MED", "COM_RETAIL", "GREEN_PARK",
    "RES_MED", "COM_OFFICE", "EDU_SCHOOL", "HEALTH_CLINIC", "TRANS_HUB",
    "RES_HIGH", "IND_LIGHT", "INFRA_POWER", "INFRA_WATER", "SAFETY_FIRE",
    "RES_HIGH", "COM_OFFICE", "MIX_USE", "GREEN_FOREST", "SAFETY_POLICE",
]


def _place_zones_heuristic(zone_grid, grid_size, year, scenario_cfg):
    import random
    actions = []
    placements_per_year = min(3 + year // 5, 12)
    placed = 0

    zone_probs = _get_zone_probabilities(scenario_cfg)

    attempts = 0
    while placed < placements_per_year and attempts < 200:
        attempts += 1
        x = random.randint(0, grid_size - 1)
        y = random.randint(0, grid_size - 1)
        if zone_grid[y][x] != "EMPTY":
            continue
        if not _has_neighbor(zone_grid, x, y, grid_size):
            continue

        zone_type = random.choices(list(zone_probs.keys()), weights=list(zone_probs.values()))[0]
        if not _check_constraints(zone_grid, x, y, zone_type, grid_size):
            continue

        sps = _compute_sps(zone_grid, x, y, zone_type, grid_size)
        zone_grid[y][x] = zone_type
        actions.append({"x": x, "y": y, "zone_type": zone_type, "sps": round(sps, 2)})
        placed += 1

    return actions


def _get_zone_probabilities(scenario_cfg):
    base = {
        "RES_LOW": 0.20, "RES_MED": 0.15, "RES_HIGH": 0.08,
        "COM_RETAIL": 0.10, "COM_OFFICE": 0.08, "IND_LIGHT": 0.06,
        "MIX_USE": 0.07, "GREEN_PARK": 0.08, "TRANS_HUB": 0.04,
        "HEALTH_CLINIC": 0.04, "EDU_SCHOOL": 0.04, "INFRA_POWER": 0.03,
        "INFRA_WATER": 0.03,
    }
    if scenario_cfg.get("green", 0) > 0.20:
        base["GREEN_PARK"] = 0.18
        base["GREEN_FOREST"] = 0.12
    if scenario_cfg.get("density", 0) > 0.25:
        base["RES_HIGH"] = 0.15
        base["COM_OFFICE"] = 0.12
    if scenario_cfg.get("equity", 0) > 0.30:
        base["RES_LOW"] = 0.25
        base["HEALTH_CLINIC"] = 0.08
        base["EDU_SCHOOL"] = 0.08
    return base


def _has_neighbor(zone_grid, x, y, grid_size):
    for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
        nx, ny = x + dx, y + dy
        if 0 <= nx < grid_size and 0 <= ny < grid_size:
            if zone_grid[ny][nx] != "EMPTY":
                return True
    return False


def _check_constraints(zone_grid, x, y, zone_type, grid_size):
    if zone_type in ("IND_HEAVY", "IND_LIGHT"):
        for dx in range(-3, 4):
            for dy in range(-3, 4):
                nx, ny = x + dx, y + dy
                if 0 <= nx < grid_size and 0 <= ny < grid_size:
                    if zone_grid[ny][nx] in ("RES_LOW", "RES_MED", "RES_HIGH"):
                        if zone_type == "IND_HEAVY":
                            return False
    return True


def _compute_sps(zone_grid, x, y, zone_type, grid_size):
    score = 5.0
    for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1), (-1, -1), (1, 1), (-1, 1), (1, -1)]:
        nx, ny = x + dx, y + dy
        if 0 <= nx < grid_size and 0 <= ny < grid_size:
            neighbor = zone_grid[ny][nx]
            if neighbor == "TRANS_HUB":
                score += 1.0
            elif neighbor == "GREEN_PARK":
                score += 0.5
            elif neighbor in ("RES_MED", "RES_HIGH") and zone_type == "COM_RETAIL":
                score += 0.5
    center_dist = ((x - grid_size // 2) ** 2 + (y - grid_size // 2) ** 2) ** 0.5
    score -= center_dist * 0.02
    return min(10.0, max(0.0, score))


def _update_metrics(metrics, actions, year, scenario_cfg):
    n = len(actions)
    zone_types = [a["zone_type"] for a in actions]

    res_count = sum(1 for z in zone_types if z.startswith("RES"))
    com_count = sum(1 for z in zone_types if z.startswith("COM"))
    green_count = sum(1 for z in zone_types if z.startswith("GREEN"))
    infra_count = sum(1 for z in zone_types if z.startswith("INFRA") or z.startswith("TRANS"))

    metrics["population"] = metrics.get("population", 1_000_000) * (1 + 0.01 * res_count * scenario_cfg.get("density", 0.2))
    metrics["gdp_per_capita"] = metrics.get("gdp_per_capita", 50000) * (1 + 0.005 * com_count * scenario_cfg.get("economic", 0.15))
    metrics["green_ratio"] = min(1.0, metrics.get("green_ratio", 0.15) + 0.002 * green_count)
    metrics["commute_minutes"] = max(10, metrics.get("commute_minutes", 35) - 0.1 * infra_count)
    metrics["aqi"] = max(20, metrics.get("aqi", 80) - 0.2 * green_count + 0.1 * sum(1 for z in zone_types if z == "IND_HEAVY"))
    metrics["equity_score"] = min(1.0, metrics.get("equity_score", 0.5) + 0.001 * scenario_cfg.get("equity", 0.2))
    metrics["year"] = year


def _fill_metrics(metrics):
    defaults = {
        "population": 1_000_000, "gdp_per_capita": 50000, "green_ratio": 0.15,
        "commute_minutes": 35, "aqi": 80, "equity_score": 0.5,
        "infrastructure_score": 0.6, "flood_risk": 0.2, "energy_per_capita": 5000,
        "transit_coverage": 0.4, "hospital_beds_per_1k": 3.0, "school_enrollment": 0.85,
    }
    for k, v in defaults.items():
        metrics.setdefault(k, v)


def _seed_initial_zones(zone_grid, grid_size, city_data):
    cx, cy = grid_size // 2, grid_size // 2
    core_zones = [
        (cx, cy, "COM_OFFICE"), (cx + 1, cy, "COM_OFFICE"), (cx, cy + 1, "COM_RETAIL"),
        (cx - 1, cy, "TRANS_HUB"), (cx, cy - 1, "GREEN_PARK"),
        (cx + 2, cy, "RES_HIGH"), (cx - 2, cy, "RES_MED"),
        (cx, cy + 2, "RES_LOW"), (cx + 1, cy + 1, "MIX_USE"),
        (cx - 1, cy - 1, "EDU_SCHOOL"), (cx + 1, cy - 1, "HEALTH_CLINIC"),
    ]
    for x, y, zone in core_zones:
        if 0 <= x < grid_size and 0 <= y < grid_size:
            zone_grid[y][x] = zone


def _grid_to_geojson(zone_grid, city_data, grid_size):
    bounds = city_data.get("bounds", {})
    min_lng = bounds.get("min_lng", city_data.get("center_lng", 0) - 0.3)
    max_lng = bounds.get("max_lng", city_data.get("center_lng", 0) + 0.3)
    min_lat = bounds.get("min_lat", city_data.get("center_lat", 0) - 0.3)
    max_lat = bounds.get("max_lat", city_data.get("center_lat", 0) + 0.3)

    lng_step = (max_lng - min_lng) / grid_size
    lat_step = (max_lat - min_lat) / grid_size

    features = []
    for y in range(grid_size):
        for x in range(grid_size):
            zone = zone_grid[y][x]
            if zone == "EMPTY":
                continue
            lng = min_lng + x * lng_step
            lat = min_lat + y * lat_step
            features.append({
                "type": "Feature",
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [[
                        [lng, lat],
                        [lng + lng_step, lat],
                        [lng + lng_step, lat + lat_step],
                        [lng, lat + lat_step],
                        [lng, lat],
                    ]],
                },
                "properties": {"zone_type": zone, "x": x, "y": y},
            })

    return {"type": "FeatureCollection", "features": features}


def _load_city(city_id: str) -> dict:
    data_dir = Path(__file__).parent.parent.parent / "data" / "cities"
    path = data_dir / f"{city_id}.json"
    if path.exists():
        with open(path) as f:
            import json
            return json.load(f)
    return {
        "id": city_id,
        "name": city_id.replace("_", " ").title(),
        "center_lat": 40.71,
        "center_lng": -74.01,
        "bounds": {"min_lat": 40.5, "max_lat": 40.9, "min_lng": -74.3, "max_lng": -73.7},
        "initial_metrics": {},
    }

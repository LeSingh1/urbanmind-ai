import sys
from pathlib import Path
import numpy as np
import random

sys.path.insert(0, str(Path(__file__).parent.parent))

from environment.city_env import CityExpansionEnv, ID_TO_ZONE, ZONE_IDS
from simulation.metrics_calculator import MetricsCalculator
from simulation.population_dynamics import PopulationDynamics

SCENARIO_ZONE_PROBS = {
    "MAXIMUM_GROWTH": {
        "RES_HIGH": 0.20, "COM_OFFICE": 0.18, "RES_MED": 0.15, "COM_RETAIL": 0.12,
        "IND_LIGHT": 0.10, "MIX_USE": 0.10, "TRANS_HUB": 0.05,
        "GREEN_PARK": 0.04, "INFRA_POWER": 0.03, "INFRA_WATER": 0.03,
    },
    "BALANCED_SUSTAINABLE": {
        "RES_LOW": 0.18, "RES_MED": 0.15, "COM_RETAIL": 0.12, "GREEN_PARK": 0.12,
        "RES_HIGH": 0.08, "COM_OFFICE": 0.08, "TRANS_HUB": 0.08,
        "EDU_SCHOOL": 0.06, "HEALTH_CLINIC": 0.06, "MIX_USE": 0.04, "INFRA_POWER": 0.03,
    },
    "CLIMATE_RESILIENT": {
        "GREEN_PARK": 0.22, "GREEN_FOREST": 0.15, "RES_LOW": 0.18,
        "TRANS_HUB": 0.12, "RES_MED": 0.10, "HEALTH_CLINIC": 0.08,
        "EDU_SCHOOL": 0.06, "INFRA_WATER": 0.05, "COM_RETAIL": 0.04,
    },
    "EQUITY_FOCUSED": {
        "RES_LOW": 0.25, "HEALTH_CLINIC": 0.15, "EDU_SCHOOL": 0.15,
        "GREEN_PARK": 0.12, "RES_MED": 0.12, "TRANS_HUB": 0.10,
        "SAFETY_FIRE": 0.04, "SAFETY_POLICE": 0.04, "COM_RETAIL": 0.03,
    },
    "HISTORIC_PATTERN": {
        "RES_LOW": 0.22, "RES_MED": 0.18, "COM_RETAIL": 0.15,
        "GREEN_PARK": 0.10, "TRANS_HUB": 0.10, "EDU_SCHOOL": 0.08,
        "COM_OFFICE": 0.07, "HEALTH_CLINIC": 0.05, "IND_LIGHT": 0.05,
    },
}


class SimulationLoop:
    def __init__(self, city_data: dict, scenario: str, grid_size: int = 64):
        self.city_data = city_data
        self.scenario = scenario
        self.grid_size = grid_size
        self.env = CityExpansionEnv(city_data, scenario)
        self.metrics_calc = MetricsCalculator()
        self.pop_dynamics = PopulationDynamics(city_data)
        self.zone_probs = SCENARIO_ZONE_PROBS.get(scenario, SCENARIO_ZONE_PROBS["BALANCED_SUSTAINABLE"])

    def run(self):
        obs, _ = self.env.reset()

        for year in range(1, 51):
            actions_this_year = []
            placements = min(4 + year // 4, 15)

            for _ in range(placements):
                action = self._choose_action()
                obs, reward, done, _, info = self.env.step(action)
                if info.get("valid"):
                    x, y, zone_id, _ = self.env.action_decoder.decode(action)
                    zone_name = ID_TO_ZONE.get(zone_id, "EMPTY")
                    sps = self._compute_sps(x, y, zone_name)
                    actions_this_year.append({
                        "x": x, "y": y,
                        "zone_type": zone_name,
                        "sps": round(sps, 2),
                        "reward": round(reward, 4),
                    })

            metrics = self.metrics_calc.compute(self.env.zone_grid, self.env.metrics)
            metrics = self.pop_dynamics.update(metrics, year, actions_this_year)
            metrics["year"] = year
            self.env.metrics.update(metrics)

            zones_geojson = self._grid_to_geojson()

            yield {
                "year": year,
                "zones_geojson": zones_geojson,
                "metrics": dict(metrics),
                "agent_actions": actions_this_year,
            }

    def apply_override(self, x: int, y: int, zone_type: str):
        zone_id = ZONE_IDS.get(zone_type, 0)
        if 0 <= x < self.grid_size and 0 <= y < self.grid_size:
            self.env.zone_grid[y, x] = zone_id

    def _choose_action(self) -> np.ndarray:
        zones = list(self.zone_probs.keys())
        weights = list(self.zone_probs.values())
        zone_name = random.choices(zones, weights=weights)[0]
        zone_id = ZONE_IDS.get(zone_name, 0)

        best_x, best_y, best_sps = 0, 0, -1.0
        for _ in range(20):
            x = random.randint(0, self.grid_size - 1)
            y = random.randint(0, self.grid_size - 1)
            if self.env.zone_grid[y, x] != 0:
                continue
            if not self._has_neighbor(x, y):
                continue
            sps = self._compute_sps(x, y, zone_name)
            if sps > best_sps:
                best_sps, best_x, best_y = sps, x, y

        return np.array([best_x, best_y, zone_id, 1], dtype=np.int64)

    def _has_neighbor(self, x: int, y: int) -> bool:
        for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
            nx, ny = x + dx, y + dy
            if 0 <= nx < self.grid_size and 0 <= ny < self.grid_size:
                if self.env.zone_grid[ny, nx] != 0:
                    return True
        return False

    def _compute_sps(self, x: int, y: int, zone_type: str) -> float:
        g = self.env.zone_grid
        n = self.grid_size
        score = 5.0
        TRANS = ZONE_IDS["TRANS_HUB"]
        GREEN = ZONE_IDS["GREEN_PARK"]
        for dx in range(-4, 5):
            for dy in range(-4, 5):
                nx, ny = x + dx, y + dy
                if 0 <= nx < n and 0 <= ny < n:
                    cell = g[ny, nx]
                    dist = (dx ** 2 + dy ** 2) ** 0.5
                    if cell == TRANS:
                        score += max(0, 1.5 - dist * 0.3)
                    elif cell == GREEN:
                        score += max(0, 0.5 - dist * 0.1)
        cx, cy = n // 2, n // 2
        dist_core = ((x - cx) ** 2 + (y - cy) ** 2) ** 0.5
        score -= dist_core * 0.02
        return min(10.0, max(0.0, score))

    def _grid_to_geojson(self) -> dict:
        bounds = self.city_data.get("bounds", {})
        clng = self.city_data.get("center_lng", 0)
        clat = self.city_data.get("center_lat", 0)
        min_lng = bounds.get("min_lng", clng - 0.3)
        max_lng = bounds.get("max_lng", clng + 0.3)
        min_lat = bounds.get("min_lat", clat - 0.3)
        max_lat = bounds.get("max_lat", clat + 0.3)

        lng_step = (max_lng - min_lng) / self.grid_size
        lat_step = (max_lat - min_lat) / self.grid_size

        features = []
        for y in range(self.grid_size):
            for x in range(self.grid_size):
                zone_id = int(self.env.zone_grid[y, x])
                if zone_id == 0:
                    continue
                zone_name = ID_TO_ZONE.get(zone_id, "EMPTY")
                lng = min_lng + x * lng_step
                lat = min_lat + y * lat_step
                features.append({
                    "type": "Feature",
                    "geometry": {
                        "type": "Polygon",
                        "coordinates": [[
                            [lng, lat], [lng + lng_step, lat],
                            [lng + lng_step, lat + lat_step],
                            [lng, lat + lat_step], [lng, lat],
                        ]],
                    },
                    "properties": {"zone_type": zone_name, "x": x, "y": y},
                })

        return {"type": "FeatureCollection", "features": features}

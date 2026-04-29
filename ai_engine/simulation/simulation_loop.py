import sys
import random
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).parent.parent))

from environment.city_env import CityExpansionEnv, ID_TO_ZONE, ZONE_IDS
from simulation.metrics_calculator import MetricsCalculator
from simulation.population_dynamics import PopulationDynamics
from simulation.infrastructure_sim import InfrastructureSim

# ─────────────────────────────────────────────────────────────────────────────
# Zone placement probabilities per scenario
# ─────────────────────────────────────────────────────────────────────────────

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
        self.infra_sim = InfrastructureSim(grid_size)
        self.zone_probs = SCENARIO_ZONE_PROBS.get(scenario, SCENARIO_ZONE_PROBS["BALANCED_SUSTAINABLE"])

    def run(self):
        obs, _ = self.env.reset()

        for year in range(1, 51):
            actions_this_year = []
            placements = min(4 + year // 4, 15)

            for _ in range(placements):
                action = self._choose_action(year)
                if action is None:
                    break
                obs, reward, done, _, info = self.env.step(action)
                if info.get("valid"):
                    x, y, zone_id, _ = self.env.action_decoder.decode(action)
                    zone_name = ID_TO_ZONE.get(zone_id, "EMPTY")
                    sps = self._compute_sps(x, y, zone_name)
                    lat, lng = self._cell_lat_lng(x, y)
                    actions_this_year.append({
                        "x": x, "y": y,
                        "zone_type": zone_name,
                        "lat": lat,
                        "lng": lng,
                        "sps": round(sps, 2),
                        "sps_score": round(sps, 2),
                        "reward": round(reward, 4),
                        "reason": self._planning_reason(x, y, zone_name),
                    })

            # Compute full metrics snapshot
            metrics = self.metrics_calc.compute(self.env.zone_grid, self.env.metrics)
            metrics = self.pop_dynamics.update(metrics, year, actions_this_year)
            new_zones = [a["zone_type"] for a in actions_this_year]
            metrics = self.infra_sim.update(self.env.zone_grid, metrics, new_zones)
            metrics["year"] = year
            self.env.metrics.update(metrics)

            # Enriched GeoJSON from env (includes zone_display_name, population, year_placed)
            zones_geojson = self.env.get_zones_geojson()
            roads_geojson = self.env.get_roads_geojson()

            grid_delta = [
                {
                    "x": a["x"], "y": a["y"],
                    "old_zone": "EMPTY",
                    "new_zone": a["zone_type"],
                    "lat": a["lat"], "lng": a["lng"],
                }
                for a in actions_this_year
            ]
            primary_action = actions_this_year[0] if actions_this_year else {
                "x": 0, "y": 0, "zone_type": "EMPTY", "lat": 0.0, "lng": 0.0,
                "sps_score": 0, "reason": "No valid expansion frontier available.",
            }

            yield {
                "year": year,
                "step": year,
                "total_steps": 50,
                "zones_geojson": zones_geojson,
                "roads_geojson": roads_geojson,
                "metrics": dict(metrics),
                "agent_actions": actions_this_year,
                "grid_delta": grid_delta,
                "action": primary_action,
                "sps_score": primary_action.get("sps_score", 0),
            }

    def apply_override(self, x: int, y: int, zone_type: str):
        zone_id = ZONE_IDS.get(zone_type, 0)
        if 0 <= x < self.grid_size and 0 <= y < self.grid_size:
            self.env.zone_grid[y, x] = zone_id
            self.env.year_placed[(x, y)] = self.env.current_year

    def get_grid_as_cells(self) -> list[list[dict]]:
        cells = []
        for y in range(self.grid_size):
            row = []
            for x in range(self.grid_size):
                zone_id = int(self.env.zone_grid[y, x])
                zone = ID_TO_ZONE.get(zone_id, "EMPTY")
                lat, lng = self._cell_lat_lng(x, y)
                row.append({
                    "x": x, "y": y,
                    "zone_type": zone,
                    "elevation": 0,
                    "flood_risk": round(float(self.env.flood_risk_map[y, x]), 3),
                    "population": self._estimated_population(zone),
                    "lat": lat, "lng": lng,
                })
            cells.append(row)
        return cells

    # ─────────────────────────────────────────────────────────────────────────
    # Action selection
    # ─────────────────────────────────────────────────────────────────────────

    def _choose_action(self, year: int) -> np.ndarray | None:
        zones = list(self.zone_probs.keys())
        weights = list(self.zone_probs.values())
        zone_name = random.choices(zones, weights=weights)[0]
        zone_id = ZONE_IDS.get(zone_name, 0)

        candidates = []
        for x, y in self._frontier_cells():
            if not self.env.validator.is_valid(self.env.zone_grid, x, y, zone_name):
                continue
            candidates.append((self._compute_sps(x, y, zone_name), x, y))
        if not candidates:
            return None
        candidates.sort(reverse=True)
        _, best_x, best_y = random.choice(candidates[: min(8, len(candidates))])
        return np.array([best_x, best_y, zone_id, 1], dtype=np.int64)

    def _frontier_cells(self) -> list[tuple[int, int]]:
        cells = []
        for y in range(self.grid_size):
            for x in range(self.grid_size):
                if self.env.zone_grid[y, x] == 0 and self._has_neighbor(x, y):
                    cells.append((x, y))
        center = (self.grid_size - 1) / 2.0
        cells.sort(key=lambda c: ((c[0] - center) ** 2 + (c[1] - center) ** 2) ** 0.5)
        return cells

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
        # ECC bonus: priority cells score higher
        ecc_val = int(self.env.ecc_map[y, x])
        score += (ecc_val - 2) * 0.1
        return min(10.0, max(0.0, score))

    def _planning_reason(self, x: int, y: int, zone_type: str) -> str:
        ecc = int(self.env.ecc_map[y, x])
        flood = float(self.env.flood_risk_map[y, x])
        if zone_type.startswith("RES"):
            return "Extends housing from the existing urban edge while keeping the expansion contiguous."
        if zone_type.startswith("COM") or zone_type == "MIX_USE":
            return "Adds jobs and services beside existing development instead of creating isolated sprawl."
        if zone_type.startswith("GREEN"):
            return f"Sets aside open space (ECC-{ecc}, flood risk {flood:.2f}) inside the growth frontier."
        if zone_type.startswith("TRANS") or zone_type.startswith("INFRA"):
            return "Adds infrastructure near active growth so future parcels can connect efficiently."
        if zone_type.startswith("HEALTH") or zone_type.startswith("EDU") or zone_type.startswith("SAFETY"):
            return "Places civic access near growing neighborhoods."
        return "Fills an undeveloped frontier parcel adjacent to the current city."

    # ─────────────────────────────────────────────────────────────────────────
    # Geo helpers
    # ─────────────────────────────────────────────────────────────────────────

    def _cell_lat_lng(self, x: int, y: int) -> tuple[float, float]:
        bounds = self.city_data.get("bounds", {})
        clng = self.city_data.get("center_lng", 0)
        clat = self.city_data.get("center_lat", 0)

        bbox = self.city_data.get("bbox")
        if bbox and len(bbox) == 4:
            min_lng, min_lat, max_lng, max_lat = bbox
        else:
            min_lng = bounds.get("min_lng", clng - 0.3)
            max_lng = bounds.get("max_lng", clng + 0.3)
            min_lat = bounds.get("min_lat", clat - 0.3)
            max_lat = bounds.get("max_lat", clat + 0.3)

        lng_step = (max_lng - min_lng) / self.grid_size
        lat_step = (max_lat - min_lat) / self.grid_size
        return max_lat - (y + 0.5) * lat_step, min_lng + (x + 0.5) * lng_step

    def _estimated_population(self, zone: str) -> int:
        return {
            "RES_LOW": 180, "RES_MED": 520, "RES_HIGH": 1400, "MIX_USE": 900,
        }.get(zone, 0)

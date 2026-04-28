"""Seeds an initial urban core into a blank sandbox city."""
import numpy as np

ZONE_IDS = {
    "COM_OFFICE": 5, "COM_RETAIL": 4, "TRANS_HUB": 17,
    "GREEN_PARK": 9, "RES_HIGH": 3, "RES_MED": 2, "RES_LOW": 1,
    "MIX_USE": 8, "EDU_SCHOOL": 13, "HEALTH_CLINIC": 11,
    "INFRA_POWER": 15, "INFRA_WATER": 16, "SAFETY_FIRE": 19,
}

SEED_PATTERN = [
    (0, 0, "COM_OFFICE"), (1, 0, "COM_OFFICE"), (0, 1, "COM_RETAIL"),
    (-1, 0, "TRANS_HUB"), (0, -1, "GREEN_PARK"), (2, 0, "RES_HIGH"),
    (-2, 0, "RES_MED"), (0, 2, "RES_LOW"), (-2, 1, "RES_LOW"),
    (1, 1, "MIX_USE"), (-1, -1, "EDU_SCHOOL"), (1, -1, "HEALTH_CLINIC"),
    (3, 0, "RES_MED"), (-3, 0, "RES_LOW"), (0, 3, "RES_LOW"),
    (2, -1, "INFRA_POWER"), (-2, -1, "INFRA_WATER"), (0, -2, "SAFETY_FIRE"),
]


class CitySeeder:
    def seed(self, zone_grid: np.ndarray, cx: int, cy: int, grid_size: int) -> np.ndarray:
        for dx, dy, zone_name in SEED_PATTERN:
            x, y = cx + dx, cy + dy
            if 0 <= x < grid_size and 0 <= y < grid_size:
                zone_grid[y, x] = ZONE_IDS.get(zone_name, 0)
        return zone_grid

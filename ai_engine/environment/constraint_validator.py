import numpy as np

ZONE_IDS = {
    "EMPTY": 0, "RES_LOW": 1, "RES_MED": 2, "RES_HIGH": 3,
    "COM_RETAIL": 4, "COM_OFFICE": 5, "IND_LIGHT": 6, "IND_HEAVY": 7,
    "MIX_USE": 8, "GREEN_PARK": 9, "GREEN_FOREST": 10,
    "HEALTH_CLINIC": 11, "HEALTH_HOSP": 12, "EDU_SCHOOL": 13, "EDU_UNIVERSITY": 14,
    "INFRA_POWER": 15, "INFRA_WATER": 16, "TRANS_HUB": 17, "TRANS_HIGHWAY": 18,
    "SAFETY_FIRE": 19, "SAFETY_POLICE": 20,
}

RESIDENTIAL = {"RES_LOW", "RES_MED", "RES_HIGH"}
INDUSTRIAL = {"IND_LIGHT", "IND_HEAVY"}


class ConstraintValidator:
    def __init__(self, grid_size: int):
        self.grid_size = grid_size

    def is_valid(self, zone_grid: np.ndarray, x: int, y: int, zone_type: str) -> bool:
        if not (0 <= x < self.grid_size and 0 <= y < self.grid_size):
            return False
        if zone_grid[y, x] != 0:
            return False
        if zone_type == "EMPTY":
            return True
        if zone_type == "IND_HEAVY":
            return self._check_buffer(zone_grid, x, y, RESIDENTIAL, min_buffer=3)
        if zone_type in RESIDENTIAL:
            return self._check_buffer(zone_grid, x, y, {"IND_HEAVY"}, min_buffer=3)
        if zone_type == "RES_HIGH":
            return self._has_nearby(zone_grid, x, y, {ZONE_IDS["TRANS_HUB"]}, radius=4)
        return True

    def _check_buffer(self, zone_grid, x, y, forbidden_zones, min_buffer):
        forbidden_ids = {ZONE_IDS.get(z, -1) for z in forbidden_zones}
        for dy in range(-min_buffer, min_buffer + 1):
            for dx in range(-min_buffer, min_buffer + 1):
                nx, ny = x + dx, y + dy
                if 0 <= nx < self.grid_size and 0 <= ny < self.grid_size:
                    if zone_grid[ny, nx] in forbidden_ids:
                        return False
        return True

    def _has_nearby(self, zone_grid, x, y, required_ids, radius):
        for dy in range(-radius, radius + 1):
            for dx in range(-radius, radius + 1):
                nx, ny = x + dx, y + dy
                if 0 <= nx < self.grid_size and 0 <= ny < self.grid_size:
                    if zone_grid[ny, nx] in required_ids:
                        return True
        return False

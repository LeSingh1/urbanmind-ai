import numpy as np


class ObservationBuilder:
    """Builds (grid_size, grid_size, 8) float32 observation tensor."""

    CHANNELS = 8  # zone_type, pop_density, road_access, dist_to_core, elevation, flood_risk, land_use, infra_score

    def __init__(self, grid_size: int):
        self.grid_size = grid_size
        cx, cy = grid_size // 2, grid_size // 2
        self._dist_to_core = np.zeros((grid_size, grid_size), dtype=np.float32)
        max_dist = (cx ** 2 + cy ** 2) ** 0.5
        for y in range(grid_size):
            for x in range(grid_size):
                d = ((x - cx) ** 2 + (y - cy) ** 2) ** 0.5
                self._dist_to_core[y, x] = d / max_dist if max_dist > 0 else 0.0

    def build(self, zone_grid: np.ndarray, metrics: dict) -> np.ndarray:
        n = self.grid_size
        obs = np.zeros((n, n, self.CHANNELS), dtype=np.float32)

        max_zone_id = 20.0
        obs[:, :, 0] = zone_grid.astype(np.float32) / max_zone_id

        pop_density = metrics.get("population", 1_000_000) / 30_000_000
        obs[:, :, 1] = np.clip(pop_density, 0, 1)

        obs[:, :, 2] = self._compute_road_access(zone_grid)
        obs[:, :, 3] = self._dist_to_core
        obs[:, :, 4] = 0.5  # flat elevation default
        obs[:, :, 5] = metrics.get("flood_risk", 0.2)
        obs[:, :, 6] = (zone_grid > 0).astype(np.float32)
        obs[:, :, 7] = np.clip(metrics.get("infrastructure_score", 0.6), 0, 1)

        return obs

    def _compute_road_access(self, zone_grid: np.ndarray) -> np.ndarray:
        n = self.grid_size
        road_access = np.zeros((n, n), dtype=np.float32)
        TRANS_HUB_ID = 17
        for y in range(n):
            for x in range(n):
                for dy in range(-3, 4):
                    for dx in range(-3, 4):
                        ny, nx = y + dy, x + dx
                        if 0 <= ny < n and 0 <= nx < n:
                            if zone_grid[ny, nx] == TRANS_HUB_ID:
                                dist = (dx ** 2 + dy ** 2) ** 0.5
                                road_access[y, x] = max(road_access[y, x], 1.0 - dist / 5.0)
        return road_access

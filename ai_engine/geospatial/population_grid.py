import numpy as np


class PopulationGrid:
    """Distributes city population across the grid based on zone types."""

    POP_DENSITY_PER_CELL = {
        "RES_LOW": 2_000, "RES_MED": 8_000, "RES_HIGH": 25_000,
        "MIX_USE": 12_000, "COM_RETAIL": 500, "COM_OFFICE": 1_000,
    }

    def compute(self, zone_grid: np.ndarray) -> np.ndarray:
        from environment.city_env import ID_TO_ZONE
        grid_size = zone_grid.shape[0]
        pop_grid = np.zeros((grid_size, grid_size), dtype=np.float32)
        for y in range(grid_size):
            for x in range(grid_size):
                zone_id = int(zone_grid[y, x])
                zone_name = ID_TO_ZONE.get(zone_id, "EMPTY")
                pop_grid[y, x] = self.POP_DENSITY_PER_CELL.get(zone_name, 0)
        return pop_grid

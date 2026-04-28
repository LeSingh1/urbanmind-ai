"""Lays out an initial 3×3 block road grid around the seed core."""
import numpy as np


class RoadInitializer:
    def initialize(self, road_grid: np.ndarray, cx: int, cy: int, grid_size: int) -> np.ndarray:
        # 3 concentric road rings spaced 4 cells apart
        for ring in range(1, 5):
            r = ring * 4
            for i in range(-r, r + 1):
                for dx, dy in [(i, -r), (i, r), (-r, i), (r, i)]:
                    x, y = cx + dx, cy + dy
                    if 0 <= x < grid_size and 0 <= y < grid_size:
                        road_grid[y, x] = 1

        # 4 radial arteries (N/S/E/W)
        for i in range(grid_size):
            road_grid[cy, i] = 1
            road_grid[i, cx] = 1

        return road_grid

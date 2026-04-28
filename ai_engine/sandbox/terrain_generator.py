"""
Procedural terrain generation using Perlin noise.
Falls back to random noise if the `noise` library is unavailable.
"""
import numpy as np
import random


def _perlin_2d(n: int, scale: float, octaves: int, seed: int) -> np.ndarray:
    try:
        from noise import pnoise2
        grid = np.zeros((n, n), dtype=np.float32)
        offset_x = random.Random(seed).random() * 1000
        offset_y = random.Random(seed + 1).random() * 1000
        for y in range(n):
            for x in range(n):
                grid[y, x] = pnoise2(
                    (x + offset_x) / scale,
                    (y + offset_y) / scale,
                    octaves=octaves,
                    persistence=0.5,
                    lacunarity=2.0,
                )
        # Normalize to [0, 1]
        mn, mx = grid.min(), grid.max()
        if mx > mn:
            grid = (grid - mn) / (mx - mn)
        return grid
    except ImportError:
        rng = np.random.default_rng(seed)
        return rng.random((n, n)).astype(np.float32)


ARCHETYPES = {
    "coastal":      {"water_edge": True, "mountains": False, "rivers": 1},
    "inland":       {"water_edge": False, "mountains": False, "rivers": 1},
    "river_delta":  {"water_edge": True, "mountains": False, "rivers": 3},
    "desert":       {"water_edge": False, "mountains": False, "rivers": 0},
    "mountainous":  {"water_edge": False, "mountains": True, "rivers": 1},
}


class TerrainGenerator:
    def __init__(self, grid_size: int = 64, archetype: str = "inland", seed: int = 42):
        self.grid_size = grid_size
        self.archetype = ARCHETYPES.get(archetype, ARCHETYPES["inland"])
        self.seed = seed

    def generate(self) -> dict:
        n = self.grid_size
        elevation = _perlin_2d(n, scale=20.0, octaves=6, seed=self.seed)
        moisture = _perlin_2d(n, scale=15.0, octaves=4, seed=self.seed + 100)

        if self.archetype["water_edge"]:
            for y in range(n):
                for x in range(n // 6):
                    elevation[y, x] *= 0.1

        if self.archetype["mountains"]:
            for y in range(n // 4, 3 * n // 4):
                for x in range(n // 4, 3 * n // 4):
                    elevation[y, x] = min(1.0, elevation[y, x] * 1.8)

        terrain = np.full((n, n), "flat", dtype=object)
        water = (elevation < 0.2) | ((moisture > 0.6) & (elevation < 0.3))
        mountain = elevation > 0.7
        terrain[water] = "water"
        terrain[mountain] = "mountain"
        terrain[(elevation >= 0.2) & (elevation <= 0.7)] = "flat"

        best_x, best_y = self._find_seed_location(elevation, moisture, water, mountain)

        return {
            "elevation": elevation.tolist(),
            "moisture": moisture.tolist(),
            "terrain": terrain.tolist(),
            "water_mask": water.tolist(),
            "mountain_mask": mountain.tolist(),
            "seed_location": {"x": best_x, "y": best_y},
        }

    def _find_seed_location(self, elevation, moisture, water, mountain) -> tuple[int, int]:
        n = self.grid_size
        cx, cy = n // 2, n // 2
        best_score = -1.0
        best = (cx, cy)
        for y in range(n // 4, 3 * n // 4):
            for x in range(n // 4, 3 * n // 4):
                if water[y, x] or mountain[y, x]:
                    continue
                el = float(elevation[y, x])
                if 0.3 <= el <= 0.6:
                    dist_center = ((x - cx) ** 2 + (y - cy) ** 2) ** 0.5
                    score = el - dist_center * 0.01
                    if score > best_score:
                        best_score = score
                        best = (x, y)
        return best

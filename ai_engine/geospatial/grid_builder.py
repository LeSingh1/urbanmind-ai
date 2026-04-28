import numpy as np
from typing import Optional


class GridBuilder:
    """Converts city bounding box into a 64×64 grid with per-cell metadata."""

    CELL_SIZE_M = 500  # 500m × 500m cells

    def __init__(self, city_data: dict, grid_size: int = 64):
        self.city_data = city_data
        self.grid_size = grid_size
        bounds = city_data.get("bounds", {})
        clat = city_data.get("center_lat", 0)
        clng = city_data.get("center_lng", 0)
        self.min_lat = bounds.get("min_lat", clat - 0.3)
        self.max_lat = bounds.get("max_lat", clat + 0.3)
        self.min_lng = bounds.get("min_lng", clng - 0.3)
        self.max_lng = bounds.get("max_lng", clng + 0.3)
        self.lat_step = (self.max_lat - self.min_lat) / grid_size
        self.lng_step = (self.max_lng - self.min_lng) / grid_size

    def cell_to_lnglat(self, x: int, y: int) -> tuple[float, float]:
        lng = self.min_lng + (x + 0.5) * self.lng_step
        lat = self.min_lat + (y + 0.5) * self.lat_step
        return lng, lat

    def lnglat_to_cell(self, lng: float, lat: float) -> tuple[int, int]:
        x = int((lng - self.min_lng) / self.lng_step)
        y = int((lat - self.min_lat) / self.lat_step)
        return (
            max(0, min(self.grid_size - 1, x)),
            max(0, min(self.grid_size - 1, y)),
        )

    def build_ecc_layer(self) -> np.ndarray:
        """Environmental Constraint Class: 0=protected, 5=priority."""
        ecc = np.full((self.grid_size, self.grid_size), 4, dtype=np.int32)
        cx, cy = self.grid_size // 2, self.grid_size // 2
        max_r = (cx ** 2 + cy ** 2) ** 0.5
        for y in range(self.grid_size):
            for x in range(self.grid_size):
                r = ((x - cx) ** 2 + (y - cy) ** 2) ** 0.5
                if r < max_r * 0.15:
                    ecc[y, x] = 5
                elif r > max_r * 0.85:
                    ecc[y, x] = 2
        return ecc

    def build_flood_risk_layer(self) -> np.ndarray:
        risk = np.zeros((self.grid_size, self.grid_size), dtype=np.float32)
        coast_cities = {"lagos", "singapore", "dubai", "mumbai", "new_york"}
        city_id = self.city_data.get("id", "")
        if city_id in coast_cities:
            for y in range(self.grid_size):
                for x in range(self.grid_size):
                    edge_dist = min(x, y, self.grid_size - 1 - x, self.grid_size - 1 - y)
                    risk[y, x] = max(0, 0.5 - edge_dist * 0.02)
        return risk

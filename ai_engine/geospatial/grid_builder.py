import numpy as np
from typing import Optional


def classify_ecc(
    slope_deg: float,
    flood_risk: float,
    ndvi: float = 0.3,
    is_coastal_200m: bool = False,
) -> int:
    """
    Classify a cell into an Environmental Constraint Class (ECC).

    Returns:
        0 - Permanently protected (no development)
        1 - Constrained natural (conservation only)
        2 - Sensitive (limited low-impact use)
        3 - Preferred low-impact (careful development)
        4 - Standard buildable
        5 - Priority (high centrality + existing infra)
    """
    if slope_deg > 30 or flood_risk > 0.8:
        return 0  # permanently protected

    if slope_deg > 20 or flood_risk > 0.5 or (is_coastal_200m and flood_risk > 0.3):
        return 1  # constrained natural

    if slope_deg > 10 or flood_risk > 0.1 or ndvi > 0.7:
        return 2  # sensitive

    if slope_deg > 5:
        return 3  # preferred low-impact

    if slope_deg <= 5 and flood_risk < 0.1:
        return 4  # standard

    # fallback (shouldn't normally reach here)
    return 4


class GridBuilder:
    """Converts city bounding box into a 64×64 grid with per-cell metadata."""

    CELL_SIZE_M = 500  # 500m × 500m cells

    def __init__(self, city_data: dict, grid_size: int = 64):
        self.city_data = city_data
        self.grid_size = grid_size
        bounds = city_data.get("bounds", {})
        clat = city_data.get("center_lat", 0)
        clng = city_data.get("center_lng", 0)

        # Support bbox as [west, south, east, north]
        bbox = city_data.get("bbox")
        if bbox and len(bbox) == 4:
            self.min_lng, self.min_lat, self.max_lng, self.max_lat = bbox
        else:
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
        """
        Environmental Constraint Class map: 0=protected, 5=priority.
        Uses a synthetic slope + flood-risk model when real DEM unavailable.
        """
        n = self.grid_size
        ecc = np.full((n, n), 4, dtype=np.int32)
        cx, cy = n // 2, n // 2
        max_r = (cx ** 2 + cy ** 2) ** 0.5

        flood_risk_map = self.build_flood_risk_layer()

        city_id = self.city_data.get("id", "")
        coastal_cities = {"lagos", "singapore", "dubai", "mumbai", "new_york"}
        is_coastal = city_id in coastal_cities

        for y in range(n):
            for x in range(n):
                r = ((x - cx) ** 2 + (y - cy) ** 2) ** 0.5
                norm_r = r / max_r if max_r > 0 else 0.0

                # Synthetic slope: increases toward outer edges
                slope_deg = norm_r * 25.0

                flood = float(flood_risk_map[y, x])
                edge_dist = min(x, y, n - 1 - x, n - 1 - y)
                is_coastal_200m = is_coastal and edge_dist < 2

                ecc[y, x] = classify_ecc(slope_deg, flood, ndvi=0.3, is_coastal_200m=is_coastal_200m)

                # City core override: always priority
                if r < max_r * 0.12:
                    ecc[y, x] = 5

        return ecc

    def build_flood_risk_layer(self) -> np.ndarray:
        """Flood risk raster 0.0–1.0."""
        risk = np.zeros((self.grid_size, self.grid_size), dtype=np.float32)
        flood_prone = {"lagos", "singapore", "dubai", "mumbai", "new_york", "sao_paulo"}
        city_id = self.city_data.get("id", "")
        base_risk = 0.3 if city_id in flood_prone else 0.1
        n = self.grid_size
        for y in range(n):
            for x in range(n):
                edge_dist = min(x, y, n - 1 - x, n - 1 - y)
                risk[y, x] = base_risk * max(0, 1 - edge_dist / (n * 0.15))
        return risk

    def build_observation_tensor(self) -> np.ndarray:
        """
        Build initial (64, 64, 8) observation tensor from city data alone.
        Channels: zone_type, pop_density, road_access, dist_to_core,
                  elevation, flood_risk, land_use, infra_score.
        """
        n = self.grid_size
        tensor = np.zeros((n, n, 8), dtype=np.float32)

        cx, cy = n // 2, n // 2
        max_dist = (cx ** 2 + cy ** 2) ** 0.5

        flood_risk = self.build_flood_risk_layer()
        ecc = self.build_ecc_layer()

        for y in range(n):
            for x in range(n):
                d = ((x - cx) ** 2 + (y - cy) ** 2) ** 0.5
                tensor[y, x, 3] = d / max_dist if max_dist > 0 else 0.0  # dist_to_core
                tensor[y, x, 4] = float(ecc[y, x]) / 5.0                 # elevation proxy via ECC
                tensor[y, x, 5] = float(flood_risk[y, x])                # flood_risk

        return tensor

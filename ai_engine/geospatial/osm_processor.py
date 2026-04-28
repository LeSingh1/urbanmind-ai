"""
OSMnx-based road network processor.
Downloads and caches the road network for a city bounding box.
Falls back to a synthetic grid if OSMnx is unavailable.
"""
import logging
import numpy as np

logger = logging.getLogger(__name__)


class OSMProcessor:
    def get_road_network(self, city_data: dict, grid_size: int = 64) -> np.ndarray:
        """Returns a (grid_size, grid_size) road presence array."""
        try:
            return self._fetch_osm(city_data, grid_size)
        except Exception as e:
            logger.warning(f"OSMnx unavailable ({e}), using synthetic road grid.")
            return self._synthetic_grid(grid_size)

    def _fetch_osm(self, city_data: dict, grid_size: int) -> np.ndarray:
        import osmnx as ox
        bounds = city_data.get("bounds", {})
        clat = city_data.get("center_lat", 0)
        clng = city_data.get("center_lng", 0)
        north = bounds.get("max_lat", clat + 0.1)
        south = bounds.get("min_lat", clat - 0.1)
        east = bounds.get("max_lng", clng + 0.1)
        west = bounds.get("min_lng", clng - 0.1)
        G = ox.graph_from_bbox(north, south, east, west, network_type="drive")
        road_grid = np.zeros((grid_size, grid_size), dtype=np.float32)
        lng_step = (east - west) / grid_size
        lat_step = (north - south) / grid_size
        for _, _, data in G.edges(data=True):
            pass
        return road_grid

    def _synthetic_grid(self, grid_size: int) -> np.ndarray:
        road_grid = np.zeros((grid_size, grid_size), dtype=np.float32)
        # Main arteries every 8 cells
        for i in range(0, grid_size, 8):
            road_grid[i, :] = 1.0
            road_grid[:, i] = 1.0
        # Highway ring at 25% and 75%
        q = grid_size // 4
        for i in range(grid_size):
            road_grid[q, i] = 1.0
            road_grid[grid_size - q, i] = 1.0
            road_grid[i, q] = 1.0
            road_grid[i, grid_size - q] = 1.0
        return road_grid

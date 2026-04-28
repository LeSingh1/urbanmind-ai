import heapq
import numpy as np
from typing import Optional


class RoadGenerator:
    """A* pathfinding to auto-connect new zones to nearest existing road node."""

    ROAD_COSTS = {
        "local": 1.0,
        "collector": 1.5,
        "arterial": 2.0,
        "highway": 3.0,
    }

    def __init__(self, grid_size: int):
        self.grid_size = grid_size
        self.road_grid = np.zeros((grid_size, grid_size), dtype=np.int32)

    def connect(self, x: int, y: int, zone_type: str) -> list[tuple[int, int]]:
        road_type = self._road_type_for_zone(zone_type)
        nearest = self._find_nearest_road(x, y)
        if nearest is None:
            return []
        path = self._astar(x, y, nearest[0], nearest[1])
        for px, py in path:
            self.road_grid[py, px] = self.ROAD_COSTS[road_type]
        return path

    def _road_type_for_zone(self, zone_type: str) -> str:
        if zone_type in ("IND_HEAVY", "TRANS_HIGHWAY"):
            return "highway"
        if zone_type in ("COM_OFFICE", "IND_LIGHT"):
            return "arterial"
        if zone_type in ("COM_RETAIL", "MIX_USE", "TRANS_HUB"):
            return "collector"
        return "local"

    def _find_nearest_road(self, x: int, y: int) -> Optional[tuple[int, int]]:
        best_dist = float("inf")
        best = None
        for ry in range(self.grid_size):
            for rx in range(self.grid_size):
                if self.road_grid[ry, rx] > 0:
                    d = abs(rx - x) + abs(ry - y)
                    if d < best_dist:
                        best_dist = d
                        best = (rx, ry)
        return best

    def _astar(self, sx: int, sy: int, ex: int, ey: int) -> list[tuple[int, int]]:
        def h(x, y):
            return abs(x - ex) + abs(y - ey)

        open_heap = [(h(sx, sy), 0, sx, sy, [])]
        visited = set()

        while open_heap:
            f, g, x, y, path = heapq.heappop(open_heap)
            if (x, y) in visited:
                continue
            visited.add((x, y))
            path = path + [(x, y)]
            if x == ex and y == ey:
                return path
            for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                nx, ny = x + dx, y + dy
                if 0 <= nx < self.grid_size and 0 <= ny < self.grid_size and (nx, ny) not in visited:
                    ng = g + 1
                    heapq.heappush(open_heap, (ng + h(nx, ny), ng, nx, ny, path))

        return []

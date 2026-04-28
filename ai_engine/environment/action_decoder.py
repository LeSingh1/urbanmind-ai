import numpy as np


class ActionDecoder:
    def __init__(self, grid_size: int, num_zones: int):
        self.grid_size = grid_size
        self.num_zones = num_zones

    def decode(self, action) -> tuple[int, int, int, int]:
        if isinstance(action, (list, tuple, np.ndarray)):
            x = int(action[0]) % self.grid_size
            y = int(action[1]) % self.grid_size
            zone_id = int(action[2]) % self.num_zones
            connect_road = int(action[3]) % 2 if len(action) > 3 else 0
        else:
            flat = int(action)
            connect_road = flat % 2
            flat //= 2
            zone_id = flat % self.num_zones
            flat //= self.num_zones
            y = flat // self.grid_size
            x = flat % self.grid_size
        return x % self.grid_size, y % self.grid_size, zone_id, connect_road

    def encode(self, x: int, y: int, zone_id: int, connect_road: int = 0) -> np.ndarray:
        return np.array([x, y, zone_id, connect_road], dtype=np.int64)

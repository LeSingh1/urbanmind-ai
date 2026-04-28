import numpy as np


class FloodRiskAnalyzer:
    def compute(self, grid_size: int, city_data: dict) -> np.ndarray:
        risk = np.zeros((grid_size, grid_size), dtype=np.float32)
        flood_prone = {"lagos", "mumbai", "singapore", "new_york", "sao_paulo"}
        city_id = city_data.get("id", "")
        base_risk = 0.3 if city_id in flood_prone else 0.1
        for y in range(grid_size):
            for x in range(grid_size):
                edge = min(x, y, grid_size - 1 - x, grid_size - 1 - y)
                risk[y, x] = base_risk * max(0, 1 - edge / (grid_size * 0.15))
        return risk

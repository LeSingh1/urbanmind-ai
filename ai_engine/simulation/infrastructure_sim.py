import numpy as np


class InfrastructureSim:
    """Simulates infrastructure capacity, power grid, and water demand."""

    POWER_DEMAND = {
        "RES_LOW": 0.5, "RES_MED": 1.0, "RES_HIGH": 2.5,
        "COM_RETAIL": 1.5, "COM_OFFICE": 2.0, "IND_LIGHT": 3.0, "IND_HEAVY": 6.0,
        "MIX_USE": 1.8, "TRANS_HUB": 1.2, "HEALTH_HOSP": 3.5, "EDU_UNIVERSITY": 2.0,
    }

    WATER_DEMAND = {
        "RES_LOW": 0.3, "RES_MED": 0.6, "RES_HIGH": 1.5,
        "COM_RETAIL": 0.4, "COM_OFFICE": 0.5, "IND_LIGHT": 2.0, "IND_HEAVY": 5.0,
        "HEALTH_HOSP": 2.5, "GREEN_PARK": 0.8, "GREEN_FOREST": 0.2,
    }

    def __init__(self, grid_size: int):
        self.grid_size = grid_size
        self.power_capacity = 0.0
        self.water_capacity = 0.0

    def update(self, zone_grid: np.ndarray, metrics: dict, new_zones: list[str]) -> dict:
        from environment.city_env import ID_TO_ZONE

        power_demand = 0.0
        water_demand = 0.0

        for y in range(self.grid_size):
            for x in range(self.grid_size):
                zone_id = int(zone_grid[y, x])
                zone_name = ID_TO_ZONE.get(zone_id, "EMPTY")
                power_demand += self.POWER_DEMAND.get(zone_name, 0.0)
                water_demand += self.WATER_DEMAND.get(zone_name, 0.0)

        for zone in new_zones:
            if zone == "INFRA_POWER":
                self.power_capacity += 50.0
            if zone == "INFRA_WATER":
                self.water_capacity += 50.0

        power_ratio = self.power_capacity / max(1.0, power_demand)
        water_ratio = self.water_capacity / max(1.0, water_demand)

        metrics["power_grid_load"] = round(min(1.0, power_demand / max(1.0, self.power_capacity)), 4)
        metrics["water_grid_load"] = round(min(1.0, water_demand / max(1.0, self.water_capacity)), 4)
        metrics["infrastructure_score"] = round(min(1.0, (power_ratio + water_ratio) / 2), 4)

        return metrics

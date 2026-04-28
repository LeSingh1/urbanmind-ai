import numpy as np

SCENARIO_WEIGHTS = {
    "MAXIMUM_GROWTH":       {"mobility": 0.15, "density": 0.30, "green": 0.02, "equity": 0.02, "economic": 0.50, "disaster": 0.01},
    "BALANCED_SUSTAINABLE": {"mobility": 0.25, "density": 0.20, "green": 0.15, "equity": 0.20, "economic": 0.15, "disaster": 0.05},
    "CLIMATE_RESILIENT":    {"mobility": 0.15, "density": 0.05, "green": 0.25, "equity": 0.15, "economic": 0.05, "disaster": 0.35},
    "EQUITY_FOCUSED":       {"mobility": 0.15, "density": 0.05, "green": 0.20, "equity": 0.45, "economic": 0.10, "disaster": 0.05},
    "HISTORIC_PATTERN":     {"mobility": 0.25, "density": 0.25, "green": 0.10, "equity": 0.15, "economic": 0.20, "disaster": 0.05},
}


class RewardCalculator:
    def __init__(self, scenario: str):
        self.weights = SCENARIO_WEIGHTS.get(scenario, SCENARIO_WEIGHTS["BALANCED_SUSTAINABLE"])

    def compute(self, zone_grid: np.ndarray, metrics: dict, x: int, y: int, zone_name: str, valid: bool) -> float:
        if not valid:
            return -0.5

        w = self.weights
        commute = metrics.get("commute_minutes", 35)
        pop = metrics.get("population", 1_000_000)
        area = float(zone_grid.shape[0] * zone_grid.shape[1])
        infra_cost = max(1.0, metrics.get("infrastructure_score", 0.5))
        total_cells = float(zone_grid.size)
        green_cells = float(np.sum((zone_grid == 9) | (zone_grid == 10)))
        developed = float(np.sum(zone_grid > 0))
        gdp = metrics.get("gdp_per_capita", 50000)
        baseline_gdp = 45000.0
        equity = metrics.get("equity_score", 0.5)
        disaster = metrics.get("flood_risk", 0.2)

        r_mobility = 1.0 / (1.0 + commute / 60.0)
        r_density = (pop / area) / max(1.0, infra_cost * 1000)
        r_green = green_cells / max(1.0, developed)
        r_equity = equity
        r_economic = gdp / baseline_gdp
        r_disaster = 1.0 - disaster

        reward = (
            r_mobility * w["mobility"]
            + min(r_density, 1.0) * w["density"]
            + r_green * w["green"]
            + r_equity * w["equity"]
            + min(r_economic, 2.0) / 2.0 * w["economic"]
            + r_disaster * w["disaster"]
        )
        return float(np.clip(reward, -1.0, 1.0))

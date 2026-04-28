import math


SCENARIO_GROWTH = {
    "MAXIMUM_GROWTH": 0.025,
    "BALANCED_SUSTAINABLE": 0.015,
    "CLIMATE_RESILIENT": 0.010,
    "EQUITY_FOCUSED": 0.012,
    "HISTORIC_PATTERN": 0.018,
}

GROWTH_FACTOR_WEIGHTS = {
    "housing_affordability": 0.25,
    "job_growth_rate": 0.20,
    "transit_coverage": 0.15,
    "green_space_per_capita": 0.10,
    "school_access": 0.10,
    "healthcare_access": 0.10,
    "climate_risk": 0.08,
    "gdp_per_capita": 0.02,
}


class PopulationDynamics:
    def __init__(self, city_data: dict):
        self.city_data = city_data
        self.scenario = "BALANCED_SUSTAINABLE"

    def update(self, metrics: dict, year: int, actions: list) -> dict:
        pop = metrics.get("population", 1_000_000)
        base_rate = SCENARIO_GROWTH.get(metrics.get("scenario", self.scenario), 0.015)

        res_placed = sum(1 for a in actions if a.get("zone_type", "").startswith("RES"))
        trans_placed = sum(1 for a in actions if a.get("zone_type") == "TRANS_HUB")
        health_placed = sum(1 for a in actions if a.get("zone_type", "").startswith("HEALTH"))
        edu_placed = sum(1 for a in actions if a.get("zone_type", "").startswith("EDU"))

        multiplier = 1.0
        multiplier += res_placed * 0.002
        multiplier += trans_placed * 0.005
        multiplier += health_placed * 0.002
        multiplier += edu_placed * 0.002

        climate_risk = metrics.get("flood_risk", 0.2)
        if climate_risk > 0.6:
            multiplier *= 0.98
        elif climate_risk > 0.8:
            multiplier *= 0.90

        new_pop = pop * (1 + base_rate * multiplier)
        capacity = metrics.get("residential_capacity", new_pop * 1.5)
        new_pop = min(new_pop, capacity * 0.85)

        metrics["population"] = round(new_pop)
        metrics["population_growth_rate"] = round(base_rate * multiplier, 4)

        gdp = metrics.get("gdp_per_capita", 50000)
        metrics["gdp_per_capita"] = round(gdp * (1 + 0.02 * multiplier), 2)

        return metrics

import numpy as np

ZONE_IDS = {
    "EMPTY": 0, "RES_LOW": 1, "RES_MED": 2, "RES_HIGH": 3,
    "COM_RETAIL": 4, "COM_OFFICE": 5, "IND_LIGHT": 6, "IND_HEAVY": 7,
    "MIX_USE": 8, "GREEN_PARK": 9, "GREEN_FOREST": 10,
    "HEALTH_CLINIC": 11, "HEALTH_HOSP": 12, "EDU_SCHOOL": 13, "EDU_UNIVERSITY": 14,
    "INFRA_POWER": 15, "INFRA_WATER": 16, "TRANS_HUB": 17, "TRANS_HIGHWAY": 18,
    "SAFETY_FIRE": 19, "SAFETY_POLICE": 20,
}


class MetricsCalculator:
    def compute(self, zone_grid: np.ndarray, current_metrics: dict) -> dict:
        metrics = dict(current_metrics)
        total = float(zone_grid.size)
        developed = float(np.sum(zone_grid > 0))

        res = float(np.sum((zone_grid >= 1) & (zone_grid <= 3)))
        com = float(np.sum((zone_grid >= 4) & (zone_grid <= 5)))
        ind = float(np.sum((zone_grid >= 6) & (zone_grid <= 7)))
        green = float(np.sum((zone_grid == 9) | (zone_grid == 10)))
        trans = float(np.sum((zone_grid == 17) | (zone_grid == 18)))
        health = float(np.sum((zone_grid == 11) | (zone_grid == 12)))
        edu = float(np.sum((zone_grid == 13) | (zone_grid == 14)))

        if developed > 0:
            metrics["green_ratio"] = round(green / developed, 4)
        metrics["transit_coverage"] = round(min(1.0, trans * 0.05), 4)
        metrics["infrastructure_score"] = round(min(1.0, (trans + health + edu) / max(1.0, developed) * 5), 4)

        pop = metrics.get("population", 1_000_000)
        if health > 0:
            metrics["hospital_beds_per_1k"] = round(min(20.0, health * 50 / max(1, pop / 1000)), 2)
        if edu > 0:
            metrics["school_enrollment"] = round(min(1.0, 0.5 + edu * 0.02), 4)

        aqi_base = metrics.get("aqi", 80)
        aqi_delta = -green * 0.1 + ind * 0.3
        metrics["aqi"] = round(max(10, min(300, aqi_base + aqi_delta)), 1)

        if com > 0:
            metrics["employment_rate"] = round(min(1.0, metrics.get("employment_rate", 0.85) + com * 0.001), 4)

        return metrics

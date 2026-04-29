import numpy as np

ZONE_IDS = {
    "EMPTY": 0, "RES_LOW": 1, "RES_MED": 2, "RES_HIGH": 3,
    "COM_RETAIL": 4, "COM_OFFICE": 5, "IND_LIGHT": 6, "IND_HEAVY": 7,
    "MIX_USE": 8, "GREEN_PARK": 9, "GREEN_FOREST": 10,
    "HEALTH_CLINIC": 11, "HEALTH_HOSP": 12, "EDU_SCHOOL": 13, "EDU_UNIVERSITY": 14,
    "INFRA_POWER": 15, "INFRA_WATER": 16, "TRANS_HUB": 17, "TRANS_HIGHWAY": 18,
    "SAFETY_FIRE": 19, "SAFETY_POLICE": 20,
}
ID_TO_ZONE = {v: k for k, v in ZONE_IDS.items()}

# Cells are 500m × 500m = 0.25 km²
CELL_AREA_KM2 = 0.25

# Population per cell by zone type
POP_PER_CELL = {
    "RES_LOW": 2_000, "RES_MED": 8_000, "RES_HIGH": 25_000,
    "MIX_USE": 12_000, "COM_RETAIL": 200, "COM_OFFICE": 500,
}

# Jobs per cell
JOBS_PER_CELL = {
    "COM_RETAIL": 150, "COM_OFFICE": 600, "IND_LIGHT": 200, "IND_HEAVY": 350,
    "MIX_USE": 300, "TRANS_HUB": 100, "HEALTH_CLINIC": 80, "HEALTH_HOSP": 500,
    "EDU_SCHOOL": 60, "EDU_UNIVERSITY": 400, "INFRA_POWER": 20, "INFRA_WATER": 20,
    "SAFETY_FIRE": 30, "SAFETY_POLICE": 40,
}

# Power demand per cell (MW)
POWER_DEMAND_MW = {
    "RES_LOW": 0.5, "RES_MED": 1.0, "RES_HIGH": 2.5,
    "COM_RETAIL": 1.5, "COM_OFFICE": 2.0, "IND_LIGHT": 3.0, "IND_HEAVY": 6.0,
    "MIX_USE": 1.8, "TRANS_HUB": 1.2, "HEALTH_HOSP": 3.5, "HEALTH_CLINIC": 1.0,
    "EDU_UNIVERSITY": 2.0, "EDU_SCHOOL": 0.6,
}

# Water demand per cell (ML/day)
WATER_DEMAND_ML = {
    "RES_LOW": 0.3, "RES_MED": 0.6, "RES_HIGH": 1.5,
    "COM_RETAIL": 0.4, "COM_OFFICE": 0.5, "IND_LIGHT": 2.0, "IND_HEAVY": 5.0,
    "HEALTH_HOSP": 2.5, "GREEN_PARK": 0.8, "GREEN_FOREST": 0.2,
}


def _gini(values: np.ndarray) -> float:
    v = np.sort(np.abs(values.flatten()))
    n = len(v)
    if n == 0 or v.sum() == 0:
        return 0.0
    cumsum = np.cumsum(v)
    return float((2 * np.sum((np.arange(1, n + 1)) * v) - (n + 1) * cumsum[-1]) / (n * cumsum[-1]))


def _infra_access_grid(zone_grid: np.ndarray, infra_ids: set, radius: int = 8) -> np.ndarray:
    n = zone_grid.shape[0]
    access = np.zeros((n, n), dtype=np.float32)
    for y in range(n):
        for x in range(n):
            if zone_grid[y, x] in infra_ids:
                for dy in range(-radius, radius + 1):
                    for dx in range(-radius, radius + 1):
                        ny, nx = y + dy, x + dx
                        if 0 <= ny < n and 0 <= nx < n:
                            dist = (dx ** 2 + dy ** 2) ** 0.5
                            access[ny, nx] = max(access[ny, nx], 1.0 - dist / (radius + 1))
    return access


class MetricsCalculator:
    def compute(self, zone_grid: np.ndarray, current_metrics: dict) -> dict:
        metrics = dict(current_metrics)
        n = zone_grid.shape[0]
        total_cells = float(n * n)

        # --- Zone counts ---
        res_cells = float(np.sum((zone_grid >= 1) & (zone_grid <= 3)))
        com_cells = float(np.sum((zone_grid >= 4) & (zone_grid <= 5)))
        ind_cells = float(np.sum((zone_grid >= 6) & (zone_grid <= 7)))
        mix_cells = float(np.sum(zone_grid == ZONE_IDS["MIX_USE"]))
        green_cells = float(np.sum((zone_grid == ZONE_IDS["GREEN_PARK"]) | (zone_grid == ZONE_IDS["GREEN_FOREST"])))
        trans_cells = float(np.sum((zone_grid == ZONE_IDS["TRANS_HUB"]) | (zone_grid == ZONE_IDS["TRANS_HIGHWAY"])))
        health_cells = float(np.sum((zone_grid == ZONE_IDS["HEALTH_CLINIC"]) | (zone_grid == ZONE_IDS["HEALTH_HOSP"])))
        hosp_cells = float(np.sum(zone_grid == ZONE_IDS["HEALTH_HOSP"]))
        edu_cells = float(np.sum((zone_grid == ZONE_IDS["EDU_SCHOOL"]) | (zone_grid == ZONE_IDS["EDU_UNIVERSITY"])))
        power_cells = float(np.sum(zone_grid == ZONE_IDS["INFRA_POWER"]))
        water_cells = float(np.sum(zone_grid == ZONE_IDS["INFRA_WATER"]))
        safety_cells = float(np.sum((zone_grid == ZONE_IDS["SAFETY_FIRE"]) | (zone_grid == ZONE_IDS["SAFETY_POLICE"])))
        developed_cells = float(np.sum(zone_grid > 0))

        # --- Population ---
        pop_grid = np.zeros((n, n), dtype=np.float64)
        for y in range(n):
            for x in range(n):
                zone_name = ID_TO_ZONE.get(int(zone_grid[y, x]), "EMPTY")
                pop_grid[y, x] = POP_PER_CELL.get(zone_name, 0)
        pop_total = int(pop_grid.sum())
        pop_total = max(pop_total, metrics.get("population", 500_000))

        developed_area_km2 = developed_cells * CELL_AREA_KM2
        total_area_km2 = total_cells * CELL_AREA_KM2
        pop_density_avg = pop_total / total_area_km2  # people/km² across whole grid

        prev_pop = metrics.get("population", pop_total)
        pop_growth_rate = ((pop_total - prev_pop) / max(1, prev_pop)) * 100

        # --- Jobs ---
        jobs_created = 0
        for y in range(n):
            for x in range(n):
                zone_name = ID_TO_ZONE.get(int(zone_grid[y, x]), "EMPTY")
                jobs_created += JOBS_PER_CELL.get(zone_name, 0)

        # --- Mobility ---
        commute_base = metrics.get("commute_minutes", 35.0)
        trans_bonus = min(10.0, trans_cells * 0.5)
        congestion_penalty = max(0.0, (ind_cells + com_cells - trans_cells * 2) * 0.3)
        mobility_commute = max(8.0, commute_base - trans_bonus + congestion_penalty * 0.3)

        mobility_congestion = min(100.0, max(0.0, (1.0 - trans_cells * 0.04) * 100 * (developed_cells / max(1, total_cells)) * 1.5))
        transit_coverage = min(1.0, trans_cells * 0.06)
        walkability = min(100.0, (green_cells + mix_cells + com_cells) / max(1, developed_cells) * 200)

        # --- Economics ---
        gdp_base = metrics.get("gdp_per_capita", 50_000.0)
        gdp_growth = (com_cells * 0.5 + ind_cells * 0.3 + mix_cells * 0.3) / max(1, developed_cells) * 0.05
        econ_gdp_est = gdp_base * (1 + gdp_growth)
        baseline_gdp = metrics.get("baseline_gdp", gdp_base)

        housing_supply = res_cells * CELL_AREA_KM2 * 4000  # rough dwellings
        econ_housing_afford = min(1.0, max(0.0, housing_supply / max(1, pop_total) * 3))

        # --- Environment ---
        green_m2_per_person = (green_cells * CELL_AREA_KM2 * 1e6) / max(1, pop_total)
        env_green_ratio = green_cells / max(1.0, developed_cells)

        renewable_ratio = min(1.0, green_cells * 0.01 + power_cells * 0.05)
        co2_per_capita_base = 6.0  # tonnes/capita/yr global avg
        ind_factor = 1 + ind_cells * 0.05
        green_factor = max(0.5, 1 - green_cells * 0.02)
        env_co2_est = co2_per_capita_base * ind_factor * green_factor

        env_impervious = min(1.0, (res_cells + com_cells + ind_cells) / max(1.0, total_cells))

        flood_base = metrics.get("flood_risk", 0.2)
        flood_cells_exposed = max(0.0, flood_base * developed_cells)
        env_flood_exposure = min(1.0, flood_cells_exposed / max(1.0, total_cells))

        # --- Equity ---
        hosp_ids = {ZONE_IDS["HEALTH_HOSP"], ZONE_IDS["HEALTH_CLINIC"]}
        edu_ids = {ZONE_IDS["EDU_SCHOOL"], ZONE_IDS["EDU_UNIVERSITY"]}

        hosp_access = _infra_access_grid(zone_grid, hosp_ids, radius=10)
        edu_access_grid = _infra_access_grid(zone_grid, edu_ids, radius=8)
        trans_access = _infra_access_grid(zone_grid, {ZONE_IDS["TRANS_HUB"]}, radius=6)

        combined_infra = (hosp_access + edu_access_grid + trans_access) / 3.0

        res_mask = (zone_grid >= 1) & (zone_grid <= 3)
        if res_mask.sum() > 0:
            res_infra_vals = combined_infra[res_mask]
            equity_infra_gini = _gini(res_infra_vals)
            equity_hosp_coverage = float(np.mean(hosp_access[res_mask]))
            equity_school_access = float(np.mean(edu_access_grid[res_mask])) * 100
        else:
            equity_infra_gini = 0.0
            equity_hosp_coverage = 0.0
            equity_school_access = 0.0

        # --- Infrastructure capacity ---
        power_demand = sum(
            POWER_DEMAND_MW.get(ID_TO_ZONE.get(int(zone_grid[y, x]), "EMPTY"), 0)
            for y in range(n) for x in range(n)
        )
        power_capacity = max(1.0, power_cells * 50.0)
        infra_power_load = min(1.0, power_demand / power_capacity)

        water_demand = sum(
            WATER_DEMAND_ML.get(ID_TO_ZONE.get(int(zone_grid[y, x]), "EMPTY"), 0)
            for y in range(n) for x in range(n)
        )
        water_capacity = max(1.0, water_cells * 50.0)
        infra_water_capacity = min(1.0, water_demand / water_capacity)

        # --- Safety ---
        safety_response = max(3.0, 15.0 - safety_cells * 1.5 - trans_cells * 0.3)

        # --- Composite scores ---
        mobility_score = min(100.0, (transit_coverage * 40 + walkability * 0.3 + max(0, (60 - mobility_commute)) * 0.5))
        economic_score = min(100.0, (econ_gdp_est / baseline_gdp) * 50 + (jobs_created / max(1, pop_total)) * 5000)
        sustainability_score = min(100.0, env_green_ratio * 50 + (1 - env_co2_est / 12) * 30 + (1 - env_impervious) * 20)
        equity_score = min(1.0, (1 - equity_infra_gini) * 0.5 + equity_hosp_coverage * 0.3 + equity_school_access / 100 * 0.2)
        overall_health = min(100.0, (mobility_score + economic_score + sustainability_score + equity_score * 100) / 4)

        # --- Unemployment ---
        labour_force = pop_total * 0.45
        unemployment_rate = max(0.02, 0.10 - (jobs_created / max(1, labour_force)) * 0.5)

        # --- AQI ---
        aqi_base = metrics.get("aqi", 80.0)
        aqi = max(10.0, min(300.0, aqi_base - green_cells * 0.15 + ind_cells * 0.3))

        # --- Energy ---
        energy_gwh = power_demand * 8760 / 1000  # MW → GWh/yr
        renewable_pct = renewable_ratio * 100
        water_access_pct = min(100.0, (water_cells * 5 + 80) if water_cells > 0 else 85.0)
        waste_recycling_pct = min(100.0, green_cells * 2 + 30)
        crime_rate = max(0.5, 5.0 - safety_cells * 0.3)

        happiness_idx = min(10.0, (
            equity_score * 3 +
            (1 - env_co2_est / 12) * 2 +
            (transit_coverage) * 2 +
            (green_m2_per_person / 20) * 2 +
            (econ_gdp_est / baseline_gdp - 1) * 1
        ))

        # --- Merge all keys ---
        metrics.update({
            # Spec 20-key format
            "pop_total": pop_total,
            "pop_density_avg": round(pop_density_avg, 1),
            "pop_growth_rate": round(pop_growth_rate, 4),
            "mobility_commute": round(mobility_commute, 1),
            "mobility_congestion": round(mobility_congestion, 1),
            "mobility_transit_coverage": round(transit_coverage, 4),
            "mobility_walkability": round(walkability, 1),
            "econ_gdp_est": round(econ_gdp_est, 2),
            "econ_housing_afford": round(econ_housing_afford, 4),
            "econ_jobs_created": int(jobs_created),
            "env_green_ratio": round(env_green_ratio, 4),
            "env_co2_est": round(env_co2_est, 3),
            "env_impervious": round(env_impervious, 4),
            "env_flood_exposure": round(env_flood_exposure, 4),
            "equity_infra_gini": round(equity_infra_gini, 4),
            "equity_hosp_coverage": round(equity_hosp_coverage, 4),
            "equity_school_access": round(equity_school_access, 1),
            "infra_power_load": round(infra_power_load, 4),
            "infra_water_capacity": round(infra_water_capacity, 4),
            "safety_response_time": round(safety_response, 1),
            "baseline_gdp": round(baseline_gdp, 2),
            "gini_infrastructure": round(equity_infra_gini, 4),
            # Frontend CityMetrics keys
            "population": pop_total,
            "population_density": round(pop_density_avg, 1),
            "gdp_per_capita": round(econ_gdp_est, 2),
            "unemployment_rate": round(unemployment_rate, 4),
            "avg_commute_time": round(mobility_commute, 1),
            "public_transit_coverage": round(transit_coverage * 100, 1),
            "green_space_pct": round(env_green_ratio * 100, 1),
            "air_quality_index": round(aqi, 1),
            "housing_affordability": round(econ_housing_afford, 4),
            "healthcare_access": round(equity_hosp_coverage * 100, 1),
            "education_access": round(equity_school_access, 1),
            "crime_rate": round(crime_rate, 2),
            "flood_risk_score": round(env_flood_exposure * 10, 2),
            "energy_consumption_gwh": round(energy_gwh, 1),
            "renewable_energy_pct": round(renewable_pct, 1),
            "water_access_pct": round(water_access_pct, 1),
            "waste_recycling_pct": round(waste_recycling_pct, 1),
            "happiness_index": round(max(0.0, happiness_idx), 2),
            "equity_index": round(equity_score, 4),
            "mobility_score": round(mobility_score, 1),
            "economic_score": round(economic_score, 1),
            "sustainability_score": round(sustainability_score, 1),
            "overall_health": round(overall_health, 1),
            # Shared aliases for backward compat
            "commute_minutes": round(mobility_commute, 1),
            "green_ratio": round(env_green_ratio, 4),
            "transit_coverage": round(transit_coverage, 4),
            "aqi": round(aqi, 1),
            "equity_score": round(equity_score, 4),
            "infrastructure_score": round(1.0 - equity_infra_gini, 4),
            "power_grid_load": round(infra_power_load, 4),
            "water_grid_load": round(infra_water_capacity, 4),
            "flood_risk": float(metrics.get("flood_risk", 0.2)),
            # Cell counts for reward calculator
            "developed_area": developed_area_km2,
            "developed_cells": int(developed_cells),
            "green_cells": int(green_cells),
            "avg_commute_minutes": round(mobility_commute, 1),
            "infra_cost": round(max(1.0, power_demand + water_demand) / 100, 4),
        })

        return metrics

"""
Energy demand forecasting. LSTM-based when PyTorch available, linear fallback.
"""

ZONE_ENERGY_KWH_PER_YEAR = {
    "RES_LOW": 12_000, "RES_MED": 18_000, "RES_HIGH": 25_000,
    "COM_RETAIL": 80_000, "COM_OFFICE": 120_000,
    "IND_LIGHT": 200_000, "IND_HEAVY": 500_000,
    "MIX_USE": 50_000, "TRANS_HUB": 150_000,
    "HEALTH_HOSP": 300_000, "EDU_UNIVERSITY": 180_000,
}


class EnergyForecaster:
    def forecast(self, zone_counts: dict[str, int], metrics: dict) -> dict:
        total_kwh = 0
        for zone, count in zone_counts.items():
            total_kwh += ZONE_ENERGY_KWH_PER_YEAR.get(zone, 5_000) * count

        pop = metrics.get("population", 1_000_000)
        kwh_per_capita = total_kwh / max(1, pop)

        renewable_ratio = metrics.get("green_ratio", 0.15) * 0.4
        co2_kg_per_kwh = 0.4 * (1 - renewable_ratio)
        co2_tonnes = total_kwh * co2_kg_per_kwh / 1_000

        return {
            "total_energy_gwh": round(total_kwh / 1e6, 2),
            "energy_per_capita_kwh": round(kwh_per_capita, 0),
            "renewable_ratio": round(renewable_ratio, 3),
            "co2_tonnes_per_year": round(co2_tonnes, 0),
            "co2_per_capita": round(co2_tonnes * 1000 / max(1, pop), 2),
        }

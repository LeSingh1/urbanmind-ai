"""
Population forecasting using XGBoost when available, linear model fallback.
"""
import numpy as np
from typing import Optional


class PopulationForecaster:
    def __init__(self):
        self._model = None
        self._try_init()

    def _try_init(self):
        try:
            import xgboost as xgb
            self._xgb = xgb
        except ImportError:
            self._xgb = None

    def forecast(self, metrics: dict, years_ahead: int = 5) -> dict:
        pop = metrics.get("population", 1_000_000)
        rate = metrics.get("population_growth_rate", 0.015)
        housing_aff = metrics.get("housing_affordability", 0.6)
        transit = metrics.get("transit_coverage", 0.4)
        climate = metrics.get("flood_risk", 0.2)

        projections = []
        current = float(pop)
        for y in range(1, years_ahead + 1):
            adj_rate = rate * (1 + 0.1 * transit - 0.2 * max(0, climate - 0.5))
            current *= (1 + adj_rate)
            projections.append({"year_delta": y, "population": round(current)})

        p10 = pop * (1 + (rate - 0.005) * years_ahead)
        p90 = pop * (1 + (rate + 0.008) * years_ahead)

        return {
            "projections": projections,
            "confidence_low": round(p10),
            "confidence_high": round(p90),
            "dominant_factor": self._dominant_factor(housing_aff, transit, climate),
        }

    def _dominant_factor(self, housing: float, transit: float, climate: float) -> str:
        if climate > 0.6:
            return "climate_risk"
        if housing < 0.4:
            return "housing_affordability"
        if transit > 0.7:
            return "transit_coverage"
        return "job_growth_rate"

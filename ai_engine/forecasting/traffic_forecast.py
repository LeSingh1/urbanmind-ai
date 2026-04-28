"""
Traffic/commute time forecasting using LightGBM when available.
"""


class TrafficForecaster:
    def forecast(self, metrics: dict, new_zones: list[str]) -> dict:
        commute = metrics.get("commute_minutes", 35)
        transit = metrics.get("transit_coverage", 0.4)
        pop = metrics.get("population", 1_000_000)

        trans_added = sum(1 for z in new_zones if z == "TRANS_HUB")
        highway_added = sum(1 for z in new_zones if z == "TRANS_HIGHWAY")
        res_added = sum(1 for z in new_zones if z.startswith("RES"))

        delta = 0.0
        delta -= trans_added * 0.8
        delta -= highway_added * 0.4
        delta += res_added * 0.15
        delta += (pop / 5_000_000) * 0.2

        new_commute = max(8.0, commute + delta)
        return {
            "commute_minutes": round(new_commute, 1),
            "congestion_index": round(min(1.0, new_commute / 60.0), 3),
            "transit_mode_share": round(min(0.9, transit + trans_added * 0.02), 3),
        }

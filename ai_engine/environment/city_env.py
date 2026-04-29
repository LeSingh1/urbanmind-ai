import numpy as np
from typing import Optional

try:
    import gymnasium as gym
    from gymnasium import spaces
    GYM_AVAILABLE = True
except ImportError:
    GYM_AVAILABLE = False
    gym = None

from environment.observation_builder import ObservationBuilder
from environment.action_decoder import ActionDecoder
from environment.constraint_validator import ConstraintValidator
from environment.reward_calculator import RewardCalculator

ZONE_IDS = {
    "EMPTY": 0, "RES_LOW": 1, "RES_MED": 2, "RES_HIGH": 3,
    "COM_RETAIL": 4, "COM_OFFICE": 5, "IND_LIGHT": 6, "IND_HEAVY": 7,
    "MIX_USE": 8, "GREEN_PARK": 9, "GREEN_FOREST": 10,
    "HEALTH_CLINIC": 11, "HEALTH_HOSP": 12, "EDU_SCHOOL": 13, "EDU_UNIVERSITY": 14,
    "INFRA_POWER": 15, "INFRA_WATER": 16, "TRANS_HUB": 17, "TRANS_HIGHWAY": 18,
    "SAFETY_FIRE": 19, "SAFETY_POLICE": 20,
}
ID_TO_ZONE = {v: k for k, v in ZONE_IDS.items()}
NUM_ZONES = len(ZONE_IDS)

ZONE_DISPLAY_NAMES = {
    "EMPTY": "Undeveloped",
    "RES_LOW": "Low-Density Residential",
    "RES_MED": "Medium-Density Residential",
    "RES_HIGH": "High-Rise Residential",
    "COM_RETAIL": "Retail/Commercial",
    "COM_OFFICE": "Office/Business District",
    "IND_LIGHT": "Light Industrial",
    "IND_HEAVY": "Heavy Industrial",
    "MIX_USE": "Mixed Use",
    "GREEN_PARK": "Public Park",
    "GREEN_FOREST": "Forest / Nature Reserve",
    "HEALTH_CLINIC": "Health Clinic",
    "HEALTH_HOSP": "Hospital",
    "EDU_SCHOOL": "School",
    "EDU_UNIVERSITY": "University",
    "INFRA_POWER": "Power Plant",
    "INFRA_WATER": "Water Treatment",
    "TRANS_HUB": "Transit Hub",
    "TRANS_HIGHWAY": "Highway",
    "SAFETY_FIRE": "Fire Station",
    "SAFETY_POLICE": "Police Station",
}

ZONE_POP = {
    "RES_LOW": 2_000, "RES_MED": 8_000, "RES_HIGH": 25_000,
    "MIX_USE": 12_000, "COM_RETAIL": 200, "COM_OFFICE": 500,
}

ROAD_TYPES = {
    "RES_LOW": "local", "RES_MED": "local", "RES_HIGH": "collector",
    "COM_RETAIL": "collector", "COM_OFFICE": "arterial",
    "IND_LIGHT": "collector", "IND_HEAVY": "arterial",
    "MIX_USE": "collector", "TRANS_HUB": "arterial", "TRANS_HIGHWAY": "highway",
}


def _build_ecc_map(grid_size: int, city_data: dict) -> np.ndarray:
    """Build Environmental Constraint Class map (0=protected … 5=priority)."""
    ecc = np.full((grid_size, grid_size), 4, dtype=np.int32)
    cx, cy = grid_size // 2, grid_size // 2
    max_r = (cx ** 2 + cy ** 2) ** 0.5

    city_id = city_data.get("id", "")
    coastal_cities = {"lagos", "singapore", "dubai", "mumbai", "new_york", "miami"}

    for y in range(grid_size):
        for x in range(grid_size):
            r = ((x - cx) ** 2 + (y - cy) ** 2) ** 0.5
            if r < max_r * 0.12:
                ecc[y, x] = 5  # city core — priority
            elif r > max_r * 0.85:
                ecc[y, x] = 2  # outer edge — sensitive

            # Coastal cities: mark water-edge as constrained/protected
            if city_id in coastal_cities:
                edge_dist = min(x, grid_size - 1 - x, y, grid_size - 1 - y)
                if edge_dist < 3:
                    ecc[y, x] = 1  # constrained natural (coastal buffer)
                elif edge_dist < 5:
                    ecc[y, x] = min(ecc[y, x], 2)  # sensitive

    return ecc


def _build_flood_risk_map(grid_size: int, city_data: dict) -> np.ndarray:
    """Build flood risk raster (0.0–1.0) from city metadata."""
    flood_prone = {"lagos", "mumbai", "singapore", "new_york", "sao_paulo", "dhaka"}
    city_id = city_data.get("id", "")
    base_risk = 0.35 if city_id in flood_prone else 0.10

    risk = np.zeros((grid_size, grid_size), dtype=np.float32)
    for y in range(grid_size):
        for x in range(grid_size):
            edge_dist = min(x, y, grid_size - 1 - x, grid_size - 1 - y)
            risk[y, x] = base_risk * max(0.0, 1.0 - edge_dist / (grid_size * 0.2))

    # Add some inland low-lying noise
    rng = np.random.default_rng(hash(city_id) % (2 ** 32))
    risk += rng.random((grid_size, grid_size)).astype(np.float32) * 0.05
    return np.clip(risk, 0.0, 1.0)


class CityExpansionEnv:
    """Gymnasium-compatible city expansion environment with ECC, flood risk, and GeoJSON output."""

    GRID_SIZE = 64
    OBS_CHANNELS = 8
    MAX_YEARS = 50

    def __init__(self, city_data: dict, scenario: str = "BALANCED_SUSTAINABLE"):
        self.city_data = city_data
        self.scenario = scenario
        self.grid_size = self.GRID_SIZE

        # Geo layers
        self.ecc_map = _build_ecc_map(self.grid_size, city_data)
        self.flood_risk_map = _build_flood_risk_map(self.grid_size, city_data)

        # Components
        self.obs_builder = ObservationBuilder(self.grid_size)
        self.action_decoder = ActionDecoder(self.grid_size, NUM_ZONES)
        self.validator = ConstraintValidator(
            self.grid_size,
            ecc_map=self.ecc_map,
            flood_risk_map=self.flood_risk_map,
            prevailing_wind=city_data.get("prevailing_wind", "S"),
        )
        self.reward_calc = RewardCalculator(scenario)

        if GYM_AVAILABLE:
            self.observation_space = spaces.Box(
                low=0.0, high=1.0,
                shape=(self.grid_size, self.grid_size, self.OBS_CHANNELS),
                dtype=np.float32,
            )
            self.action_space = spaces.MultiDiscrete(
                [self.grid_size, self.grid_size, NUM_ZONES, 2]
            )

        # State
        self.zone_grid: np.ndarray = np.zeros((self.grid_size, self.grid_size), dtype=np.int32)
        self.year_placed: dict = {}   # (x, y) → year
        self.metrics: dict = {}
        self.current_year: int = 0
        self._road_segments: list = []  # accumulated road GeoJSON features

        self._seed_initial_zones()

    def reset(self, seed: Optional[int] = None):
        self.zone_grid = np.zeros((self.grid_size, self.grid_size), dtype=np.int32)
        self.year_placed = {}
        self.metrics = dict(self.city_data.get("initial_metrics", {}))
        self.current_year = 0
        self._road_segments = []
        self._seed_initial_zones()
        return self.obs_builder.build(self.zone_grid, self.metrics), {}

    def step(self, action):
        x, y, zone_id, connect_road = self.action_decoder.decode(action)
        zone_name = ID_TO_ZONE.get(zone_id, "EMPTY")

        valid, reason = self.validator.validate(self.zone_grid, x, y, zone_name)
        if valid and zone_name != "EMPTY":
            self.zone_grid[y, x] = zone_id
            self.year_placed[(x, y)] = self.current_year
            if connect_road:
                self._add_road_segment(x, y, zone_name)

        reward = self.reward_calc.compute(self.zone_grid, self.metrics, x, y, zone_name, valid)
        self._advance_metrics(zone_name)
        self.current_year += 1

        obs = self.obs_builder.build(self.zone_grid, self.metrics)
        done = self.current_year >= self.MAX_YEARS
        info = {
            "year": self.current_year,
            "zone": zone_name,
            "valid": valid,
            "rejection_reason": reason if not valid else "",
            "reward": reward,
        }
        return obs, reward, done, False, info

    def get_action_mask(self) -> np.ndarray:
        mask = np.ones((self.grid_size, self.grid_size, NUM_ZONES), dtype=bool)
        for y in range(self.grid_size):
            for x in range(self.grid_size):
                if self.zone_grid[y, x] != 0:
                    mask[y, x, :] = False
                else:
                    for zone_id in range(NUM_ZONES):
                        zone_name = ID_TO_ZONE.get(zone_id, "EMPTY")
                        if not self.validator.is_valid(self.zone_grid, x, y, zone_name):
                            mask[y, x, zone_id] = False
        return mask

    def get_grid_as_names(self) -> list[list[str]]:
        return [[ID_TO_ZONE.get(int(self.zone_grid[y, x]), "EMPTY")
                 for x in range(self.grid_size)]
                for y in range(self.grid_size)]

    # ------------------------------------------------------------------
    # GeoJSON serialization
    # ------------------------------------------------------------------

    def get_zones_geojson(self) -> dict:
        """FeatureCollection of all placed zone cells as Polygon features."""
        lng_min, lat_min, lng_max, lat_max = self._bounds()
        lng_step = (lng_max - lng_min) / self.grid_size
        lat_step = (lat_max - lat_min) / self.grid_size

        features = []
        for y in range(self.grid_size):
            for x in range(self.grid_size):
                zone_id = int(self.zone_grid[y, x])
                if zone_id == 0:
                    continue
                zone_name = ID_TO_ZONE.get(zone_id, "EMPTY")
                lng = lng_min + x * lng_step
                lat = lat_max - (y + 1) * lat_step

                features.append({
                    "type": "Feature",
                    "geometry": {
                        "type": "Polygon",
                        "coordinates": [[
                            [lng, lat],
                            [lng + lng_step, lat],
                            [lng + lng_step, lat + lat_step],
                            [lng, lat + lat_step],
                            [lng, lat],
                        ]],
                    },
                    "properties": {
                        "zone_type": zone_name,
                        "zone_type_id": zone_id,
                        "zone_display_name": ZONE_DISPLAY_NAMES.get(zone_name, zone_name),
                        "population": ZONE_POP.get(zone_name, 0),
                        "year_placed": self.year_placed.get((x, y), 0),
                        "x": x,
                        "y": y,
                        "ecc": int(self.ecc_map[y, x]),
                        "flood_risk": round(float(self.flood_risk_map[y, x]), 3),
                    },
                })
        return {"type": "FeatureCollection", "features": features}

    def get_roads_geojson(self) -> dict:
        """FeatureCollection of road LineStrings."""
        return {"type": "FeatureCollection", "features": list(self._road_segments)}

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _bounds(self) -> tuple[float, float, float, float]:
        bounds = self.city_data.get("bounds", {})
        clat = self.city_data.get("center_lat", 0.0)
        clng = self.city_data.get("center_lng", 0.0)
        lng_min = bounds.get("min_lng", clng - 0.3)
        lat_min = bounds.get("min_lat", clat - 0.3)
        lng_max = bounds.get("max_lng", clng + 0.3)
        lat_max = bounds.get("max_lat", clat + 0.3)

        # Support bbox as [west, south, east, north] list
        bbox = self.city_data.get("bbox")
        if bbox and len(bbox) == 4:
            lng_min, lat_min, lng_max, lat_max = bbox

        return lng_min, lat_min, lng_max, lat_max

    def _add_road_segment(self, x: int, y: int, zone_name: str):
        """Generate a simple road LineString from new zone centroid to nearest existing road."""
        lng_min, lat_min, lng_max, lat_max = self._bounds()
        lng_step = (lng_max - lng_min) / self.grid_size
        lat_step = (lat_max - lat_min) / self.grid_size

        # Centroid of new cell
        cx = lng_min + (x + 0.5) * lng_step
        cy_lat = lat_max - (y + 0.5) * lat_step

        # Find nearest grid center with an existing road segment or existing development
        road_grid = self.zone_grid
        best_x, best_y = self.grid_size // 2, self.grid_size // 2
        best_d = float("inf")
        for ry in range(self.grid_size):
            for rx in range(self.grid_size):
                if road_grid[ry, rx] in (ZONE_IDS["TRANS_HUB"], ZONE_IDS["TRANS_HIGHWAY"]):
                    d = abs(rx - x) + abs(ry - y)
                    if d < best_d and d > 0:
                        best_d = d
                        best_x, best_y = rx, ry

        tx = lng_min + (best_x + 0.5) * lng_step
        ty_lat = lat_max - (best_y + 0.5) * lat_step

        road_type = ROAD_TYPES.get(zone_name, "local")
        self._road_segments.append({
            "type": "Feature",
            "geometry": {
                "type": "LineString",
                "coordinates": [[cx, cy_lat], [tx, ty_lat]],
            },
            "properties": {
                "road_type": road_type,
                "congestion_pct": 0,
                "year": self.current_year,
                "from_zone": zone_name,
            },
        })

    def _seed_initial_zones(self):
        cx, cy = self.grid_size // 2, self.grid_size // 2
        seeds = [
            (cx, cy, "COM_OFFICE"), (cx + 1, cy, "COM_OFFICE"),
            (cx, cy + 1, "COM_RETAIL"), (cx - 1, cy, "TRANS_HUB"),
            (cx, cy - 1, "GREEN_PARK"), (cx + 2, cy, "RES_HIGH"),
            (cx - 2, cy, "RES_MED"), (cx, cy + 2, "RES_LOW"),
            (cx + 1, cy + 1, "MIX_USE"), (cx - 1, cy - 1, "EDU_SCHOOL"),
        ]
        for x, y, zone in seeds:
            if 0 <= x < self.grid_size and 0 <= y < self.grid_size:
                zone_id = ZONE_IDS.get(zone, 0)
                # Don't place in ECC-0 cells
                if self.ecc_map[y, x] > 0:
                    self.zone_grid[y, x] = zone_id
                    self.year_placed[(x, y)] = 0

    def _advance_metrics(self, zone_name: str):
        m = self.metrics
        if zone_name.startswith("RES"):
            m["population"] = m.get("population", 1_000_000) * 1.002
        if zone_name.startswith("COM"):
            m["gdp_per_capita"] = m.get("gdp_per_capita", 50000) * 1.001
        if zone_name.startswith("GREEN"):
            m["green_ratio"] = min(1.0, m.get("green_ratio", 0.15) + 0.002)
            m["aqi"] = max(20, m.get("aqi", 80) - 0.5)
        if zone_name == "TRANS_HUB":
            m["commute_minutes"] = max(10, m.get("commute_minutes", 35) - 0.3)

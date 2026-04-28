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


class CityExpansionEnv:
    """Gymnasium-compatible city expansion environment."""

    GRID_SIZE = 64
    OBS_CHANNELS = 8
    MAX_YEARS = 50

    def __init__(self, city_data: dict, scenario: str = "BALANCED_SUSTAINABLE"):
        self.city_data = city_data
        self.scenario = scenario
        self.grid_size = self.GRID_SIZE

        self.obs_builder = ObservationBuilder(self.grid_size)
        self.action_decoder = ActionDecoder(self.grid_size, NUM_ZONES)
        self.validator = ConstraintValidator(self.grid_size)
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

        self.zone_grid: np.ndarray = np.zeros((self.grid_size, self.grid_size), dtype=np.int32)
        self.metrics: dict = {}
        self.current_year: int = 0
        self._seed_initial_zones()

    def reset(self, seed: Optional[int] = None):
        self.zone_grid = np.zeros((self.grid_size, self.grid_size), dtype=np.int32)
        self.metrics = dict(self.city_data.get("initial_metrics", {}))
        self.current_year = 0
        self._seed_initial_zones()
        return self.obs_builder.build(self.zone_grid, self.metrics), {}

    def step(self, action):
        x, y, zone_id, connect_road = self.action_decoder.decode(action)
        zone_name = ID_TO_ZONE.get(zone_id, "EMPTY")

        valid = self.validator.is_valid(self.zone_grid, x, y, zone_name)
        if valid and zone_name != "EMPTY":
            self.zone_grid[y, x] = zone_id

        reward = self.reward_calc.compute(self.zone_grid, self.metrics, x, y, zone_name, valid)
        self._advance_metrics(zone_name)
        self.current_year += 1

        obs = self.obs_builder.build(self.zone_grid, self.metrics)
        done = self.current_year >= self.MAX_YEARS
        info = {"year": self.current_year, "zone": zone_name, "valid": valid, "reward": reward}
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
                self.zone_grid[y, x] = ZONE_IDS.get(zone, 0)

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

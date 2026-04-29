import numpy as np
from typing import Optional

ZONE_IDS = {
    "EMPTY": 0, "RES_LOW": 1, "RES_MED": 2, "RES_HIGH": 3,
    "COM_RETAIL": 4, "COM_OFFICE": 5, "IND_LIGHT": 6, "IND_HEAVY": 7,
    "MIX_USE": 8, "GREEN_PARK": 9, "GREEN_FOREST": 10,
    "HEALTH_CLINIC": 11, "HEALTH_HOSP": 12, "EDU_SCHOOL": 13, "EDU_UNIVERSITY": 14,
    "INFRA_POWER": 15, "INFRA_WATER": 16, "TRANS_HUB": 17, "TRANS_HIGHWAY": 18,
    "SAFETY_FIRE": 19, "SAFETY_POLICE": 20,
}

RESIDENTIAL_IDS = {ZONE_IDS["RES_LOW"], ZONE_IDS["RES_MED"], ZONE_IDS["RES_HIGH"]}
INDUSTRIAL_IDS = {ZONE_IDS["IND_LIGHT"], ZONE_IDS["IND_HEAVY"]}
EDUCATIONAL_IDS = {ZONE_IDS["EDU_SCHOOL"], ZONE_IDS["EDU_UNIVERSITY"]}
HEALTHCARE_IDS = {ZONE_IDS["HEALTH_CLINIC"], ZONE_IDS["HEALTH_HOSP"]}
TRANSIT_IDS = {ZONE_IDS["TRANS_HUB"], ZONE_IDS["TRANS_HIGHWAY"]}

# Zones treated as industrial for downwind rule
HEAVY_INDUSTRIAL = {"IND_HEAVY", "IND_LIGHT"}

# Grid cells are 500m each; convert meter distances to cell counts
M_PER_CELL = 500


def _cells(meters: int) -> int:
    return max(1, round(meters / M_PER_CELL))


def _min_dist_to_ids(zone_grid: np.ndarray, x: int, y: int, target_ids: set, radius: int) -> float:
    """Returns minimum Chebyshev-like Euclidean distance (in cells) to any cell in target_ids within radius."""
    n = zone_grid.shape[0]
    min_d = float("inf")
    for dy in range(-radius, radius + 1):
        for dx in range(-radius, radius + 1):
            nx, ny = x + dx, y + dy
            if 0 <= nx < n and 0 <= ny < n:
                if zone_grid[ny, nx] in target_ids:
                    d = (dx ** 2 + dy ** 2) ** 0.5
                    if d < min_d:
                        min_d = d
    return min_d * M_PER_CELL  # convert to meters


def _has_zone_within(zone_grid: np.ndarray, x: int, y: int, target_ids: set, radius_cells: int) -> bool:
    n = zone_grid.shape[0]
    for dy in range(-radius_cells, radius_cells + 1):
        for dx in range(-radius_cells, radius_cells + 1):
            nx, ny = x + dx, y + dy
            if 0 <= nx < n and 0 <= ny < n:
                if zone_grid[ny, nx] in target_ids:
                    return True
    return False


def _nearest_zone_in_direction(zone_grid: np.ndarray, x: int, y: int, target_ids: set, direction: str) -> bool:
    """Check if the cell is 'downwind' (south/southeast of residential for default south wind)."""
    n = zone_grid.shape[0]
    # Prevailing wind blows from north → industrial should be placed south of residential
    # Simplified: industrial is valid if it is south of any residential (y > res_y)
    for ry in range(n):
        for rx in range(n):
            if zone_grid[ry, rx] in RESIDENTIAL_IDS:
                # Industrial at (x,y) should have y >= ry (south of residential in screen coords)
                if y >= ry:
                    return True  # at least one residential is to the north → valid downwind
    return False  # no residential north of us, can't confirm downwind placement


class ConstraintValidator:
    """
    Validates zone placements against environmental, spatial, and zoning constraints.

    ecc_map: (grid_size, grid_size) int array, 0=protected … 5=priority.
             None → all cells treated as ECC-4 (standard buildable).
    flood_risk_map: (grid_size, grid_size) float32 array, 0.0–1.0.
                    None → use uniform low risk.
    prevailing_wind: 'N'|'S'|'E'|'W', default 'S' (wind blows south).
    """

    def __init__(
        self,
        grid_size: int,
        ecc_map: Optional[np.ndarray] = None,
        flood_risk_map: Optional[np.ndarray] = None,
        prevailing_wind: str = "S",
    ):
        self.grid_size = grid_size
        self.ecc_map = ecc_map
        self.flood_risk_map = flood_risk_map
        self.prevailing_wind = prevailing_wind

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def is_valid(self, zone_grid: np.ndarray, x: int, y: int, zone_type: str) -> bool:
        valid, _ = self.validate(zone_grid, x, y, zone_type)
        return valid

    def validate(self, zone_grid: np.ndarray, x: int, y: int, zone_type: str) -> tuple[bool, str]:
        if not (0 <= x < self.grid_size and 0 <= y < self.grid_size):
            return False, "Out of bounds"
        if zone_grid[y, x] != 0:
            return False, "Cell already developed"
        if zone_type == "EMPTY":
            return True, ""

        # --- ECC constraints ---
        if self.ecc_map is not None:
            ecc = int(self.ecc_map[y, x])
            if ecc == 0:
                return False, "ECC-0: permanently protected cell"
            if ecc == 1 and zone_type not in ("GREEN_PARK", "GREEN_FOREST", "EMPTY"):
                return False, "ECC-1: only conservation use allowed"

        # --- Flood risk constraints ---
        if self.flood_risk_map is not None:
            flood = float(self.flood_risk_map[y, x])
            if flood > 0.8:
                return False, "Extreme flood risk (>0.8)"
            if flood > 0.5 and zone_type in ("RES_HIGH", "RES_MED", "COM_OFFICE", "HEALTH_HOSP"):
                return False, "High flood risk: dense/critical use not allowed"

        # --- Zone-specific constraints ---
        ok, reason = self._zone_constraints(zone_grid, x, y, zone_type)
        if not ok:
            return False, reason

        return True, ""

    # ------------------------------------------------------------------
    # Per-zone constraint rules
    # ------------------------------------------------------------------

    def _zone_constraints(self, zone_grid: np.ndarray, x: int, y: int, zone_type: str) -> tuple[bool, str]:
        n = self.grid_size

        # Heavy industrial: 1 km buffer from residential
        if zone_type == "IND_HEAVY":
            if _has_zone_within(zone_grid, x, y, RESIDENTIAL_IDS, _cells(1000)):
                return False, "IND_HEAVY: must be ≥1 km from residential"
            if not _is_downwind(x, y, zone_grid, self.prevailing_wind, n):
                return False, "Industrial must be downwind of residential"

        # Light industrial: 500m buffer from residential
        if zone_type == "IND_LIGHT":
            if _has_zone_within(zone_grid, x, y, RESIDENTIAL_IDS, _cells(500)):
                return False, "IND_LIGHT: must be ≥500m from residential"
            if not _is_downwind(x, y, zone_grid, self.prevailing_wind, n):
                return False, "Industrial must be downwind of residential"

        # High-rise residential needs transit hub within 400m (≈1 cell)
        if zone_type == "RES_HIGH":
            if not _has_zone_within(zone_grid, x, y, RESIDENTIAL_IDS | {0}, 0) and \
               not _has_zone_within(zone_grid, x, y, TRANSIT_IDS, _cells(400)):
                return False, "RES_HIGH: no transit hub within 400m"
            if _has_zone_within(zone_grid, x, y, INDUSTRIAL_IDS, _cells(800)):
                return False, "RES_HIGH: too close to industrial zone"

        # Residential in general: buffer from heavy industrial
        if zone_type in ("RES_LOW", "RES_MED"):
            if _has_zone_within(zone_grid, x, y, {ZONE_IDS["IND_HEAVY"]}, _cells(1000)):
                return False, "Residential: must be ≥1 km from heavy industrial"

        # Hospital needs arterial access (transit or highway within 200m ≈ 1 cell)
        if zone_type == "HEALTH_HOSP":
            arterial_ids = {ZONE_IDS["TRANS_HUB"], ZONE_IDS["TRANS_HIGHWAY"]}
            if not _has_zone_within(zone_grid, x, y, arterial_ids, _cells(400)):
                return False, "HEALTH_HOSP: needs transit/arterial access within 400m"

        # Prison/Jail: away from educational and healthcare
        if zone_type in ("SAFETY_POLICE",):  # nearest analogue in our zone set
            if _has_zone_within(zone_grid, x, y, EDUCATIONAL_IDS, _cells(500)):
                return False, "SAFETY_POLICE: cannot be near schools"

        # University: needs transit access
        if zone_type == "EDU_UNIVERSITY":
            if not _has_zone_within(zone_grid, x, y, TRANSIT_IDS, _cells(800)):
                return False, "EDU_UNIVERSITY: needs transit access within 800m"

        # Large green/forest: only in lower ECC or edge areas
        if zone_type == "GREEN_FOREST":
            if self.ecc_map is not None:
                ecc = int(self.ecc_map[y, x])
                if ecc >= 5:
                    return False, "GREEN_FOREST: priority urban land should not be forestation"

        # Highway: can't be inside dense residential core
        if zone_type == "TRANS_HIGHWAY":
            res_count = sum(
                1 for dy in range(-2, 3) for dx in range(-2, 3)
                if 0 <= x + dx < n and 0 <= y + dy < n
                and zone_grid[y + dy, x + dx] in RESIDENTIAL_IDS
            )
            if res_count > 4:
                return False, "TRANS_HIGHWAY: too many adjacent residential cells"

        # Power plant: must not be adjacent to residential
        if zone_type == "INFRA_POWER":
            if _has_zone_within(zone_grid, x, y, RESIDENTIAL_IDS, _cells(300)):
                return False, "INFRA_POWER: must be ≥300m from residential"

        return True, ""


# ------------------------------------------------------------------
# Helper: is placement downwind of residential?
# ------------------------------------------------------------------

def _is_downwind(x: int, y: int, zone_grid: np.ndarray, wind: str, n: int) -> bool:
    """
    Returns True if there is no residential upwind of (x, y), OR if no residential exists.
    Wind direction is where wind blows TO (e.g., 'S' = wind blows southward → upwind is north).
    Industrial should be placed downwind (to the south if wind blows south).
    """
    if not np.any(np.isin(zone_grid, list(RESIDENTIAL_IDS))):
        return True  # no residential yet, no restriction

    # Upwind direction (where residential should NOT be relative to industrial)
    # Wind blows S → residential should be north (y < y_ind), industrial is south → valid
    # Wind blows N → residential should be south (y > y_ind), industrial is north → valid
    if wind == "S":
        # residential must be at higher y (north in grid, row 0 = north)
        return _any_residential_in_direction(zone_grid, x, y, n, dy_sign=-1)
    elif wind == "N":
        return _any_residential_in_direction(zone_grid, x, y, n, dy_sign=1)
    elif wind == "E":
        return _any_residential_in_direction(zone_grid, x, y, n, dx_sign=-1)
    elif wind == "W":
        return _any_residential_in_direction(zone_grid, x, y, n, dx_sign=1)
    return True


def _any_residential_in_direction(
    zone_grid: np.ndarray, x: int, y: int, n: int,
    dy_sign: int = 0, dx_sign: int = 0
) -> bool:
    """Check if any residential cell exists 'upwind' of (x, y)."""
    for ry in range(n):
        for rx in range(n):
            if zone_grid[ry, rx] not in RESIDENTIAL_IDS:
                continue
            if dy_sign < 0 and ry < y:
                return True
            if dy_sign > 0 and ry > y:
                return True
            if dx_sign < 0 and rx < x:
                return True
            if dx_sign > 0 and rx > x:
                return True
    return False

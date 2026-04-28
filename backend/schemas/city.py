from pydantic import BaseModel


class CityListItem(BaseModel):
    id: str
    name: str
    country: str
    flag: str = ""
    center_lat: float
    center_lng: float
    default_zoom: int
    population_current: int
    key_planning_challenge: str


class CityDetail(CityListItem):
    bounds: dict
    climate_zone: str
    gdp_per_capita: int
    urban_growth_rate: float
    expansion_constraint: str
    historical_snapshots: list[dict]
    initial_metrics: dict

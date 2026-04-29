from uuid import UUID

from pydantic import BaseModel, ConfigDict


class CityResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    slug: str
    name: str
    country: str
    center_lat: float
    center_lng: float
    default_zoom: int
    climate_zone: str
    population_current: int
    gdp_per_capita: float
    urban_growth_rate: float


class CityDataResponse(CityResponse):
    boundary_geojson: dict
    profile: dict

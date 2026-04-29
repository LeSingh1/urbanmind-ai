from pydantic import BaseModel


class StartSessionRequest(BaseModel):
    city_id: str
    scenario_id: str = "BALANCED_SUSTAINABLE"


class StartSessionResponse(BaseModel):
    session_id: str
    ws_url: str


class OverrideRequest(BaseModel):
    x: int
    y: int
    zone_type_id: str


class ScenarioChangeRequest(BaseModel):
    scenario_id: str


class ExportRequest(BaseModel):
    format: str = "json"

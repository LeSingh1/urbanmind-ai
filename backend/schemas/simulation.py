from pydantic import BaseModel


class StartSessionRequest(BaseModel):
    city_id: str
    scenario: str = "BALANCED_SUSTAINABLE"
    speed_multiplier: float = 1.0


class StartSessionResponse(BaseModel):
    session_id: str
    websocket_url: str


class OverrideRequest(BaseModel):
    x: int
    y: int
    zone_type: str


class ScenarioChangeRequest(BaseModel):
    scenario_id: str


class ExportRequest(BaseModel):
    format: str = "json"

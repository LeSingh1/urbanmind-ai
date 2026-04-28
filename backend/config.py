from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    app_name: str = "UrbanMind AI"
    debug: bool = False
    anthropic_api_key: str = ""
    redis_url: str = "redis://localhost:6379"
    cors_origins: list[str] = ["http://localhost:3000", "http://localhost:5173"]
    simulation_speed_default: float = 1.0
    claude_model: str = "claude-sonnet-4-20250514"
    explanation_cache_ttl: int = 86400  # 24 hours
    max_grid_rows: int = 64
    max_grid_cols: int = 64

    class Config:
        env_file = ".env"


settings = Settings()

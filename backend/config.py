from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "UrbanMind AI"
    debug: bool = False
    database_url: str = "postgresql+asyncpg://urbanmind:urbanmind@localhost/urbanmind"
    redis_url: str = "redis://localhost:6379/0"
    anthropic_api_key: str = ""
    mapbox_token: str = ""
    minio_endpoint: str = "minio:9000"
    minio_access_key: str = "minioadmin"
    minio_secret_key: str = "minioadmin"
    secret_key: str = "change-me-32-byte-hex-string-here"
    simulation_max_workers: int = 5
    ai_provider: str = "anthropic"
    cors_origins: list[str] = ["http://localhost:3000", "http://localhost:5173"]
    claude_model: str = "claude-3-5-sonnet-20240620"
    explanation_cache_ttl: int = 86400
    max_grid_rows: int = 64
    max_grid_cols: int = 64

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()

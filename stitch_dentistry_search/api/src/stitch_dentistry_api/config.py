from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class APISettings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_prefix="API_", extra="ignore")

    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = False
    database_url: str = "sqlite:///./local.db"
    billing_provider: str = "stripe"
    stripe_api_key: str | None = None
    stripe_price_id: str | None = None
    stripe_webhook_secret: str | None = None


@lru_cache

def get_settings() -> APISettings:
    return APISettings()

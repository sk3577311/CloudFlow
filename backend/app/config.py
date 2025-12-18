from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    DATABASE_URL: str
    REDIS_URL: str
    JWT_SECRET: str
    JWT_ALGORITHM: str
    API_KEY: str
    RUN_WORKER: bool = True
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str

    SLACK_WEBHOOK_URL: Optional[str] = None
    ADMIN_EMAIL: Optional[str] = None
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: Optional[int] = None
    SMTP_USER: Optional[str] = None
    SMTP_PASS: Optional[str] = None

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",  # 👈 allows extra vars like APP_VERSION safely
    )


settings = Settings()

from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str
    REDIS_URL: str
    JWT_SECRET: str
    JWT_ALGORITHM: str
    API_KEY: str
    RUN_WORKER: bool = True

    SLACK_WEBHOOK_URL: str | None = None
    ADMIN_EMAIL: str | None = None
    SMTP_HOST: str | None = None
    SMTP_PORT: int | None = None
    SMTP_USER: str | None = None
    SMTP_PASS: str | None = None

    class Config:
        env_file = ".env"

settings = Settings()

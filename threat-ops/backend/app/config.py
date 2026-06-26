from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@db:5432/tasks_db"
    S3_ENDPOINT: str = "http://minio:9000"
    S3_ACCESS_KEY: str = "minioadmin"
    S3_SECRET_KEY: str = "minioadmin"
    S3_BUCKET: str = "tasks"
    ANALYTICS_URL: str = "http://analytics:8001"
    INTERNAL_API_TOKEN: str = "dev-internal-token-change-me"
    ADMIN_USERNAME: str = "admin"
    ADMIN_PASSWORD: str = ""  

    class Config:
        env_file = ".env"


settings = Settings()

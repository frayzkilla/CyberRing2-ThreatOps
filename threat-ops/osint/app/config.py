from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    BACKEND_URL: str = "http://backend:8000"
    S3_ENDPOINT: str = "http://minio:9000"
    S3_ACCESS_KEY: str = "minioadmin"
    S3_SECRET_KEY: str = "minioadmin"
    S3_BUCKET: str = "tasks"

    class Config:
        env_file = ".env"


settings = Settings()

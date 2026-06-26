from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    VISHING_URL: str = "http://vishing:8002"
    OSINT_URL: str = "http://osint:8003"
    BACKEND_URL: str = "http://backend:8000"
    S3_ENDPOINT: str = "http://minio:9000"
    S3_ACCESS_KEY: str = "minioadmin"
    S3_SECRET_KEY: str = "minioadmin"
    S3_BUCKET: str = "tasks"

    class Config:
        env_file = ".env"


settings = Settings()

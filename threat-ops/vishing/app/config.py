from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    S3_ENDPOINT: str = "http://minio:9000"
    S3_ACCESS_KEY: str = "minioadmin"
    S3_SECRET_KEY: str = "minioadmin"
    S3_BUCKET: str = "tasks"
    FRAUD_THRESHOLD: float = 0.5

    class Config:
        env_file = ".env"


settings = Settings()

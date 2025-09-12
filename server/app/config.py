"""Application configuration using environment variables."""
from pydantic_settings import BaseSettings
from pydantic import Field

from typing import List


class Settings(BaseSettings):
    database_url: str = Field(..., alias="DATABASE_URL")
    jwt_secret: str = Field(..., alias="JWT_SECRET")
    jwt_expires_min: int = Field(60, alias="JWT_EXPIRES_MIN")
    model_source: str = Field(
        "speechbrain/spkrec-ecapa-voxceleb", alias="MODEL_SOURCE"
    )
    sample_rate: int = Field(16000, alias="SAMPLE_RATE")
    vector_dim: int = Field(192, alias="VECTOR_DIM")
    cors_origins: List[str] = Field(["*"], alias="CORS_ORIGINS")

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
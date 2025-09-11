from pydantic_settings import BaseSettings


class Settings(BaseSettings):
DATABASE_URL: str = "postgresql+psycopg2://postgres:postgres@localhost:5432/voiceid"
MODEL_SOURCE: str = "speechbrain/spkrec-ecapa-voxceleb"
SAMPLE_RATE: int = 16000
VECTOR_DIM: int = 192 # ECAPA-TDNN de SpeechBrain entrega 192 dims
CORS_ORIGINS: str = "*" # ajusta en prod


settings = Settings()
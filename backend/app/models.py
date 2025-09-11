from sqlalchemy import Column, String, Integer, DateTime, func
from pgvector.sqlalchemy import Vector
from .db import Base
from .config import settings


class UserVoice(Base):
__tablename__ = "user_voice"
id = Column(String, primary_key=True) # usa tu propio UUID/ID
name = Column(String, nullable=False)
embedding = Column(Vector(settings.VECTOR_DIM), nullable=False)
samples_count = Column(Integer, nullable=False, default=1)
updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
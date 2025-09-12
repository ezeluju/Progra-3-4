"""SQLAlchemy models."""
from datetime import datetime
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, Integer, DateTime
from pgvector.sqlalchemy import Vector

from .db import Base
from .config import settings


class UserVoice(Base):
    __tablename__ = "user_voice"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    embedding: Mapped[Vector] = mapped_column(Vector(settings.vector_dim), nullable=False)
    samples_count: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def update_embedding(self, new_emb):
        """Update embedding via incremental mean and renormalize."""
        import numpy as np

        count = self.samples_count
        avg = (self.embedding * count + new_emb) / (count + 1)
        norm = np.linalg.norm(avg)
        self.embedding = avg / (norm or 1.0)
        self.samples_count = count + 1
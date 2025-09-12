"""SQLAlchemy models."""
from __future__ import annotations

from datetime import datetime
from typing import List

import numpy as np
from sqlalchemy import String, Integer, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from pgvector.sqlalchemy import Vector

from .db import Base
from .config import settings


class UserVoice(Base):
    __tablename__ = "user_voice"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String, nullable=False)

    # Almacena el embedding como vector(pgvector) de dimensión fija
    # Nota: a nivel de tipos Python, guardaremos/leeremos como list[float]
    embedding: Mapped[List[float]] = mapped_column(
        Vector(settings.vector_dim), nullable=False
    )

    samples_count: Mapped[int] = mapped_column(Integer, default=1, nullable=False)

    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    # ---------- helpers ----------

    @staticmethod
    def _normalize_vec(vec: np.ndarray | List[float]) -> List[float]:
        """Devuelve una copia normalizada (L2=1) como list[float]."""
        v = np.asarray(vec, dtype=np.float32)
        n = float(np.linalg.norm(v))
        if n > 0:
            v = (v / n).astype(np.float32)
        return v.tolist()

    # ---------- API ----------

    def update_embedding(self, new_emb: np.ndarray | List[float]) -> None:
        """
        Promedia el embedding incrementalmente y re-normaliza.

        - Convierte todo a float32.
        - Verifica dimensión consistente.
        - Promedia: (cur*n + inc) / (n+1).
        - Renormaliza a norma 1 (cosine-ready).
        - Guarda como list[float] (pgvector lo acepta sin problemas).
        """
        cur = np.asarray(self.embedding, dtype=np.float32)
        inc = np.asarray(new_emb, dtype=np.float32)

        if cur.shape != inc.shape:
            raise ValueError(f"Dim mismatch: current {cur.shape} vs new {inc.shape}")

        n = int(self.samples_count or 0)
        avg = (cur * n + inc) / (n + 1)

        norm = float(np.linalg.norm(avg))
        if norm > 0:
            avg = (avg / norm).astype(np.float32)

        self.embedding = avg.tolist()
        self.samples_count = n + 1

    # (Opcional) representación útil para logs
    def __repr__(self) -> str:
        return f"UserVoice(id={self.id!r}, name={self.name!r}, samples={self.samples_count}, dim={len(self.embedding) if self.embedding else 0})"

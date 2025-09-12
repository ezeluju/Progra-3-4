# scripts/renormalize_embeddings.py
"""
Renormaliza (L2=1) todos los embeddings guardados en user_voice.
Útil si previamente se guardaron sin normalizar o con media incremental sin re-normalizar.
"""

from __future__ import annotations
import sys
import numpy as np

from app.db import SessionLocal
from app import models
from app.config import settings

def normalize_vec(vec):
    v = np.asarray(vec, dtype=np.float32)
    n = float(np.linalg.norm(v))
    if n > 0:
        v = (v / n).astype(np.float32)
    return v.tolist()

def main(dry_run: bool = False):
    total = 0
    changed = 0
    dim = settings.vector_dim

    with SessionLocal() as session:
        users = session.query(models.UserVoice).all()
        total = len(users)
        for u in users:
            if u.embedding is None:
                continue
            v = np.asarray(u.embedding, dtype=np.float32)

            if v.size == 0:
                print(f"[WARN] {u.id}: embedding vacío")
                continue

            if v.shape != (dim,):
                print(f"[WARN] {u.id}: dimensión {v.shape}, esperada {(dim,)} — se salta", file=sys.stderr)
                continue

            n = float(np.linalg.norm(v))
            if n == 0:
                print(f"[WARN] {u.id}: norma 0 — se salta", file=sys.stderr)
                continue

            if abs(n - 1.0) < 1e-4:
                # ya estaba normalizado
                continue

            u.embedding = normalize_vec(v)
            changed += 1

        if dry_run:
            session.rollback()
            print(f"[DRY RUN] Usuarios totales: {total} | Cambiados: {changed}")
        else:
            session.commit()
            print(f"[OK] Usuarios totales: {total} | Normalizados: {changed}")

if __name__ == "__main__":
    dry = "--dry-run" in sys.argv
    main(dry_run=dry)

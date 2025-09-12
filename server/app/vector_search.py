"""Vector similarity search utilities."""
from typing import List, Tuple
import numpy as np
from sqlalchemy import text

from .models import UserVoice


def search_top_k(session, embedding: np.ndarray, k: int = 3) -> List[Tuple[str, str, float]]:
    """Return top-K matches as (userId, name, score)."""
    try:
        rows = session.execute(
            text(
                """
                SELECT id, name, 1 - (embedding <=> :q) AS score
                FROM user_voice
                ORDER BY embedding <=> :q
                LIMIT :k
                """
            ),
            {"q": list(embedding), "k": k},
        ).all()
        return [(r.id, r.name, float(r.score)) for r in rows]
    except Exception:
        # Fallback: load all embeddings and compute cosine similarity in Python
        users = session.query(UserVoice).all()
        scores = []
        for u in users:
            emb = np.array(u.embedding)
            sim = float(np.dot(emb, embedding))
            scores.append((u.id, u.name, sim))
        scores.sort(key=lambda x: x[2], reverse=True)
        return scores[:k]
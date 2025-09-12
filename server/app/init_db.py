from sqlalchemy import text
from .db import Base, engine

def init_db() -> None:
    """Create database extension and tables."""
    # Use a transaction to ensure statements are committed
    with engine.begin() as conn:
        # Ensure pgvector extension is available
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        # Create all tables defined on the Base metadata
        Base.metadata.create_all(bind=conn)


if __name__ == "__main__":
    init_db()
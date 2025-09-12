CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS user_voice (
  id text primary key,
  name text not null,
  embedding vector(192) not null,
  samples_count int not null default 1,
  updated_at timestamptz not null default now()
);

CREATE INDEX IF NOT EXISTS idx_user_voice_embedding
ON user_voice USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- example top-K query
-- SELECT id, name, 1 - (embedding <=> :q) AS score
-- FROM user_voice
-- ORDER BY embedding <=> :q
-- LIMIT :k;

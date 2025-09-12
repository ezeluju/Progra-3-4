# VoiceID Server

FastAPI backend for speaker enrollment and voice login using SpeechBrain and pgvector.

## Setup

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Docker

```bash
docker build -t voiceid-api .
docker run --rm -p 8000:8000 --env-file .env voiceid-api
```

## Environment Variables

See `.env.example` for required variables.

## Database

Run the following SQL in Supabase:

```sql
create extension if not exists vector;

create table if not exists user_voice (
  id text primary key,
  name text not null,
  embedding vector(192) not null,
  samples_count int not null default 1,
  updated_at timestamptz not null default now()
);

create index if not exists idx_user_voice_embedding
on user_voice using ivfflat (embedding vector_cosine_ops)
with (lists = 100);

-- example top-K
SELECT id, name, 1 - (embedding <=> :q) AS score
FROM user_voice
ORDER BY embedding <=> :q
LIMIT :k;
```
# VoiceID Server

Backend en **FastAPI** para registro de usuarios por voz y login mediante comparación de *embeddings* de voz, utilizando **SpeechBrain** y **pgvector**.

---

## 🚀 Instalación y ejecución

### Entorno virtual

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
 👉 Para exponer el servidor fuera del PC host:
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 // <-- para entrar desde fuera del pc host.
```

### Docker

```bash
docker build -t voiceid-api .
docker run --rm -p 8000:8000 --env-file .env voiceid-api
```

## ⚙️ Variables de entorno

Variables necesarias en `.env.example` 

## 🗄️ Base de datos

Podés crear la base de datos ejecutando:

```bash
python app/init_db.py

```
        O
```bash
python -m app.init_db

```

Inicialización manual en Supabase (SQL) 

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
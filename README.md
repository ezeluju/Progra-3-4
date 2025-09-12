# VoiceID Monorepo

Speaker enrollment and authentication by voice using FastAPI and Expo.

## Structure

- `server/` – FastAPI backend
- `app/` – Expo React Native client

## Quick Start

1. **Database (Supabase):**
   Run the SQL from `server/README.md` to create the table and index.
2. **Backend:**
   See `server/README.md` for environment variables and run instructions.
3. **Client:**
   See `app/README.md` to start the Expo app.

## Curl Examples

```bash
# Enroll
curl -F "userId=alice" -F "name=Alice" -F "file=@sample.wav" http://localhost:8000/enroll

# Identify
curl -F "file=@sample.wav" -F "threshold=0.82" http://localhost:8000/identify

# Login by voice
curl -F "file=@sample.wav" -F "threshold=0.82" http://localhost:8000/login-by-voice
```

## Threshold

Similarity scores range from 0 to 1. Start with a threshold between **0.78–0.86** and adjust based on false accept/reject rates in your environment.
Comandos de backend

# 1) Crear DB y habilitar pgvector
createdb voiceid
psql -d voiceid -c "CREATE EXTENSION IF NOT EXISTS vector;"


# 2) Instalar dependencias (local)
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt


# 3) Correr
uvicorn app.main:app --reload --port 8000


# 4) (Opcional) Docker
docker build -t voiceid-api .
docker run --rm -p 8000:8000 --env-file .env voiceid-api



Pruebas con cURL



# Enrolar 3 veces a Ezequiel
echo "graba 5-7s a 16k" # usa cualquier WAV/M4A en pruebas
curl -F "userId=ezequiel" -F "name=Ezequiel" -F "file=@/ruta/voz1.wav" http://localhost:8000/enroll
curl -F "userId=ezequiel" -F "name=Ezequiel" -F "file=@/ruta/voz2.wav" http://localhost:8000/enroll
curl -F "userId=ezequiel" -F "name=Ezequiel" -F "file=@/ruta/voz3.wav" http://localhost:8000/enroll


# Identificar
curl -F "threshold=0.82" -F "top_k=3" -F "file=@/ruta/prueba.wav" http://localhost:8000/identify
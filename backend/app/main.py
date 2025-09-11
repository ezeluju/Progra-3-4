from fastapi import FastAPI, UploadFile, File, Form
CORSMiddleware,
allow_origins=settings.CORS_ORIGINS.split(","),
allow_credentials=True,
allow_methods=["*"],
allow_headers=["*"],
)


# ---- Startup: crea extensión y tabla
@app.on_event("startup")
def on_startup():
with engine.connect() as conn:
conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
conn.commit()
Base.metadata.create_all(bind=engine)


# ---- Helpers


def cos_sim(a: np.ndarray, b: np.ndarray) -> float:
return float(np.dot(a, b)) # ya normalizados


# ---- Endpoints


@app.post("/enroll")
async def enroll(
userId: str = Form(...),
name: str = Form(...),
file: UploadFile = File(...),
):
audio_bytes = await file.read()
emb = extractor.filebytes_to_embedding(audio_bytes)


with SessionLocal() as db:
uv = db.get(UserVoice, userId)
if uv is None:
uv = UserVoice(id=userId, name=name, embedding=emb.tolist(), samples_count=1)
db.add(uv)
else:
# average incremental simple
new_count = uv.samples_count + 1
old = np.array(uv.embedding, dtype=np.float32)
avg = (old * uv.samples_count + emb) / new_count
avg /= (np.linalg.norm(avg) + 1e-9)
uv.embedding = avg.tolist()
uv.samples_count = new_count
db.commit()
return {"ok": True}


@app.post("/identify", response_model=IdentifyResponse)
async def identify(
file: UploadFile = File(...),
threshold: float = Form(0.80),
top_k: int = Form(3),
):
audio_bytes = await file.read()
q = extractor.filebytes_to_embedding(audio_bytes)


with SessionLocal() as db:
# Recupera todos (para POC). Para escala: usa búsqueda vectorial en SQL con <=> y ORDER BY
users = db.execute(select(UserVoice)).scalars().all()
if not users:
return IdentifyResponse(match=False, score=-1.0)
scores = []
for u in users:
ref = np.array(u.embedding, dtype=np.float32)
s = cos_sim(q, ref)
scores.append((u, s))
scores.sort(key=lambda x: x[1], reverse=True)
best_u, best_s = scores[0]
top = [{"userId": u.id, "name": u.name, "score": float(s)} for u, s in scores[:top_k]]
if best_s >= threshold:
return IdentifyResponse(match=True, userId=best_u.id, name=best_u.name, score=float(best_s), topK=top)
return IdentifyResponse(match=False, score=float(best_s), topK=top)


@app.get("/health")
async def health():
return {"ok": True}
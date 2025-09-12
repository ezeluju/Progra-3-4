"""FastAPI application for voice identification."""
from typing import List

from fastapi import FastAPI, UploadFile, File, Form, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from .config import settings
from .db import get_session
from . import models
from .schemas import EnrollResponse, IdentifyResponse, IdentifyTopK, LoginResponse
from .audio import filebytes_to_embedding
from .vector_search import search_top_k
from .auth import create_jwt
from .init_db import init_db

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    """Initialize database on application startup."""
    init_db()



@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/enroll", response_model=EnrollResponse)
async def enroll(
    userId: str = Form(...),
    name: str = Form(...),
    file: UploadFile = File(...),
    session: Session = Depends(get_session),
):
    if file.content_type not in {"audio/wav", "audio/x-wav", "audio/m4a", "audio/mp4"}:
        raise HTTPException(400, "Unsupported audio type")
    data = await file.read()
    if len(data) > 5_000_000:
        raise HTTPException(400, "File too large")
    emb = filebytes_to_embedding(data)
    user = session.get(models.UserVoice, userId)
    if user:
        user.update_embedding(emb)
    else:
        user = models.UserVoice(id=userId, name=name, embedding=emb)
        session.add(user)
    session.commit()
    return EnrollResponse(id=user.id, name=user.name, samples_count=user.samples_count)


@app.post("/identify", response_model=IdentifyResponse)
async def identify(
    file: UploadFile = File(...),
    threshold: float = Form(0.82),
    top_k: int = Form(3),
    session: Session = Depends(get_session),
):
    data = await file.read()
    emb = filebytes_to_embedding(data)
    results = search_top_k(session, emb, top_k)
    match = False
    user_id = name = None
    score = None
    if results:
        user_id, name, score = results[0]
        match = score >= threshold
    topK = [IdentifyTopK(userId=u, name=n, score=s) for u, n, s in results]
    return IdentifyResponse(match=match, userId=user_id if match else None, name=name if match else None, score=score if match else None, topK=topK)


@app.post("/login-by-voice")
async def login_by_voice(
    file: UploadFile = File(...),
    threshold: float = Form(0.82),
    top_k: int = Form(3),
    session: Session = Depends(get_session),
):
    data = await file.read()
    emb = filebytes_to_embedding(data)
    results = search_top_k(session, emb, top_k)
    if results:
        user_id, name, score = results[0]
        if score >= threshold:
            token = create_jwt(user_id)
            return LoginResponse(token=token, userId=user_id, name=name, score=score)
    topK = [IdentifyTopK(userId=u, name=n, score=s) for u, n, s in results]
    return IdentifyResponse(match=False, topK=topK)
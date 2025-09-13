"""FastAPI application for voice identification."""
from typing import List, Optional

from fastapi import FastAPI, UploadFile, File, Form, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import traceback
from sqlalchemy.orm import Session
from uuid import uuid4

from .config import settings
from .db import get_session
from . import models
from .schemas import EnrollResponse, IdentifyResponse, IdentifyTopK, LoginResponse
from .audio import filebytes_to_embedding
from .vector_search import search_top_k
from .auth import create_jwt
from .init_db import init_db
import numpy as np


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

# ---------- helpers ----------
AUDIO_CT_ALLOWED = {
    "audio/wav", "audio/x-wav",
    "audio/m4a", "audio/mp4",  # m4a suele venir como audio/mp4
    "audio/aac", "audio/3gpp", "audio/3gpp2",
    "application/octet-stream",  # algunos RN envían esto
}

def _ok_content_type(ct: Optional[str]) -> bool:
    if not ct:
        return True
    if ct in AUDIO_CT_ALLOWED:
        return True
    if ct.startswith("audio/"):
        return True
    return False

MAX_BYTES = 5_000_000  # 5 MB

# ---------- endpoints ----------


@app.post("/debug/cosine-two")
async def cosine_two(a: UploadFile = File(...), b: UploadFile = File(...)):
    try:
        e1 = filebytes_to_embedding(await a.read())
        e2 = filebytes_to_embedding(await b.read())
        cos = float(np.dot(e1, e2))  # ya normalizamos en filebytes_to_embedding
        return {"cosine": cos}
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)

@app.post("/enroll", response_model=EnrollResponse)
async def enroll(
    userId: Optional[str] = Form(None),
    name: str = Form(...),
    file: UploadFile = File(...),
    session: Session = Depends(get_session),
):
    try:
        if not _ok_content_type(file.content_type):
            raise HTTPException(400, f"Unsupported content-type: {file.content_type}")

        data = await file.read()
        if not data:
            raise HTTPException(400, "Empty file")
        if len(data) > MAX_BYTES:
            raise HTTPException(400, "File too large")

        emb = filebytes_to_embedding(data)

        if not userId:
            userId = uuid4().hex

        user = session.get(models.UserVoice, userId)
        if user:
            user.update_embedding(emb)
        else:
            user = models.UserVoice(
                id=userId,
                name=name,
                embedding=models.UserVoice._normalize_vec(emb),  # 🔑 normalizar al crear
            )
            session.add(user)
        session.commit()

        return EnrollResponse(id=user.id, name=user.name, samples_count=user.samples_count)

    except HTTPException:
        raise
    except Exception as e:
        return JSONResponse(
            {"error": str(e), "traceback": traceback.format_exc()},
            status_code=500,
        )

@app.post("/identify", response_model=IdentifyResponse)
async def identify(
    file: UploadFile = File(...),
    threshold: float = Form(0.65),
    top_k: int = Form(3),
    session: Session = Depends(get_session),
):
    try:
        if not _ok_content_type(file.content_type):
            raise HTTPException(400, f"Unsupported content-type: {file.content_type}")

        data = await file.read()
        if not data:
            raise HTTPException(400, "Empty file")
        if len(data) > MAX_BYTES:
            raise HTTPException(400, "File too large")

        emb = filebytes_to_embedding(data)
        results = search_top_k(session, emb, top_k)

        match = False
        user_id = name = None
        score = None
        if results:
            user_id, name, score = results[0]
            match = score >= threshold

        topK = [IdentifyTopK(userId=u, name=n, score=s) for u, n, s in results]
        return IdentifyResponse(
            match=match,
            userId=user_id if match else None,
            name=name if match else None,
            score=score if match else None,
            topK=topK,
        )

    except HTTPException:
        raise
    except Exception as e:
        return JSONResponse(
            {"error": str(e), "traceback": traceback.format_exc()},
            status_code=500,
        )

@app.post("/login-by-voice")
async def login_by_voice(
    file: UploadFile = File(...),
    threshold: float = Form(0.65),
    top_k: int = Form(3),
    session: Session = Depends(get_session),
):
    try:
        if not _ok_content_type(file.content_type):
            raise HTTPException(400, f"Unsupported content-type: {file.content_type}")

        data = await file.read()
        if not data:
            raise HTTPException(400, "Empty file")
        if len(data) > MAX_BYTES:
            raise HTTPException(400, "File too large")

        emb = filebytes_to_embedding(data)
        results = search_top_k(session, emb, top_k)

        if results:
            user_id, name, score = results[0]
            if score >= threshold:
                token = create_jwt(user_id)
                return LoginResponse(token=token, userId=user_id, name=name, score=score)

        topK = [IdentifyTopK(userId=u, name=n, score=s) for u, n, s in results]
        return IdentifyResponse(match=False, topK=topK)

    except HTTPException:
        raise
    except Exception as e:
        return JSONResponse(
            {"error": str(e), "traceback": traceback.format_exc()},
            status_code=500,
        )

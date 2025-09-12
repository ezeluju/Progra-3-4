"""Audio utilities for extracting voice embeddings."""
import io
import os
import tempfile
import subprocess
import numpy as np
import torch
import soundfile as sf
import torchaudio
from torchaudio.functional import resample
from speechbrain.inference import EncoderClassifier

from .config import settings

_model: EncoderClassifier | None = None

def _get_model() -> EncoderClassifier:
    global _model
    if _model is None:
        _model = EncoderClassifier.from_hparams(
            source=settings.model_source,
            run_opts={"device": "cpu"},
        )
    return _model

# ---------- decodificadores ----------

def _decode_with_soundfile(file_bytes: bytes):
    """Intenta leer cualquier contenedor soportado por libsndfile (WAV/FLAC/etc)."""
    data, sr = sf.read(io.BytesIO(file_bytes), dtype="float32", always_2d=True)
    # a mono
    if data.shape[1] > 1:
        data = data.mean(axis=1, keepdims=True)
    wav = torch.from_numpy(data.T)  # (1, frames)
    return wav, sr

def _decode_with_ffmpeg(file_bytes: bytes, target_sr: int):
    """Convierte con ffmpeg a WAV mono 16k (o target_sr) y carga con torchaudio."""
    with tempfile.NamedTemporaryFile(suffix=".m4a", delete=False) as src:
        src.write(file_bytes)
        src.flush()
        src_path = src.name
    dst_path = src_path.rsplit(".", 1)[0] + ".wav"
    try:
        # -ac 1 mono, -ar target_sr resample, salida WAV PCM s16le
        subprocess.run(
            ["ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
             "-i", src_path, "-ac", "1", "-ar", str(target_sr), dst_path],
            check=True,
        )
        wav, sr = torchaudio.load(dst_path)  # ya debe venir mono a target_sr
        # garantizar shape (1, N)
        if wav.dim() == 1:
            wav = wav.unsqueeze(0)
        return wav, sr
    finally:
        for p in (src_path, dst_path):
            try:
                if os.path.exists(p):
                    os.remove(p)
            except Exception:
                pass

def _decode_audio_bytes(file_bytes: bytes, target_sr: int = 16000):
    """Primero intenta con soundfile; si no reconoce el formato (ej. m4a/aac), usa FFmpeg."""
    try:
        wav, sr = _decode_with_soundfile(file_bytes)
    except Exception as e_sf:
        # fallback robusto
        try:
            wav, sr = _decode_with_ffmpeg(file_bytes, target_sr)
            return wav, sr
        except Exception as e_ff:
            raise RuntimeError(
                f"Fallo al decodificar audio. soundfile: {e_sf}; ffmpeg: {e_ff}"
            )
    # resample si hace falta
    if sr != target_sr:
        wav = resample(wav, sr, target_sr)
        sr = target_sr
    return wav, sr

# ---------- preprocesado ----------

def _trim_silence(
    wav: torch.Tensor,
    frame_ms: int = 25,
    hop_ms: int = 10,
    rms_thresh: float = 0.005,
) -> torch.Tensor:
    """
    Recorta extremos con bajo nivel RMS.
    wav: (1, N) float32 en [-1, 1]
    """
    assert wav.dim() == 2 and wav.size(0) == 1, "wav debe ser (1, N)"
    sr = settings.sample_rate
    frame = max(1, int(sr * frame_ms / 1000))
    hop = max(1, int(sr * hop_ms / 1000))

    x = wav.squeeze(0)
    if x.numel() < frame:
        return wav

    # RMS por frames
    rms_vals = []
    for i in range(0, x.numel() - frame + 1, hop):
        window = x[i:i + frame]
        rms_vals.append(torch.sqrt((window**2).mean() + 1e-9))
    rms = torch.stack(rms_vals)

    idx = (rms > rms_thresh).nonzero().squeeze(-1)
    if idx.numel() == 0:
        return wav  # todo silencio, mejor no recortar
    start = int(idx[0].item() * hop)
    end = int(min(x.numel(), idx[-1].item() * hop + frame))
    trimmed = x[start:end].unsqueeze(0)
    return trimmed if trimmed.numel() > 0 else wav

# ---------- API principal ----------

def filebytes_to_embedding(file_bytes: bytes) -> np.ndarray:
    """Convert raw audio bytes to a normalized embedding."""
    wav, _ = _decode_audio_bytes(file_bytes, target_sr=settings.sample_rate)

    # seguridad: shape (1, N) y mono
    if wav.dim() == 1:
        wav = wav.unsqueeze(0)
    if wav.size(0) > 1:
        wav = wav.mean(dim=0, keepdim=True)

    # recorte de silencios
    wav = _trim_silence(wav)

    model = _get_model()
    with torch.no_grad():
        emb = model.encode_batch(wav).squeeze().cpu().numpy()

    # normalización L2
    norm = np.linalg.norm(emb)
    return emb / (norm or 1.0)

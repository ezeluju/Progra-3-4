"""Audio utilities for extracting voice embeddings."""
import io
from typing import Tuple

import numpy as np
import torch
import torchaudio
from speechbrain.pretrained import EncoderClassifier

from .config import settings


_model: EncoderClassifier | None = None


def _get_model() -> EncoderClassifier:
    global _model
    if _model is None:
        _model = EncoderClassifier.from_hparams(source=settings.model_source, run_opts={"device": "cpu"})
    return _model


def filebytes_to_embedding(file_bytes: bytes) -> np.ndarray:
    """Convert raw audio bytes to a normalized embedding."""
    waveform, sr = torchaudio.load(io.BytesIO(file_bytes))
    if sr != settings.sample_rate:
        waveform = torchaudio.functional.resample(waveform, sr, settings.sample_rate)
    if waveform.shape[0] > 1:
        waveform = torch.mean(waveform, dim=0, keepdim=True)
    model = _get_model()
    with torch.no_grad():
        emb = model.encode_batch(waveform).squeeze().cpu().numpy()
    norm = np.linalg.norm(emb)
    return emb / (norm or 1.0)
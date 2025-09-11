import io
import numpy as np
import torch
import torchaudio
from speechbrain.pretrained import EncoderClassifier
from .config import settings


class EmbeddingExtractor:
def __init__(self):
self.device = "cpu" if not torch.cuda.is_available() else "cuda"
self.model = EncoderClassifier.from_hparams(
source=settings.MODEL_SOURCE,
run_opts={"device": self.device},
)


def filebytes_to_embedding(self, file_bytes: bytes) -> np.ndarray:
wav, sr = torchaudio.load(io.BytesIO(file_bytes))
if wav.shape[0] > 1:
wav = wav.mean(dim=0, keepdim=True) # mono
if sr != settings.SAMPLE_RATE:
wav = torchaudio.functional.resample(wav, sr, settings.SAMPLE_RATE)
with torch.no_grad():
emb = self.model.encode_batch(wav).squeeze().cpu().numpy()
# normaliza para usar coseno = dot
emb = emb / (np.linalg.norm(emb) + 1e-9)
return emb.astype(np.float32)


extractor = EmbeddingExtractor()
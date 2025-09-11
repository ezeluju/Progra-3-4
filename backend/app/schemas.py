from pydantic import BaseModel


class IdentifyResponse(BaseModel):
match: bool
userId: str | None = None
name: str | None = None
score: float
topK: list[dict] | None = None
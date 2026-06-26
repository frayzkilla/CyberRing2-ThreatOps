from fastapi import FastAPI

from app.schemas import VishingRequest, VishingResponse
from app import analyzer

app = FastAPI(title="Vishing Analysis Service")


@app.post("/analyze", response_model=VishingResponse)
async def analyze(request: VishingRequest) -> VishingResponse:
    is_fraud, score = await analyzer.analyze(request.description, request.file_key)
    return VishingResponse(vishing_response=is_fraud, score=score)


@app.get("/health")
async def health():
    return {"status": "ok"}

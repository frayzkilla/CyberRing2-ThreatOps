from fastapi import FastAPI

from app.schemas import OsintRequest, OsintResponse
from app import collector

app = FastAPI(title="OSINT Collection Service")


@app.post("/analyze", response_model=OsintResponse)
async def analyze(request: OsintRequest) -> OsintResponse:
    comments = await collector.collect(
        request.task_id,
        request.description,
        request.file_key,
        request.vishing_result,
    )
    return OsintResponse(comments=comments)


@app.get("/health")
async def health():
    return {"status": "ok"}

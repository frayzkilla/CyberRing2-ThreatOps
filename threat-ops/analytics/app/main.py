from fastapi import FastAPI, BackgroundTasks

from app.schemas import AnalyticsRequest
from app import router as analytics_router

app = FastAPI(title="Analytics Service")


@app.post("/analyze", status_code=202)
async def analyze(request: AnalyticsRequest, background_tasks: BackgroundTasks):
    """Accept task and process asynchronously."""
    background_tasks.add_task(analytics_router.process, request)
    return {"status": "accepted", "task_id": request.task_id}


@app.get("/health")
async def health():
    return {"status": "ok"}

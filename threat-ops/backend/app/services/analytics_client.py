import httpx

from app.config import settings
from app.schemas import AnalyticsRequest


async def send_for_analysis(payload: AnalyticsRequest) -> None:
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(
            f"{settings.ANALYTICS_URL}/analyze",
            json=payload.model_dump(),
        )
        resp.raise_for_status()

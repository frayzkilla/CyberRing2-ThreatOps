import httpx

from app.config import settings
from app.schemas import VishingRequest, VishingResponse


async def analyze(payload: VishingRequest) -> VishingResponse:
    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.post(
            f"{settings.VISHING_URL}/analyze",
            json=payload.model_dump(),
        )
        resp.raise_for_status()
        return VishingResponse(**resp.json())

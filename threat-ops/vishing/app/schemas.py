from pydantic import BaseModel


class VishingRequest(BaseModel):
    task_id: int
    description: str | None
    file_key: str | None


class VishingResponse(BaseModel):
    vishing_response: bool
    score: float

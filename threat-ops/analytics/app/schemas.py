from pydantic import BaseModel


class AnalyticsRequest(BaseModel):
    task_id: int
    label: str
    description: str | None
    priority: int
    file_key: str | None
    comments: str | None


class VishingRequest(BaseModel):
    task_id: int
    description: str | None
    file_key: str | None


class VishingResponse(BaseModel):
    vishing_response: bool


class OsintRequest(BaseModel):
    task_id: int
    description: str | None
    file_key: str | None
    vishing_result: bool | None = None


class OsintResponse(BaseModel):
    comments: str


class BackendCallback(BaseModel):
    task_id: int
    vishing_result: bool | None
    osint_comments: str | None
    report_key: str | None

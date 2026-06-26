from pydantic import BaseModel


class OsintRequest(BaseModel):
    task_id: int
    description: str | None
    file_key: str | None
    vishing_result: bool | None = None


class OsintResponse(BaseModel):
    comments: str


class IndicatorUpsertItem(BaseModel):
    type: str
    value: str
    display_value: str


class IndicatorSummary(BaseModel):
    type: str
    display_value: str
    seen_count: int
    suspicious_hits: int
    repeated: bool
    possible_fraud: bool


class IndicatorUpsertRequest(BaseModel):
    indicators: list[IndicatorUpsertItem]
    vishing_result: bool | None = None


class IndicatorUpsertResponse(BaseModel):
    indicators: list[IndicatorSummary]

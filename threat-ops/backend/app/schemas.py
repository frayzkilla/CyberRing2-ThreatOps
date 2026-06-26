from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=64)
    password: str = Field(..., min_length=4, max_length=128)


class PasswordChangeRequest(BaseModel):
    old_password: str = Field(..., min_length=4, max_length=128)
    new_password: str = Field(..., min_length=4, max_length=128)


class MessageResponse(BaseModel):
    message: str


class UserResponse(BaseModel):
    id: int
    username: str
    token: str
    is_admin: bool = False

    class Config:
        from_attributes = True


class TaskCreate(BaseModel):
    title: str = Field(..., max_length=255)
    label: str = Field(..., min_length=1, max_length=1, description="'p' for vishing, any other for osint")
    description: str | None = None
    priority: int = Field(default=0, ge=0, le=127)
    comments: str | None = Field(None, max_length=255)
    visibility: str = Field("private", pattern="^(public|private)$")


class TaskStatusUpdate(BaseModel):
    status: Literal["in_progress", "confirmed"]


class TaskResponse(BaseModel):
    id: int
    title: str
    label: str
    description: str | None
    priority: int
    file_key: str | None
    comments: str | None
    status: str
    visibility: str
    owner_id: int | None
    vishing_result: bool | None
    osint_comments: str | None
    report_key: str | None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AnalyticsRequest(BaseModel):
    task_id: int
    label: str
    description: str | None
    priority: int
    file_key: str | None
    comments: str | None


class AnalyticsCallback(BaseModel):
    task_id: int
    vishing_result: bool | None
    osint_comments: str | None
    report_key: str | None


class IndicatorUpsertItem(BaseModel):
    type: Literal["phone", "email", "inn"]
    value: str
    display_value: str


class IndicatorSummary(BaseModel):
    type: Literal["phone", "email", "inn"]
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

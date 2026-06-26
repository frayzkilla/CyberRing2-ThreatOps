import json
import uuid

import aioboto3
import httpx

from app.config import settings
from app.clients import vishing_client, osint_client
from app.schemas import (
    AnalyticsRequest,
    VishingRequest,
    OsintRequest,
    BackendCallback,
)

_s3_session = aioboto3.Session(
    aws_access_key_id=settings.S3_ACCESS_KEY,
    aws_secret_access_key=settings.S3_SECRET_KEY,
)


async def _upload_report(task_id: int, data: dict) -> str:
    key = f"reports/task_{task_id}_{uuid.uuid4().hex[:8]}.json"
    async with _s3_session.client("s3", endpoint_url=settings.S3_ENDPOINT) as s3:
        await s3.put_object(
            Bucket=settings.S3_BUCKET,
            Key=key,
            Body=json.dumps(data, ensure_ascii=False, indent=2).encode(),
            ContentType="application/json",
        )
    return key


async def _send_callback(callback: BackendCallback) -> None:
    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.post(
            f"{settings.BACKEND_URL}/tasks/callback",
            json=callback.model_dump(),
        )
        resp.raise_for_status()


async def process(request: AnalyticsRequest) -> None:
    vishing_result: bool | None = None
    osint_comments: str | None = None

    if request.label == "p":
        v_resp = await vishing_client.analyze(
            VishingRequest(
                task_id=request.task_id,
                description=request.description,
                file_key=request.file_key,
            )
        )
        vishing_result = v_resp.vishing_response

        if vishing_result:
            o_resp = await osint_client.analyze(
                OsintRequest(
                    task_id=request.task_id,
                    description=request.description,
                    file_key=request.file_key,
                    vishing_result=vishing_result,
                )
            )
            osint_comments = o_resp.comments
    else:
        o_resp = await osint_client.analyze(
            OsintRequest(
                task_id=request.task_id,
                description=request.description,
                file_key=request.file_key,
                vishing_result=None,
            )
        )
        osint_comments = o_resp.comments

    report = {
        "task_id": request.task_id,
        "label": request.label,
        "vishing_result": vishing_result,
        "osint_comments": osint_comments,
    }
    report_key = await _upload_report(request.task_id, report)

    await _send_callback(
        BackendCallback(
            task_id=request.task_id,
            vishing_result=vishing_result,
            osint_comments=osint_comments,
            report_key=report_key,
        )
    )

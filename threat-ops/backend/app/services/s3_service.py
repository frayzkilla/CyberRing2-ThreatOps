import hashlib
import time

import aioboto3
from botocore.exceptions import ClientError

from app.config import settings

_session = aioboto3.Session(
    aws_access_key_id=settings.S3_ACCESS_KEY,
    aws_secret_access_key=settings.S3_SECRET_KEY,
)


async def ensure_bucket():
    async with _session.client("s3", endpoint_url=settings.S3_ENDPOINT) as s3:
        try:
            await s3.head_bucket(Bucket=settings.S3_BUCKET)
        except ClientError:
            await s3.create_bucket(Bucket=settings.S3_BUCKET)


def _make_file_key(task_id: int, filename: str) -> str:
    ts = int(time.time())
    raw = f"{task_id}{ts}"
    digest = hashlib.md5(raw.encode()).hexdigest()
    return f"uploads/{digest}/{filename}"


async def upload_file(file_bytes: bytes, filename: str, task_id: int,
                      content_type: str = "application/octet-stream") -> str:
    key = _make_file_key(task_id, filename)
    async with _session.client("s3", endpoint_url=settings.S3_ENDPOINT) as s3:
        await s3.put_object(
            Bucket=settings.S3_BUCKET,
            Key=key,
            Body=file_bytes,
            ContentType=content_type,
        )
    return key


async def upload_report(task_id: int, content: str) -> str:
    key = f"reports/task_{task_id}.json"
    async with _session.client("s3", endpoint_url=settings.S3_ENDPOINT) as s3:
        await s3.put_object(
            Bucket=settings.S3_BUCKET,
            Key=key,
            Body=content.encode(),
            ContentType="application/json",
        )
    return key


async def get_presigned_url(key: str, expires_in: int = 3600) -> str:
    async with _session.client("s3", endpoint_url=settings.S3_ENDPOINT) as s3:
        url = await s3.generate_presigned_url(
            "get_object",
            Params={"Bucket": settings.S3_BUCKET, "Key": key},
            ExpiresIn=expires_in,
        )
    return url


async def download_file(key: str) -> bytes:
    async with _session.client("s3", endpoint_url=settings.S3_ENDPOINT) as s3:
        resp = await s3.get_object(Bucket=settings.S3_BUCKET, Key=key)
        return await resp["Body"].read()

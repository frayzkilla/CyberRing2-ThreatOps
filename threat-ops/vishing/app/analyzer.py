import re

import aioboto3

from app.config import settings

_s3_session = aioboto3.Session(
    aws_access_key_id=settings.S3_ACCESS_KEY,
    aws_secret_access_key=settings.S3_SECRET_KEY,
)


_FRAUD_KEYWORDS: list[tuple[str, float]] = [
    (r"сбербанк|sberbank", 0.15),
    (r"служб[аы] безопасности", 0.20),
    (r"карт[аы]|card", 0.10),
    (r"cvv|cvc|пин.?код|pin", 0.25),
    (r"перевод|transfer", 0.10),
    (r"заблокир|blocked|block", 0.15),
    (r"подозрительн|suspicious", 0.10),
    (r"верифика|verif", 0.10),
    (r"срочно|urgent|asap", 0.10),
    (r"лотере|lottery|выигр|prize", 0.20),
    (r"код из смс|sms.?code|otp", 0.30),
]


async def _fetch_file_text(file_key: str) -> str:
    try:
        async with _s3_session.client("s3", endpoint_url=settings.S3_ENDPOINT) as s3:
            resp = await s3.get_object(Bucket=settings.S3_BUCKET, Key=file_key)
            data = await resp["Body"].read()
        return data.decode("utf-8", errors="ignore")
    except Exception:
        return ""


def _score_text(text: str) -> float:
    text_lower = text.lower()
    score = 0.0
    for pattern, weight in _FRAUD_KEYWORDS:
        if re.search(pattern, text_lower):
            score += weight
    return min(score, 1.0)


async def analyze(description: str | None, file_key: str | None) -> tuple[bool, float]:
    combined = description or ""

    if file_key:
        file_text = await _fetch_file_text(file_key)
        combined = f"{combined}\n{file_text}"

    score = _score_text(combined)
    is_fraud = score >= settings.FRAUD_THRESHOLD
    return is_fraud, round(score, 4)

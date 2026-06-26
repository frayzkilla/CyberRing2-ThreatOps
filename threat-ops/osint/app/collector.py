import re

import aioboto3
import httpx

from app.config import settings
from app.phishing import PhishingAssessment, assess_urls
from app.schemas import IndicatorUpsertItem, IndicatorUpsertRequest, IndicatorUpsertResponse

_s3_session = aioboto3.Session(
    aws_access_key_id=settings.S3_ACCESS_KEY,
    aws_secret_access_key=settings.S3_SECRET_KEY,
)

_RE_PHONE = re.compile(r"(?:\+7|8)[\s\-]?\(?\d{3}\)?[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}")
_RE_EMAIL = re.compile(r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}")
_RE_URL = re.compile(r"https?://[^\s\"'<>]+")
_RE_INN = re.compile(r"\b\d{10}(?:\d{2})?\b")


async def _fetch_file_text(file_key: str) -> str:
    try:
        async with _s3_session.client("s3", endpoint_url=settings.S3_ENDPOINT) as s3:
            resp = await s3.get_object(Bucket=settings.S3_BUCKET, Key=file_key)
            data = await resp["Body"].read()
        return data.decode("utf-8", errors="ignore")
    except Exception:
        return ""


def _normalize_phone(phone: str) -> str:
    digits = re.sub(r"\D", "", phone)
    if digits.startswith("8") and len(digits) == 11:
        digits = "7" + digits[1:]
    return digits


def _normalize_email(email: str) -> str:
    return email.strip().lower()


def _normalize_inn(inn: str) -> str:
    return inn.strip()


async def _fetch_urls(urls: list[str]) -> dict[str, str]:
    results: dict[str, str] = {}
    async with httpx.AsyncClient(timeout=5.0, follow_redirects=True) as client:
        for url in urls[:5]:
            try:
                resp = await client.get(url)
                results[url] = resp.text[:2000]
            except Exception as e:
                detail = str(e) or e.__class__.__name__
                results[url] = f"[error: {detail}]"
    return results


async def _sync_indicators(
    entities: dict[str, list[str]],
    vishing_result: bool | None,
) -> list:
    indicators: list[IndicatorUpsertItem] = []

    for phone in entities["phones"]:
        indicators.append(
            IndicatorUpsertItem(
                type="phone",
                value=_normalize_phone(phone),
                display_value=phone,
            )
        )
    for email in entities["emails"]:
        indicators.append(
            IndicatorUpsertItem(
                type="email",
                value=_normalize_email(email),
                display_value=email,
            )
        )
    for inn in entities["inn_numbers"]:
        indicators.append(
            IndicatorUpsertItem(
                type="inn",
                value=_normalize_inn(inn),
                display_value=inn,
            )
        )

    if not indicators:
        return []

    try:
        payload = IndicatorUpsertRequest(
            indicators=indicators,
            vishing_result=vishing_result,
        )
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                f"{settings.BACKEND_URL}/internal/osint/indicators",
                json=payload.model_dump(),
            )
            resp.raise_for_status()
        return IndicatorUpsertResponse(**resp.json()).indicators
    except Exception:
        return []


def _extract_entities(text: str) -> dict[str, list[str]]:
    return {
        "phones": list(set(_RE_PHONE.findall(text))),
        "emails": list(set(_RE_EMAIL.findall(text))),
        "urls": list(set(_RE_URL.findall(text))),
        "inn_numbers": list(set(_RE_INN.findall(text))),
    }


def _build_report(
    entities: dict,
    fetched_urls: dict[str, str],
    phishing_assessments: list[PhishingAssessment],
    indicator_history: list,
    vishing_result: bool | None,
) -> str:
    lines: list[str] = []

    if vishing_result is True:
        lines.append("[!] Vishing confirmed. OSINT collected for deeper analysis.")
    elif vishing_result is False:
        lines.append("[i] Vishing not detected. OSINT collected in standard mode.")
    else:
        lines.append("[i] OSINT collected without prior vishing validation.")

    lines.append("")

    for entity_type, values in entities.items():
        if values:
            label = {
                "phones": "Phones",
                "emails": "Emails",
                "urls": "URLs",
                "inn_numbers": "INN",
            }.get(entity_type, entity_type)
            lines.append(f"{label}:")
            for value in values:
                lines.append(f"  - {value}")
            lines.append("")

    if phishing_assessments:
        lines.append("Phishing site assessment:")
        for item in phishing_assessments:
            lines.append(f"  - {item.url}")
            lines.append(f"    risk: {item.risk} ({item.score:.2f})")
            lines.append("    reasons:")
            for reason in item.reasons:
                lines.append(f"      - {reason}")
        lines.append("")

    if fetched_urls:
        lines.append("Fetched URL contents:")
        for url, content in fetched_urls.items():
            lines.append(f"\n  [{url}]")
            lines.append(f"  {content}")
        lines.append("")

    repeated_any = False
    if indicator_history:
        lines.append("Indicator history:")
        for item in indicator_history:
            if item.repeated:
                repeated_any = True
                lines.append(
                    f"  - {item.display_value}: seen {item.seen_count} times in the system"
                )
                if item.type == "phone":
                    lines.append("    Possible repeated fraud pattern for this phone number.")
        if not repeated_any:
            lines.append("  - No repeated indicators found in prior analyses.")
        lines.append("")

    if not any(entities.values()) and not fetched_urls and not indicator_history:
        lines.append("No identifiable entities found.")

    return "\n".join(lines).strip()


async def collect(
    task_id: int,
    description: str | None,
    file_key: str | None,
    vishing_result: bool | None,
) -> str:
    del task_id 

    combined = description or ""
    if file_key:
        file_text = await _fetch_file_text(file_key)
        combined = f"{combined}\n{file_text}"

    entities = _extract_entities(combined)
    indicator_history = await _sync_indicators(entities, vishing_result)

    fetched = await _fetch_urls(entities["urls"]) if entities["urls"] else {}
    phishing_assessments = assess_urls(fetched) if fetched else []

    return _build_report(
        entities,
        fetched,
        phishing_assessments,
        indicator_history,
        vishing_result,
    )

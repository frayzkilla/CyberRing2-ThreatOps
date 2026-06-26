from __future__ import annotations

import re
from dataclasses import dataclass
from urllib.parse import urlparse


@dataclass(frozen=True)
class PhishingAssessment:
    url: str
    risk: str
    score: float
    reasons: list[str]


_BRAND_TERMS = (
    "sber",
    "sberbank",
    "tinkoff",
    "alfabank",
    "vtb",
    "gosuslugi",
    "paypal",
    "apple",
    "google",
    "microsoft",
    "steam",
    "telegram",
    "whatsapp",
)

_SENSITIVE_TERMS = (
    "login",
    "signin",
    "verify",
    "verification",
    "secure",
    "account",
    "password",
    "wallet",
    "bonus",
    "prize",
    "payment",
    "bank",
    "card",
    "otp",
    "cvv",
    "cvc",
    "pin",
    "\u043f\u0430\u0440\u043e\u043b",
    "\u0432\u043e\u0439\u0442\u0438",
    "\u043f\u043e\u0434\u0442\u0432\u0435\u0440\u0434",
    "\u043a\u0430\u0440\u0442\u0430",
    "\u0431\u0430\u043d\u043a",
    "\u043a\u043e\u0434",
)

_HIGH_RISK_TLDS = {"zip", "mov", "top", "xyz", "click", "monster", "quest", "work"}
_IP_HOST_RE = re.compile(r"^\d{1,3}(?:\.\d{1,3}){3}$")
_PASSWORD_FIELD_RE = re.compile(r"<input[^>]+type\s*=\s*[\"']?password", re.I)
_FORM_RE = re.compile(r"<form\b", re.I)
_TITLE_RE = re.compile(r"<title[^>]*>(.*?)</title>", re.I | re.S)


def _risk_from_score(score: float) -> str:
    if score >= 0.75:
        return "high"
    if score >= 0.4:
        return "medium"
    if score >= 0.18:
        return "low"
    return "minimal"


def _add(reasons: list[str], reason: str, score: float, weight: float) -> float:
    reasons.append(reason)
    return score + weight


def assess_url(url: str, content: str) -> PhishingAssessment:
    parsed = urlparse(url)
    host = (parsed.hostname or "").lower()
    full_url = url.lower()
    html = content.lower()
    reasons: list[str] = []
    score = 0.0
    fetch_failed = content.startswith("[error:")

    if parsed.scheme == "http":
        score = _add(reasons, "plain HTTP is used for a web target", score, 0.12)

    if host.startswith("xn--"):
        score = _add(reasons, "punycode hostname may indicate lookalike domain", score, 0.22)

    if _IP_HOST_RE.match(host):
        score = _add(reasons, "IP address is used instead of a domain name", score, 0.18)

    labels = [part for part in host.split(".") if part]
    if len(labels) >= 4:
        score = _add(reasons, "deep subdomain chain can hide the real domain", score, 0.12)

    if host.count("-") >= 2:
        score = _add(reasons, "hostname contains several hyphens", score, 0.08)

    tld = labels[-1] if labels else ""
    if tld in _HIGH_RISK_TLDS:
        score = _add(reasons, f"high-abuse top-level domain .{tld}", score, 0.14)

    brand_hits = [term for term in _BRAND_TERMS if term in full_url]
    sensitive_hits = [term for term in _SENSITIVE_TERMS if term in full_url or term in html]

    if brand_hits and sensitive_hits:
        score = _add(
            reasons,
            "brand-like term appears together with login/payment language",
            score,
            0.28,
        )
    elif sensitive_hits:
        score = _add(reasons, "login/payment verification language detected", score, 0.14)

    if _PASSWORD_FIELD_RE.search(content):
        score = _add(reasons, "password input field detected in page HTML", score, 0.3)
    elif _FORM_RE.search(content) and sensitive_hits:
        score = _add(reasons, "form detected near sensitive wording", score, 0.16)

    title_match = _TITLE_RE.search(content)
    if title_match:
        title = re.sub(r"\s+", " ", title_match.group(1)).strip().lower()
        if any(term in title for term in _SENSITIVE_TERMS):
            score = _add(reasons, "page title contains sensitive account wording", score, 0.1)

    if "window.location" in html or "http-equiv=\"refresh\"" in html:
        score = _add(reasons, "client-side redirect pattern detected", score, 0.1)

    if fetch_failed:
        score = _add(reasons, "page content was unavailable, so the verdict is based on the URL only", score, 0.03)

    score = min(score, 1.0)
    if fetch_failed and len(reasons) == 1:
        reasons.append("the domain itself does not look suspicious from its name alone")
    elif not reasons:
        reasons.append("no common phishing indicators detected")

    return PhishingAssessment(
        url=url,
        risk=_risk_from_score(score),
        score=round(score, 2),
        reasons=reasons[:6],
    )


def assess_urls(fetched_urls: dict[str, str]) -> list[PhishingAssessment]:
    return [assess_url(url, content) for url, content in fetched_urls.items()]

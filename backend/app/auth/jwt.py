"""JWT の発行・検証。設計: docs/05-auth-and-invitation.md."""
from datetime import datetime, timedelta, timezone
from typing import Any

import jwt
from jwt import PyJWLError

from app.auth.constants import TOKEN_TYPE_ACCESS, TOKEN_TYPE_REFRESH
from app.config import get_settings

ALGORITHM = "HS256"


def _now_utc() -> datetime:
    return datetime.now(timezone.utc)


def create_access_token(
    user_id: str,
    organization_id: str | None,
    role: str | None,
    system_role: str | None,
    token_version: int,
) -> str:
    settings = get_settings()
    now = _now_utc()
    exp = now + timedelta(minutes=settings.jwt_access_expire_minutes)
    payload = {
        "sub": user_id,
        "organization_id": organization_id,
        "role": role,
        "system_role": system_role,
        "token_version": token_version,
        "type": TOKEN_TYPE_ACCESS,
        "iat": int(now.timestamp()),
        "exp": int(exp.timestamp()),
    }
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=ALGORITHM)


def create_refresh_token(
    user_id: str,
    token_version: int,
) -> str:
    settings = get_settings()
    now = _now_utc()
    exp = now + timedelta(days=settings.jwt_refresh_expire_days)
    payload = {
        "sub": user_id,
        "token_version": token_version,
        "type": TOKEN_TYPE_REFRESH,
        "iat": int(now.timestamp()),
        "exp": int(exp.timestamp()),
    }
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=ALGORITHM)


def decode_token(token: str) -> dict[str, Any] | None:
    settings = get_settings()
    if not settings.jwt_secret_key:
        return None
    try:
        return jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=[ALGORITHM],
        )
    except PyJWLError:
        return None

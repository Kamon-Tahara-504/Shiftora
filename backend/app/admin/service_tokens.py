"""サービス発行トークンの検証・消費。"""
from datetime import datetime, timezone
from typing import Any

from app.db import get_supabase

SERVICE_TOKEN_PURPOSE_CREATE_ORG = "create_org"


def consume_service_token(token: str, purpose: str = SERVICE_TOKEN_PURPOSE_CREATE_ORG) -> dict[str, Any] | None:
    """
    service_registration_tokens のトークンを検証し、使用済みに更新する。
    成功時はレコードを返し、失敗時は None。
    """
    supabase = get_supabase()
    if not supabase:
        return None
    value = (token or "").strip()
    if not value:
        return None
    r = (
        supabase.table("service_registration_tokens")
        .select("*")
        .eq("token", value)
        .eq("purpose", purpose)
        .eq("is_active", True)
        .maybe_single()
        .execute()
    )
    if not r.data:
        return None
    row = r.data
    expires_at = row.get("expires_at")
    if isinstance(expires_at, str):
        try:
            exp_dt = datetime.fromisoformat(expires_at.replace("Z", "+00:00"))
        except ValueError:
            return None
        if exp_dt.tzinfo is None:
            exp_dt = exp_dt.replace(tzinfo=timezone.utc)
        if datetime.now(timezone.utc) >= exp_dt:
            return None
    update = (
        supabase.table("service_registration_tokens")
        .update({"is_active": False, "used_at": datetime.now(timezone.utc).isoformat()})
        .eq("id", row["id"])
        .eq("is_active", True)
        .execute()
    )
    if not update.data:
        return None
    return row

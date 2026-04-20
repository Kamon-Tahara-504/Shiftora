"""サービス発行トークンの管理（発行/一覧/失効）と消費。"""
from datetime import datetime, timedelta, timezone
from secrets import token_urlsafe
from typing import Any

from app.db import get_supabase

SERVICE_TOKEN_PURPOSE_CREATE_ORG = "create_org"
SERVICE_TOKEN_PURPOSES = (SERVICE_TOKEN_PURPOSE_CREATE_ORG,)


def _parse_iso_dt(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


def issue_service_token(
    *,
    purpose: str = SERVICE_TOKEN_PURPOSE_CREATE_ORG,
    expires_in_hours: int | None = None,
) -> dict[str, Any] | None:
    """サービス登録トークンを新規発行する（平文返却は発行時のみ）。"""
    supabase = get_supabase()
    if not supabase or purpose not in SERVICE_TOKEN_PURPOSES:
        return None
    token = token_urlsafe(24)
    expires_at: str | None = None
    if expires_in_hours and expires_in_hours > 0:
        expires_at = (datetime.now(timezone.utc) + timedelta(hours=expires_in_hours)).isoformat()
    payload = {
        "token": token,
        "purpose": purpose,
        "is_active": True,
        "expires_at": expires_at,
    }
    r = supabase.table("service_registration_tokens").insert(payload).execute()
    if not r.data:
        return None
    row = r.data[0]
    row["token"] = token
    return row


def list_service_tokens(
    *,
    purpose: str | None = None,
    include_inactive: bool = True,
) -> list[dict[str, Any]]:
    """トークン一覧を返す（平文tokenは返さない）。"""
    supabase = get_supabase()
    if not supabase:
        return []
    q = supabase.table("service_registration_tokens").select(
        "id,purpose,is_active,expires_at,used_at,created_at"
    )
    if purpose:
        q = q.eq("purpose", purpose)
    if not include_inactive:
        q = q.eq("is_active", True)
    r = q.order("created_at", desc=True).execute()
    rows = r.data or []
    now = datetime.now(timezone.utc)
    result: list[dict[str, Any]] = []
    for row in rows:
        exp_dt = _parse_iso_dt(row.get("expires_at"))
        is_expired = bool(exp_dt and now >= exp_dt)
        state = "active"
        if not row.get("is_active"):
            state = "revoked_or_used"
        elif is_expired:
            state = "expired"
        result.append(
            {
                "id": row.get("id"),
                "purpose": row.get("purpose"),
                "is_active": bool(row.get("is_active")),
                "expires_at": row.get("expires_at"),
                "used_at": row.get("used_at"),
                "created_at": row.get("created_at"),
                "state": state,
            }
        )
    return result


def revoke_service_token(token_id: str) -> dict[str, Any] | None:
    """トークンを手動失効する。存在しない場合は None。"""
    supabase = get_supabase()
    if not supabase:
        return None
    lookup = supabase.table("service_registration_tokens").select("*").eq("id", token_id).maybe_single().execute()
    if not lookup.data:
        return None
    row = lookup.data
    if row.get("is_active"):
        supabase.table("service_registration_tokens").update({"is_active": False}).eq("id", token_id).execute()
        row["is_active"] = False
    return row


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
        exp_dt = _parse_iso_dt(expires_at)
        if exp_dt is None:
            return None
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

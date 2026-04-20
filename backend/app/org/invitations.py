"""既存登録ユーザー向け組織招待。"""
from datetime import datetime, timedelta, timezone
from typing import Any
import secrets

from app.auth.constants import ROLE_STAFF
from app.db import get_supabase

INVITATION_EXPIRE_DAYS = 7


def _parse_dt(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


def create_organization_invitation(
    organization_id: str,
    user_id: str,
    invited_by: str,
    role: str = ROLE_STAFF,
) -> tuple[dict[str, Any] | None, str | None]:
    """招待を作成。既存 pending がある場合は error_code を返す。"""
    supabase = get_supabase()
    if not supabase:
        return None, "internal_error"
    existing = (
        supabase.table("organization_invitations")
        .select("id")
        .eq("organization_id", organization_id)
        .eq("user_id", user_id)
        .eq("status", "pending")
        .limit(1)
        .execute()
    )
    if existing.data:
        return None, "invitation_already_exists"
    row = {
        "organization_id": organization_id,
        "user_id": user_id,
        "invited_by": invited_by,
        "role": role,
        "token": secrets.token_urlsafe(24),
        "status": "pending",
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=INVITATION_EXPIRE_DAYS)).isoformat(),
    }
    created = supabase.table("organization_invitations").insert(row).execute()
    if not created.data:
        return None, "internal_error"
    return created.data[0], None


def list_organization_invitations_for_admin(organization_id: str) -> list[dict[str, Any]]:
    supabase = get_supabase()
    if not supabase:
        return []
    r = (
        supabase.table("organization_invitations")
        .select("*")
        .eq("organization_id", organization_id)
        .order("created_at", desc=True)
        .execute()
    )
    return list(r.data) if r.data else []


def list_pending_invitations_for_user(user_id: str) -> list[dict[str, Any]]:
    supabase = get_supabase()
    if not supabase:
        return []
    r = (
        supabase.table("organization_invitations")
        .select("*")
        .eq("user_id", user_id)
        .eq("status", "pending")
        .order("created_at", desc=True)
        .execute()
    )
    return list(r.data) if r.data else []


def get_invitation(invitation_id: str) -> dict[str, Any] | None:
    supabase = get_supabase()
    if not supabase:
        return None
    r = (
        supabase.table("organization_invitations")
        .select("*")
        .eq("id", invitation_id)
        .maybe_single()
        .execute()
    )
    return r.data if r.data else None


def mark_invitation_accepted(invitation_id: str) -> bool:
    supabase = get_supabase()
    if not supabase:
        return False
    r = (
        supabase.table("organization_invitations")
        .update(
            {
                "status": "accepted",
                "accepted_at": datetime.now(timezone.utc).isoformat(),
            }
        )
        .eq("id", invitation_id)
        .eq("status", "pending")
        .execute()
    )
    return bool(r.data)


def invitation_is_expired(invitation: dict[str, Any]) -> bool:
    exp_dt = _parse_dt(invitation.get("expires_at"))
    if not exp_dt:
        return True
    return datetime.now(timezone.utc) >= exp_dt

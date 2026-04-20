"""運営admin向け組織人数監査ロジック。"""
from typing import Any

from app.auth.constants import SUBSCRIPTION_DEFAULT_MAX_USERS
from app.db import get_supabase


def list_organization_user_audit() -> list[dict[str, Any]]:
    """組織ごとの契約上限と利用人数を返す。"""
    supabase = get_supabase()
    if not supabase:
        return []
    org_rows = (
        supabase.table("organizations")
        .select("id,name,created_at")
        .order("created_at", desc=True)
        .execute()
        .data
        or []
    )
    sub_rows = (
        supabase.table("subscriptions")
        .select("organization_id,status,max_users,plan_type,expires_at")
        .execute()
        .data
        or []
    )
    user_rows = (
        supabase.table("users")
        .select("organization_id,is_active")
        .not_.is_("organization_id", "null")
        .execute()
        .data
        or []
    )

    subscription_by_org: dict[str, dict[str, Any]] = {}
    for row in sub_rows:
        org_id = row.get("organization_id")
        if org_id:
            subscription_by_org[str(org_id)] = row

    active_counts: dict[str, int] = {}
    for user in user_rows:
        org_id = user.get("organization_id")
        if not org_id:
            continue
        key = str(org_id)
        if user.get("is_active"):
            active_counts[key] = active_counts.get(key, 0) + 1

    result: list[dict[str, Any]] = []
    for org in org_rows:
        org_id = str(org["id"])
        sub = subscription_by_org.get(org_id, {})
        max_users = int(sub.get("max_users") or SUBSCRIPTION_DEFAULT_MAX_USERS)
        active_user_count = active_counts.get(org_id, 0)
        result.append(
            {
                "organization_id": org_id,
                "organization_name": org.get("name"),
                "subscription_status": sub.get("status") or "unknown",
                "plan_type": sub.get("plan_type"),
                "max_users": max_users,
                "active_user_count": active_user_count,
                "remaining_slots": max(max_users - active_user_count, 0),
                "subscription_expires_at": sub.get("expires_at"),
                "created_at": org.get("created_at"),
            }
        )
    return result

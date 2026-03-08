"""サブスクリプション取得・制御（docs/06-subscription.md）。max_users は users のみカウント。"""
from datetime import datetime, timezone
from typing import Any

from app.auth.constants import SUBSCRIPTION_STATUS_ACTIVE, SUBSCRIPTION_STATUS_SUSPENDED
from app.db import get_supabase


def _parse_expires_at(expires_at: Any) -> datetime | None:
    """expires_at を timezone 付き datetime に変換。無効なら None。"""
    if expires_at is None:
        return None
    if isinstance(expires_at, str):
        try:
            dt = datetime.fromisoformat(expires_at.replace("Z", "+00:00"))
        except (ValueError, TypeError):
            return None
    else:
        dt = expires_at
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt


def get_subscription_for_org(organization_id: str) -> dict[str, Any] | None:
    """
    組織の subscription を 1 件取得する。
    expires_at 超過かつ status が active の場合は suspended に更新してから返す（docs/06）。
    存在しない場合は None。
    """
    supabase = get_supabase()
    if not supabase:
        return None
    r = (
        supabase.table("subscriptions")
        .select("*")
        .eq("organization_id", organization_id)
        .maybe_single()
        .execute()
    )
    if not r.data:
        return None
    sub = r.data
    status = sub.get("status")
    expires_at = _parse_expires_at(sub.get("expires_at"))
    if status == SUBSCRIPTION_STATUS_ACTIVE and expires_at is not None:
        if datetime.now(timezone.utc) >= expires_at:
            sub_id = sub.get("id")
            if sub_id:
                supabase.table("subscriptions").update(
                    {"status": SUBSCRIPTION_STATUS_SUSPENDED}
                ).eq("id", sub_id).execute()
            sub = {**sub, "status": SUBSCRIPTION_STATUS_SUSPENDED}
    return sub


def count_organization_users(organization_id: str) -> int:
    """組織に属する users の件数（docs/06: max_users は users のみカウント）。"""
    supabase = get_supabase()
    if not supabase:
        return 0
    r = (
        supabase.table("users")
        .select("id")
        .eq("organization_id", organization_id)
        .execute()
    )
    return len(r.data) if r.data else 0


def can_org_invite_more(organization_id: str) -> tuple[bool, str | None]:
    """
    組織が新規招待（ユーザー追加）可能か判定する。
    docs/06: max_users 超過 → 招待追加不可。status ≠ active → 招待追加不可。
    戻り値: (可能なら True, 不可なら False, 理由のコード or None)。
    理由: "max_users_exceeded" | "subscription_inactive" | None（可能なとき）
    """
    sub = get_subscription_for_org(organization_id)
    if not sub:
        return False, "subscription_inactive"
    if sub.get("status") != SUBSCRIPTION_STATUS_ACTIVE:
        return False, "subscription_inactive"
    max_users = sub.get("max_users")
    if max_users is not None:
        current = count_organization_users(organization_id)
        if current >= max_users:
            return False, "max_users_exceeded"
    return True, None

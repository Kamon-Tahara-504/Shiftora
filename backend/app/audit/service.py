"""audit_logs テーブルへの追記。削除しない（docs/09）。"""
from typing import Any

from app.db import get_supabase

# イベント種別（docs/04 の例に合わせる）
EVENT_EMPLOYEE_CREATED = "employee_created"
EVENT_SHIFT_GENERATED = "shift_generated"
EVENT_SHIFT_UPDATED = "shift_updated"
EVENT_USER_ROLE_CHANGED = "user_role_changed"
EVENT_INVITATION_CREATED = "invitation_created"


def append(
    organization_id: str,
    user_id: str,
    event_type: str,
    metadata: dict[str, Any] | None = None,
) -> bool:
    """
    監査ログに 1 件追記する。操作者 user_id、組織 organization_id。
    失敗時は False（呼び出し元は処理を継続してよい）。
    """
    supabase = get_supabase()
    if not supabase:
        return False
    row = {
        "organization_id": organization_id,
        "user_id": user_id,
        "event_type": event_type,
        "metadata": metadata or {},
    }
    try:
        supabase.table("audit_logs").insert(row).execute()
        return True
    except Exception:
        return False

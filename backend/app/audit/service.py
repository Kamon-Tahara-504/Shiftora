"""audit_logs テーブルへの追記。削除しない（docs/09）。"""
from typing import Any

from app.db import get_supabase

# イベント種別（docs/04 の例に合わせる）
EVENT_EMPLOYEE_CREATED = "employee_created"
EVENT_SHIFT_GENERATED = "shift_generated"
EVENT_SHIFT_UPDATED = "shift_updated"
EVENT_USER_ROLE_CHANGED = "user_role_changed"
EVENT_INVITATION_CREATED = "invitation_created"
EVENT_AUTH_LOGIN_SUCCEEDED = "auth_login_succeeded"
EVENT_AUTH_LOGIN_FAILED = "auth_login_failed"
EVENT_AUTH_REFRESH_SUCCEEDED = "auth_refresh_succeeded"
EVENT_AUTH_REFRESH_FAILED = "auth_refresh_failed"
EVENT_AUTH_LOGOUT = "auth_logout"
EVENT_AUTH_REGISTER_ORG_SUCCEEDED = "auth_register_org_succeeded"
EVENT_AUTH_REGISTER_ORG_FAILED = "auth_register_org_failed"
EVENT_AUTH_REGISTER_USER_SUCCEEDED = "auth_register_user_succeeded"
EVENT_AUTH_REGISTER_USER_FAILED = "auth_register_user_failed"
EVENT_AUTH_SIGNUP_SUCCEEDED = "auth_signup_succeeded"
EVENT_AUTH_SIGNUP_FAILED = "auth_signup_failed"
EVENT_ADMIN_SERVICE_TOKEN_ISSUED = "admin_service_token_issued"
EVENT_ADMIN_SERVICE_TOKEN_REVOKED = "admin_service_token_revoked"
EVENT_ADMIN_SERVICE_TOKENS_LISTED = "admin_service_tokens_listed"
EVENT_ADMIN_ORG_AUDIT_VIEWED = "admin_org_audit_viewed"


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


def append_admin(
    user_id: str,
    event_type: str,
    metadata: dict[str, Any] | None = None,
) -> bool:
    """運営admin操作の監査ログに 1 件追記する。"""
    supabase = get_supabase()
    if not supabase:
        return False
    row = {
        "user_id": user_id,
        "event_type": event_type,
        "metadata": metadata or {},
    }
    try:
        supabase.table("admin_audit_logs").insert(row).execute()
        return True
    except Exception:
        return False

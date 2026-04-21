"""認証サービス: ログイン・トークン検証・ログアウト（token_version 更新）。"""
from typing import Any

import bcrypt

from app.auth.constants import (
    ROLE_ORG_ADMIN,
    SUBSCRIPTION_DEFAULT_MAX_USERS,
    SUBSCRIPTION_PLAN_TRIAL,
    SUBSCRIPTION_STATUS_ACTIVE,
    TOKEN_TYPE_BEARER,
    TOKEN_TYPE_REFRESH,
)
from app.admin.service_tokens import consume_service_token
from app.auth.jwt import create_access_token, create_refresh_token, decode_token
from app.config import get_settings
from app.db import get_supabase


def _first_row(response: Any) -> dict[str, Any] | None:
    """Supabase レスポンスから先頭1件を安全に取り出す。"""
    if response is None:
        return None
    data = getattr(response, "data", None)
    if isinstance(data, list):
        return data[0] if data else None
    if isinstance(data, dict):
        return data
    return None


def _user_to_token_payload(user: dict[str, Any]) -> tuple[str, str | None, Any, Any, int]:
    """users 行からトークン用の (user_id, org_id, role, system_role, token_version) を返す。"""
    user_id = str(user["id"])
    org_id = str(user["organization_id"]) if user.get("organization_id") else None
    role = user.get("role")
    system_role = user.get("system_role")
    token_version = int(user.get("token_version", 0))
    return user_id, org_id, role, system_role, token_version


def _build_token_response(user: dict[str, Any]) -> dict[str, Any]:
    """ユーザー行から access_token / refresh_token 付きレスポンスを組み立てる。"""
    user_id, org_id, role, system_role, token_version = _user_to_token_payload(user)
    access = create_access_token(user_id, org_id, role, system_role, token_version)
    refresh = create_refresh_token(user_id, token_version)
    return {
        "access_token": access,
        "refresh_token": refresh,
        "token_type": TOKEN_TYPE_BEARER,
    }


def build_token_response(user: dict[str, Any]) -> dict[str, Any]:
    """ユーザー辞書からトークンレスポンスを組み立てる。register-org の 201 用。"""
    return _build_token_response(user)


def get_user_by_email(email: str) -> dict[str, Any] | None:
    """email で users を 1 件取得。いなければ None。"""
    supabase = get_supabase()
    if not supabase:
        return None
    settings = get_settings()
    if not settings.supabase_configured():
        return None
    r = supabase.table("users").select("*").eq("email", email).limit(1).execute()
    return _first_row(r)


def get_user_by_id(user_id: str) -> dict[str, Any] | None:
    """id で users を 1 件取得。いなければ None。"""
    supabase = get_supabase()
    if not supabase:
        return None
    r = supabase.table("users").select("*").eq("id", user_id).limit(1).execute()
    return _first_row(r)


def list_user_memberships(user_id: str) -> list[dict[str, Any]]:
    """ユーザーの組織所属一覧（organization_memberships）を返す。"""
    supabase = get_supabase()
    if not supabase:
        return []
    settings = get_settings()
    if not settings.supabase_configured():
        return []
    r = (
        supabase.table("organization_memberships")
        .select("organization_id, role, status, is_default, joined_at")
        .eq("user_id", user_id)
        .order("is_default", desc=True)
        .order("joined_at", desc=False)
        .execute()
    )
    return list(r.data) if r.data else []


def upsert_user_membership(
    user_id: str,
    organization_id: str,
    role: str,
    *,
    status: str = "active",
    is_default: bool = False,
) -> bool:
    """organization_memberships に所属を upsert する。"""
    supabase = get_supabase()
    if not supabase:
        return False
    existing_r = (
        supabase.table("organization_memberships")
        .select("id")
        .eq("user_id", user_id)
        .eq("organization_id", organization_id)
        .limit(1)
        .execute()
    )
    existing = _first_row(existing_r)
    payload = {
        "role": role,
        "status": status,
        "is_default": is_default,
    }
    if existing:
        result = (
            supabase.table("organization_memberships")
            .update(payload)
            .eq("id", existing["id"])
            .execute()
        )
    else:
        result = (
            supabase.table("organization_memberships")
            .insert(
                {
                    "organization_id": organization_id,
                    "user_id": user_id,
                    "role": role,
                    "status": status,
                    "is_default": is_default,
                }
            )
            .execute()
        )
    return bool(getattr(result, "data", None))


def set_default_membership(user_id: str, organization_id: str) -> bool:
    """ユーザーの default membership を1件に正規化する。"""
    supabase = get_supabase()
    if not supabase:
        return False
    clear_r = (
        supabase.table("organization_memberships")
        .update({"is_default": False})
        .eq("user_id", user_id)
        .execute()
    )
    if clear_r is None:
        return False
    set_r = (
        supabase.table("organization_memberships")
        .update({"is_default": True})
        .eq("user_id", user_id)
        .eq("organization_id", organization_id)
        .eq("status", "active")
        .execute()
    )
    return bool(getattr(set_r, "data", None))


def switch_active_organization_for_user(
    user_id: str,
    organization_id: str,
) -> tuple[dict[str, Any] | None, str | None]:
    """
    active organization を切り替える。
    戻り値: (updated_user, error_code)
    """
    supabase = get_supabase()
    if not supabase:
        return None, "internal_error"
    user = get_user_by_id(user_id)
    if not user:
        return None, "user_not_found"
    membership_r = (
        supabase.table("organization_memberships")
        .select("organization_id, role, status")
        .eq("user_id", user_id)
        .eq("organization_id", organization_id)
        .limit(1)
        .execute()
    )
    membership = _first_row(membership_r)
    if not membership:
        return None, "membership_not_found"
    if membership.get("status") != "active":
        return None, "membership_inactive"
    if not set_default_membership(user_id, organization_id):
        return None, "internal_error"
    updated_user_r = (
        supabase.table("users")
        .update(
            {
                "organization_id": organization_id,
                "role": membership.get("role"),
                "token_version": int(user.get("token_version", 0)) + 1,
            }
        )
        .eq("id", user_id)
        .execute()
    )
    updated_user = _first_row(updated_user_r)
    if not updated_user:
        return None, "internal_error"
    return updated_user, None


def hash_password(plain: str) -> str:
    """平文パスワードを bcrypt でハッシュして返す。register_org 用。"""
    return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str | None) -> bool:
    """平文パスワードとハッシュを照合。ハッシュ不正時は False。"""
    if not hashed:
        return False
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except (ValueError, TypeError):
        return False


def login(email: str, password: str) -> dict[str, Any] | None:
    """
    ログイン: ユーザー取得 → パスワード検証 → トークン発行。
    失敗時は None。成功時は { "access_token", "refresh_token", "token_type" }。
    """
    user = get_user_by_email(email)
    if not user or not user.get("is_active", True):
        return None
    if not verify_password(password, user.get("password_hash")):
        return None
    return _build_token_response(user)


def refresh_tokens(refresh_token: str) -> dict[str, Any] | None:
    """
    refresh_token を検証し、新しい access_token と refresh_token を発行。
    失敗時は None。
    """
    payload = decode_token(refresh_token)
    if not payload or payload.get("type") != TOKEN_TYPE_REFRESH:
        return None
    user_id = payload.get("sub")
    if not user_id:
        return None
    user = get_user_by_id(user_id)
    if not user or not user.get("is_active", True):
        return None
    token_version = int(user.get("token_version", 0))
    if payload.get("token_version") != token_version:
        return None
    return _build_token_response(user)


def logout(user_id: str) -> bool:
    """users.token_version を +1 してトークン失効。成功で True。"""
    supabase = get_supabase()
    if not supabase:
        return False
    r = supabase.table("users").select("token_version").eq("id", user_id).limit(1).execute()
    row = _first_row(r)
    if not row:
        return False
    new_version = int(row.get("token_version", 0)) + 1
    supabase.table("users").update({"token_version": new_version}).eq("id", user_id).execute()
    return True


def register_user(first_name: str, last_name: str, email: str, password: str) -> dict[str, Any] | None:
    """一般ユーザーを作成する（organization_id, role は未設定）。"""
    normalized = (email or "").strip().lower()
    if not normalized or get_user_by_email(normalized) is not None:
        return None
    supabase = get_supabase()
    if not supabase:
        return None
    settings = get_settings()
    if not settings.supabase_configured():
        return None
    user_r = (
        supabase.table("users")
        .insert(
            {
                "organization_id": None,
                "first_name": first_name.strip(),
                "last_name": last_name.strip(),
                "email": normalized,
                "password_hash": hash_password(password),
                "role": None,
                "token_version": 0,
                "is_active": True,
            }
        )
        .execute()
    )
    if not user_r.data or len(user_r.data) == 0:
        return None
    return user_r.data[0]


def create_organization_for_user(
    user_id: str,
    organization_name: str,
    service_token: str,
) -> tuple[dict[str, Any] | None, str | None]:
    """
    ログイン済み一般ユーザーに組織を作成し、org_admin を付与する。
    戻り値: (updated_user, error_code)
    """
    user = get_user_by_id(user_id)
    if not user:
        return None, "user_not_found"
    if user.get("organization_id"):
        return None, "organization_already_set"
    token_row = consume_service_token(service_token)
    if not token_row:
        return None, "service_token_invalid"
    supabase = get_supabase()
    if not supabase:
        return None, "internal_error"
    org_r = supabase.table("organizations").insert({"name": organization_name.strip()}).execute()
    if not org_r.data:
        return None, "internal_error"
    org_id = org_r.data[0]["id"]
    if not upsert_user_membership(
        user_id=user_id,
        organization_id=str(org_id),
        role=ROLE_ORG_ADMIN,
        status="active",
        is_default=True,
    ):
        return None, "internal_error"
    if not set_default_membership(user_id, str(org_id)):
        return None, "internal_error"
    updated_user_r = (
        supabase.table("users")
        .update(
            {
                "organization_id": org_id,
                "role": ROLE_ORG_ADMIN,
                "token_version": int(user.get("token_version", 0)) + 1,
            }
        )
        .eq("id", user_id)
        .execute()
    )
    if not updated_user_r.data:
        return None, "internal_error"
    supabase.table("subscriptions").insert(
        {
            "organization_id": org_id,
            "plan_type": SUBSCRIPTION_PLAN_TRIAL,
            "status": SUBSCRIPTION_STATUS_ACTIVE,
            "max_users": SUBSCRIPTION_DEFAULT_MAX_USERS,
        }
    ).execute()
    return updated_user_r.data[0], None

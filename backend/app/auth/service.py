"""認証サービス: ログイン・トークン検証・ログアウト（token_version 更新）。"""
from typing import Any

import bcrypt

from app.auth.constants import TOKEN_TYPE_BEARER, TOKEN_TYPE_REFRESH
from app.auth.jwt import create_access_token, create_refresh_token, decode_token
from app.config import get_settings
from app.db import get_supabase


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


def get_user_by_email(email: str) -> dict[str, Any] | None:
    """email で users を 1 件取得。いなければ None。"""
    supabase = get_supabase()
    if not supabase:
        return None
    settings = get_settings()
    if not settings.supabase_configured():
        return None
    r = supabase.table("users").select("*").eq("email", email).maybe_single().execute()
    if not r.data:
        return None
    return r.data


def get_user_by_id(user_id: str) -> dict[str, Any] | None:
    """id で users を 1 件取得。いなければ None。"""
    supabase = get_supabase()
    if not supabase:
        return None
    r = supabase.table("users").select("*").eq("id", user_id).maybe_single().execute()
    if not r.data:
        return None
    return r.data


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
    r = supabase.table("users").select("token_version").eq("id", user_id).maybe_single().execute()
    if not r.data:
        return False
    new_version = int(r.data.get("token_version", 0)) + 1
    supabase.table("users").update({"token_version": new_version}).eq("id", user_id).execute()
    return True

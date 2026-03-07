"""Supabase クライアント。設定が有効なときのみ生成する。"""
from supabase import Client, create_client

from app.config import get_settings


def get_supabase() -> Client | None:
    """Supabase クライアントを返す。未設定の場合は None。"""
    s = get_settings()
    if not s.supabase_configured():
        return None
    return create_client(s.supabase_url, s.supabase_service_role_key)

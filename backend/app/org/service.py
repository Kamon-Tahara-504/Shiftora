"""組織スコープのビジネスロジック（招待トークン作成等）。"""
from datetime import datetime, timedelta, timezone
from typing import Any
import secrets

from app.auth.constants import ROLE_STAFF
from app.db import get_supabase

# 招待トークン有効期間（docs/05: 7日間有効、SaaSでよくある値）
INVITATION_EXPIRE_DAYS = 7


def create_invitation(
    organization_id: str,
    email: str,
    role: str,
) -> dict[str, Any] | None:
    """
    invitation_tokens に 1 件挿入する。
    成功時は作成した行（token, expires_at 含む）を返す。失敗時は None。
    """
    supabase = get_supabase()
    if not supabase:
        return None
    token = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(days=INVITATION_EXPIRE_DAYS)
    row = {
        "organization_id": organization_id,
        "email": email.strip().lower(),
        "role": role if role else ROLE_STAFF,
        "token": token,
        "expires_at": expires_at.isoformat(),
        "used": False,
    }
    r = supabase.table("invitation_tokens").insert(row).execute()
    if not r.data or len(r.data) == 0:
        return None
    return r.data[0]

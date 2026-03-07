"""組織 API: 招待等。設計: docs/05-auth-and-invitation.md, docs/08-api.md。"""
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr

from app.auth.constants import (
    CODE_AUTH_NOT_CONFIGURED,
    CODE_FORBIDDEN,
    CODE_INTERNAL_ERROR,
)
from app.auth.deps import CurrentUser
from app.auth.rbac import require_org_admin
from app.config import get_settings
from app.org.service import create_invitation

router = APIRouter(prefix="/org", tags=["org"])


def _error_detail(code: str, message: str, details: dict | None = None) -> dict:
    """docs/08-api.md のエラー形式 { code, message, details } を返す。"""
    return {"code": code, "message": message, "details": details or {}}


class InviteRequest(BaseModel):
    """POST /org/invite のリクエスト。MVP では role は staff のみ。"""
    email: EmailStr
    role: Literal["staff"] = "staff"


@router.post("/invite", status_code=status.HTTP_201_CREATED)
def invite(
    body: InviteRequest,
    current_user: Annotated[CurrentUser, Depends(require_org_admin)],
):
    """
    POST /org/invite（org_admin のみ）
    body: { "email": "...", "role": "staff" }。
    invitation_tokens に 1 件作成し、招待リンク用の token を返す。MVP ではメール送信は行わない。
    """
    if not get_settings().supabase_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=_error_detail(CODE_AUTH_NOT_CONFIGURED, "Auth not configured"),
        )
    org_id = current_user.organization_id
    if not org_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=_error_detail(CODE_FORBIDDEN, "Insufficient permissions"),
        )
    result = create_invitation(
        organization_id=org_id,
        email=body.email,
        role=body.role,
    )
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=_error_detail(CODE_INTERNAL_ERROR, "Failed to create invitation"),
        )
    token = result.get("token", "")
    expires_at = result.get("expires_at")
    # クライアントがリンクを組み立てやすいよう token と expires_at を返す
    return {
        "token": token,
        "expires_at": expires_at,
        "email": result.get("email", body.email),
        "role": result.get("role", body.role),
        "signup_url_template": "/signup?token={token}",
    }

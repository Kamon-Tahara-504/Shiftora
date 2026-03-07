"""認証 API: login / refresh / logout。設計: docs/05-auth-and-invitation.md, docs/08-api.md."""
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.auth.constants import (
    CODE_INVALID_CREDENTIALS,
    CODE_INVALID_TOKEN,
    CODE_VALIDATION_ERROR,
)
from app.auth.deps import get_current_user_id_from_token
from app.auth.service import login as do_login, logout as do_logout, refresh_tokens
from app.config import get_settings

router = APIRouter(prefix="/auth", tags=["auth"])


def _error_detail(code: str, message: str) -> dict:
    """docs/08-api.md のエラー形式 { code, message, details } を返す。"""
    return {"code": code, "message": message, "details": {}}


def _require_jwt_configured() -> None:
    """JWT 未設定なら 503。login / refresh 用の共通チェック。"""
    if not get_settings().jwt_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Auth not configured",
        )


class LoginRequest(BaseModel):
    email: str
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


@router.post("/login")
def login(body: LoginRequest):
    """
    POST /auth/login
    body: { "email": "...", "password": "..." }
    returns: { "access_token", "refresh_token", "token_type": "bearer" }
    """
    _require_jwt_configured()
    email = (body.email or "").strip()
    password = body.password or ""
    if not email or not password:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=_error_detail(CODE_VALIDATION_ERROR, "email and password are required"),
        )
    result = do_login(email, password)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=_error_detail(CODE_INVALID_CREDENTIALS, "Invalid email or password"),
        )
    return result


@router.post("/refresh")
def refresh(body: RefreshRequest):
    """
    POST /auth/refresh
    body: { "refresh_token": "..." }
    returns: { "access_token", "refresh_token", "token_type": "bearer" }
    """
    _require_jwt_configured()
    refresh_token = (body.refresh_token or "").strip()
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=_error_detail(CODE_VALIDATION_ERROR, "refresh_token is required"),
        )
    result = refresh_tokens(refresh_token)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=_error_detail(CODE_INVALID_TOKEN, "Invalid or expired refresh token"),
        )
    return result


@router.post("/logout")
def logout(user_id: Annotated[str, Depends(get_current_user_id_from_token)]):
    """
    POST /auth/logout
    Authorization: Bearer <access_token> 必須。
    token_version を +1 してトークン失効。
    """
    do_logout(user_id)
    return {"status": "ok"}

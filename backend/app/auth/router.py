"""認証 API: login / refresh / logout。設計: docs/05-auth-and-invitation.md, docs/08-api.md."""
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field

from app.auth.constants import (
    CODE_EMAIL_ALREADY_REGISTERED,
    CODE_INVALID_CREDENTIALS,
    CODE_INVALID_INVITATION,
    CODE_INVALID_TOKEN,
    CODE_VALIDATION_ERROR,
)
from app.auth.deps import CurrentUser, get_current_user
from app.auth.service import (
    build_token_response,
    login as do_login,
    logout as do_logout,
    refresh_tokens,
    register_org as do_register_org,
    signup as do_signup,
)
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


def _require_auth_configured() -> None:
    """JWT および Supabase 未設定なら 503。register-org 用。"""
    s = get_settings()
    if not s.jwt_configured() or not s.supabase_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Auth not configured",
        )


class LoginRequest(BaseModel):
    email: str
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class RegisterOrgRequest(BaseModel):
    organization_name: str = Field(..., min_length=1, description="組織名")
    admin_email: EmailStr
    password: str = Field(..., min_length=8, description="8文字以上")


class SignupRequest(BaseModel):
    """POST /auth/signup。招待トークンとパスワードでユーザー作成。"""
    token: str = Field(..., min_length=1, description="招待トークン")
    password: str = Field(..., min_length=8, description="8文字以上")


@router.get("/me")
def me(current_user: Annotated[CurrentUser, Depends(get_current_user)]):
    """
    GET /auth/me
    認証必須。現在のユーザー情報を返す（id, email, organization_id, role, system_role）。
    """
    return {
        "id": current_user.id,
        "email": current_user.email,
        "organization_id": current_user.organization_id,
        "role": current_user.role,
        "system_role": current_user.system_role,
    }


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
def logout(current_user: Annotated[CurrentUser, Depends(get_current_user)]):
    """
    POST /auth/logout
    Authorization: Bearer <access_token> 必須。
    token_version を +1 してトークン失効。
    """
    do_logout(current_user.id)
    return {"status": "ok"}


@router.post("/register-org", status_code=status.HTTP_201_CREATED)
def register_org(body: RegisterOrgRequest):
    """
    POST /auth/register-org（認証不要）
    組織・org_admin・subscription を同時に作成。body: organization_name, admin_email, password。
    """
    _require_auth_configured()
    user = do_register_org(
        organization_name=body.organization_name.strip(),
        admin_email=body.admin_email.strip().lower(),
        password=body.password,
    )
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "code": CODE_EMAIL_ALREADY_REGISTERED,
                "message": "This email is already registered",
                "details": {"admin_email": body.admin_email},
            },
        )
    tokens = build_token_response(user)
    return {
        "organization_id": str(user["organization_id"]),
        "user_id": str(user["id"]),
        "access_token": tokens["access_token"],
        "refresh_token": tokens["refresh_token"],
        "token_type": tokens["token_type"],
    }


@router.post("/signup", status_code=status.HTTP_201_CREATED)
def signup(body: SignupRequest):
    """
    POST /auth/signup（認証不要）
    招待トークンでパスワードを設定しユーザーを作成。body: { "token": "...", "password": "..." }。
    """
    _require_auth_configured()
    user = do_signup(token=body.token.strip(), password=body.password)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=_error_detail(
                CODE_INVALID_INVITATION,
                "Invalid, expired, or already used invitation token",
            ),
        )
    tokens = build_token_response(user)
    return {
        "user_id": str(user["id"]),
        "organization_id": str(user["organization_id"]),
        "access_token": tokens["access_token"],
        "refresh_token": tokens["refresh_token"],
        "token_type": tokens["token_type"],
    }

"""認証 API: login / refresh / logout。設計: docs/05-auth-and-invitation.md, docs/08-api.md."""
import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field

from app.auth.constants import (
    CODE_AUTH_NOT_CONFIGURED,
    CODE_EMAIL_ALREADY_REGISTERED,
    CODE_INVALID_CREDENTIALS,
    CODE_INVALID_INVITATION,
    CODE_INVALID_TOKEN,
    CODE_MAX_USERS_EXCEEDED,
    CODE_SUBSCRIPTION_INACTIVE,
    CODE_VALIDATION_ERROR,
)
from app.auth.deps import CurrentUser, get_current_user
from app.audit.service import (
    EVENT_AUTH_LOGIN_FAILED,
    EVENT_AUTH_LOGIN_SUCCEEDED,
    EVENT_AUTH_LOGOUT,
    EVENT_AUTH_REFRESH_FAILED,
    EVENT_AUTH_REFRESH_SUCCEEDED,
    EVENT_AUTH_REGISTER_ORG_FAILED,
    EVENT_AUTH_REGISTER_ORG_SUCCEEDED,
    EVENT_AUTH_SIGNUP_FAILED,
    EVENT_AUTH_SIGNUP_SUCCEEDED,
    EVENT_USER_ROLE_CHANGED,
    append as audit_append,
)
from app.auth.service import (
    build_token_response,
    get_user_by_email,
    login as do_login,
    logout as do_logout,
    refresh_tokens,
    register_org as do_register_org,
    signup as do_signup,
)
from app.auth.jwt import decode_token
from app.api_user_messages import (
    AUTH_NOT_CONFIGURED,
    INVALID_CREDENTIALS,
    INVALID_REQUEST,
    REFRESH_FAILED,
    REGISTRATION_FAILED,
    SIGNUP_FAILED,
)
from app.config import get_settings

router = APIRouter(prefix="/auth", tags=["auth"])
logger = logging.getLogger(__name__)


def _error_detail(code: str, message: str) -> dict:
    """docs/08-api.md のエラー形式 { code, message, details } を返す。"""
    return {"code": code, "message": message, "details": {}}


def _mask_email(email: str) -> str:
    value = (email or "").strip().lower()
    if "@" not in value:
        return "***"
    local, domain = value.split("@", 1)
    if len(local) <= 2:
        masked_local = f"{local[:1]}***"
    else:
        masked_local = f"{local[:1]}***{local[-1:]}"
    return f"{masked_local}@{domain}"


def _log_auth_failure(event_type: str, metadata: dict | None = None) -> None:
    logger.warning(
        "auth_failure event=%s metadata=%s",
        event_type,
        metadata or {},
    )


def _require_jwt_configured() -> None:
    """JWT 未設定なら 503。login / refresh 用の共通チェック。"""
    if not get_settings().jwt_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=_error_detail(CODE_AUTH_NOT_CONFIGURED, AUTH_NOT_CONFIGURED),
        )


def _require_auth_configured() -> None:
    """JWT および Supabase 未設定なら 503。register-org 用。"""
    s = get_settings()
    if not s.jwt_configured() or not s.supabase_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=_error_detail(CODE_AUTH_NOT_CONFIGURED, AUTH_NOT_CONFIGURED),
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
        _log_auth_failure(EVENT_AUTH_LOGIN_FAILED, {"reason": "validation_failed"})
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=_error_detail(CODE_VALIDATION_ERROR, INVALID_REQUEST),
        )
    result = do_login(email, password)
    if not result:
        _log_auth_failure(
            EVENT_AUTH_LOGIN_FAILED,
            {"reason": "invalid_credentials", "email_masked": _mask_email(email)},
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=_error_detail(CODE_INVALID_CREDENTIALS, INVALID_CREDENTIALS),
        )
    # do_login は tokens のみ返すため、監査ログ用にユーザーを再取得する。
    found = get_user_by_email(email.strip().lower())
    if found and found.get("organization_id") and found.get("id"):
        audit_append(
            str(found["organization_id"]),
            str(found["id"]),
            EVENT_AUTH_LOGIN_SUCCEEDED,
            {"email_masked": _mask_email(email)},
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
        _log_auth_failure(EVENT_AUTH_REFRESH_FAILED, {"reason": "validation_failed"})
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=_error_detail(CODE_VALIDATION_ERROR, INVALID_REQUEST),
        )
    result = refresh_tokens(refresh_token)
    if not result:
        _log_auth_failure(EVENT_AUTH_REFRESH_FAILED, {"reason": "invalid_token"})
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=_error_detail(CODE_INVALID_TOKEN, REFRESH_FAILED),
        )
    payload = decode_token(result["access_token"])
    if payload and payload.get("org_id") and payload.get("sub"):
        audit_append(
            str(payload["org_id"]),
            str(payload["sub"]),
            EVENT_AUTH_REFRESH_SUCCEEDED,
            {},
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
    if current_user.organization_id:
        audit_append(
            current_user.organization_id,
            current_user.id,
            EVENT_AUTH_LOGOUT,
            {},
        )
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
        _log_auth_failure(
            EVENT_AUTH_REGISTER_ORG_FAILED,
            {"reason": "register_failed", "email_masked": _mask_email(body.admin_email)},
        )
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=_error_detail(CODE_EMAIL_ALREADY_REGISTERED, REGISTRATION_FAILED),
        )
    tokens = build_token_response(user)
    audit_append(
        str(user["organization_id"]),
        str(user["id"]),
        EVENT_AUTH_REGISTER_ORG_SUCCEEDED,
        {"email_masked": _mask_email(body.admin_email)},
    )
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
    max_users 超過時は 422（docs/06）。
    """
    _require_auth_configured()
    user, error_code = do_signup(token=body.token.strip(), password=body.password)
    if user is None:
        _log_auth_failure(EVENT_AUTH_SIGNUP_FAILED, {"reason": error_code or "signup_failed"})
        if error_code == "max_users_exceeded":
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=_error_detail(
                    CODE_MAX_USERS_EXCEEDED,
                    SIGNUP_FAILED,
                ),
            )
        if error_code == "subscription_inactive":
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=_error_detail(
                    CODE_SUBSCRIPTION_INACTIVE,
                    SIGNUP_FAILED,
                ),
            )
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=_error_detail(
                CODE_INVALID_INVITATION,
                SIGNUP_FAILED,
            ),
        )
    audit_append(
        str(user["organization_id"]),
        str(user["id"]),
        EVENT_AUTH_SIGNUP_SUCCEEDED,
        {"role": user.get("role", "staff")},
    )
    audit_append(
        str(user["organization_id"]),
        str(user["id"]),
        EVENT_USER_ROLE_CHANGED,
        {"role": user.get("role", "staff")},
    )
    tokens = build_token_response(user)
    return {
        "user_id": str(user["id"]),
        "organization_id": str(user["organization_id"]),
        "access_token": tokens["access_token"],
        "refresh_token": tokens["refresh_token"],
        "token_type": tokens["token_type"],
    }

"""認証 API: login / refresh / logout。設計: docs/05-auth-and-invitation.md, docs/08-api.md."""
import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field

from app.auth.constants import (
    CODE_AUTH_NOT_CONFIGURED,
    CODE_EMAIL_ALREADY_REGISTERED,
    CODE_INVALID_CREDENTIALS,
    CODE_INVALID_TOKEN,
    CODE_ORGANIZATION_ALREADY_SET,
    CODE_SERVICE_TOKEN_INVALID,
    CODE_USER_NOT_FOUND,
    CODE_VALIDATION_ERROR,
)
from app.auth.deps import CurrentUser, get_current_user
from app.audit.service import (
    EVENT_AUTH_LOGIN_FAILED,
    EVENT_AUTH_LOGIN_SUCCEEDED,
    EVENT_AUTH_LOGOUT,
    EVENT_AUTH_REFRESH_FAILED,
    EVENT_AUTH_REFRESH_SUCCEEDED,
    EVENT_AUTH_REGISTER_USER_FAILED,
    EVENT_AUTH_REGISTER_ORG_FAILED,
    EVENT_AUTH_REGISTER_ORG_SUCCEEDED,
    EVENT_USER_ROLE_CHANGED,
    append as audit_append,
)
from app.auth.service import (
    build_token_response,
    create_organization_for_user,
    get_user_by_email,
    login as do_login,
    logout as do_logout,
    register_user as do_register_user,
    refresh_tokens,
)
from app.auth.jwt import decode_token
from app.api_user_messages import (
    AUTH_NOT_CONFIGURED,
    INVALID_CREDENTIALS,
    INVALID_REQUEST,
    ORGANIZATION_ALREADY_SET,
    REGISTER_USER_COMPLETED,
    REGISTER_USER_FAILED,
    REFRESH_FAILED,
    SERVICE_TOKEN_INVALID,
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
    service_token: str = Field(..., min_length=1, description="SaaS発行トークン")


class RegisterUserRequest(BaseModel):
    """POST /auth/register-user。一般ユーザー登録。"""
    first_name: str = Field(..., min_length=1, description="姓")
    last_name: str = Field(..., min_length=1, description="名")
    email: EmailStr
    password: str = Field(..., min_length=8, description="8文字以上")


@router.get("/me")
def me(current_user: Annotated[CurrentUser, Depends(get_current_user)]):
    """
    GET /auth/me
    認証必須。現在のユーザー情報を返す（id, email, organization_id, role, system_role）。
    """
    return {
        "id": current_user.id,
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
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


@router.post("/register-user", status_code=status.HTTP_201_CREATED)
def register_user(body: RegisterUserRequest):
    """
    POST /auth/register-user（認証不要）
    一般ユーザーを作成。organization_id, role は未設定。
    """
    _require_jwt_configured()
    user = do_register_user(
        body.first_name,
        body.last_name,
        body.email.strip().lower(),
        body.password,
    )
    if user is None:
        _log_auth_failure(
            EVENT_AUTH_REGISTER_USER_FAILED,
            {"reason": "register_failed", "email_masked": _mask_email(body.email)},
        )
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=_error_detail(CODE_EMAIL_ALREADY_REGISTERED, REGISTER_USER_FAILED),
        )
    tokens = build_token_response(user)
    # 未所属ユーザーは organization_id がないため監査ログには書かない。
    return {
        "organization_id": None,
        "user_id": str(user["id"]),
        "access_token": tokens["access_token"],
        "refresh_token": tokens["refresh_token"],
        "token_type": tokens["token_type"],
        "message": REGISTER_USER_COMPLETED,
    }


@router.post("/register-org", status_code=status.HTTP_201_CREATED)
def register_org(
    body: RegisterOrgRequest,
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
):
    """
    POST /auth/register-org（認証必須）
    ログイン済みユーザーが組織を作成し org_admin になる。service_token 必須。
    """
    _require_auth_configured()
    user, error_code = create_organization_for_user(
        user_id=current_user.id,
        organization_name=body.organization_name.strip(),
        service_token=body.service_token.strip(),
    )
    if user is None:
        _log_auth_failure(EVENT_AUTH_REGISTER_ORG_FAILED, {"reason": error_code or "register_org_failed"})
        if error_code == "service_token_invalid":
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=_error_detail(
                    CODE_SERVICE_TOKEN_INVALID,
                    SERVICE_TOKEN_INVALID,
                ),
            )
        if error_code == "organization_already_set":
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=_error_detail(CODE_ORGANIZATION_ALREADY_SET, ORGANIZATION_ALREADY_SET),
            )
        if error_code == "user_not_found":
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=_error_detail(CODE_USER_NOT_FOUND, REGISTER_USER_FAILED),
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=_error_detail(CODE_VALIDATION_ERROR, REGISTER_USER_FAILED),
        )
    org_id = str(user["organization_id"]) if user.get("organization_id") else None
    if org_id:
        audit_append(
            org_id,
            current_user.id,
            EVENT_AUTH_REGISTER_ORG_SUCCEEDED,
            {"organization_name": body.organization_name.strip()},
        )
        audit_append(
            org_id,
            current_user.id,
            EVENT_USER_ROLE_CHANGED,
            {"role": user.get("role", "org_admin")},
        )
    tokens = build_token_response(user)
    return {
        "user_id": str(user["id"]),
        "organization_id": org_id,
        "access_token": tokens["access_token"],
        "refresh_token": tokens["refresh_token"],
        "token_type": tokens["token_type"],
    }


@router.post("/signup", status_code=status.HTTP_410_GONE)
def signup_disabled():
    """旧招待トークン signup は廃止。"""
    raise HTTPException(
        status_code=status.HTTP_410_GONE,
        detail=_error_detail(CODE_VALIDATION_ERROR, "この登録方法は現在利用できません。"),
    )

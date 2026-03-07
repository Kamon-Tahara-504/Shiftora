"""認証まわりの FastAPI 依存（Bearer トークン取得・検証）。"""
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel

from app.auth.constants import TOKEN_TYPE_ACCESS
from app.auth.jwt import decode_token
from app.auth.service import get_user_by_id
from app.config import get_settings

HTTP_BEARER = HTTPBearer(auto_error=False)


class CurrentUser(BaseModel):
    """認証済みユーザーのコンテキスト。JWT/DB から 1 回だけ組み立て、ルートと RBAC で共有する。"""
    id: str
    email: str
    organization_id: str | None
    role: str | None  # org_admin | staff | None（システムユーザーは None）
    system_role: str | None  # super_admin | support_admin | billing_admin | None

    model_config = {"frozen": True}


def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(HTTP_BEARER)],
) -> CurrentUser:
    """Authorization: Bearer <access_token> から CurrentUser を取得。無効なら 401。"""
    if not get_settings().jwt_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Auth not configured",
        )
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    payload = decode_token(credentials.credentials)
    if not payload or payload.get("type") != TOKEN_TYPE_ACCESS:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user = get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    if int(user.get("token_version", 0)) != int(payload.get("token_version", -1)):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token revoked")
    org_id = user.get("organization_id")
    return CurrentUser(
        id=str(user["id"]),
        email=str(user.get("email", "")),
        organization_id=str(org_id) if org_id is not None else None,
        role=user.get("role"),
        system_role=user.get("system_role"),
    )


def get_current_user_id_from_token(
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
) -> str:
    """CurrentUser の id を返す。logout など user_id のみ必要な場合に利用。"""
    return current_user.id

"""認証まわりの FastAPI 依存（Bearer トークン取得・検証）。"""
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.auth.constants import TOKEN_TYPE_ACCESS
from app.auth.jwt import decode_token
from app.auth.service import get_user_by_id
from app.config import get_settings

HTTP_BEARER = HTTPBearer(auto_error=False)


def get_current_user_id_from_token(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(HTTP_BEARER)],
) -> str:
    """Authorization: Bearer <access_token> から user_id を取得。無効なら 401。"""
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
    return user_id

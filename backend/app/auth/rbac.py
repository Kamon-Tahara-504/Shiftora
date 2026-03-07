"""RBAC: ロール・権限チェック。認証済み CurrentUser に対して /org /staff /admin のアクセス可否を判定する。"""
from typing import Annotated, Callable

from fastapi import Depends, HTTPException, status

from app.auth.constants import (
    CODE_FORBIDDEN,
    ROLE_ORG_ADMIN,
    ROLE_STAFF,
)
from app.auth.deps import CurrentUser, get_current_user

FORBIDDEN_MESSAGE = "Insufficient permissions"


def _forbidden_detail(message: str = FORBIDDEN_MESSAGE) -> dict:
    """docs/08-api.md のエラー形式で 403 用の detail を返す。"""
    return {"code": CODE_FORBIDDEN, "message": message, "details": {}}


def _raise_forbidden(message: str = FORBIDDEN_MESSAGE) -> None:
    """403 Forbidden を投げる。"""
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail=_forbidden_detail(message),
    )


def require_org_admin(
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
) -> CurrentUser:
    """組織管理者のみ許可。/org/* 用。role == org_admin かつ organization_id が存在すること。"""
    if current_user.role != ROLE_ORG_ADMIN or not current_user.organization_id:
        _raise_forbidden()
    return current_user


def require_staff(
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
) -> CurrentUser:
    """職員のみ許可。/staff/* 用。role == staff かつ organization_id が存在すること。"""
    if current_user.role != ROLE_STAFF or not current_user.organization_id:
        _raise_forbidden()
    return current_user


def require_system_role(
    *allowed_roles: str,
) -> Callable[..., CurrentUser]:
    """指定したシステムロールのいずれかであれば許可。/admin/* 用。依存を返すファクトリ。"""
    allowed = set(allowed_roles)

    def _check(
        current_user: Annotated[CurrentUser, Depends(get_current_user)],
    ) -> CurrentUser:
        if not current_user.system_role or current_user.system_role not in allowed:
            _raise_forbidden()
        return current_user

    return _check

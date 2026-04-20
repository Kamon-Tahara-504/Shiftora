"""system_role 前提の admin API。"""
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field

from app.admin.audit_service import list_organization_user_audit
from app.admin.service_tokens import (
    SERVICE_TOKEN_PURPOSE_CREATE_ORG,
    issue_service_token,
    list_service_tokens,
    revoke_service_token,
)
from app.api_user_messages import (
    REQUEST_FAILED,
    SERVICE_TOKEN_CREATED,
    SERVICE_TOKEN_NOT_FOUND,
    SERVICE_TOKEN_REVOKED,
)
from app.audit.service import (
    EVENT_ADMIN_ORG_AUDIT_VIEWED,
    EVENT_ADMIN_SERVICE_TOKEN_ISSUED,
    EVENT_ADMIN_SERVICE_TOKEN_REVOKED,
    EVENT_ADMIN_SERVICE_TOKENS_LISTED,
    append_admin,
)
from app.auth.constants import (
    CODE_INTERNAL_ERROR,
    CODE_TOKEN_NOT_FOUND,
    SYSTEM_ROLE_SUPPORT_ADMIN,
    SYSTEM_ROLE_SUPER_ADMIN,
)
from app.auth.deps import CurrentUser
from app.auth.rbac import require_system_role

router = APIRouter(prefix="/admin", tags=["admin"])
AdminUser = Annotated[
    CurrentUser,
    Depends(
        require_system_role(
            SYSTEM_ROLE_SUPER_ADMIN,
            SYSTEM_ROLE_SUPPORT_ADMIN,
        )
    ),
]


def _error_detail(code: str, message: str) -> dict:
    return {"code": code, "message": message, "details": {}}


class IssueServiceTokenRequest(BaseModel):
    purpose: Literal["create_org"] = SERVICE_TOKEN_PURPOSE_CREATE_ORG
    expires_in_hours: int | None = Field(default=None, ge=1, le=24 * 365)


@router.post("/service-tokens", status_code=status.HTTP_201_CREATED)
def admin_issue_service_token(body: IssueServiceTokenRequest, current_user: AdminUser):
    row = issue_service_token(purpose=body.purpose, expires_in_hours=body.expires_in_hours)
    if not row:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=_error_detail(CODE_INTERNAL_ERROR, REQUEST_FAILED),
        )
    append_admin(
        user_id=current_user.id,
        event_type=EVENT_ADMIN_SERVICE_TOKEN_ISSUED,
        metadata={"token_id": row.get("id"), "purpose": body.purpose, "expires_in_hours": body.expires_in_hours},
    )
    return {
        "id": row.get("id"),
        "token": row.get("token"),
        "purpose": row.get("purpose"),
        "is_active": row.get("is_active"),
        "expires_at": row.get("expires_at"),
        "used_at": row.get("used_at"),
        "created_at": row.get("created_at"),
        "message": SERVICE_TOKEN_CREATED,
    }


@router.get("/service-tokens")
def admin_list_service_tokens(
    current_user: AdminUser,
    purpose: str | None = Query(default=None),
    include_inactive: bool = Query(default=True),
):
    rows = list_service_tokens(purpose=purpose, include_inactive=include_inactive)
    append_admin(
        user_id=current_user.id,
        event_type=EVENT_ADMIN_SERVICE_TOKENS_LISTED,
        metadata={"count": len(rows), "purpose": purpose, "include_inactive": include_inactive},
    )
    return rows


@router.post("/service-tokens/{token_id}/revoke")
def admin_revoke_service_token(token_id: str, current_user: AdminUser):
    row = revoke_service_token(token_id)
    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=_error_detail(CODE_TOKEN_NOT_FOUND, SERVICE_TOKEN_NOT_FOUND),
        )
    append_admin(
        user_id=current_user.id,
        event_type=EVENT_ADMIN_SERVICE_TOKEN_REVOKED,
        metadata={"token_id": token_id},
    )
    return {"id": row.get("id"), "is_active": bool(row.get("is_active")), "message": SERVICE_TOKEN_REVOKED}


@router.get("/organizations/audit")
def admin_list_org_audit(current_user: AdminUser):
    rows = list_organization_user_audit()
    append_admin(
        user_id=current_user.id,
        event_type=EVENT_ADMIN_ORG_AUDIT_VIEWED,
        metadata={"count": len(rows)},
    )
    return rows

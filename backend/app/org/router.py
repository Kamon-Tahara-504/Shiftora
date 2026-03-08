"""組織 API: 招待・職員マスター・シフト生成。設計: docs/05-auth-and-invitation.md, docs/08-api.md。"""
from datetime import date
from typing import Annotated, Any, Literal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr, Field

from app.auth.constants import (
    CODE_AUTH_NOT_CONFIGURED,
    CODE_FORBIDDEN,
    CODE_INTERNAL_ERROR,
    CODE_INVALID_PERIOD,
    CODE_MAX_USERS_EXCEEDED,
    CODE_NOT_FOUND,
    CODE_SUBSCRIPTION_INACTIVE,
)
from app.auth.deps import CurrentUser
from app.auth.rbac import require_org_admin
from app.config import get_settings
from app.org.employees import (
    create_employee,
    get_employee,
    list_employees,
    update_employee,
)
from app.audit.service import (
    EVENT_EMPLOYEE_CREATED,
    EVENT_INVITATION_CREATED,
    EVENT_SHIFT_GENERATED,
    EVENT_SHIFT_UPDATED,
    append as audit_append,
)
from app.org.service import create_invitation
from app.org.shifts import (
    delete_shifts_for_month,
    get_shift,
    insert_shifts,
    list_shifts,
    update_shift,
)
from app.org.subscription import can_org_invite_more
from app.shift.service import generate_shifts, solve_result_to_api

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
    can_invite, reason = can_org_invite_more(org_id)
    if not can_invite:
        if reason == "max_users_exceeded":
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=_error_detail(
                    CODE_MAX_USERS_EXCEEDED,
                    "Cannot invite: organization user limit reached",
                ),
            )
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=_error_detail(
                CODE_SUBSCRIPTION_INACTIVE,
                "Cannot invite: subscription is not active",
            ),
        )
    result = create_invitation(
        organization_id=org_id,
        email=body.email,
        role=body.role,
    )
    if result is not None:
        audit_append(
            org_id,
            current_user.id,
            EVENT_INVITATION_CREATED,
            {"email": body.email, "role": body.role},
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


# --- 職員マスター（docs/08, docs/10: 一覧・追加・編集・無効化、物理削除なし）---

class EmployeeCreateBody(BaseModel):
    """POST /org/employees の body。"""
    name: str = Field(..., min_length=1)
    employment_type: str | None = None
    can_visit: bool = False
    fixed_holiday: Any = None
    max_consecutive_days: int | None = None
    max_weekly_days: int | None = None


class EmployeeUpdateBody(BaseModel):
    """PATCH /org/employees/{id} の body。すべて任意。"""
    name: str | None = Field(None, min_length=1)
    employment_type: str | None = None
    can_visit: bool | None = None
    fixed_holiday: Any = None
    max_consecutive_days: int | None = None
    max_weekly_days: int | None = None
    is_active: bool | None = None


def _require_org_id(current_user: CurrentUser) -> str:
    """org_admin の organization_id を返す。無ければ 403。"""
    if not current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=_error_detail(CODE_FORBIDDEN, "Insufficient permissions"),
        )
    return current_user.organization_id


def _employee_to_response(e: dict[str, Any]) -> dict[str, Any]:
    """DB の employee 行を API レスポンス用の辞書に変換する。"""
    return {
        "id": str(e["id"]),
        "name": e["name"],
        "employment_type": e.get("employment_type"),
        "can_visit": e.get("can_visit", False),
        "fixed_holiday": e.get("fixed_holiday"),
        "max_consecutive_days": e.get("max_consecutive_days"),
        "max_weekly_days": e.get("max_weekly_days"),
        "is_active": e.get("is_active", True),
        "user_id": str(e["user_id"]) if e.get("user_id") else None,
        "created_at": e.get("created_at"),
    }


@router.get("/employees")
def employees_list(
    current_user: Annotated[CurrentUser, Depends(require_org_admin)],
    include_inactive: bool = Query(False, description="無効職員も含める"),
):
    """
    GET /org/employees（org_admin のみ）
    デフォルトは is_active が true の職員のみ。?include_inactive=true で無効も含む。
    """
    org_id = _require_org_id(current_user)
    items = list_employees(org_id, include_inactive=include_inactive)
    return [_employee_to_response(e) for e in items]


@router.post("/employees", status_code=status.HTTP_201_CREATED)
def employees_create(
    body: EmployeeCreateBody,
    current_user: Annotated[CurrentUser, Depends(require_org_admin)],
):
    """POST /org/employees（org_admin のみ）。職員を 1 件追加。"""
    if not get_settings().supabase_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=_error_detail(CODE_AUTH_NOT_CONFIGURED, "Auth not configured"),
        )
    org_id = _require_org_id(current_user)
    emp = create_employee(
        org_id,
        body.name,
        employment_type=body.employment_type,
        can_visit=body.can_visit,
        fixed_holiday=body.fixed_holiday,
        max_consecutive_days=body.max_consecutive_days,
        max_weekly_days=body.max_weekly_days,
    )
    if emp is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=_error_detail(CODE_INTERNAL_ERROR, "Failed to create employee"),
        )
    audit_append(
        org_id,
        current_user.id,
        EVENT_EMPLOYEE_CREATED,
        {"employee_id": str(emp["id"]), "name": emp.get("name")},
    )
    return _employee_to_response(emp)


@router.patch("/employees/{employee_id}")
def employees_update(
    employee_id: str,
    body: EmployeeUpdateBody,
    current_user: Annotated[CurrentUser, Depends(require_org_admin)],
):
    """PATCH /org/employees/{id}（org_admin のみ）。編集・無効化（is_active=false）。物理削除はしない。"""
    if not get_settings().supabase_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=_error_detail(CODE_AUTH_NOT_CONFIGURED, "Auth not configured"),
        )
    org_id = _require_org_id(current_user)
    updates = body.model_dump(exclude_unset=True)
    emp = update_employee(org_id, employee_id, **updates)
    if emp is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=_error_detail(CODE_NOT_FOUND, "Employee not found"),
        )
    return _employee_to_response(emp)


# --- シフト生成（docs/07, docs/08: 解なし時は 422 で missing_slots）---

class GenerateShiftsBody(BaseModel):
    """POST /org/shifts/generate の body。"""
    year: int = Field(..., ge=2000, le=2100)
    month: int = Field(..., ge=1, le=12)


@router.post("/shifts/generate")
def shifts_generate(
    body: GenerateShiftsBody,
    current_user: Annotated[CurrentUser, Depends(require_org_admin)],
):
    """
    POST /org/shifts/generate（org_admin のみ）
    body: { "year": 2026, "month": 4 }。過去月は 422 invalid_period。
    解なし時は 422 で { "status": "infeasible", "missing_slots": [...] }（docs/07）。
    """
    if not get_settings().supabase_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=_error_detail(CODE_AUTH_NOT_CONFIGURED, "Auth not configured"),
        )
    org_id = _require_org_id(current_user)
    today = date.today()
    if (body.year, body.month) < (today.year, today.month):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=_error_detail(
                CODE_INVALID_PERIOD,
                "Cannot generate shifts for past months",
                {"year": body.year, "month": body.month},
            ),
        )
    result = generate_shifts(org_id, body.year, body.month)
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=_error_detail(CODE_INTERNAL_ERROR, "Failed to generate shifts"),
        )
    if result.status == "infeasible":
        api_body = solve_result_to_api(result)
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content=api_body,
        )
    # status == "ok": 対象月を削除してから投入
    if not delete_shifts_for_month(org_id, body.year, body.month):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=_error_detail(CODE_INTERNAL_ERROR, "Failed to clear existing shifts"),
        )
    assignments = [
        {
            "date": a.date.isoformat(),
            "slot": a.slot,
            "department": a.department,
            "employee_id": a.employee_id,
        }
        for a in result.assignments
    ]
    inserted = insert_shifts(org_id, assignments)
    if inserted is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=_error_detail(CODE_INTERNAL_ERROR, "Failed to save shifts"),
        )
    audit_append(
        org_id,
        current_user.id,
        EVENT_SHIFT_GENERATED,
        {"year": body.year, "month": body.month, "assignments_count": len(inserted)},
    )
    return {"status": "ok"}


# --- シフト取得・手動修正（docs/08）---

def _shift_to_response(row: dict[str, Any]) -> dict[str, Any]:
    """DB の shift 行を API レスポンス用に変換（id 必須）。"""
    return {
        "id": str(row["id"]),
        "date": str(row["date"]),
        "slot": row["slot"],
        "department": row["department"],
        "employee_id": str(row["employee_id"]),
    }


@router.get("/shifts")
def shifts_list(
    current_user: Annotated[CurrentUser, Depends(require_org_admin)],
    year: int = Query(..., ge=2000, le=2100, description="年"),
    month: int = Query(..., ge=1, le=12, description="月"),
):
    """
    GET /org/shifts（org_admin のみ）
    クエリ year, month 必須。各要素に id を含める（docs/08）。
    """
    if not get_settings().supabase_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=_error_detail(CODE_AUTH_NOT_CONFIGURED, "Auth not configured"),
        )
    org_id = _require_org_id(current_user)
    rows = list_shifts(org_id, year, month)
    return [_shift_to_response(r) for r in rows]


class ShiftPatchBody(BaseModel):
    """PATCH /org/shifts/{id} の body。すべて任意。"""
    employee_id: str | None = None
    department: Literal["daycare", "visit"] | None = None
    slot: Literal["AM", "PM"] | None = None


@router.patch("/shifts/{shift_id}")
def shifts_patch(
    shift_id: str,
    body: ShiftPatchBody,
    current_user: Annotated[CurrentUser, Depends(require_org_admin)],
):
    """
    PATCH /org/shifts/{id}（org_admin のみ）
    手動修正。更新可: employee_id, department, slot（docs/08）。
    """
    if not get_settings().supabase_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=_error_detail(CODE_AUTH_NOT_CONFIGURED, "Auth not configured"),
        )
    org_id = _require_org_id(current_user)
    updates = body.model_dump(exclude_unset=True)
    if not updates:
        # 何も更新しない場合は現状を返す
        row = get_shift(org_id, shift_id)
        if not row:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=_error_detail(CODE_NOT_FOUND, "Shift not found"),
            )
        return _shift_to_response(row)
    before = get_shift(org_id, shift_id)
    if not before:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=_error_detail(CODE_NOT_FOUND, "Shift not found"),
        )
    updated = update_shift(org_id, shift_id, **updates)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=_error_detail(CODE_NOT_FOUND, "Shift not found"),
        )
    audit_append(
        org_id,
        current_user.id,
        EVENT_SHIFT_UPDATED,
        {
            "shift_id": shift_id,
            "before_employee": str(before["employee_id"]),
            "after_employee": str(updated["employee_id"]),
            "before_department": before["department"],
            "after_department": updated["department"],
            "before_slot": before["slot"],
            "after_slot": updated["slot"],
        },
    )
    return _shift_to_response(updated)

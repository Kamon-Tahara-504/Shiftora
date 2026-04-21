"""職員 API: 希望休・自分のシフト。設計: docs/08-api.md。"""
import calendar
from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field

from app.api_user_messages import (
    ALREADY_REQUESTED_DAY_OFF,
    CANNOT_DELETE_OTHERS_DAY_OFF,
    DAY_OFF_NOT_FOUND,
    NO_LINKED_EMPLOYEE,
    REQUIRE_PERIOD_PARAMS,
)
from app.auth.constants import (
    CODE_FORBIDDEN,
    CODE_NOT_FOUND,
    CODE_VALIDATION_ERROR,
)
from app.auth.deps import CurrentUser
from app.auth.rbac import require_staff
from app.auth.rbac import require_organization_id
from app.org.employees import create_employee_for_user, get_employee_by_user_id
from app.org.shifts import list_shifts_in_range
from app.staff.day_offs import (
    create_day_off,
    delete_day_off,
    get_day_off_by_id,
    list_day_offs,
)

router = APIRouter(prefix="/staff", tags=["staff"])


def _error_detail(code: str, message: str, details: dict | None = None) -> dict:
    """docs/08-api.md のエラー形式 { code, message, details } を返す。"""
    return {"code": code, "message": message, "details": details or {}}


def _get_staff_employee_id(current_user: CurrentUser) -> str:
    """staff ユーザーに紐づく employee_id を返す。紐づく職員がいなければ 403。"""
    org_id = require_organization_id(current_user)
    emp = get_employee_by_user_id(
        org_id,
        current_user.id,
    )
    if not emp:
        # 過去データや移行直後で employees 未作成の場合は self-healing で補完する。
        full_name = " ".join(
            [p for p in [current_user.first_name, current_user.last_name] if p]
        ).strip()
        fallback_name = full_name or (current_user.email or "staff").split("@")[0]
        emp = create_employee_for_user(org_id, current_user.id, fallback_name)
    if not emp:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=_error_detail(
                CODE_FORBIDDEN,
                NO_LINKED_EMPLOYEE,
            ),
        )
    return str(emp["id"])


class DayOffCreateBody(BaseModel):
    """POST /staff/day-offs の body。"""
    date: str = Field(..., description="希望休日（YYYY-MM-DD）")


@router.get("/day-offs")
def day_offs_list(
    current_user: Annotated[CurrentUser, Depends(require_staff)],
):
    """GET /staff/day-offs（staff のみ）。自分の希望休一覧。"""
    employee_id = _get_staff_employee_id(current_user)
    items = list_day_offs(employee_id)
    return [
        {"id": str(d["id"]), "date": d["date"], "employee_id": str(d["employee_id"])}
        for d in items
    ]


@router.post("/day-offs", status_code=status.HTTP_201_CREATED)
def day_offs_create(
    body: DayOffCreateBody,
    current_user: Annotated[CurrentUser, Depends(require_staff)],
):
    """POST /staff/day-offs（staff のみ）。希望休を申請。同一日の重複は禁止。"""
    employee_id = _get_staff_employee_id(current_user)
    result = create_day_off(employee_id, body.date.strip())
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=_error_detail(
                CODE_VALIDATION_ERROR,
                ALREADY_REQUESTED_DAY_OFF,
                {"date": body.date},
            ),
        )
    return {"id": str(result["id"]), "date": result["date"], "employee_id": str(result["employee_id"])}


@router.delete("/day-offs/{day_off_id}", status_code=status.HTTP_204_NO_CONTENT)
def day_offs_delete(
    day_off_id: str,
    current_user: Annotated[CurrentUser, Depends(require_staff)],
):
    """DELETE /staff/day-offs/{id}（staff のみ）。自分の希望休のみ取消可能。"""
    employee_id = _get_staff_employee_id(current_user)
    deleted = delete_day_off(day_off_id, employee_id)
    if not deleted:
        # 他者の希望休または存在しない id
        req = get_day_off_by_id(day_off_id)
        if not req:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=_error_detail(CODE_NOT_FOUND, DAY_OFF_NOT_FOUND),
            )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=_error_detail(CODE_FORBIDDEN, CANNOT_DELETE_OTHERS_DAY_OFF),
        )


@router.get("/shifts")
def staff_shifts_list(
    current_user: Annotated[CurrentUser, Depends(require_staff)],
    year: int | None = Query(None, ge=2000, le=2100, description="年（month とセット）"),
    month: int | None = Query(None, ge=1, le=12, description="月（year とセット）"),
    start: str | None = Query(None, description="開始日 YYYY-MM-DD（end とセット）"),
    end: str | None = Query(None, description="終了日 YYYY-MM-DD（start とセット）"),
):
    """
    GET /staff/shifts（staff のみ）。自分のシフト一覧。期間指定必須。
    year=2026&month=4 または start=2026-04-01&end=2026-04-30（docs/08）。
    """
    employee_id = _get_staff_employee_id(current_user)
    org_id = require_organization_id(current_user)
    if start is not None and end is not None:
        start_date, end_date = start, end
    elif year is not None and month is not None:
        _, last_day = calendar.monthrange(year, month)
        start_date = date(year, month, 1).isoformat()
        end_date = date(year, month, last_day).isoformat()
    else:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=_error_detail(
                CODE_VALIDATION_ERROR,
                REQUIRE_PERIOD_PARAMS,
                {},
            ),
        )
    rows = list_shifts_in_range(org_id, start_date, end_date, employee_id=employee_id)
    return [
        {
            "id": str(r["id"]),
            "date": str(r["date"]),
            "slot": r["slot"],
            "department": r["department"],
            "employee_id": str(r["employee_id"]),
        }
        for r in rows
    ]

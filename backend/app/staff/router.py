"""職員 API: 希望休等。設計: docs/08-api.md。"""
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.auth.constants import (
    CODE_FORBIDDEN,
    CODE_NOT_FOUND,
    CODE_VALIDATION_ERROR,
)
from app.auth.deps import CurrentUser
from app.auth.rbac import require_staff
from app.org.employees import get_employee_by_user_id
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
    if not current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=_error_detail(CODE_FORBIDDEN, "Insufficient permissions"),
        )
    emp = get_employee_by_user_id(
        current_user.organization_id,
        current_user.id,
    )
    if not emp:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=_error_detail(
                CODE_FORBIDDEN,
                "No employee record linked to your account",
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
                "Already requested for this date",
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
                detail=_error_detail(CODE_NOT_FOUND, "Day-off request not found"),
            )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=_error_detail(CODE_FORBIDDEN, "Cannot delete another user's request"),
        )

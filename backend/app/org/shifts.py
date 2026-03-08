"""シフトの削除・一括投入・一覧・1件取得・更新（docs/07, docs/08）。"""
import calendar
from datetime import date
from typing import Any

from app.db import get_supabase


def list_shifts(
    organization_id: str,
    year: int,
    month: int,
) -> list[dict[str, Any]]:
    """指定組織・年月のシフト一覧を返す。日付・スロット順。"""
    _, last_day = calendar.monthrange(year, month)
    start = date(year, month, 1).isoformat()
    end = date(year, month, last_day).isoformat()
    return list_shifts_in_range(organization_id, start, end)


def list_shifts_in_range(
    organization_id: str,
    start_date: str,
    end_date: str,
    employee_id: str | None = None,
) -> list[dict[str, Any]]:
    """指定組織・日付範囲のシフト一覧。employee_id を指定するとその職員分のみ。"""
    supabase = get_supabase()
    if not supabase:
        return []
    q = (
        supabase.table("shifts")
        .select("id, date, slot, department, employee_id")
        .eq("organization_id", organization_id)
        .gte("date", start_date)
        .lte("date", end_date)
        .order("date")
        .order("slot")
    )
    if employee_id is not None:
        q = q.eq("employee_id", employee_id)
    r = q.execute()
    return list(r.data) if r.data else []


def get_shift(organization_id: str, shift_id: str) -> dict[str, Any] | None:
    """組織に属するシフトを 1 件取得する。存在しない・他組織の場合は None。"""
    supabase = get_supabase()
    if not supabase:
        return None
    r = (
        supabase.table("shifts")
        .select("id, date, slot, department, employee_id")
        .eq("id", shift_id)
        .eq("organization_id", organization_id)
        .maybe_single()
        .execute()
    )
    return r.data if r.data else None


def update_shift(
    organization_id: str,
    shift_id: str,
    *,
    employee_id: str | None = None,
    department: str | None = None,
    slot: str | None = None,
) -> dict[str, Any] | None:
    """
    シフトを部分更新する。指定したフィールドのみ更新。当該 shift が組織に属さない場合は None。
    """
    supabase = get_supabase()
    if not supabase:
        return None
    existing = get_shift(organization_id, shift_id)
    if not existing:
        return None
    updates: dict[str, Any] = {}
    if employee_id is not None:
        updates["employee_id"] = employee_id
    if department is not None:
        updates["department"] = department
    if slot is not None:
        updates["slot"] = slot
    if not updates:
        return existing
    r = (
        supabase.table("shifts")
        .update(updates)
        .eq("id", shift_id)
        .eq("organization_id", organization_id)
        .execute()
    )
    if not r.data or len(r.data) == 0:
        return None
    return r.data[0]


def delete_shifts_for_month(
    organization_id: str,
    year: int,
    month: int,
) -> bool:
    """指定組織・年月のシフトを全削除する。成功で True。"""
    supabase = get_supabase()
    if not supabase:
        return False
    _, last_day = calendar.monthrange(year, month)
    start = date(year, month, 1).isoformat()
    end = date(year, month, last_day).isoformat()
    supabase.table("shifts").delete().eq("organization_id", organization_id).gte(
        "date", start
    ).lte("date", end).execute()
    return True


def insert_shifts(
    organization_id: str,
    assignments: list[dict[str, Any]],
) -> list[dict[str, Any]] | None:
    """
    assignments を shifts に一括投入する。
    各要素は { "date": "YYYY-MM-DD", "slot": "AM"|"PM", "department": "daycare"|"visit", "employee_id": "uuid" }。
    成功時は投入した行のリスト（id 含む）を返す。失敗時は None。
    """
    supabase = get_supabase()
    if not supabase:
        return None
    rows = [
        {
            "organization_id": organization_id,
            "date": a["date"],
            "slot": a["slot"],
            "department": a["department"],
            "employee_id": a["employee_id"],
        }
        for a in assignments
    ]
    r = supabase.table("shifts").insert(rows).execute()
    return list(r.data) if r.data else None

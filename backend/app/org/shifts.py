"""シフトの削除・一括投入（docs/07: 対象月は完全上書き）。"""
import calendar
from datetime import date
from typing import Any

from app.db import get_supabase


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

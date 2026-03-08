"""希望休の一覧・申請・取消（docs/08-api.md）。同一日重複禁止は DB UNIQUE(employee_id, date)。"""
from typing import Any

from app.db import get_supabase


def list_day_offs(employee_id: str) -> list[dict[str, Any]]:
    """職員の希望休一覧を返す。"""
    supabase = get_supabase()
    if not supabase:
        return []
    r = (
        supabase.table("day_off_requests")
        .select("*")
        .eq("employee_id", employee_id)
        .order("date", desc=False)
        .execute()
    )
    return list(r.data) if r.data else []


def create_day_off(employee_id: str, date: str) -> dict[str, Any] | None:
    """
    希望休を 1 件作成する。同一 (employee_id, date) が既に存在する場合は None（重複）。
    成功時は作成した行を返す。
    """
    supabase = get_supabase()
    if not supabase:
        return None
    # 重複チェック（UNIQUE 制約でも防げるが、明示的に 422 用に判定）
    existing = (
        supabase.table("day_off_requests")
        .select("id")
        .eq("employee_id", employee_id)
        .eq("date", date)
        .maybe_single()
        .execute()
    )
    if existing.data:
        return None
    row = {"employee_id": employee_id, "date": date}
    r = supabase.table("day_off_requests").insert(row).execute()
    if not r.data or len(r.data) == 0:
        return None
    return r.data[0]


def get_day_off_by_id(day_off_id: str) -> dict[str, Any] | None:
    """希望休を id で 1 件取得する。"""
    supabase = get_supabase()
    if not supabase:
        return None
    r = (
        supabase.table("day_off_requests")
        .select("*")
        .eq("id", day_off_id)
        .maybe_single()
        .execute()
    )
    return r.data if r.data else None


def delete_day_off(day_off_id: str, employee_id: str) -> bool:
    """希望休を削除する。当該 id がその employee のものである場合のみ削除。成功で True。"""
    supabase = get_supabase()
    if not supabase:
        return False
    row = get_day_off_by_id(day_off_id)
    if not row or str(row.get("employee_id")) != str(employee_id):
        return False
    supabase.table("day_off_requests").delete().eq("id", day_off_id).execute()
    return True

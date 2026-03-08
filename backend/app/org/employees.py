"""職員マスターの取得・作成・更新（docs/08-api.md, docs/04-database.md）。物理削除は行わない。"""
from typing import Any

from app.db import get_supabase

# PATCH で更新可能なフィールド（id, organization_id, user_id, created_at は変更不可）
UPDATABLE_EMPLOYEE_FIELDS = frozenset({
    "name",
    "employment_type",
    "can_visit",
    "fixed_holiday",
    "max_consecutive_days",
    "max_weekly_days",
    "is_active",
})


def list_employees(
    organization_id: str,
    include_inactive: bool = False,
) -> list[dict[str, Any]]:
    """
    組織の職員一覧を返す。デフォルトは is_active が true のみ（docs/08）。
    """
    supabase = get_supabase()
    if not supabase:
        return []
    q = (
        supabase.table("employees")
        .select("*")
        .eq("organization_id", organization_id)
        .order("created_at", desc=False)
    )
    if not include_inactive:
        q = q.eq("is_active", True)
    r = q.execute()
    return list(r.data) if r.data else []


def create_employee(
    organization_id: str,
    name: str,
    *,
    employment_type: str | None = None,
    can_visit: bool = False,
    fixed_holiday: Any = None,
    max_consecutive_days: int | None = None,
    max_weekly_days: int | None = None,
) -> dict[str, Any] | None:
    """職員を 1 件作成する。成功時は作成した行を返す。"""
    supabase = get_supabase()
    if not supabase:
        return None
    row: dict[str, Any] = {
        "organization_id": organization_id,
        "name": name.strip(),
        "can_visit": can_visit,
    }
    if employment_type is not None:
        row["employment_type"] = employment_type.strip() or None
    if fixed_holiday is not None:
        row["fixed_holiday"] = fixed_holiday
    if max_consecutive_days is not None:
        row["max_consecutive_days"] = max_consecutive_days
    if max_weekly_days is not None:
        row["max_weekly_days"] = max_weekly_days
    r = supabase.table("employees").insert(row).execute()
    if not r.data or len(r.data) == 0:
        return None
    return r.data[0]


def get_employee(organization_id: str, employee_id: str) -> dict[str, Any] | None:
    """組織に属する職員を 1 件取得する。存在しない・他組織の場合は None。"""
    supabase = get_supabase()
    if not supabase:
        return None
    r = (
        supabase.table("employees")
        .select("*")
        .eq("id", employee_id)
        .eq("organization_id", organization_id)
        .maybe_single()
        .execute()
    )
    return r.data if r.data else None


def update_employee(
    organization_id: str,
    employee_id: str,
    **fields: Any,
) -> dict[str, Any] | None:
    """
    職員を更新する。UPDATABLE_EMPLOYEE_FIELDS のキーのみ反映。
    成功時は更新後の行を返す。存在しない・他組織の場合は None。
    """
    supabase = get_supabase()
    if not supabase:
        return None
    existing = get_employee(organization_id, employee_id)
    if not existing:
        return None
    updates = {k: v for k, v in fields.items() if k in UPDATABLE_EMPLOYEE_FIELDS}
    if not updates:
        return existing
    r = (
        supabase.table("employees")
        .update(updates)
        .eq("id", employee_id)
        .eq("organization_id", organization_id)
        .execute()
    )
    if not r.data or len(r.data) == 0:
        return None
    return r.data[0]

"""シフト生成に必要な入力データの取得（職員・稼働曜日・希望休）。"""
import calendar
from dataclasses import dataclass
from datetime import date
from typing import Any

from app.db import get_supabase


def _db_weekday(d: date) -> int:
    """date を DB の weekday に変換。0=日, 1=月, ..., 6=土（docs/04）。"""
    # Python: Monday=0, Sunday=6
    return (d.weekday() + 1) % 7


@dataclass
class ShiftInput:
    """1 ヶ月分のシフト生成入力。"""

    organization_id: str
    year: int
    month: int
    employees: list[dict[str, Any]]  # id, can_visit, fixed_holiday, ...
    availability: dict[str, list[dict[str, Any]]]  # employee_id -> [ { weekday, available_morning, available_afternoon }, ... ]
    day_offs: set[tuple[str, str]]  # (employee_id, date_str)
    dates: list[date]  # 対象月の日付リスト（日順）


def load_shift_input(organization_id: str, year: int, month: int) -> ShiftInput | None:
    """
    対象組織・年月のシフト生成用データを取得する。
    Supabase 未設定やデータ取得失敗時は None。
    """
    supabase = get_supabase()
    if not supabase:
        return None

    _, last = calendar.monthrange(year, month)
    start_date = date(year, month, 1)
    end_date = date(year, month, last)

    # アクティブな職員
    r_emp = (
        supabase.table("employees")
        .select("id, can_visit, fixed_holiday")
        .eq("organization_id", organization_id)
        .eq("is_active", True)
        .execute()
    )
    employees = list(r_emp.data) if r_emp.data else []
    if not employees:
        return ShiftInput(
            organization_id=organization_id,
            year=year,
            month=month,
            employees=[],
            availability={},
            day_offs=set(),
            dates=[date(year, month, d) for d in range(1, last + 1)],
        )

    emp_ids = [str(e["id"]) for e in employees]

    # availability_rules（全員分）
    r_avail = (
        supabase.table("availability_rules")
        .select("employee_id, weekday, available_morning, available_afternoon")
        .in_("employee_id", emp_ids)
        .execute()
    )
    avail_list = r_avail.data if r_avail.data else []
    availability: dict[str, list[dict[str, Any]]] = {eid: [] for eid in emp_ids}
    for row in avail_list:
        eid = str(row["employee_id"])
        if eid in availability:
            availability[eid].append(row)

    # 希望休（対象月のみ）
    r_do = (
        supabase.table("day_off_requests")
        .select("employee_id, date")
        .in_("employee_id", emp_ids)
        .gte("date", start_date.isoformat())
        .lte("date", end_date.isoformat())
        .execute()
    )
    do_list = r_do.data if r_do.data else []
    day_offs = set()
    for row in do_list:
        day_offs.add((str(row["employee_id"]), str(row["date"])))

    dates = [date(year, month, d) for d in range(1, last + 1)]

    return ShiftInput(
        organization_id=organization_id,
        year=year,
        month=month,
        employees=employees,
        availability=availability,
        day_offs=day_offs,
        dates=dates,
    )


def can_work_slot(
    employee: dict[str, Any],
    availability: dict[str, list[dict[str, Any]]],
    d: date,
    slot: str,
) -> bool:
    """
    職員が指定日の指定スロットで勤務可能か。
    slot は "AM" または "PM"。曜日制約・fixed_holiday を考慮する。
    """
    eid = str(employee["id"])
    wd = _db_weekday(d)
    fixed = employee.get("fixed_holiday")
    if isinstance(fixed, list) and wd in fixed:
        return False
    rules = availability.get(eid, [])
    for r in rules:
        if r.get("weekday") == wd:
            if slot == "AM":
                return bool(r.get("available_morning", False))
            return bool(r.get("available_afternoon", False))
    return False


def is_day_off(day_offs: set[tuple[str, str]], employee_id: str, d: date) -> bool:
    """希望休に含まれるか。"""
    return (str(employee_id), d.isoformat()) in day_offs

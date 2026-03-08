"""シフト生成のエントリポイント。データ取得 → 求解 → 結果返却。"""
from __future__ import annotations

from typing import Any

from app.shift.data import load_shift_input
from app.shift.solver import SolveResult, solve


def generate_shifts(
    organization_id: str,
    year: int,
    month: int,
) -> SolveResult | None:
    """
    指定組織・年月でシフトを生成する。データ取得失敗時は None。
    戻り値の status は "ok" または "infeasible"。
    """
    inp = load_shift_input(organization_id, year, month)
    if inp is None:
        return None
    return solve(inp)


def solve_result_to_api(result: SolveResult) -> dict[str, Any]:
    """SolveResult を API レスポンス用の辞書に変換（docs/07, docs/08）。"""
    if result.status == "ok":
        return {
            "status": "ok",
            "assignments": [
                {
                    "date": a.date.isoformat(),
                    "slot": a.slot,
                    "department": a.department,
                    "employee_id": a.employee_id,
                }
                for a in result.assignments
            ],
        }
    return {
        "status": "infeasible",
        "missing_slots": [
            {
                "date": m.date.isoformat(),
                "slot": m.slot,
                "department": m.department,
                "required": m.required,
                "assigned": m.assigned,
            }
            for m in result.missing_slots
        ],
    }

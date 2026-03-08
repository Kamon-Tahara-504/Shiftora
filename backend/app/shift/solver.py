"""
OR-Tools CP-SAT によるシフト割当（docs/07-shift-logic.md）。
制約: デイ 4 人/スロット、訪問 AM/PM 各 1、半日兼務 2 人以上、希望休・曜日・can_visit。
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import date
from typing import Any

from ortools.sat.python import cp_model

from app.shift.data import ShiftInput, can_work_slot, is_day_off


SLOT_AM = 0
SLOT_PM = 1
DEPT_DAYCARE = 0
DEPT_VISIT = 1
SLOT_NAMES = ("AM", "PM")
DEPT_NAMES = ("daycare", "visit")

DAYCARE_REQUIRED = 4
VISIT_REQUIRED_PER_SLOT = 1
CROSS_STAFF_MIN = 2  # 半日兼務: 同日で daycare & visit を跨ぐ人数


@dataclass
class Assignment:
    """1 件の割当。"""
    date: date
    slot: str  # "AM" | "PM"
    department: str  # "daycare" | "visit"
    employee_id: str


@dataclass
class MissingSlot:
    """解なし時の不足枠（docs/07）。"""
    date: date
    slot: str
    department: str
    required: int
    assigned: int


@dataclass
class SolveResult:
    """求解結果。"""
    status: str  # "ok" | "infeasible"
    assignments: list[Assignment]
    missing_slots: list[MissingSlot]


def solve(inp: ShiftInput) -> SolveResult:
    """
    ハード制約のみで求解する。解があれば assignments を返し、
    解なしなら missing_slots を計算して返す（Phase 3.4 で詳細化可能）。
    """
    model = cp_model.CpModel()
    E = len(inp.employees)
    D = len(inp.dates)
    if E == 0 or D == 0:
        return SolveResult(status="ok", assignments=[], missing_slots=[])

    # x[e, d, slot, dept] = 1  iff  職員 e が日 d の slot で dept に割当
    x: dict[tuple[int, int, int, int], Any] = {}
    for e in range(E):
        for d in range(D):
            for slot in (SLOT_AM, SLOT_PM):
                for dept in (DEPT_DAYCARE, DEPT_VISIT):
                    x[e, d, slot, dept] = model.NewBoolVar(f"x_{e}_{d}_{slot}_{dept}")

    emp = inp.employees
    avail = inp.availability
    do_set = inp.day_offs
    dates = inp.dates

    # 1) デイ: 各 (d, slot) で daycare >= 4
    for d in range(D):
        for slot in (SLOT_AM, SLOT_PM):
            model.Add(
                sum(x[e, d, slot, DEPT_DAYCARE] for e in range(E)) >= DAYCARE_REQUIRED
            )

    # 2) 訪問: 各 (d, AM) と (d, PM) で visit >= 1
    for d in range(D):
        model.Add(sum(x[e, d, SLOT_AM, DEPT_VISIT] for e in range(E)) >= VISIT_REQUIRED_PER_SLOT)
        model.Add(sum(x[e, d, SLOT_PM, DEPT_VISIT] for e in range(E)) >= VISIT_REQUIRED_PER_SLOT)

    # 3) 1 人 1 スロット 1 部門まで
    for e in range(E):
        for d in range(D):
            for slot in (SLOT_AM, SLOT_PM):
                model.Add(
                    x[e, d, slot, DEPT_DAYCARE] + x[e, d, slot, DEPT_VISIT] <= 1
                )

    # 4) 希望休
    for e in range(E):
        eid = str(emp[e]["id"])
        for d in range(D):
            if is_day_off(do_set, eid, dates[d]):
                model.Add(
                    sum(
                        x[e, d, slot, dept]
                        for slot in (SLOT_AM, SLOT_PM)
                        for dept in (DEPT_DAYCARE, DEPT_VISIT)
                    ) == 0
                )

    # 5) 曜日・fixed_holiday（勤務可能でないスロットは 0）
    for e in range(E):
        for d in range(D):
            for slot, slot_name in ((SLOT_AM, "AM"), (SLOT_PM, "PM")):
                if not can_work_slot(emp[e], avail, dates[d], slot_name):
                    model.Add(
                        x[e, d, slot, DEPT_DAYCARE] + x[e, d, slot, DEPT_VISIT] == 0
                    )

    # 6) visit は can_visit のみ
    for e in range(E):
        if not emp[e].get("can_visit", False):
            model.Add(
                sum(
                    x[e, d, slot, DEPT_VISIT]
                    for d in range(D)
                    for slot in (SLOT_AM, SLOT_PM)
                ) == 0
            )

    # 7) 半日兼務: 各日 d で「その日 daycare と visit の両方に就く人数」>= 2（can_visit のみ）
    y: dict[tuple[int, int], Any] = {}
    for e in range(E):
        for d in range(D):
            y[e, d] = model.NewBoolVar(f"y_{e}_{d}")
    for e in range(E):
        for d in range(D):
            # y[e,d] = 1 iff e does both daycare and visit on day d (linearization)
            daycare_any = sum(x[e, d, slot, DEPT_DAYCARE] for slot in (SLOT_AM, SLOT_PM))
            visit_any = sum(x[e, d, slot, DEPT_VISIT] for slot in (SLOT_AM, SLOT_PM))
            model.Add(y[e, d] <= daycare_any)
            model.Add(y[e, d] <= visit_any)
            model.Add(y[e, d] >= daycare_any + visit_any - 1)
            if not emp[e].get("can_visit", False):
                model.Add(y[e, d] == 0)
    for d in range(D):
        model.Add(sum(y[e, d] for e in range(E)) >= CROSS_STAFF_MIN)

    # 目的関数: 割当総数最小化（均等化の簡易版）
    model.Minimize(
        sum(
            x[e, d, slot, dept]
            for e in range(E)
            for d in range(D)
            for slot in (SLOT_AM, SLOT_PM)
            for dept in (DEPT_DAYCARE, DEPT_VISIT)
        )
    )

    solver = cp_model.CpSolver()
    status = solver.Solve(model)

    if status in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        assignments: list[Assignment] = []
        for e in range(E):
            eid = str(emp[e]["id"])
            for d in range(D):
                for slot in (SLOT_AM, SLOT_PM):
                    for dept in (DEPT_DAYCARE, DEPT_VISIT):
                        if solver.Value(x[e, d, slot, dept]) == 1:
                            assignments.append(
                                Assignment(
                                    date=dates[d],
                                    slot=SLOT_NAMES[slot],
                                    department=DEPT_NAMES[dept],
                                    employee_id=eid,
                                )
                            )
        return SolveResult(status="ok", assignments=assignments, missing_slots=[])
    else:
        # 解なし: 不足枠を簡易計算（制約ごとの不足を列挙は Phase 3.4 で拡張可）
        missing_slots = _compute_missing_slots(inp)
        return SolveResult(status="infeasible", assignments=[], missing_slots=missing_slots)


def _compute_missing_slots(inp: ShiftInput) -> list[MissingSlot]:
    """解なし時に、枠ごとの必要数と割当可能人数の差を返す簡易版。"""
    missing: list[MissingSlot] = []
    E = len(inp.employees)
    emp = inp.employees
    avail = inp.availability
    do_set = inp.day_offs
    dates = inp.dates

    for d_idx, d in enumerate(dates):
        for slot, slot_name in ((SLOT_AM, "AM"), (SLOT_PM, "PM")):
            # daycare: 必要 4、割当可能な人数
            can_daycare = sum(
                1
                for e in range(E)
                if not is_day_off(do_set, str(emp[e]["id"]), d)
                and can_work_slot(emp[e], avail, d, slot_name)
            )
            if can_daycare < DAYCARE_REQUIRED:
                missing.append(
                    MissingSlot(
                        date=d,
                        slot=slot_name,
                        department="daycare",
                        required=DAYCARE_REQUIRED,
                        assigned=can_daycare,
                    )
                )
        for slot, slot_name in ((SLOT_AM, "AM"), (SLOT_PM, "PM")):
            can_visit = sum(
                1
                for e in range(E)
                if emp[e].get("can_visit", False)
                and not is_day_off(do_set, str(emp[e]["id"]), d)
                and can_work_slot(emp[e], avail, d, slot_name)
            )
            if can_visit < VISIT_REQUIRED_PER_SLOT:
                missing.append(
                    MissingSlot(
                        date=d,
                        slot=slot_name,
                        department="visit",
                        required=VISIT_REQUIRED_PER_SLOT,
                        assigned=can_visit,
                    )
                )
    return missing

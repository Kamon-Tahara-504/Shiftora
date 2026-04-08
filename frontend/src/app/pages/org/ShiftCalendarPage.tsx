"use client";

import { useState, useMemo, useEffect } from "react";
import { ChevronLeft, ChevronRight, CalendarPlus } from "lucide-react";
import { OrgSidebar } from "@/components/org/OrgSidebar";
import { OrgPageHeader } from "@/components/org/OrgPageHeader";
import { useShifts } from "@/hooks/useShifts";
import { useEmployees } from "@/hooks/useEmployees";

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

type CalendarDay = {
  date: number;
  month: number;
  year: number;
  isCurrentMonth: boolean;
  dateString: string;
};

function getCalendarDays(year: number, month: number): CalendarDay[] {
  const first = new Date(year, month - 1, 1);
  const startOffset = first.getDay();
  const startDate = 1 - startOffset;
  const days: CalendarDay[] = [];
  for (let i = 0; i < 42; i++) {
    const d = startDate + i;
    const dateObj = new Date(year, month - 1, d);
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, "0");
    const day = String(dateObj.getDate()).padStart(2, "0");
    days.push({
      date: dateObj.getDate(),
      month: dateObj.getMonth() + 1,
      year: dateObj.getFullYear(),
      isCurrentMonth: dateObj.getMonth() === month - 1,
      dateString: `${y}-${m}-${day}`,
    });
  }
  return days;
}

export default function ShiftCalendarPage() {
  const today = new Date();
  const [displayYear, setDisplayYear] = useState(today.getFullYear());
  const [displayMonth, setDisplayMonth] = useState(today.getMonth() + 1);
  const { shifts, isLoading: isShiftsLoading, fetchShifts, patchShift } = useShifts();
  const { employees } = useEmployees();
  const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null);
  const [editEmployeeId, setEditEmployeeId] = useState("");
  const [editDepartment, setEditDepartment] = useState<"daycare" | "visit">("daycare");
  const [editSlot, setEditSlot] = useState<"AM" | "PM">("AM");
  const [editError, setEditError] = useState<string | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  useEffect(() => {
    fetchShifts(displayYear, displayMonth);
  }, [displayYear, displayMonth, fetchShifts]);

  const calendarDays = useMemo(
    () => getCalendarDays(displayYear, displayMonth),
    [displayYear, displayMonth]
  );

  const shiftsByDate = useMemo(() => {
    const map: Record<string, typeof shifts> = {};
    shifts.forEach((s) => {
      if (!map[s.date]) map[s.date] = [];
      map[s.date].push(s);
    });
    return map;
  }, [shifts]);

  const employeeMap = useMemo(() => {
    const map: Record<string, typeof employees[0]> = {};
    employees.forEach((e) => {
      map[e.id] = e;
    });
    return map;
  }, [employees]);

  const stats = useMemo(() => {
    const daycareCount = shifts.filter(s => s.department === "daycare").length;
    const visitCount = shifts.filter(s => s.department === "visit").length;
    return { daycareCount, visitCount };
  }, [shifts]);

  const selectedShift = useMemo(
    () => shifts.find((item) => item.id === selectedShiftId) ?? null,
    [shifts, selectedShiftId],
  );

  const goPrevMonth = () => {
    if (displayMonth === 1) {
      setDisplayYear((y) => y - 1);
      setDisplayMonth(12);
    } else {
      setDisplayMonth((m) => m - 1);
    }
  };

  const goNextMonth = () => {
    if (displayMonth === 12) {
      setDisplayYear((y) => y + 1);
      setDisplayMonth(1);
    } else {
      setDisplayMonth((m) => m + 1);
    }
  };

  const monthLabel = `${displayYear}年${displayMonth}月`;

  useEffect(() => {
    if (!selectedShift) return;
    setEditEmployeeId(selectedShift.employee_id);
    setEditDepartment(selectedShift.department);
    setEditSlot(selectedShift.slot);
    setEditError(null);
  }, [selectedShift]);

  async function handleSaveShiftEdit() {
    if (!selectedShift) return;
    setEditError(null);
    if (!editEmployeeId) {
      setEditError("担当職員を選択してください。");
      return;
    }
    setIsSavingEdit(true);
    try {
      await patchShift(selectedShift.id, {
        employee_id: editEmployeeId,
        department: editDepartment,
        slot: editSlot,
      });
      await fetchShifts(displayYear, displayMonth);
      setSelectedShiftId(null);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "シフト更新に失敗しました。");
    } finally {
      setIsSavingEdit(false);
    }
  }

  return (
    <div className="bg-background-light font-display text-slate-900 antialiased h-screen overflow-hidden flex">
      <OrgSidebar />

      <main className="flex-1 h-screen overflow-y-auto bg-background-light p-8">
        <div className="max-w-6xl mx-auto w-full">
          <OrgPageHeader
            title="シフトカレンダー"
            description={
              <div className="flex items-center gap-4 text-slate-500 text-xs md:text-sm mt-1">
                <div className="flex items-center gap-2">
                  <span className="size-2 md:size-3 rounded-full bg-primary" />
                  <span>デイサービス</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="size-2 md:size-3 rounded-full bg-purple-500" />
                  <span>訪問介護</span>
                </div>
              </div>
            }
            actions={
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center bg-white rounded-lg border border-slate-200 px-3 py-1.5 gap-4">
                  <button
                    type="button"
                    onClick={goPrevMonth}
                    className="p-1 hover:text-primary transition-colors"
                    aria-label="前月"
                  >
                    <ChevronLeft className="size-4 md:size-5" />
                  </button>
                  <span className="text-xs md:text-sm font-bold min-w-[100px] md:min-w-[120px] text-center">
                    {monthLabel}
                  </span>
                  <button
                    type="button"
                    onClick={goNextMonth}
                    className="p-1 hover:text-primary transition-colors"
                    aria-label="翌月"
                  >
                    <ChevronRight className="size-4 md:size-5" />
                  </button>
                </div>
                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-2 px-4 md:px-5 py-2 md:py-2.5 bg-primary text-white text-xs md:text-sm font-bold rounded-lg hover:bg-primary/90 shadow-sm shadow-primary/20"
                >
                  <CalendarPlus className="size-4 md:size-5" />
                  <span>シフトを追加</span>
                </button>
              </div>
            }
          />

          {/* カレンダーグリッド */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-8">
            <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
              {WEEKDAYS.map((day) => (
                <div
                  key={day}
                  className="py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-500"
                >
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 auto-rows-fr">
              {calendarDays.map((cell, index) => {
                const isLastInRow = (index + 1) % 7 === 0;
                const isCurrentMonth = cell.isCurrentMonth;
                const dateShifts = shiftsByDate[cell.dateString] || [];

                return (
                  <div
                    key={`${cell.year}-${cell.month}-${cell.date}-${index}`}
                    className={`min-h-[140px] p-2 border-b border-slate-200 ${
                      isLastInRow ? "" : "border-r border-slate-200"
                    } ${!isCurrentMonth ? "bg-slate-50/50" : ""}`}
                  >
                    <span
                      className={`text-sm ${
                        isCurrentMonth ? "font-bold" : "font-medium text-slate-400"
                      }`}
                    >
                      {cell.date}
                    </span>
                    <div className="mt-2 flex flex-col gap-1">
                      {dateShifts.map((s) => {
                        const employee = employeeMap[s.employee_id];
                        const isDaycare = s.department === "daycare";
                        return (
                          <div
                            key={s.id}
                            onClick={() => setSelectedShiftId(s.id)}
                            className={`text-[10px] px-1.5 py-0.5 rounded flex items-center justify-between border ${
                              isDaycare 
                                ? "bg-primary/10 text-primary border-primary/20" 
                                : "bg-purple-50 text-purple-600 border-purple-100"
                            } cursor-pointer`}
                          >
                            <span className="truncate font-medium">{employee?.name || "???"}</span>
                            <span className="shrink-0 scale-90">{s.slot}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 統計 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">デイサービス</p>
              <h4 className="text-2xl font-black text-primary">{isShiftsLoading ? "..." : stats.daycareCount} 枠</h4>
              <p className="text-xs text-slate-500 mt-1">今月の総割り当て数</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">訪問介護</p>
              <h4 className="text-2xl font-black text-purple-500">{isShiftsLoading ? "..." : stats.visitCount} 枠</h4>
              <p className="text-xs text-slate-500 mt-1">今月の総割り当て数</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex items-center justify-center">
              <p className="text-xs text-slate-400">PDF書き出し機能は今後実装予定です</p>
            </div>
          </div>

          {selectedShift ? (
            <section className="mt-8 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center justify-between gap-3 mb-4">
                <h3 className="text-sm font-bold text-slate-800">シフト編集</h3>
                <button
                  type="button"
                  onClick={() => setSelectedShiftId(null)}
                  className="text-xs text-slate-500 hover:text-slate-700"
                >
                  閉じる
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <label className="text-xs text-slate-600">
                  担当職員
                  <select
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    value={editEmployeeId}
                    onChange={(event) => setEditEmployeeId(event.target.value)}
                  >
                    {employees.map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {employee.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-xs text-slate-600">
                  部門
                  <select
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    value={editDepartment}
                    onChange={(event) => setEditDepartment(event.target.value as "daycare" | "visit")}
                  >
                    <option value="daycare">デイサービス</option>
                    <option value="visit">訪問介護</option>
                  </select>
                </label>
                <label className="text-xs text-slate-600">
                  時間帯
                  <select
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    value={editSlot}
                    onChange={(event) => setEditSlot(event.target.value as "AM" | "PM")}
                  >
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                </label>
              </div>
              {editError ? (
                <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {editError}
                </p>
              ) : null}
              <div className="mt-4">
                <button
                  type="button"
                  onClick={handleSaveShiftEdit}
                  disabled={isSavingEdit}
                  className="inline-flex items-center justify-center px-4 py-2 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary/90 disabled:opacity-60"
                >
                  {isSavingEdit ? "保存中..." : "変更を保存"}
                </button>
              </div>
            </section>
          ) : null}
        </div>
      </main>
    </div>
  );
}


"use client";

import { useMemo, useState, useEffect } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { StaffSidebar } from "@/components/staff/StaffSidebar";
import { OrgPageHeader } from "@/components/org/OrgPageHeader";
import { useMyShifts } from "@/hooks/useMyShifts";
import { type ShiftAssignment } from "@/services/shiftService";

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

type CalendarCell = {
  key: string;
  date: number;
  month: number;
  year: number;
  isCurrentMonth: boolean;
  dateString: string;
};

function getMonthCells(year: number, month: number): CalendarCell[] {
  const first = new Date(year, month - 1, 1);
  const startOffset = first.getDay();
  const startDate = 1 - startOffset;
  const cells: CalendarCell[] = [];

  for (let i = 0; i < 42; i += 1) {
    const dateObj = new Date(year, month - 1, startDate + i);
    const cellYear = dateObj.getFullYear();
    const cellMonth = dateObj.getMonth() + 1;
    const cellDate = dateObj.getDate();
    const y = cellYear;
    const m = String(cellMonth).padStart(2, "0");
    const d = String(cellDate).padStart(2, "0");
    cells.push({
      key: `${cellYear}-${cellMonth}-${cellDate}-${i}`,
      date: cellDate,
      month: cellMonth,
      year: cellYear,
      isCurrentMonth: cellMonth === month,
      dateString: `${y}-${m}-${d}`,
    });
  }

  return cells;
}

function EventBadge({ event }: { event: ShiftAssignment }) {
  const isDaycare = event.department === "daycare";
  const label = isDaycare ? "デイ" : "訪問";
  const className = isDaycare
    ? "bg-primary/10 text-primary border-primary/20"
    : "bg-purple-50 text-purple-600 border-purple-100";

  return (
    <div className={`text-[10px] p-1 rounded font-bold leading-tight border ${className}`}>
      {event.slot}: {label}
    </div>
  );
}

export default function MyShiftsPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const { shifts, fetchMyShifts } = useMyShifts();

  useEffect(() => {
    fetchMyShifts(year, month);
  }, [year, month, fetchMyShifts]);

  const cells = useMemo(() => getMonthCells(year, month), [year, month]);
  const monthLabel = `${year}年 ${month}月`;

  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const shiftsByDate = useMemo(() => {
    const map: Record<string, ShiftAssignment[]> = {};
    shifts.forEach((s) => {
      if (!map[s.date]) map[s.date] = [];
      map[s.date].push(s);
    });
    return map;
  }, [shifts]);

  const todayShifts = useMemo(() => shiftsByDate[todayStr] || [], [shiftsByDate, todayStr]);

  const goPrev = () => {
    if (month === 1) {
      setYear((prev) => prev - 1);
      setMonth(12);
      return;
    }
    setMonth((prev) => prev - 1);
  };

  const goNext = () => {
    if (month === 12) {
      setYear((prev) => prev + 1);
      setMonth(1);
      return;
    }
    setMonth((prev) => prev + 1);
  };

  const goToday = () => {
    setYear(today.getFullYear());
    setMonth(today.getMonth() + 1);
  };

  return (
    <div className="bg-background-light font-display text-slate-900 antialiased h-screen overflow-hidden flex">
      <StaffSidebar />

      <main className="flex-1 h-screen overflow-y-auto bg-background-light p-8">
        <div className="max-w-6xl mx-auto w-full">
          <OrgPageHeader
            title="自分のシフト"
            description="割り当てられたシフトの確認と本日の業務詳細を確認できます。"
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <CalendarDays className="size-5 text-primary" />
                    {monthLabel}
                  </h3>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={goPrev}
                      className="p-1 hover:bg-primary/10 rounded text-slate-600"
                      aria-label="前月"
                    >
                      <ChevronLeft className="size-5" />
                    </button>
                    <button
                      type="button"
                      onClick={goToday}
                      className="px-3 py-1 text-xs font-bold border border-primary/20 rounded hover:bg-primary/5"
                    >
                      今日
                    </button>
                    <button
                      type="button"
                      onClick={goNext}
                      className="p-1 hover:bg-primary/10 rounded text-slate-600"
                      aria-label="翌月"
                    >
                      <ChevronRight className="size-5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-px bg-slate-200 rounded-lg overflow-hidden border border-slate-200">
                  {WEEKDAYS.map((day) => (
                    <div
                      key={day}
                      className={`bg-slate-50 p-2 text-center text-xs font-bold ${
                        day === "日"
                          ? "text-red-500"
                          : day === "土"
                            ? "text-blue-500"
                            : "text-slate-700"
                      }`}
                    >
                      {day}
                    </div>
                  ))}

                  {cells.map((cell) => {
                    const dateShifts = shiftsByDate[cell.dateString] || [];
                    const isToday = cell.dateString === todayStr;

                    return (
                      <div
                        key={cell.key}
                        className={`bg-white min-h-[100px] p-2 flex flex-col gap-1 ${
                          cell.isCurrentMonth ? "" : "opacity-40"
                        } ${isToday ? "bg-orange-50 border-2 border-primary shadow-inner" : ""}`}
                      >
                        <span className={`text-xs ${isToday ? "font-bold text-primary" : ""}`}>
                          {cell.date}
                          {isToday ? " (今日)" : ""}
                        </span>
                        {dateShifts.map((s) => (
                          <EventBadge key={s.id} event={s} />
                        ))}
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className="grid grid-cols-1 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <p className="text-slate-500 text-xs font-bold mb-1">今月の勤務日数</p>
                  <h4 className="text-2xl font-bold text-primary">{shifts.length} 日</h4>
                </div>
              </section>
            </div>

            <div className="space-y-8">
              <section className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="bg-primary px-4 py-3 flex items-center justify-between">
                  <h3 className="text-white font-bold">本日の詳細</h3>
                  <span className="text-white/80 text-xs">{today.getMonth() + 1}月{today.getDate()}日 ({WEEKDAYS[today.getDay()]})</span>
                </div>
                <div className="p-4 space-y-6">
                  {todayShifts.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-8">本日の勤務はありません。</p>
                  ) : (
                    todayShifts.map((s) => {
                      const isDaycare = s.department === "daycare";
                      return (
                        <div key={s.id} className={`relative pl-6 border-l-2 ${isDaycare ? "border-primary" : "border-purple-500"}`}>
                          <div className={`absolute -left-1.5 top-0 size-3 rounded-full ring-4 ring-white ${isDaycare ? "bg-primary" : "bg-purple-500"}`} />
                          <div className="flex items-center justify-between mb-2">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded ${isDaycare ? "bg-primary/20 text-primary" : "bg-purple-100 text-purple-600"}`}>
                              {s.slot}
                            </span>
                          </div>
                          <h4 className="font-bold mb-1">{isDaycare ? "デイサービス勤務" : "訪問介護勤務"}</h4>
                          <p className="text-xs text-slate-500 mb-3">
                            部門: {isDaycare ? "デイサービス" : "訪問介護"} / 時間帯: {s.slot}
                          </p>
                        </div>
                      );
                    })
                  )}
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}


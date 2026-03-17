"use client";

import { useMemo, useState } from "react";
import {
  Bell,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Info,
  Users,
} from "lucide-react";
import { StaffSidebar } from "@/components/staff/StaffSidebar";
import { OrgPageHeader } from "@/components/org/OrgPageHeader";

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

type ShiftKind = "day" | "visit";
type ShiftSlot = "AM" | "PM";

type ShiftEvent = {
  slot: ShiftSlot;
  kind: ShiftKind;
};

type ShiftMap = Record<string, ShiftEvent[]>;

type CalendarCell = {
  key: string;
  date: number;
  month: number;
  year: number;
  isCurrentMonth: boolean;
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
    cells.push({
      key: `${cellYear}-${cellMonth}-${cellDate}-${i}`,
      date: cellDate,
      month: cellMonth,
      year: cellYear,
      isCurrentMonth: cellMonth === month,
    });
  }

  return cells;
}

const SHIFT_EVENTS: ShiftMap = {
  "2023-10-4": [
    { slot: "AM", kind: "day" },
    { slot: "PM", kind: "visit" },
  ],
  "2023-10-5": [{ slot: "AM", kind: "day" }],
  "2023-10-6": [{ slot: "PM", kind: "visit" }],
  "2023-10-8": [{ slot: "AM", kind: "day" }],
  "2023-10-13": [
    { slot: "AM", kind: "day" },
    { slot: "PM", kind: "visit" },
  ],
};

function getEvents(year: number, month: number, date: number): ShiftEvent[] {
  return SHIFT_EVENTS[`${year}-${month}-${date}`] ?? [];
}

function EventBadge({ event }: { event: ShiftEvent }) {
  const isDay = event.kind === "day";
  const label = isDay ? "デイ" : "訪問";
  const className = isDay
    ? "bg-primary/10 text-primary"
    : "bg-orange-600/10 text-orange-600";

  return (
    <div className={`text-[10px] p-1 rounded font-bold leading-tight ${className}`}>
      {event.slot}: {label}
    </div>
  );
}

export default function MyShiftsPage() {
  const [year, setYear] = useState(2023);
  const [month, setMonth] = useState(10);

  const cells = useMemo(() => getMonthCells(year, month), [year, month]);
  const monthLabel = `${year}年 ${month}月`;

  const todayKey = "2023-10-13";

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
    setYear(2023);
    setMonth(10);
  };

  return (
    <div className="bg-background-light font-display text-slate-900 antialiased h-screen overflow-hidden flex">
      <div className="h-screen overflow-y-auto">
        <StaffSidebar />
      </div>

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
                    const key = `${cell.year}-${cell.month}-${cell.date}`;
                    const events = getEvents(cell.year, cell.month, cell.date);
                    const isToday = key === todayKey;

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
                        {events.map((event, idx) => (
                          <EventBadge key={`${key}-${idx}`} event={event} />
                        ))}
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <p className="text-slate-500 text-xs font-bold mb-1">今月の総勤務日数</p>
                  <p className="text-2xl font-bold text-primary">22 日</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <p className="text-slate-500 text-xs font-bold mb-1">今月の稼働時間（見込）</p>
                  <p className="text-2xl font-bold text-primary">168.5 h</p>
                </div>
              </section>
            </div>

            <div className="space-y-8">
              <section className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="bg-primary px-4 py-3 flex items-center justify-between">
                  <h3 className="text-white font-bold">本日の詳細</h3>
                  <span className="text-white/80 text-xs">10月13日 (金)</span>
                </div>
                <div className="p-4 space-y-6">
                  <div className="relative pl-6 border-l-2 border-primary">
                    <div className="absolute -left-1.5 top-0 size-3 rounded-full bg-primary ring-4 ring-white" />
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold bg-primary/20 text-primary px-2 py-0.5 rounded">
                        AM
                      </span>
                      <span className="text-sm font-bold">09:00 - 13:00</span>
                    </div>
                    <h4 className="font-bold mb-1">デイサービス勤務</h4>
                    <p className="text-xs text-slate-500 mb-3">担当: フロアA（レクリエーション）</p>
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs">
                      <p className="font-bold mb-1 flex items-center gap-1 text-slate-700">
                        <Users className="size-3.5" />
                        主な利用者
                      </p>
                      <p className="text-slate-600">佐藤 様 / 山田 様 / 田中 様</p>
                    </div>
                  </div>

                  <div className="relative pl-6 border-l-2 border-orange-600">
                    <div className="absolute -left-1.5 top-0 size-3 rounded-full bg-orange-600 ring-4 ring-white" />
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold bg-orange-600/20 text-orange-600 px-2 py-0.5 rounded">
                        PM
                      </span>
                      <span className="text-sm font-bold">14:00 - 18:00</span>
                    </div>
                    <h4 className="font-bold mb-1">訪問介護 (Home Care)</h4>
                    <p className="text-xs text-slate-500 mb-3">移動: 自転車 / 3件</p>
                    <ul className="space-y-2">
                      <li className="flex items-center justify-between p-2 bg-slate-50 rounded-lg text-xs">
                        <span className="text-slate-600">14:30 鈴木 様 (身体)</span>
                        <ChevronRight className="size-4 text-slate-400" />
                      </li>
                      <li className="flex items-center justify-between p-2 bg-slate-50 rounded-lg text-xs">
                        <span className="text-slate-600">16:00 高橋 様 (生活)</span>
                        <ChevronRight className="size-4 text-slate-400" />
                      </li>
                      <li className="flex items-center justify-between p-2 bg-slate-50 rounded-lg text-xs">
                        <span className="text-slate-600">17:15 伊藤 様 (身体)</span>
                        <ChevronRight className="size-4 text-slate-400" />
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="p-4 bg-slate-50 border-t border-slate-100">
                  <button
                    type="button"
                    className="w-full bg-white border border-slate-200 text-slate-700 py-2 rounded-lg text-sm font-bold hover:bg-slate-50 transition-colors shadow-sm"
                  >
                    本日の業務日報を作成
                  </button>
                </div>
              </section>

              <section className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                  <Info className="size-4 text-primary" />
                  連絡事項
                </h3>
                <div className="space-y-3">
                  <div className="p-2 bg-red-50 border-l-4 border-red-500 rounded text-xs">
                    <p className="font-bold text-red-600">シフト変更あり</p>
                    <p className="text-slate-600">10月20日のPMが変更になりました。</p>
                  </div>
                  <div className="p-2 bg-blue-50 border-l-4 border-blue-500 rounded text-xs">
                    <p className="font-bold text-blue-600">全体研修</p>
                    <p className="text-slate-600">10月25日 18:30〜 Web研修あり</p>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

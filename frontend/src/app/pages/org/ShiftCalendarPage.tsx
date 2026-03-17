"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, CalendarPlus } from "lucide-react";
import { OrgSidebar } from "@/components/org/OrgSidebar";

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

type CalendarDay = {
  date: number;
  month: number;
  year: number;
  isCurrentMonth: boolean;
};

function getCalendarDays(year: number, month: number): CalendarDay[] {
  const first = new Date(year, month - 1, 1);
  const startOffset = first.getDay();
  const startDate = 1 - startOffset;
  const days: CalendarDay[] = [];
  for (let i = 0; i < 42; i++) {
    const d = startDate + i;
    const dateObj = new Date(year, month - 1, d);
    days.push({
      date: dateObj.getDate(),
      month: dateObj.getMonth() + 1,
      year: dateObj.getFullYear(),
      isCurrentMonth: dateObj.getMonth() === month - 1,
    });
  }
  return days;
}

export default function ShiftCalendarPage() {
  const [displayYear, setDisplayYear] = useState(2023);
  const [displayMonth, setDisplayMonth] = useState(10);

  const calendarDays = useMemo(
    () => getCalendarDays(displayYear, displayMonth),
    [displayYear, displayMonth]
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

  return (
    <div className="bg-background-light font-display text-slate-900 antialiased h-screen overflow-hidden flex">
      <div className="h-screen overflow-y-auto">
        <OrgSidebar />
      </div>

      <main className="flex-1 h-screen overflow-y-auto bg-background-light p-8">
        <div className="max-w-6xl mx-auto w-full">
          {/* ページヘッダー（タイトル＋凡例＋ツールバー） */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <h2 className="text-3xl font-black tracking-tight mb-2">
                シフトカレンダー
              </h2>
              <div className="flex items-center gap-4 text-slate-500 text-sm">
                <div className="flex items-center gap-2">
                  <span className="size-3 rounded-full bg-primary" />
                  <span>デイサービス</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="size-3 rounded-full bg-purple-500" />
                  <span>訪問介護</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex bg-white rounded-lg border border-slate-200 p-1">
                <button
                  type="button"
                  className="px-4 py-1.5 text-sm font-medium rounded-md hover:bg-slate-50"
                >
                  日
                </button>
                <button
                  type="button"
                  className="px-4 py-1.5 text-sm font-medium rounded-md hover:bg-slate-50"
                >
                  週
                </button>
              </div>
              <div className="flex items-center bg-white rounded-lg border border-slate-200 px-3 py-1.5 gap-4">
                <button
                  type="button"
                  onClick={goPrevMonth}
                  className="p-1 hover:text-primary transition-colors"
                  aria-label="前月"
                >
                  <ChevronLeft className="size-5" />
                </button>
                <span className="text-sm font-bold min-w-[120px] text-center">
                  {monthLabel}
                </span>
                <button
                  type="button"
                  onClick={goNextMonth}
                  className="p-1 hover:text-primary transition-colors"
                  aria-label="翌月"
                >
                  <ChevronRight className="size-5" />
                </button>
              </div>
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary/90 shadow-sm shadow-primary/20"
              >
                <CalendarPlus className="size-5" />
                <span>シフトを追加</span>
              </button>
            </div>
          </div>

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
                    <div className="mt-2 flex flex-col gap-1" />
                  </div>
                );
              })}
            </div>
          </div>

          {/* 職員配置サマリー＋統計 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold">職員配置サマリー</h3>
                <button
                  type="button"
                  className="text-sm text-primary font-bold hover:underline"
                >
                  全リストを表示
                </button>
              </div>
              <div className="space-y-4">
                <div className="p-6 rounded-lg border border-dashed border-slate-200 text-center text-sm text-slate-500">
                  職員配置サマリーのデータは未連携です
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h3 className="text-lg font-bold mb-4">統計</h3>
              <div className="space-y-4">
                <div className="bg-primary/5 rounded-xl p-4 border border-primary/10">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    デイサービス・コーディネーター
                  </p>
                  <div className="flex items-end justify-between">
                    <h4 className="text-3xl font-black text-primary">--</h4>
                    <span className="text-xs font-bold text-slate-500 pb-1">
                      今後14日間
                    </span>
                  </div>
                </div>
                <div className="bg-purple-500/5 rounded-xl p-4 border border-purple-500/10">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    ケア・スペシャリスト
                  </p>
                  <div className="flex items-end justify-between">
                    <h4 className="text-3xl font-black text-purple-500">--</h4>
                    <span className="text-xs font-bold text-slate-500 pb-1">
                      承認待ち
                    </span>
                  </div>
                </div>
                <div className="p-2">
                  <button
                    type="button"
                    className="w-full py-3 rounded-lg border-2 border-slate-200 text-sm font-bold hover:bg-slate-50 transition-colors"
                  >
                    スケジュールを書き出し (PDF)
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

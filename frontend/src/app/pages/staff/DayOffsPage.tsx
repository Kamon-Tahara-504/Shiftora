"use client";

import { useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  PlaneTakeoff,
  Trash2,
  AlertCircle,
  Clock,
} from "lucide-react";
import { StaffSidebar } from "@/components/staff/StaffSidebar";
import { OrgPageHeader } from "@/components/org/OrgPageHeader";
import { useDayOffs } from "@/hooks/useDayOffs";

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

export default function DayOffsPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const { requests, error, addRequest, removeRequest, refresh } = useDayOffs();

  const cells = useMemo(() => getMonthCells(year, month), [year, month]);
  const monthLabel = `${year}年 ${month}月`;

  const toggleDayOff = async (cell: CalendarCell) => {
    if (!cell.isCurrentMonth) return;
    const existing = requests.find((r) => r.date === cell.dateString);

    if (existing) {
      await removeRequest(existing.id);
    } else {
      await addRequest(cell.dateString);
    }
  };

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

  const currentMonthRequests = useMemo(() => {
    return requests
      .filter((r) => {
        const d = new Date(r.date);
        return d.getFullYear() === year && d.getMonth() + 1 === month;
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [requests, year, month]);

  return (
    <div className="bg-background-light font-display text-slate-900 antialiased h-screen overflow-hidden flex">
      <StaffSidebar />

      <main className="flex-1 h-screen overflow-y-auto bg-background-light p-8">
        <div className="max-w-6xl mx-auto w-full">
          <OrgPageHeader
            title="希望休の申請"
            description="カレンダーから日付を選択して、希望休を申請できます。確定後の変更は管理者へ連絡してください。"
          />

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
              <AlertCircle className="size-5 text-red-500" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

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
                    const request = requests.find((r) => r.date === cell.dateString);
                    const isSelected = !!request;

                    return (
                      <div
                        key={cell.key}
                        onClick={() => toggleDayOff(cell)}
                        className={`bg-white min-h-[100px] p-2 flex flex-col gap-1 cursor-pointer transition-all hover:bg-slate-50 ${
                          cell.isCurrentMonth ? "" : "opacity-40 pointer-events-none"
                        } ${
                          isSelected
                            ? "bg-primary/5 ring-2 ring-primary ring-inset"
                            : ""
                        }`}
                      >
                        <span
                          className={`text-xs ${
                            isSelected ? "font-bold text-primary" : ""
                          }`}
                        >
                          {cell.date}
                        </span>
                        {isSelected && (
                          <div className="bg-primary text-white text-[10px] p-1 rounded font-bold leading-tight flex items-center gap-1 mt-auto">
                            <Clock className="size-3" />
                            <span>申請中</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="size-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-bold mb-1">ご注意ください</p>
                  <ul className="list-disc list-inside space-y-1 text-xs opacity-90">
                    <li>申請中の項目は、再度クリックすることで取り消せます。</li>
                    <li>
                      確定済みの希望休を取り消す場合は、直接管理者に連絡してください。
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                  <h3 className="font-bold text-sm text-slate-700">申請中の希望休</h3>
                </div>
                <div className="p-4 flex-1">
                  {currentMonthRequests.length === 0 ? (
                    <div className="py-12 text-center">
                      <PlaneTakeoff className="size-12 text-slate-200 mx-auto mb-3" />
                      <p className="text-xs text-slate-400">申請はありません</p>
                    </div>
                  ) : (
                    <ul className="space-y-3">
                      {currentMonthRequests.map((r) => (
                        <li
                          key={r.id}
                          className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-white shadow-sm"
                        >
                          <div>
                            <p className="text-sm font-bold text-slate-700">
                              {r.date.replace(/-/g, "/")}
                            </p>
                            <p className="text-[10px] font-bold text-primary">
                              申請中
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeRequest(r.id);
                            }}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="p-4 bg-slate-50 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={refresh}
                    className="w-full bg-white border border-slate-200 text-slate-700 py-2.5 rounded-lg text-sm font-bold hover:bg-slate-50 transition-all shadow-sm"
                  >
                    再読み込み
                  </button>
                </div>
              </section>

              <section className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                  <Clock className="size-4 text-primary" />
                  申請状況
                </h3>
                <div className="grid grid-cols-1 gap-4 text-center">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-500 uppercase">
                      今月の申請数
                    </p>
                    <p className="text-xl font-black text-slate-700">
                      {currentMonthRequests.length}
                    </p>
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


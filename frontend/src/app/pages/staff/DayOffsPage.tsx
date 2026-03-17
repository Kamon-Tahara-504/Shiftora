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

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

type DayOffRequest = {
  id: string;
  date: string; // ISO string YYYY-MM-DD
  status: "pending" | "approved" | "rejected";
};

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

const DUMMY_DAY_OFFS: DayOffRequest[] = [
  { id: "1", date: "2023-10-15", status: "approved" },
  { id: "2", date: "2023-10-20", status: "pending" },
];

export default function DayOffsPage() {
  const [year, setYear] = useState(2023);
  const [month, setMonth] = useState(10);
  const [requests, setRequests] = useState<DayOffRequest[]>(DUMMY_DAY_OFFS);

  const cells = useMemo(() => getMonthCells(year, month), [year, month]);
  const monthLabel = `${year}年 ${month}月`;

  const toggleDayOff = (cell: CalendarCell) => {
    if (!cell.isCurrentMonth) return;
    const dateStr = `${cell.year}-${String(cell.month).padStart(2, "0")}-${String(
      cell.date
    ).padStart(2, "0")}`;
    const existing = requests.find((r) => r.date === dateStr);

    if (existing) {
      if (existing.status === "pending") {
        setRequests((prev) => prev.filter((r) => r.id !== existing.id));
      }
    } else {
      setRequests((prev) => [
        ...prev,
        { id: Math.random().toString(36).substr(2, 9), date: dateStr, status: "pending" },
      ]);
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
      <div className="h-screen overflow-y-auto">
        <StaffSidebar />
      </div>

      <main className="flex-1 h-screen overflow-y-auto bg-background-light p-8">
        <div className="max-w-6xl mx-auto w-full">
          <OrgPageHeader
            title="希望休の申請"
            description="カレンダーから日付を選択して、希望休を申請できます。確定後の変更は管理者へ連絡してください。"
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
                    const dateStr = `${cell.year}-${String(cell.month).padStart(
                      2,
                      "0"
                    )}-${String(cell.date).padStart(2, "0")}`;
                    const request = requests.find((r) => r.date === dateStr);
                    const isSelected = request?.status === "pending";
                    const isApproved = request?.status === "approved";

                    return (
                      <div
                        key={cell.key}
                        onClick={() => toggleDayOff(cell)}
                        className={`bg-white min-h-[100px] p-2 flex flex-col gap-1 cursor-pointer transition-all hover:bg-slate-50 ${
                          cell.isCurrentMonth ? "" : "opacity-40 pointer-events-none"
                        } ${
                          isSelected
                            ? "bg-primary/5 ring-2 ring-primary ring-inset"
                            : isApproved
                            ? "bg-emerald-50"
                            : ""
                        }`}
                      >
                        <span
                          className={`text-xs ${
                            isSelected || isApproved ? "font-bold text-primary" : ""
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
                        {isApproved && (
                          <div className="bg-emerald-500 text-white text-[10px] p-1 rounded font-bold leading-tight flex items-center gap-1 mt-auto">
                            <PlaneTakeoff className="size-3" />
                            <span>確定</span>
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
                    <li>希望休は月間最大5日まで申請可能です（デモ版制限なし）。</li>
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
                            <p
                              className={`text-[10px] font-bold ${
                                r.status === "approved"
                                  ? "text-emerald-600"
                                  : "text-primary"
                              }`}
                            >
                              {r.status === "approved" ? "確定済み" : "申請中"}
                            </p>
                          </div>
                          {r.status === "pending" && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setRequests((prev) => prev.filter((x) => x.id !== r.id));
                              }}
                              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="p-4 bg-slate-50 border-t border-slate-200">
                  <button
                    type="button"
                    disabled={currentMonthRequests.length === 0}
                    className="w-full bg-primary text-white py-2.5 rounded-lg text-sm font-bold hover:bg-primary/90 transition-all shadow-sm shadow-primary/20 disabled:opacity-50 disabled:shadow-none"
                  >
                    申請を送信する
                  </button>
                </div>
              </section>

              <section className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                  <Clock className="size-4 text-primary" />
                  申請状況
                </h3>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-500 uppercase">
                      今月の申請
                    </p>
                    <p className="text-xl font-black text-slate-700">
                      {currentMonthRequests.length}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-500 uppercase">
                      残り可能数
                    </p>
                    <p className="text-xl font-black text-slate-700">--</p>
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

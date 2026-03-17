"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { OrgSidebar } from "@/components/org/OrgSidebar";
import { OrgPageHeader } from "@/components/org/OrgPageHeader";
import { CheckCircle2, History, Info, TrendingUp, Users, Zap, AlertCircle } from "lucide-react";
import { useShiftGeneration } from "@/hooks/useShiftGeneration";
import { useEmployees } from "@/hooks/useEmployees";

export default function ShiftGeneratePage() {
  const router = useRouter();
  const { isGenerating, error, infeasibleData, triggerGeneration } = useShiftGeneration();
  const { employees } = useEmployees();
  
  const today = new Date();
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1);

  const handleGenerate = async () => {
    const success = await triggerGeneration(selectedYear, selectedMonth);
    if (success) {
      router.push("/shift/calendar");
    }
  };

  return (
    <div className="bg-background-light font-display text-slate-900 antialiased h-screen overflow-hidden flex">
      <OrgSidebar />

      <main className="flex-1 h-screen overflow-y-auto bg-background-light p-8">
        <div className="max-w-6xl mx-auto w-full">
          <OrgPageHeader
            title="シフト生成"
            description="AIエンジンを使用して、スタッフの空き状況、勤続年数、労働法に基づいてシフトを自動的に割り当てます。"
            actions={
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-white text-sm md:text-base font-bold rounded-full hover:bg-primary/90 transition-all shadow-sm shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Zap className={`size-5 md:size-6 ${isGenerating ? "animate-pulse" : ""}`} />
                <span>{isGenerating ? "生成中..." : "シフトを生成する"}</span>
              </button>
            }
          />

          {error && (
            <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="size-5 text-red-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-bold text-red-800">{error}</p>
                {infeasibleData && (
                  <div className="mt-2 space-y-1">
                    <p className="text-xs text-red-700 font-medium">不足している枠:</p>
                    <ul className="text-xs text-red-600 list-disc list-inside">
                      {infeasibleData.missing_slots.map((slot, i) => (
                        <li key={i}>
                          {slot.date} ({slot.slot}): {slot.department === "daycare" ? "デイサービス" : "訪問介護"} 
                          - 必要: {slot.required}名 / 割当: {slot.assigned}名
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  有効なスタッフ
                </span>
                <Users className="size-4 text-primary" />
              </div>
              <p className="text-xl font-bold">{employees.filter(e => e.status === "active").length} 名</p>
              <p className="text-sm text-slate-500">スケジューリング準備完了</p>
            </div>
          </section>

          <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-bold">スケジュールパラメータ</h3>
            </div>

            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div className="space-y-4">
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">
                      年を選択
                    </span>
                    <select
                      className="mt-1 block w-full rounded-lg border border-slate-200 bg-background-light px-3.5 py-2.5 text-sm text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    >
                      <option value={2024}>2024年</option>
                      <option value={2025}>2025年</option>
                      <option value={2026}>2026年</option>
                    </select>
                  </label>

                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">
                      月を選択
                    </span>
                    <select
                      className="mt-1 block w-full rounded-lg border border-slate-200 bg-background-light px-3.5 py-2.5 text-sm text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                        <option key={m} value={m}>{m}月</option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="bg-slate-50 p-6 rounded-xl border border-dashed border-slate-200 flex flex-col justify-center">
                  <h4 className="font-bold text-sm mb-3 flex items-center gap-2">
                    <Info className="size-4 text-primary" />
                    クイックサマリー
                  </h4>
                  <ul className="space-y-2 text-sm text-slate-600">
                    <li className="flex justify-between">
                      <span>対象スタッフ数:</span>
                      <span className="font-medium text-slate-900">{employees.filter(e => e.status === "active").length} 名</span>
                    </li>
                    <li className="flex justify-between">
                      <span>対象期間:</span>
                      <span className="font-medium text-slate-900">{selectedYear}年{selectedMonth}月</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="flex flex-col items-center gap-4 py-4">
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="w-full md:w-auto px-12 py-4 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all active:scale-95 flex items-center justify-center gap-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Zap className={`size-6 ${isGenerating ? "animate-pulse" : ""}`} />
                  <span>{isGenerating ? "生成中..." : "シフトを生成する"}</span>
                </button>
                <p className="text-xs text-slate-400 text-center">
                  注：これはシフトを即座に公開するものではありません。生成後カレンダーで確認・修正できます。
                </p>
              </div>
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}



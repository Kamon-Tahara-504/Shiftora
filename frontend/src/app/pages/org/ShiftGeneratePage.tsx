"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { OrgSidebar } from "@/components/org/OrgSidebar";
import { OrgPageHeader } from "@/components/org/OrgPageHeader";
import { Info, Users, Zap } from "lucide-react";
import { useToast } from "@/context/ToastContext";
import { useShiftGeneration } from "@/hooks/useShiftGeneration";
import { useEmployees } from "@/hooks/useEmployees";

export default function ShiftGeneratePage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { isGenerating, error, infeasibleData, triggerGeneration, clearFeedback } = useShiftGeneration();
  const { employees } = useEmployees();

  const today = new Date();
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1);
  const yearOptions = [today.getFullYear() - 1, today.getFullYear(), today.getFullYear() + 1];
  const activeStaffCount = useMemo(
    () => employees.filter((employee) => employee.status === "active").length,
    [employees],
  );
  const canGenerate = activeStaffCount > 0 && !isGenerating;
  const missingSlotsPreview = infeasibleData?.missing_slots.slice(0, 20) ?? [];

  useEffect(() => {
    if (!error) return;
    if (infeasibleData) {
      showToast("シフトを生成できませんでした。ページ下部の不足枠を確認してください。", {
        variant: "error",
        durationMs: 5000,
      });
      return;
    }
    showToast(error, { variant: "error", durationMs: 5000 });
  }, [error, infeasibleData, showToast]);

  useEffect(() => {
    clearFeedback();
  }, [selectedYear, selectedMonth, clearFeedback]);

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
                disabled={!canGenerate}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-white text-sm md:text-base font-bold rounded-full hover:bg-primary/90 transition-all shadow-sm shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Zap className={`size-5 md:size-6 ${isGenerating ? "animate-pulse" : ""}`} />
                <span>{isGenerating ? "生成中..." : "シフトを生成する"}</span>
              </button>
            }
          />

          <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  有効なスタッフ
                </span>
                <Users className="size-4 text-primary" />
              </div>
              <p className="text-xl font-bold">{activeStaffCount} 名</p>
              <p className="text-sm text-slate-500">
                {activeStaffCount > 0 ? "スケジューリング準備完了" : "職員管理で有効職員を設定してください"}
              </p>
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
                      {yearOptions.map((year) => (
                        <option key={year} value={year}>
                          {year}年
                        </option>
                      ))}
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
                      <span className="font-medium text-slate-900">{activeStaffCount} 名</span>
                    </li>
                    <li className="flex justify-between">
                      <span>対象期間:</span>
                      <span className="font-medium text-slate-900">{selectedYear}年{selectedMonth}月</span>
                    </li>
                  </ul>
                  <p className="mt-4 text-xs text-slate-500 leading-relaxed">
                    希望休はスタッフが希望休画面から事前に申請してください。申請済みの希望休は生成時に考慮されます。
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-center gap-4 py-4">
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={!canGenerate}
                  className="w-full md:w-auto px-12 py-4 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all active:scale-95 flex items-center justify-center gap-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Zap className={`size-6 ${isGenerating ? "animate-pulse" : ""}`} />
                  <span>{isGenerating ? "生成中..." : "シフトを生成する"}</span>
                </button>
                <p className="text-xs text-slate-400 text-center">
                  注：これはシフトを即座に公開するものではありません。生成後カレンダーで確認・修正できます。
                </p>
                {!canGenerate ? (
                  <p className="text-xs text-amber-700 text-center">
                    有効なスタッフがいないため、シフトを生成できません。
                  </p>
                ) : null}
              </div>
            </div>
          </section>

          {infeasibleData ? (
            <section className="mt-8 bg-white rounded-xl border border-rose-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-rose-100 bg-rose-50/60">
                <h3 className="text-base font-bold text-rose-800">不足枠の確認</h3>
                <p className="mt-1 text-xs text-rose-700">
                  条件を満たせない枠が {infeasibleData.missing_slots.length} 件あります。
                </p>
              </div>
              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="py-2 text-xs font-bold text-slate-500">日付</th>
                        <th className="py-2 text-xs font-bold text-slate-500">時間帯</th>
                        <th className="py-2 text-xs font-bold text-slate-500">部署</th>
                        <th className="py-2 text-xs font-bold text-slate-500 text-right">不足人数</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {missingSlotsPreview.map((slot) => (
                        <tr key={`${slot.date}-${slot.slot}-${slot.department}`}>
                          <td className="py-2 text-sm text-slate-700">{slot.date}</td>
                          <td className="py-2 text-sm text-slate-700">
                            {slot.slot === "AM" ? "午前" : "午後"}
                          </td>
                          <td className="py-2 text-sm text-slate-700">
                            {slot.department === "daycare" ? "デイサービス" : "訪問介護"}
                          </td>
                          <td className="py-2 text-sm text-slate-900 font-semibold text-right">
                            {Math.max(slot.required - slot.assigned, 0)}名
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {infeasibleData.missing_slots.length > missingSlotsPreview.length ? (
                  <p className="mt-3 text-xs text-slate-500">
                    他 {infeasibleData.missing_slots.length - missingSlotsPreview.length} 件の不足枠があります。
                  </p>
                ) : null}
              </div>
            </section>
          ) : null}

        </div>
      </main>
    </div>
  );
}



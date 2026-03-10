"use client";

import { OrgSidebar } from "@/components/org/OrgSidebar";
import { OrgPageHeader } from "@/components/org/OrgPageHeader";
import { CheckCircle2, History, Info, TrendingUp, Users, Zap } from "lucide-react";

export default function ShiftGeneratePage() {
  return (
    <div className="bg-background-light font-display text-slate-900 antialiased min-h-screen flex">
      <OrgSidebar />

      <main className="flex-1 overflow-y-auto bg-background-light p-8">
        <div className="max-w-6xl mx-auto w-full">
          <OrgPageHeader
            title="シフト生成"
            description="AIエンジンを使用して、スタッフの空き状況、勤続年数、労働法に基づいてシフトを自動的に割り当てます。"
            actions={
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-white text-sm md:text-base font-bold rounded-full hover:bg-primary/90 transition-all shadow-sm shadow-primary/20"
              >
                <Zap className="size-5 md:size-6" />
                <span>シフトを生成する</span>
              </button>
            }
          />

          <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  最終実行
                </span>
                <CheckCircle2 className="size-4 text-emerald-500" />
              </div>
              <p className="text-xl font-bold">2023年10月24日</p>
              <p className="text-sm text-slate-500">システムにより生成</p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  有効なスタッフ
                </span>
                <Users className="size-4 text-primary" />
              </div>
              <p className="text-xl font-bold">142 名</p>
              <p className="text-sm text-slate-500">スケジューリング準備完了</p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  カバレッジ目標
                </span>
                <TrendingUp className="size-4 text-amber-500" />
              </div>
              <p className="text-xl font-bold">98.5%</p>
              <p className="text-sm text-slate-500">平均的な履歴精度</p>
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
                      月を選択
                    </span>
                    <select
                      className="mt-1 block w-full rounded-lg border border-slate-200 bg-background-light px-3.5 py-2.5 text-sm text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      defaultValue="2024-11"
                    >
                      <optgroup label="月">
                        <option value="2024-4">4月</option>
                        <option value="2024-5">5月</option>
                        <option value="2024-6">6月</option>
                        <option value="2024-7">7月</option>
                        <option value="2024-8">8月</option>
                        <option value="2024-9">9月</option>
                        <option value="2024-10">10月</option>
                        <option value="2024-11">11月</option>
                        <option value="2024-12">12月</option>
                      </optgroup>
                    </select>
                  </label>

                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">
                      年を選択
                    </span>
                    <select
                      className="mt-1 block w-full rounded-lg border border-slate-200 bg-background-light px-3.5 py-2.5 text-sm text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      defaultValue="2024"
                    >
                      <option value="2023">2023年</option>
                      <option value="2024">2024年</option>
                      <option value="2025">2025年</option>
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
                      <span>合計労働日数:</span>
                      <span className="font-medium text-slate-900">22 日</span>
                    </li>
                    <li className="flex justify-between">
                      <span>推定シフト数:</span>
                      <span className="font-medium text-slate-900">484</span>
                    </li>
                    <li className="flex justify-between">
                      <span>休暇中のスタッフ:</span>
                      <span className="font-medium text-slate-900">12 名</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="flex flex-col items-center gap-4 py-4">
                <button
                  type="button"
                  className="w-full md:w-auto px-12 py-4 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all active:scale-95 flex items-center justify-center gap-3 text-lg"
                >
                  <Zap className="size-6" />
                  <span>シフトを生成する</span>
                </button>
                <p className="text-xs text-slate-400 text-center">
                  注：これはシフトを即座に公開するものではありません。ドラフトを確認する機会があります。
                </p>
              </div>
            </div>

            <div className="bg-slate-50 px-6 py-4 border-t border-slate-200">
              <div className="flex items-center gap-4">
                <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <History className="size-6" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-bold">最近の生成履歴</h4>
                  <p className="text-xs text-slate-500 truncate">
                    Oct 2024 (Generated 3 days ago) · Sept 2024 (Generated 34
                    days ago)
                  </p>
                </div>
                <button
                  type="button"
                  className="ml-auto text-primary text-sm font-semibold hover:underline"
                >
                  履歴を表示
                </button>
              </div>
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}


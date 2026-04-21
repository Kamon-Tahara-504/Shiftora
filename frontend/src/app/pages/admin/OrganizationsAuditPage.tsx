"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Building2, CheckCircle2, CreditCard, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/hooks/useAuth";
import { adminListOrganizationAudit, type OrganizationAuditItem } from "@/services/authService";

const ALLOWED_SYSTEM_ROLES = new Set(["super_admin", "support_admin"]);

export default function OrganizationsAuditPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { user, isLoading } = useAuth();
  const [rows, setRows] = useState<OrganizationAuditItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (!user.system_role || !ALLOWED_SYSTEM_ROLES.has(user.system_role)) {
      router.replace("/");
      return;
    }
    async function load() {
      setLoading(true);
      try {
        setRows(await adminListOrganizationAudit());
      } catch (err) {
        showToast(err instanceof Error ? err.message : "組織監査一覧の取得に失敗しました。", { variant: "error" });
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [isLoading, user, router, showToast]);

  function statusLabel(status: string) {
    switch (status) {
      case "active":
        return "有効";
      case "trialing":
        return "トライアル";
      case "past_due":
        return "支払い要対応";
      case "canceled":
        return "解約済み";
      default:
        return status;
    }
  }

  function statusBadgeClass(status: string) {
    switch (status) {
      case "active":
        return "bg-emerald-50 text-emerald-700 border border-emerald-200";
      case "trialing":
        return "bg-sky-50 text-sky-700 border border-sky-200";
      case "past_due":
        return "bg-amber-50 text-amber-700 border border-amber-200";
      case "canceled":
        return "bg-slate-100 text-slate-600 border border-slate-200";
      default:
        return "bg-slate-100 text-slate-600 border border-slate-200";
    }
  }

  function planLabel(planType: string | null) {
    if (!planType) return "-";
    switch (planType) {
      case "trial":
        return "トライアル";
      case "starter":
        return "スターター";
      case "standard":
        return "スタンダード";
      case "pro":
        return "プロ";
      default:
        return planType;
    }
  }

  const totalOrganizations = rows.length;
  const totalActiveUsers = rows.reduce((sum, row) => sum + row.active_user_count, 0);
  const totalCapacity = rows.reduce((sum, row) => sum + row.max_users, 0);
  const shortageCount = rows.filter((row) => row.remaining_slots < 0).length;

  return (
    <div className="bg-background-light font-display text-slate-900 antialiased h-screen overflow-hidden flex">
      <AdminSidebar />
      <main className="flex-1 h-screen overflow-y-auto bg-background-light p-4 md:p-8">
        <div className="mx-auto max-w-6xl space-y-4">
          <section className="grid auto-rows-fr gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm min-h-[104px]">
              <p className="text-xs font-semibold text-slate-500">組織数</p>
              <div className="mt-2 flex items-center gap-2">
                <Building2 className="size-4 text-primary" />
                <p className="text-2xl font-bold">{totalOrganizations}</p>
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm min-h-[104px]">
              <p className="text-xs font-semibold text-slate-500">利用人数合計</p>
              <div className="mt-2 flex items-center gap-2">
                <Users className="size-4 text-primary" />
                <p className="text-2xl font-bold">{totalActiveUsers}</p>
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm min-h-[104px]">
              <p className="text-xs font-semibold text-slate-500">契約上限合計</p>
              <div className="mt-2 flex items-center gap-2">
                <CreditCard className="size-4 text-primary" />
                <p className="text-2xl font-bold">{totalCapacity}</p>
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm min-h-[104px]">
              <p className="text-xs font-semibold text-slate-500">超過組織</p>
              <div className="mt-2 flex items-center gap-2">
                <AlertTriangle className={`size-4 ${shortageCount > 0 ? "text-amber-600" : "text-emerald-600"}`} />
                <p className={`text-2xl font-bold ${shortageCount > 0 ? "text-amber-700" : "text-emerald-700"}`}>
                  {shortageCount}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden min-h-[calc(100vh-16rem)] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 bg-white">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">組織監査一覧</h3>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  {rows.length}件
                </span>
              </div>
            </div>
            {loading ? (
              <div className="overflow-x-auto flex-1 p-4 md:p-6 bg-slate-50/40">
                <div className="min-w-[920px] space-y-2 animate-pulse">
                  <div className="grid grid-cols-[2.2fr_1fr_1fr_0.9fr_0.9fr_0.9fr] gap-3 px-4 py-2">
                    <div className="h-3 w-20 rounded bg-slate-200" />
                    <div className="h-3 w-16 rounded bg-slate-200" />
                    <div className="h-3 w-12 rounded bg-slate-200" />
                    <div className="ml-auto h-3 w-12 rounded bg-slate-200" />
                    <div className="ml-auto h-3 w-12 rounded bg-slate-200" />
                    <div className="ml-auto h-3 w-12 rounded bg-slate-200" />
                  </div>
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div
                      key={`audit-skeleton-${index}`}
                      className="grid min-h-[56px] grid-cols-[2.2fr_1fr_1fr_0.9fr_0.9fr_0.9fr] items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
                      style={{ animationDelay: `${index * 80}ms` }}
                    >
                      <div className="flex items-center gap-2">
                        <div className="size-4 rounded-full bg-slate-200" />
                        <div className="h-4 w-40 rounded bg-slate-200" />
                      </div>
                      <div className="h-6 w-16 rounded-full bg-slate-200" />
                      <div className="h-6 w-14 rounded-full bg-slate-200" />
                      <div className="ml-auto h-4 w-12 rounded bg-slate-200" />
                      <div className="ml-auto h-4 w-12 rounded bg-slate-200" />
                      <div className="ml-auto h-4 w-12 rounded bg-slate-200" />
                    </div>
                  ))}
                </div>
              </div>
            ) : rows.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
                <Building2 className="size-10 text-slate-300" />
                <p className="mt-3 text-sm text-slate-500">対象組織はありません。</p>
              </div>
            ) : (
              <div className="overflow-x-auto flex-1 p-4 md:p-6 bg-slate-50/40">
                <div className="min-w-[920px] space-y-2">
                  <div className="grid grid-cols-[2.2fr_1fr_1fr_0.9fr_0.9fr_0.9fr] gap-3 px-4 py-2 text-sm text-slate-500">
                    <p className="font-semibold">組織名</p>
                    <p className="font-semibold">ステータス</p>
                    <p className="font-semibold">プラン</p>
                    <p className="font-semibold text-right">上限人数</p>
                    <p className="font-semibold text-right">利用人数</p>
                    <p className="font-semibold text-right">残り枠</p>
                  </div>
                  {rows.map((row) => {
                    const hasShortage = row.remaining_slots < 0;
                    return (
                      <article
                        key={row.organization_id}
                        className="grid min-h-[56px] grid-cols-[2.2fr_1fr_1fr_0.9fr_0.9fr_0.9fr] items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition-colors hover:bg-slate-50/60"
                      >
                        <p className="text-sm font-semibold text-slate-900">
                          <span className="inline-flex items-center gap-2">
                            <Building2 className="size-4 text-slate-400" />
                            {row.organization_name}
                          </span>
                        </p>
                        <p>
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadgeClass(row.subscription_status)}`}
                          >
                            {statusLabel(row.subscription_status)}
                          </span>
                        </p>
                        <p>
                          <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                            {planLabel(row.plan_type)}
                          </span>
                        </p>
                        <p className="text-right text-sm tabular-nums">{row.max_users}</p>
                        <p className="text-right text-sm tabular-nums">{row.active_user_count}</p>
                        <p className="text-right text-sm tabular-nums">
                          <span
                            className={`inline-flex items-center gap-1 ${
                              hasShortage ? "font-bold text-rose-700" : "text-slate-700"
                            }`}
                          >
                            {hasShortage ? <AlertTriangle className="size-3.5" /> : <CheckCircle2 className="size-3.5" />}
                            {row.remaining_slots}
                          </span>
                        </p>
                      </article>
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

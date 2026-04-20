"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Building2, CheckCircle2, CreditCard, Loader2, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { useAuth } from "@/hooks/useAuth";
import { adminListOrganizationAudit, type OrganizationAuditItem } from "@/services/authService";

const ALLOWED_SYSTEM_ROLES = new Set(["super_admin", "support_admin"]);

export default function OrganizationsAuditPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [rows, setRows] = useState<OrganizationAuditItem[]>([]);
  const [error, setError] = useState<string | null>(null);
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
      setError(null);
      try {
        setRows(await adminListOrganizationAudit());
      } catch (err) {
        setError(err instanceof Error ? err.message : "組織監査一覧の取得に失敗しました。");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [isLoading, user, router]);

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
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold text-slate-500">組織数</p>
              <div className="mt-2 flex items-center gap-2">
                <Building2 className="size-4 text-primary" />
                <p className="text-2xl font-bold">{totalOrganizations}</p>
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold text-slate-500">利用人数合計</p>
              <div className="mt-2 flex items-center gap-2">
                <Users className="size-4 text-primary" />
                <p className="text-2xl font-bold">{totalActiveUsers}</p>
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold text-slate-500">契約上限合計</p>
              <div className="mt-2 flex items-center gap-2">
                <CreditCard className="size-4 text-primary" />
                <p className="text-2xl font-bold">{totalCapacity}</p>
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold text-slate-500">超過組織</p>
              <div className="mt-2 flex items-center gap-2">
                <AlertTriangle className={`size-4 ${shortageCount > 0 ? "text-amber-600" : "text-emerald-600"}`} />
                <p className={`text-2xl font-bold ${shortageCount > 0 ? "text-amber-700" : "text-emerald-700"}`}>
                  {shortageCount}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-primary/10 bg-white shadow-lg shadow-primary/5 overflow-hidden min-h-[calc(100vh-14rem)] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 bg-white/80">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-700">組織監査一覧</p>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  {rows.length}件
                </span>
              </div>
            </div>
            {error ? (
              <p className="mx-6 mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
            ) : null}

            {loading ? (
              <div className="flex-1 flex items-center justify-center gap-2 text-slate-500">
                <Loader2 className="size-4 animate-spin" />
                <span className="text-sm">読み込み中...</span>
              </div>
            ) : rows.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
                <Building2 className="size-10 text-slate-300" />
                <p className="mt-3 text-sm text-slate-500">対象組織はありません。</p>
              </div>
            ) : (
              <div className="overflow-x-auto flex-1 p-4 md:p-6 bg-slate-50/40">
                <div className="min-w-[900px] space-y-2">
                  <div className="grid grid-cols-[2fr_1fr_1fr_0.8fr_0.8fr_0.8fr] gap-3 px-4 py-2 text-sm text-slate-500">
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
                        className="grid grid-cols-[2fr_1fr_1fr_0.8fr_0.8fr_0.8fr] items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition-colors hover:bg-slate-50/60"
                      >
                        <p className="font-semibold text-slate-900">
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
                        <p className="text-right tabular-nums">{row.max_users}</p>
                        <p className="text-right tabular-nums">{row.active_user_count}</p>
                        <p className="text-right tabular-nums">
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

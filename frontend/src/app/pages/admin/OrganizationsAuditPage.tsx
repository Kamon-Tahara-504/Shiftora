"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthAppHeader } from "@/components/auth/AuthAppHeader";
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

  return (
    <div className="bg-background-light font-display text-slate-900 min-h-screen flex flex-col">
      <AuthAppHeader />
      <main className="flex-grow p-4 md:p-8">
        <div className="mx-auto max-w-6xl rounded-xl border border-primary/10 bg-white p-6 shadow-xl shadow-primary/5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold">管理: 組織人数監査</h2>
              <p className="mt-2 text-sm text-slate-500">
                組織ごとの契約上限・利用人数・残り枠を監査できます。
              </p>
            </div>
            <Link href="/admin/tokens" className="text-sm text-primary font-bold hover:underline">
              トークン管理へ
            </Link>
          </div>

          {error ? (
            <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
          ) : null}

          {loading ? (
            <p className="mt-6 text-sm text-slate-500">読み込み中...</p>
          ) : rows.length === 0 ? (
            <p className="mt-6 text-sm text-slate-500">対象組織はありません。</p>
          ) : (
            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-slate-500">
                    <th className="px-2 py-2">組織名</th>
                    <th className="px-2 py-2">ステータス</th>
                    <th className="px-2 py-2">プラン</th>
                    <th className="px-2 py-2">上限人数</th>
                    <th className="px-2 py-2">利用人数</th>
                    <th className="px-2 py-2">残り枠</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.organization_id} className="border-b">
                      <td className="px-2 py-2">{row.organization_name}</td>
                      <td className="px-2 py-2">{row.subscription_status}</td>
                      <td className="px-2 py-2">{row.plan_type ?? "-"}</td>
                      <td className="px-2 py-2">{row.max_users}</td>
                      <td className="px-2 py-2">{row.active_user_count}</td>
                      <td className="px-2 py-2">{row.remaining_slots}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { useAuth } from "@/hooks/useAuth";
import {
  adminIssueServiceToken,
  adminListServiceTokens,
  adminRevokeServiceToken,
  type AdminServiceToken,
} from "@/services/authService";

const ALLOWED_SYSTEM_ROLES = new Set(["super_admin", "support_admin"]);

export default function AdminTokensPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [rows, setRows] = useState<AdminServiceToken[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [issuing, setIssuing] = useState(false);
  const [expiresInHours, setExpiresInHours] = useState<string>("");
  const [issuedToken, setIssuedToken] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);

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
    void reload();
  }, [isLoading, user, router]);

  async function reload() {
    setLoading(true);
    setError(null);
    try {
      const data = await adminListServiceTokens();
      setRows(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "トークン一覧の取得に失敗しました。");
    } finally {
      setLoading(false);
    }
  }

  async function onIssueToken() {
    setIssuing(true);
    setError(null);
    setInfo(null);
    setIssuedToken(null);
    const parsed = expiresInHours.trim() === "" ? undefined : Number(expiresInHours);
    const normalizedExpires =
      parsed === undefined || Number.isNaN(parsed) || parsed <= 0 ? undefined : Math.floor(parsed);
    try {
      const issued = await adminIssueServiceToken(normalizedExpires);
      setIssuedToken(issued.token);
      setInfo(issued.message);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "トークン発行に失敗しました。");
    } finally {
      setIssuing(false);
    }
  }

  async function onRevokeToken(tokenId: string) {
    setRevokingId(tokenId);
    setError(null);
    setInfo(null);
    try {
      const result = await adminRevokeServiceToken(tokenId);
      setInfo(result.message);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "トークン失効に失敗しました。");
    } finally {
      setRevokingId(null);
    }
  }

  return (
    <div className="bg-background-light font-display text-slate-900 antialiased h-screen overflow-hidden flex">
      <AdminSidebar />
      <main className="flex-1 h-screen overflow-y-auto bg-background-light p-4 md:p-8">
        <div className="mx-auto max-w-5xl space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <h2 className="text-2xl font-bold">管理: サービス登録トークン</h2>
              <p className="mt-2 text-sm text-slate-500">組織作成用トークンを発行・一覧・失効できます。</p>
            </div>

            <div className="mt-6 rounded-lg border border-slate-200 p-4">
              <p className="text-sm font-bold">新規発行</p>
              <div className="mt-3 flex flex-col gap-3 md:flex-row">
                <input
                  type="number"
                  min={1}
                  className="w-full md:w-56 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  placeholder="有効時間（時間）任意"
                  value={expiresInHours}
                  onChange={(event) => setExpiresInHours(event.target.value)}
                />
                <button
                  type="button"
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-60"
                  onClick={onIssueToken}
                  disabled={issuing}
                >
                  {issuing ? "発行中..." : "トークン発行"}
                </button>
              </div>
              {issuedToken ? (
                <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 break-all">
                  発行済みトークン（この画面でのみ表示）: {issuedToken}
                </p>
              ) : null}
            </div>

            {error ? (
              <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
            ) : null}
            {info ? (
              <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {info}
              </p>
            ) : null}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h3 className="text-lg font-bold">トークン一覧</h3>
            {loading ? (
              <p className="mt-4 text-sm text-slate-500">読み込み中...</p>
            ) : rows.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500">トークンはまだありません。</p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-slate-500">
                      <th className="px-2 py-2">作成日時</th>
                      <th className="px-2 py-2">用途</th>
                      <th className="px-2 py-2">状態</th>
                      <th className="px-2 py-2">有効期限</th>
                      <th className="px-2 py-2">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.id} className="border-b">
                        <td className="px-2 py-2">{row.created_at}</td>
                        <td className="px-2 py-2">{row.purpose}</td>
                        <td className="px-2 py-2">{row.state}</td>
                        <td className="px-2 py-2">{row.expires_at ?? "-"}</td>
                        <td className="px-2 py-2">
                          <button
                            type="button"
                            disabled={!row.is_active || revokingId === row.id}
                            onClick={() => onRevokeToken(row.id)}
                            className="rounded border border-slate-300 px-3 py-1 text-xs hover:bg-slate-50 disabled:opacity-50"
                          >
                            {revokingId === row.id ? "失効中..." : "失効"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

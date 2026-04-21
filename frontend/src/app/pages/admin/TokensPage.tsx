"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, KeyRound, Loader2, ShieldAlert, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { useToast } from "@/context/ToastContext";
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
  const { showToast } = useToast();
  const { user, isLoading } = useAuth();
  const [rows, setRows] = useState<AdminServiceToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [issuing, setIssuing] = useState(false);
  const [expiresInHours, setExpiresInHours] = useState<string>("");
  const [issuedToken, setIssuedToken] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);

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
    try {
      const data = await adminListServiceTokens();
      setRows(data);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "トークン一覧の取得に失敗しました。", { variant: "error" });
    } finally {
      setLoading(false);
    }
  }

  async function onIssueToken() {
    setIssuing(true);
    setIssuedToken(null);
    const parsed = expiresInHours.trim() === "" ? undefined : Number(expiresInHours);
    const normalizedExpires =
      parsed === undefined || Number.isNaN(parsed) || parsed <= 0 ? undefined : Math.floor(parsed);
    try {
      const issued = await adminIssueServiceToken(normalizedExpires);
      setIssuedToken(issued.token);
      showToast(issued.message, { variant: "success" });
      await reload();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "トークン発行に失敗しました。", { variant: "error" });
    } finally {
      setIssuing(false);
    }
  }

  async function onRevokeToken(tokenId: string) {
    setRevokingId(tokenId);
    try {
      const result = await adminRevokeServiceToken(tokenId);
      showToast(result.message, { variant: "success" });
      await reload();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "トークン失効に失敗しました。", { variant: "error" });
    } finally {
      setRevokingId(null);
    }
  }

  function formatDateLabel(value: string | null) {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString("ja-JP");
  }

  function stateBadgeClass(row: AdminServiceToken) {
    if (row.is_active) {
      return "bg-emerald-50 text-emerald-700 border border-emerald-200";
    }
    return "bg-slate-100 text-slate-600 border border-slate-200";
  }

  function openIssueModal() {
    setExpiresInHours("");
    setIssuedToken(null);
    setIsIssueModalOpen(true);
  }

  async function copyIssuedToken() {
    if (!issuedToken) return;
    try {
      await navigator.clipboard.writeText(issuedToken);
      showToast("トークンをコピーしました。", { variant: "success" });
    } catch {
      showToast("コピーに失敗しました。手動でコピーしてください。", { variant: "error" });
    }
  }

  return (
    <div className="bg-background-light font-display text-slate-900 antialiased h-screen overflow-hidden flex">
      <AdminSidebar />
      <main className="flex-1 h-screen overflow-y-auto bg-background-light p-4 md:p-8">
        <div className="mx-auto max-w-6xl space-y-4">
          <section className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden min-h-[104px]">
            <div className="px-6 py-5 h-full flex items-center">
              <div className="flex w-full flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold">サービス登録トークン</h2>
                  <p className="text-sm text-slate-500">組織作成用トークンを発行・一覧・失効できます。</p>
                </div>
                <button
                  type="button"
                  onClick={openIssueModal}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-white hover:bg-primary/90"
                >
                  <KeyRound className="size-4" />
                  トークンを発行
                </button>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden min-h-[calc(100vh-16rem)] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 bg-white">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">トークン一覧</h3>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  {rows.length}件
                </span>
              </div>
            </div>
            {loading ? (
              <div className="overflow-x-auto flex-1 p-4 md:p-6 bg-slate-50/40">
                <div className="min-w-[920px] space-y-2 animate-pulse">
                  <div className="grid grid-cols-[1.4fr_1fr_1fr_1.2fr_0.8fr] gap-3 px-4 py-2">
                    <div className="h-3 w-24 rounded bg-slate-200" />
                    <div className="h-3 w-12 rounded bg-slate-200" />
                    <div className="h-3 w-12 rounded bg-slate-200" />
                    <div className="h-3 w-20 rounded bg-slate-200" />
                    <div className="ml-auto h-3 w-10 rounded bg-slate-200" />
                  </div>
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div
                      key={`token-skeleton-${index}`}
                      className="grid min-h-[56px] grid-cols-[1.4fr_1fr_1fr_1.2fr_0.8fr] items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
                      style={{ animationDelay: `${index * 80}ms` }}
                    >
                      <div className="h-4 w-36 rounded bg-slate-200" />
                      <div className="h-6 w-20 rounded-full bg-slate-200" />
                      <div className="h-6 w-16 rounded-full bg-slate-200" />
                      <div className="h-4 w-28 rounded bg-slate-200" />
                      <div className="ml-auto h-7 w-16 rounded-lg bg-slate-200" />
                    </div>
                  ))}
                </div>
              </div>
            ) : rows.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
                <ShieldAlert className="size-10 text-slate-300" />
                <p className="mt-3 text-sm text-slate-500">トークンはまだありません。</p>
              </div>
            ) : (
              <div className="overflow-x-auto flex-1 p-4 md:p-6 bg-slate-50/40">
                <div className="min-w-[920px] space-y-2">
                  <div className="grid grid-cols-[1.4fr_1fr_1fr_1.2fr_0.8fr] gap-3 px-4 py-2 text-sm text-slate-500">
                    <p className="font-semibold">作成日時</p>
                    <p className="font-semibold">用途</p>
                    <p className="font-semibold">状態</p>
                    <p className="font-semibold">有効期限</p>
                    <p className="font-semibold text-right">操作</p>
                  </div>
                  {rows.map((row) => (
                    <article
                      key={row.id}
                      className="grid min-h-[56px] grid-cols-[1.4fr_1fr_1fr_1.2fr_0.8fr] items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition-colors hover:bg-slate-50/60"
                    >
                      <p className="text-sm">{formatDateLabel(row.created_at)}</p>
                      <p>
                        <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                          {row.purpose}
                        </span>
                      </p>
                      <p>
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${stateBadgeClass(row)}`}>
                          {row.state}
                        </span>
                      </p>
                      <p className="text-sm">{formatDateLabel(row.expires_at)}</p>
                      <p className="text-right">
                        <button
                          type="button"
                          disabled={!row.is_active || revokingId === row.id}
                          onClick={() => onRevokeToken(row.id)}
                          className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {revokingId === row.id ? "失効中..." : "失効"}
                        </button>
                      </p>
                    </article>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
      {isIssueModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div className="inline-flex items-center gap-2 text-sm font-bold text-slate-800">
                <KeyRound className="size-4 text-primary" />
                トークン発行
              </div>
              <button
                type="button"
                onClick={() => setIsIssueModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                aria-label="モーダルを閉じる"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="space-y-4 px-5 py-5">
              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-slate-600">有効時間（時間）</span>
                <select
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={expiresInHours}
                  onChange={(event) => setExpiresInHours(event.target.value)}
                >
                  <option value="">デフォルト（未指定）</option>
                  <option value="24">24時間</option>
                  <option value="48">48時間</option>
                  <option value="72">72時間</option>
                  <option value="168">1週間（168時間）</option>
                </select>
              </label>
              {issuedToken ? (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-600">発行済みトークン（この画面でのみ表示）</p>
                  <div className="flex items-stretch gap-2">
                    <div className="flex-1 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 break-all">
                      {issuedToken}
                    </div>
                    <button
                      type="button"
                      onClick={copyIssuedToken}
                      className="inline-flex shrink-0 items-center justify-center rounded-lg border border-amber-300 px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100"
                    >
                      コピー
                    </button>
                  </div>
                </div>
              ) : null}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-60"
                  onClick={onIssueToken}
                  disabled={issuing}
                >
                  {issuing ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                  {issuing ? "発行中..." : "発行する"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

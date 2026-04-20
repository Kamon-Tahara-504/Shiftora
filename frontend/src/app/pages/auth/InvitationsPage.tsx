"use client";

import { useEffect, useState } from "react";
import { Building2, CalendarClock, CheckCircle2, Inbox, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { OnboardingSidebar } from "@/components/auth/OnboardingSidebar";
import { ApiError, setStoredAuthTokens } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { acceptInvitation, getMyInvitations, type UserInvitation } from "@/services/authService";

export default function InvitationsPage() {
  const router = useRouter();
  const { user, isLoading, refreshMe } = useAuth();
  const [items, setItems] = useState<UserInvitation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.role === "org_admin") {
      router.replace("/employees");
      return;
    }
    if (user.role === "staff") {
      router.replace("/my-shifts");
      return;
    }
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const list = await getMyInvitations();
        setItems(list);
      } catch (err) {
        setError(err instanceof Error ? err.message : "招待一覧の取得に失敗しました。");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [isLoading, router, user]);

  async function onAccept(invitationId: string) {
    setAcceptingId(invitationId);
    setError(null);
    try {
      const result = await acceptInvitation(invitationId);
      setStoredAuthTokens({
        access_token: result.access_token,
        refresh_token: result.refresh_token,
        token_type: result.token_type,
      });
      await refreshMe();
      router.push("/my-shifts");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("招待の受諾に失敗しました。");
      }
    } finally {
      setAcceptingId(null);
    }
  }

  const displayItems = items;
  const pendingCount = displayItems.filter((item) => item.status === "pending").length;

  function formatDateLabel(value: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString("ja-JP");
  }

  function statusLabel(status: UserInvitation["status"]) {
    switch (status) {
      case "pending":
        return "未対応";
      case "accepted":
        return "受諾済み";
      case "rejected":
        return "辞退";
      case "expired":
        return "期限切れ";
      default:
        return status;
    }
  }

  function statusBadgeClass(status: UserInvitation["status"]) {
    switch (status) {
      case "pending":
        return "bg-amber-50 text-amber-700 border border-amber-200";
      case "accepted":
        return "bg-emerald-50 text-emerald-700 border border-emerald-200";
      case "rejected":
        return "bg-rose-50 text-rose-700 border border-rose-200";
      case "expired":
        return "bg-slate-100 text-slate-600 border border-slate-200";
      default:
        return "bg-slate-100 text-slate-600 border border-slate-200";
    }
  }

  function roleLabel(role: UserInvitation["role"]) {
    if (role === "staff") return "スタッフ";
    return "管理者";
  }

  function isNearExpiry(value: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return false;
    return date.getTime() - Date.now() <= 1000 * 60 * 60 * 24;
  }

  return (
    <div className="bg-background-light font-display text-slate-900 antialiased h-screen overflow-hidden flex">
      <OnboardingSidebar />
      <main className="flex-1 h-screen overflow-y-auto bg-background-light p-4 md:p-8">
        <div className="mx-auto max-w-5xl pt-2">
          {error ? (
            <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
          ) : null}
          <section className="rounded-2xl border border-primary/10 bg-white shadow-lg shadow-primary/5 overflow-hidden min-h-[calc(100vh-6.5rem)] flex flex-col">
            <div className="px-6 py-5 border-b border-slate-100 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <h2 className="text-2xl font-bold">組織招待一覧</h2>
                <p className="text-xs text-slate-500">受諾可能な招待を確認して参加できます。</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  受諾待ち: {pendingCount}件
                </span>
              </div>
            </div>
            {loading ? (
              <div className="p-8 flex-1 flex items-center justify-center gap-2 text-slate-500">
                <Loader2 className="size-4 animate-spin" />
                <span className="text-sm">読み込み中...</span>
              </div>
            ) : displayItems.length === 0 ? (
              <div className="p-10 flex-1 flex flex-col items-center justify-center text-center">
                <Inbox className="mx-auto size-10 text-slate-300" />
                <p className="mt-3 text-sm text-slate-500">受諾可能な招待はありません。</p>
                <p className="mt-1 text-xs text-slate-400">管理者からの招待後にここへ表示されます。</p>
              </div>
            ) : (
              <div className="p-4 md:p-6 space-y-3 bg-slate-50/40 flex-1">
                {displayItems.map((item) => {
                  const pending = item.status === "pending";
                  const nearExpiry = pending && isNearExpiry(item.expires_at);
                  return (
                    <article
                      key={item.id}
                      className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-primary/30"
                    >
                      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
                            <div className="inline-flex items-center gap-1.5 text-slate-700">
                              <Building2 className="size-4 text-slate-500" />
                              <span className="text-xl font-extrabold leading-tight text-slate-900 md:text-2xl">
                                {item.organization_id}
                              </span>
                            </div>
                            <div className="inline-flex items-center gap-1.5 text-slate-600">
                              <CalendarClock className="size-4" />
                              <span>有効期限: {formatDateLabel(item.expires_at)}</span>
                            </div>
                            <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                              {roleLabel(item.role)}
                            </span>
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadgeClass(item.status)}`}
                            >
                              {statusLabel(item.status)}
                            </span>
                            {nearExpiry ? (
                              <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 border border-amber-200">
                                まもなく期限切れ
                              </span>
                            ) : null}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => onAccept(item.id)}
                          disabled={acceptingId === item.id || !pending}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 md:w-auto"
                        >
                          {acceptingId === item.id ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="size-4" />
                          )}
                          {acceptingId === item.id ? "受諾中..." : pending ? "この招待を受諾する" : "受諾不可"}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

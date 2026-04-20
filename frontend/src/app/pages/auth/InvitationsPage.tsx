"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Inbox, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthAppHeader } from "@/components/auth/AuthAppHeader";
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

  return (
    <div className="bg-background-light font-display text-slate-900 min-h-screen flex flex-col">
      <AuthAppHeader />
      <main className="flex-grow p-4 md:p-8">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-xl border border-primary/10 bg-white p-6 md:p-8 shadow-xl shadow-primary/5">
            <h2 className="text-2xl font-bold">組織招待</h2>
            <p className="mt-2 text-sm text-slate-500">参加する組織の招待を受諾してください。</p>

            {error ? (
              <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </p>
            ) : null}

            {loading ? (
              <div className="mt-8 flex items-center justify-center gap-2 text-slate-500">
                <Loader2 className="size-4 animate-spin" />
                <span className="text-sm">読み込み中...</span>
              </div>
            ) : items.length === 0 ? (
              <div className="mt-8 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
                <Inbox className="mx-auto size-10 text-slate-300" />
                <p className="mt-3 text-sm text-slate-500">受諾可能な招待はありません。</p>
                <p className="mt-1 text-xs text-slate-400">管理者からの招待後にここへ表示されます。</p>
              </div>
            ) : (
              <ul className="mt-6 space-y-3">
                {items.map((item) => (
                  <li key={item.id} className="rounded-xl border border-slate-200 p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-sm font-bold">組織ID: {item.organization_id}</p>
                        <p className="mt-1 text-xs text-slate-500">有効期限: {item.expires_at}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onAccept(item.id)}
                        disabled={acceptingId === item.id}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-60"
                      >
                        {acceptingId === item.id ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                        {acceptingId === item.id ? "受諾中..." : "受諾する"}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="mt-6 text-center text-sm text-slate-500">
            <Link href="/create-organization" className="text-primary font-bold hover:underline">
              招待がない場合は組織を作成
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

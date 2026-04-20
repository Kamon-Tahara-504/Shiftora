"use client";

import { useEffect, useState } from "react";
import { Building2, KeyRound, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { OnboardingSidebar } from "@/components/auth/OnboardingSidebar";
import { ApiError, setStoredAuthTokens } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { registerOrg } from "@/services/authService";

export default function CreateOrganizationPage() {
  const router = useRouter();
  const { user, isLoading, refreshMe } = useAuth();
  const [organizationName, setOrganizationName] = useState("");
  const [serviceToken, setServiceToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.role === "org_admin") {
      router.replace("/employees");
    }
  }, [isLoading, router, user]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!organizationName.trim()) {
      setError("組織名を入力してください。");
      return;
    }
    if (!serviceToken.trim()) {
      setError("サービス登録トークンを入力してください。");
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await registerOrg({
        organization_name: organizationName.trim(),
        service_token: serviceToken.trim(),
      });
      setStoredAuthTokens({
        access_token: result.access_token,
        refresh_token: result.refresh_token,
        token_type: result.token_type,
      });
      await refreshMe();
      router.push("/employees");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("組織作成に失敗しました。時間をおいて再度お試しください。");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="bg-background-light font-display text-slate-900 antialiased h-screen overflow-hidden flex">
      <OnboardingSidebar />
      <main className="flex-1 h-screen overflow-y-auto bg-background-light flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-[520px]">
          <div className="bg-white rounded-xl shadow-xl shadow-primary/5 border border-primary/10 overflow-hidden">
            <div className="p-8 md:p-10">
              <div className="text-center mb-10">
                <h2 className="text-3xl font-bold text-slate-900 mb-3">組織作成</h2>
                <p className="text-slate-500">
                  サービス発行トークンを使って組織を作成します。
                  <br />
                  作成後は組織管理者として利用できます。
                </p>
              </div>

              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700 ml-1" htmlFor="org-name">
                    組織名
                  </label>
                  <div className="relative group">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors w-5 h-5" />
                    <input
                      className="w-full pl-12 pr-4 py-3.5 bg-background-light border-primary/20 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all text-slate-900 placeholder:text-slate-400"
                      id="org-name"
                      name="org-name"
                      placeholder="例：株式会社シフトラ"
                      type="text"
                      required
                      value={organizationName}
                      onChange={(event) => setOrganizationName(event.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700 ml-1" htmlFor="service-token">
                    サービス登録トークン
                  </label>
                  <div className="relative group">
                    <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors w-5 h-5" />
                    <input
                      className="w-full pl-12 pr-4 py-3.5 bg-background-light border-primary/20 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all text-slate-900 placeholder:text-slate-400"
                      id="service-token"
                      name="service-token"
                      placeholder="発行されたトークンを入力"
                      type="text"
                      required
                      value={serviceToken}
                      onChange={(event) => setServiceToken(event.target.value)}
                    />
                  </div>
                </div>

                {error ? (
                  <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </p>
                ) : null}

                <button
                  className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 px-6 rounded-lg transition-all transform active:scale-[0.98] shadow-lg shadow-primary/20 mt-4 flex items-center justify-center gap-2"
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "作成中..." : "組織を作成する"}
                  <ArrowRight className="w-5 h-5" />
                </button>
              </form>

              <div className="mt-8 pt-8 border-t border-slate-100 text-center">
                <p className="text-slate-600">
                  既に組織に招待されていますか？
                  <br />
                  <Link className="text-primary font-bold hover:underline" href="/invitations">
                    招待一覧を確認
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

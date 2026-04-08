"use client";

import { useState } from "react";
import { Lock, KeyRound, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthAppHeader } from "@/components/auth/AuthAppHeader";
import { ApiError, setStoredAuthTokens } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { signup } from "@/services/authService";

type SignupPageProps = {
  token: string;
};

export default function SignupPage({ token }: SignupPageProps) {
  const router = useRouter();
  const { refreshMe } = useAuth();
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!token) {
      setError("招待トークンが見つかりません。招待リンクから再度アクセスしてください。");
      return;
    }
    if (password.length < 8) {
      setError("パスワードは8文字以上で入力してください。");
      return;
    }
    if (password !== passwordConfirm) {
      setError("パスワードと確認用パスワードが一致しません。");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await signup({ token, password });
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
        setError("登録に失敗しました。時間をおいて再度お試しください。");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="bg-background-light font-display text-slate-900 min-h-screen flex flex-col">
      <AuthAppHeader />

      <main className="flex-grow flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-[520px]">
          <div className="bg-white rounded-xl shadow-xl shadow-primary/5 border border-primary/10 overflow-hidden">
            <div className="p-8 md:p-10">
              <div className="text-center mb-10">
                <h2 className="text-3xl font-bold text-slate-900 mb-3">パスワード設定</h2>
                <p className="text-slate-500">
                  招待を受け入れました。アカウントを利用するため、
                  <br />
                  ログイン用のパスワードを設定してください。
                </p>
              </div>

              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <label
                    className="block text-sm font-semibold text-slate-700 ml-1"
                    htmlFor="password"
                  >
                    パスワード
                  </label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors w-5 h-5" />
                    <input
                      className="w-full pl-12 pr-4 py-3.5 bg-background-light border-primary/20 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all text-slate-900 placeholder:text-slate-400"
                      id="password"
                      name="password"
                      placeholder="8文字以上"
                      type="password"
                      required
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label
                    className="block text-sm font-semibold text-slate-700 ml-1"
                    htmlFor="password_confirm"
                  >
                    パスワード（確認）
                  </label>
                  <div className="relative group">
                    <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors w-5 h-5" />
                    <input
                      className="w-full pl-12 pr-4 py-3.5 bg-background-light border-primary/20 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all text-slate-900 placeholder:text-slate-400"
                      id="password_confirm"
                      name="password_confirm"
                      placeholder="もう一度入力"
                      type="password"
                      required
                      value={passwordConfirm}
                      onChange={(event) => setPasswordConfirm(event.target.value)}
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
                  {isSubmitting ? "登録中..." : "パスワードを設定して登録完了"}
                  <ArrowRight className="w-5 h-5" />
                </button>
              </form>

              <div className="mt-8 pt-8 border-t border-slate-100 text-center">
                <p className="text-slate-600">
                  すでにパスワードを設定済みですか？
                  <br />
                  <Link className="text-primary font-bold hover:underline" href="/login">
                    ログイン
                  </Link>
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-center gap-6 text-slate-400 text-xs">
            <Link className="hover:text-primary transition-colors" href="#">
              ヘルプセンター
            </Link>
            <Link className="hover:text-primary transition-colors" href="#">
              お問い合わせ
            </Link>
            <span>© 2026 Shiftora</span>
          </div>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 w-full h-1 bg-gradient-to-r from-primary/20 via-primary to-primary/20 opacity-30" />
    </div>
  );
}


"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthAppHeader } from "@/components/auth/AuthAppHeader";
import { useToast } from "@/context/ToastContext";
type SignupPageProps = { token: string };

export default function SignupPage({ token }: SignupPageProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token.trim()) {
      showToast("このリンクは現在利用できません。", { variant: "error" });
      return;
    }

    setIsSubmitting(true);
    router.push("/register-org");
  }

  return (
    <div className="bg-background-light font-display text-slate-900 min-h-screen flex flex-col">
      <AuthAppHeader />

      <main className="flex-grow flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-[520px]">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-8 md:p-10">
              <div className="text-center mb-10">
                <h2 className="text-3xl font-bold text-slate-900 mb-3">パスワード設定</h2>
                <p className="text-slate-500">
                  旧招待リンク方式は廃止されました。
                  <br />
                  新しい登録フローからアカウント作成を行ってください。
                </p>
              </div>

              <form className="space-y-6" onSubmit={handleSubmit}>
                <button
                  className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 px-6 rounded-lg transition-all transform active:scale-[0.98] shadow-lg shadow-primary/20 mt-4 flex items-center justify-center gap-2"
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "遷移中..." : "新しい登録フローへ進む"}
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


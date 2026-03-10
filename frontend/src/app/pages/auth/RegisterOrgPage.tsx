import { Building2, Mail, Lock, KeyRound, ArrowRight } from "lucide-react";
import Link from "next/link";
import { AuthAppHeader } from "@/components/auth/AuthAppHeader";

export default function RegisterOrgPage() {
  return (
    <div className="bg-background-light font-display text-slate-900 min-h-screen flex flex-col">
      <AuthAppHeader />

      <main className="flex-grow flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-[520px]">
          <div className="bg-white rounded-xl shadow-xl shadow-primary/5 border border-primary/10 overflow-hidden">
            <div className="p-8 md:p-10">
              <div className="text-center mb-10">
                <h2 className="text-3xl font-bold text-slate-900 mb-3">組織・管理者登録</h2>
                <p className="text-slate-500">
                  Shiftoraへようこそ。
                  <br />
                  組織情報を入力してアカウントを作成してください。
                </p>
              </div>

              <form action="#" className="space-y-6">
                <div className="space-y-2">
                  <label
                    className="block text-sm font-semibold text-slate-700 ml-1"
                    htmlFor="org-name"
                  >
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
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label
                    className="block text-sm font-semibold text-slate-700 ml-1"
                    htmlFor="email"
                  >
                    管理者メールアドレス
                  </label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors w-5 h-5" />
                    <input
                      className="w-full pl-12 pr-4 py-3.5 bg-background-light border-primary/20 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all text-slate-900 placeholder:text-slate-400"
                      id="email"
                      name="email"
                      placeholder="admin@example.com"
                      type="email"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 pt-2">
                  <input
                    className="mt-1 rounded border-primary/30 text-primary focus:ring-primary"
                    id="terms"
                    type="checkbox"
                  />
                  <label className="text-sm text-slate-600 leading-snug" htmlFor="terms">
                    <Link href="#" className="text-primary hover:underline font-medium">
                      利用規約
                    </Link>
                    および
                    <Link href="#" className="text-primary hover:underline font-medium">
                      プライバシーポリシー
                    </Link>
                    に同意します。
                  </label>
                </div>

                <button
                  className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 px-6 rounded-lg transition-all transform active:scale-[0.98] shadow-lg shadow-primary/20 mt-4 flex items-center justify-center gap-2"
                  type="submit"
                >
                  無料で登録を開始する
                  <ArrowRight className="w-5 h-5" />
                </button>
              </form>

              <div className="mt-8 pt-8 border-t border-slate-100 text-center">
                <p className="text-slate-600">
                  すでに組織アカウントをお持ちですか？
                  <br />
                  <Link className="text-primary font-bold hover:underline" href="/login">
                    ログインはこちら
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


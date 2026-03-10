import { CalendarDays, Mail, Lock, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="bg-background-light font-display text-slate-900 min-h-screen flex flex-col">
      <header className="w-full px-6 py-4 flex items-center justify-between bg-white/80 backdrop-blur-md border-b border-primary/10 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="bg-primary p-1.5 rounded-lg flex items-center justify-center">
            <CalendarDays className="text-white w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Shiftora</h1>
        </div>
        <div className="hidden md:block">
          <p className="text-sm text-slate-500">スマートなシフト管理ソリューション</p>
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-[520px]">
          <div className="bg-white rounded-xl shadow-xl shadow-primary/5 border border-primary/10 overflow-hidden">
            <div className="p-8 md:p-10">
              <div className="text-center mb-10">
                <h2 className="text-3xl font-bold text-slate-900 mb-3">ログイン</h2>
                <p className="text-slate-500">登録済みのメールアドレスとパスワードで<br />ログインしてください。</p>
              </div>

              <form action="#" className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700 ml-1" htmlFor="email">
                    メールアドレス
                  </label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors w-5 h-5" />
                    <input className="w-full pl-12 pr-4 py-3.5 bg-background-light border-primary/20 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all text-slate-900 placeholder:text-slate-400" id="email" name="email" placeholder="admin@example.com" type="email" />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center ml-1">
                    <label className="block text-sm font-semibold text-slate-700" htmlFor="password">
                      パスワード
                    </label>
                    <Link href="#" className="text-sm text-primary hover:underline font-medium">パスワードをお忘れですか？</Link>
                  </div>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors w-5 h-5" />
                    <input className="w-full pl-12 pr-4 py-3.5 bg-background-light border-primary/20 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all text-slate-900 placeholder:text-slate-400" id="password" name="password" placeholder="パスワードを入力" type="password" />
                  </div>
                </div>

                <button className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 px-6 rounded-lg transition-all transform active:scale-[0.98] shadow-lg shadow-primary/20 mt-4 flex items-center justify-center gap-2" type="submit">
                  ログイン
                  <ArrowRight className="w-5 h-5" />
                </button>
              </form>

              <div className="mt-8 pt-8 border-t border-slate-100 text-center">
                <p className="text-slate-600">
                  組織アカウントをお持ちでないですか？
                  <br />
                  <Link className="text-primary font-bold hover:underline" href="/register-org">新規登録はこちら</Link>
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-center gap-6 text-slate-400 text-xs">
            <Link className="hover:text-primary transition-colors" href="#">ヘルプセンター</Link>
            <Link className="hover:text-primary transition-colors" href="#">お問い合わせ</Link>
            <span>© 2026 Shiftora</span>
          </div>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 w-full h-1 bg-gradient-to-r from-primary/20 via-primary to-primary/20 opacity-30"></div>
    </div>
  );
}
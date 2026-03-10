import { CalendarDays, Users, Sparkles, CalendarCheck, User } from "lucide-react";
import Link from "next/link";

export function OrgSidebar() {
  return (
    <aside className="w-64 flex-shrink-0 border-r border-stone-200 bg-[#f7f3f0] flex flex-col">
      <div className="p-6">
        <div className="flex items-center gap-2.5">
          <div className="bg-primary p-2 rounded-xl flex items-center justify-center">
            <CalendarDays className="text-white w-6 h-6" />
          </div>
          <div className="flex flex-col leading-tight">
            <h1 className="text-xl font-bold tracking-tight">Shiftora</h1>
            <p className="text-xs text-slate-500 font-medium">
              シフト最適化アプリ
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        <Link
          href="/employees"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-primary text-white font-medium transition-colors"
        >
          <Users className="size-5" />
          <span className="text-sm">職員管理</span>
        </Link>
        <Link
          href="/shift/generate"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 hover:bg-slate-100 font-medium transition-colors"
        >
          <Sparkles className="size-5" />
          <span className="text-sm">シフト生成</span>
        </Link>
        <Link
          href="/shift/calendar"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 hover:bg-slate-100 font-medium transition-colors"
        >
          <CalendarCheck className="size-5" />
          <span className="text-sm">シフトカレンダー</span>
        </Link>
      </nav>

      <div className="p-4 border-t border-slate-200">
        <div className="flex items-center gap-3 px-2">
          <div className="size-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
            <User className="text-primary size-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate">管理者ユーザー</p>
            <p className="text-[10px] text-slate-500 truncate">admin@shiftora.io</p>
          </div>
        </div>
      </div>
    </aside>
  );
}


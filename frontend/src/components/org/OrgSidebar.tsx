 "use client";

import { CalendarDays, Users, Sparkles, CalendarCheck, User, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function OrgSidebar() {
  const pathname = usePathname();

  const navItems = [
    {
      href: "/employees",
      label: "職員管理",
      Icon: Users,
    },
    {
      href: "/shift/generate",
      label: "シフト生成",
      Icon: Sparkles,
    },
    {
      href: "/shift/calendar",
      label: "シフトカレンダー",
      Icon: CalendarCheck,
    },
  ];

  return (
    <aside className="w-64 h-screen overflow-y-auto flex-shrink-0 border-r border-stone-200 bg-[#f7f3f0] flex flex-col">
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
        {navItems.map(({ href, label, Icon }) => {
          const isActive =
            pathname === href || pathname.startsWith(`${href}/`);

          const baseClasses =
            "flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors";
          const activeClasses = "bg-primary text-white";
          const inactiveClasses = "text-slate-600 hover:bg-slate-100";

          return (
            <Link
              key={href}
              href={href}
              className={`${baseClasses} ${
                isActive ? activeClasses : inactiveClasses
              }`}
            >
              <Icon className="size-5" />
              <span className="text-sm">{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-200 space-y-3">
        <div className="flex items-center gap-3 px-2">
          <div className="size-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
            <User className="text-primary size-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate">管理者ユーザー</p>
            <p className="text-[10px] text-slate-500 truncate">
              admin@shiftora.io
            </p>
          </div>
        </div>
        <button
          type="button"
          className="w-full inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
        >
          <LogOut className="size-4" />
          <span>ログアウト</span>
        </button>
      </div>
    </aside>
  );
}


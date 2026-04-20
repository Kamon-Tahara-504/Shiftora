"use client";

import { Building2, CalendarDays, Inbox, LogOut, User } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export function OnboardingSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const navItems = [
    { href: "/create-organization", label: "組織作成", Icon: Building2 },
    { href: "/invitations", label: "招待一覧", Icon: Inbox },
  ];

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  return (
    <aside className="w-64 h-screen overflow-y-auto flex-shrink-0 border-r border-stone-200 bg-[#f7f3f0] flex flex-col">
      <div className="p-6">
        <div className="flex items-center gap-2.5">
          <div className="bg-primary p-2 rounded-xl flex items-center justify-center">
            <CalendarDays className="text-white w-6 h-6" />
          </div>
          <div className="flex flex-col leading-tight">
            <h1 className="text-xl font-bold tracking-tight">Shiftora</h1>
            <p className="text-xs text-slate-500 font-medium">オンボーディング</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {navItems.map(({ href, label, Icon }) => {
          const isActive = pathname === href || pathname.startsWith(`${href}/`);
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
            <p className="text-xs font-semibold truncate">{user?.email || "ユーザー"}</p>
            <p className="text-[10px] text-slate-500 truncate">組織未所属ユーザー</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="w-full inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
        >
          <LogOut className="size-4" />
          <span>ログアウト</span>
        </button>
      </div>
    </aside>
  );
}

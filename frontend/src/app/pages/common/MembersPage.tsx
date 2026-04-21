"use client";

import { useEffect, useMemo, useState } from "react";
import { OrgSidebar } from "@/components/org/OrgSidebar";
import { OrgPageHeader } from "@/components/org/OrgPageHeader";
import { StaffSidebar } from "@/components/staff/StaffSidebar";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/hooks/useAuth";
import { getOrganizationMembers, type OrganizationMember } from "@/services/authService";

function roleLabel(value: OrganizationMember["membership_role"]): string {
  if (value === "org_admin") return "管理者";
  if (value === "staff") return "スタッフ";
  return "未設定";
}

function statusLabel(value: OrganizationMember["membership_status"]): string {
  if (value === "active") return "有効";
  if (value === "suspended") return "停止";
  if (value === "left") return "離脱";
  return value;
}

export default function MembersPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function loadMembers() {
      setLoading(true);
      try {
        const list = await getOrganizationMembers();
        if (mounted) setMembers(list);
      } catch (err) {
        if (!mounted) return;
        showToast(err instanceof Error ? err.message : "メンバー一覧の取得に失敗しました。", {
          variant: "error",
        });
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadMembers();
    return () => {
      mounted = false;
    };
  }, [showToast]);

  const activeCount = useMemo(
    () => members.filter((member) => member.membership_status === "active").length,
    [members],
  );

  return (
    <div className="bg-background-light font-display text-slate-900 antialiased h-screen overflow-hidden flex">
      {user?.role === "org_admin" ? <OrgSidebar /> : <StaffSidebar />}
      <main className="flex-1 h-screen overflow-y-auto bg-background-light p-8">
        <div className="max-w-6xl mx-auto w-full">
          <OrgPageHeader
            title="メンバー一覧"
            description="現在の組織に所属するメンバーを確認できます。"
            actions={
              <>
                <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5">
                  <span className="text-xs font-semibold text-slate-500">所属メンバー</span>
                  <span className="text-sm font-bold text-slate-900">{members.length}名</span>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5">
                  <span className="text-xs font-semibold text-slate-500">有効メンバー</span>
                  <span className="text-sm font-bold text-primary">{activeCount}名</span>
                </div>
              </>
            }
          />

          <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">氏名</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">メール</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">ロール</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">状態</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td className="px-6 py-8 text-sm text-slate-500 text-center" colSpan={4}>
                        メンバー一覧を読み込み中です...
                      </td>
                    </tr>
                  ) : members.length === 0 ? (
                    <tr>
                      <td className="px-6 py-8 text-sm text-slate-500 text-center" colSpan={4}>
                        表示できるメンバーがいません。
                      </td>
                    </tr>
                  ) : (
                    members.map((member) => (
                      <tr key={member.user_id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                          {[member.last_name, member.first_name].filter(Boolean).join(" ") || "-"}
                          {member.is_default ? (
                            <span className="ml-2 inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                              現在の組織
                            </span>
                          ) : null}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">{member.email || "-"}</td>
                        <td className="px-6 py-4 text-sm text-slate-700">{roleLabel(member.membership_role)}</td>
                        <td className="px-6 py-4 text-sm text-slate-700">{statusLabel(member.membership_status)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}


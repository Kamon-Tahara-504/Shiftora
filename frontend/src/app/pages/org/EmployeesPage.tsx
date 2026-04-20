"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { OrgSidebar } from "@/components/org/OrgSidebar";
import { EmployeeCreateModal } from "@/components/org/EmployeeCreateModal";
import { OrgPageHeader } from "@/components/org/OrgPageHeader";
import { ApiError } from "@/lib/api";
import { useEmployees, type EmployeeStatus } from "@/hooks/useEmployees";
import { useShifts } from "@/hooks/useShifts";
import { inviteStaff } from "@/services/employeeService";

type Employee = {
  id: string;
  name: string;
  department: "デイサービス" | "訪問介護";
  status: EmployeeStatus;
};


function DepartmentBadge({ department }: { department: Employee["department"] }) {
  const isDayService = department === "デイサービス";
  const baseClass =
    "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium";

  if (isDayService) {
    return (
      <span className={`${baseClass} bg-primary/10 text-primary`}>
        デイサービス
      </span>
    );
  }

  return (
    <span className={`${baseClass} bg-slate-100 text-slate-700`}>
      訪問介護
    </span>
  );
}

function StatusBadge({ status }: { status: EmployeeStatus }) {
  if (status === "active") {
    return (
      <div className="flex items-center gap-1.5">
        <div className="size-1.5 rounded-full bg-emerald-500" />
        <span className="text-sm text-slate-600">有効</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <div className="size-1.5 rounded-full bg-slate-400" />
      <span className="text-sm text-slate-500">無効</span>
    </div>
  );
}

export default function EmployeesPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteResult, setInviteResult] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [isInviting, setIsInviting] = useState(false);
  const { employees, isLoading, error, addEmployee, patchEmployee, refresh } = useEmployees();
  const { shifts, fetchShifts } = useShifts();

  const pageSize = 10;
  const [currentPage, setCurrentPage] = useState(1);

  const totalCount = employees.length;
  const activeCount = useMemo(
    () => employees.filter((employee) => employee.status === "active").length,
    [employees],
  );
  const inactiveCount = totalCount - activeCount;
  const currentMonthShiftCount = shifts.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const clampedCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (clampedCurrentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedRows = employees.slice(startIndex, endIndex);

  useEffect(() => {
    const now = new Date();
    fetchShifts(now.getFullYear(), now.getMonth() + 1);
  }, [fetchShifts]);

  function initials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    return parts.slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "NA";
  }

  async function handleInvite(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setInviteError(null);
    setInviteResult(null);
    if (!inviteEmail.trim()) {
      setInviteError("招待先メールアドレスを入力してください。");
      return;
    }
    setIsInviting(true);
    try {
      const result = await inviteStaff({ email: inviteEmail.trim().toLowerCase() });
      setInviteResult(`招待を作成しました（対象: ${result.email} / 有効期限: ${result.expires_at ?? "未設定"}）`);
      setInviteEmail("");
    } catch (err) {
      if (err instanceof ApiError) {
        setInviteError(err.message);
      } else {
        setInviteError("招待の作成に失敗しました。");
      }
    } finally {
      setIsInviting(false);
    }
  }

  return (
    <div className="bg-background-light font-display text-slate-900 antialiased h-screen overflow-hidden flex">
      <OrgSidebar />

      <main className="flex-1 h-screen overflow-y-auto bg-background-light p-8">
        <div className="max-w-6xl mx-auto">
          <OrgPageHeader
            title="職員管理"
            description="従業員の役割、ステータス、人員構成を管理します。"
            actions={
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-white text-sm md:text-base font-bold rounded-full hover:bg-primary/90 transition-all shadow-sm shadow-primary/20"
              >
                <Plus className="size-5 md:size-6" />
                <span>職員を追加</span>
              </button>
            }
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">
                総職員数
              </p>
              <p className="text-2xl font-bold mt-1">{totalCount}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">
                有効職員数
              </p>
              <p className="text-2xl font-bold mt-1 text-primary">{activeCount}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">
                今月のシフト件数
              </p>
              <p className="text-2xl font-bold mt-1">{currentMonthShiftCount}</p>
              <p className="mt-1 text-[11px] text-slate-500">無効職員 {inactiveCount} 名</p>
            </div>
          </div>

          <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-8">
            <h3 className="text-sm font-bold text-slate-800 mb-3">登録済みユーザー招待</h3>
            <form className="flex flex-col md:flex-row md:items-start gap-3" onSubmit={handleInvite}>
              <input
                className="w-full md:max-w-md px-4 py-2.5 bg-background-light border border-primary/20 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-sm"
                type="email"
                placeholder="登録済みユーザーのメールアドレス"
                value={inviteEmail}
                onChange={(event) => setInviteEmail(event.target.value)}
                required
              />
              <button
                type="submit"
                disabled={isInviting}
                className="inline-flex items-center justify-center px-4 py-2.5 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary/90 disabled:opacity-60"
              >
                {isInviting ? "作成中..." : "招待を作成"}
              </button>
            </form>
            {inviteError ? (
              <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {inviteError}
              </p>
            ) : null}
            {inviteResult ? (
              <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
                <p className="text-xs text-emerald-700">招待作成結果</p>
                <p className="mt-1 break-all text-xs text-slate-700">{inviteResult}</p>
              </div>
            ) : null}
          </section>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {error ? (
              <div className="mx-6 mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                      氏名
                    </th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                      部署
                    </th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                      ステータス
                    </th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoading ? (
                    <tr>
                      <td
                        className="px-6 py-8 text-sm text-slate-500 text-center"
                        colSpan={4}
                      >
                        職員データを読み込み中です...
                      </td>
                    </tr>
                  ) : paginatedRows.length === 0 ? (
                    <tr>
                      <td
                        className="px-6 py-8 text-sm text-slate-500 text-center"
                        colSpan={4}
                      >
                        表示する職員がまだいません。
                      </td>
                    </tr>
                  ) : (
                    paginatedRows.map((employee) => (
                      <tr
                        key={employee.id}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="size-9 rounded-full bg-slate-200 overflow-hidden">
                              <div className="flex h-full w-full items-center justify-center text-xs font-bold text-slate-600">
                                {initials(employee.name)}
                              </div>
                            </div>
                            <span className="font-semibold text-sm">
                              {employee.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <DepartmentBadge department={employee.department} />
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={employee.status} />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => setEditingEmployee(employee)}
                            className="text-primary hover:underline text-xs font-bold uppercase tracking-tight"
                          >
                            編集
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
              <p className="text-xs text-slate-500">
                全{totalCount}名中 {totalCount === 0 ? 0 : startIndex + 1}
                から
                {Math.min(endIndex, totalCount)}名を表示
              </p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={clampedCurrentPage === 1}
                  className="size-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent"
                >
                  <ChevronLeft className="size-4" />
                </button>
                {Array.from({ length: totalPages }, (_, index) => {
                  const page = index + 1;
                  const isActive = page === clampedCurrentPage;
                  return (
                    <button
                      key={page}
                      type="button"
                      onClick={() => setCurrentPage(page)}
                      className={`size-8 flex items-center justify-center rounded-lg text-xs font-medium ${
                        isActive
                          ? "bg-primary text-white font-bold"
                          : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={clampedCurrentPage === totalPages}
                  className="size-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <EmployeeCreateModal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        mode="create"
        onSubmit={async (values) => {
          try {
            await addEmployee({
              name: values.name,
              department: values.department,
              status: values.status,
            });
            setIsCreateModalOpen(false);
          } catch {
            await refresh();
          }
        }}
      />
      <EmployeeCreateModal
        open={editingEmployee !== null}
        onClose={() => setEditingEmployee(null)}
        mode="edit"
        initialValues={
          editingEmployee
            ? {
                name: editingEmployee.name,
                department: editingEmployee.department,
                status: editingEmployee.status,
                note: "",
              }
            : undefined
        }
        onSubmit={(values) => {
          if (!editingEmployee) return;
          patchEmployee(editingEmployee.id, {
            name: values.name,
            department: values.department,
            status: values.status,
          })
            .then(() => setEditingEmployee(null))
            .catch(async () => {
              await refresh();
              setEditingEmployee(null);
            });
        }}
      />
    </div>
  );
}


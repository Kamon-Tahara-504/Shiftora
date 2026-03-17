"use client";

import { useState } from "react";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { OrgSidebar } from "@/components/org/OrgSidebar";
import { EmployeeCreateModal } from "@/components/org/EmployeeCreateModal";
import { OrgPageHeader } from "@/components/org/OrgPageHeader";

type EmployeeStatus = "active" | "inactive";

type Employee = {
  id: string;
  name: string;
  department: "デイサービス" | "訪問介護";
  status: EmployeeStatus;
  avatarUrl: string;
};

const employees: Employee[] = [
  {
    id: "alice",
    name: "Alice Johnson",
    department: "デイサービス",
    status: "active",
    avatarUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuC6QlmoCvogrojkuFsVc3bAtkJ7phPkec3OWjlByKOH26syFOWdzlHvndvh7jvkzsZXeYXX3vPWkKnRnIcHMs-BrRZ8n0RBO-7Q-ucrA9yVlu1bAGV56jpX6evcJzdOGV-x3msKAOMM-_H5wr8yIEWwYZhxM_ALDWJcKmRtHBVVdzvNSczEwr1-4ipwMS7AE4croIUzwuLdNUUh7FtRl0eftGsRvCjvxOn-uoo7CAQhcHhh4DNGA-yAolQ63ZT3gIrogdOeK0NUa04w",
  },
  {
    id: "bob",
    name: "Bob Smith",
    department: "訪問介護",
    status: "active",
    avatarUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAPY4dggfxyRJXXM-_O9VtBRn_pEkfr6Mqa7sK_h3X9878YBZeEo1Fof6ESuYi-wDqDgXHDLTpBIL2jLzUNLQpOAuYKMHVy49Hj1UfNWE78-Fbe8I9rO1yP0_Iqo5FEKAzf2IloyEzcGb53iagxbZ9hR3-J_UvKx6pJPEkXglXIHV3vsqVaflseCvYAjVUU1vGgIsQnexBiche1yeqLRjJQ16IBh5jp-arnTPjSHUtJc-Gjzvtg8mfOBYXlvrbA-RyM1erTT7QRK2tF",
  },
  {
    id: "charlie",
    name: "Charlie Brown",
    department: "デイサービス",
    status: "inactive",
    avatarUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCu7KYFzr1OWxeD1hAnwBpR3HjOr-TpgNxSSxdAPP6kqWTYlMjFXM0WLcfi82bnnaDcPhaetsgb2zF2JUkkV2Soia-tj29IRO6JO6pX6NYAkAK2eqSymrjchOf1pwQVlROVVPbseNjqEHAmoZMnq6ALrNCZGd7AF-V8ADXM_58oA1RcW4YES9DtI3nijBzXUnngGVp7mP6-A9Fi4Lm92tKm5salbgPhaPjLUDqOgOuADH7HAb_Flec_szAM7dq3SSkIWRCCg9aexk-0",
  },
  {
    id: "diana",
    name: "Diana Prince",
    department: "訪問介護",
    status: "active",
    avatarUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCKu-Y5ff1GEeqgomtd88h7XMFeMjP1EXN24d3nANGvQ4aZr6y-yxAFfRjfZAC3hkCBt-minqC_n03-4lWN4y29GLpsfFF1Tc1SSdQGS2gIi_mMTEVBQYU2slrEpD6XWtqAJ8cKIZ_N2OyMBtnVqe8VFSq9Aq4noNV9wDKvQ3EOZhriYlKvEbsD0Nm_3MyQDcUKX0tVasu3PyA2lrbldZhMQzlyThLu-Ey-9HS809974n6FzCvd7Nq1KpfuFGMHL0ix2VwHkeTTjxrc",
  },
];

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
  const [rows, setRows] = useState<Employee[]>(employees);

  const pageSize = 10;
  const [currentPage, setCurrentPage] = useState(1);

  const totalCount = rows.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const clampedCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (clampedCurrentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedRows = rows.slice(startIndex, endIndex);

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
              <p className="text-2xl font-bold mt-1">124</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">
                稼働中のシフト
              </p>
              <p className="text-2xl font-bold mt-1 text-primary">82</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">
                承認待ち
              </p>
              <p className="text-2xl font-bold mt-1">12</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
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
                  {paginatedRows.map((employee) => (
                    <tr
                      key={employee.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="size-9 rounded-full bg-slate-200 overflow-hidden">
                            <img
                              src={employee.avatarUrl}
                              alt={employee.name}
                              className="w-full h-full object-cover"
                            />
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
                  ))}
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
        onSubmit={(values) => {
          // 本実装では API 連携などに置き換える想定
          const newEmployee: Employee = {
            id: crypto.randomUUID(),
            name: values.name,
            department: values.department,
            status: values.status,
            avatarUrl:
              "https://lh3.googleusercontent.com/aida-public/AB6AXuC6QlmoCvogrojkuFsVc3bAtkJ7phPkec3OWjlByKOH26syFOWdzlHvndvh7jvkzsZXeYXX3vPWkKnRnIcHMs-BrRZ8n0RBO-7Q-ucrA9yVlu1bAGV56jpX6evcJzdOGV-x3msKAOMM-_H5wr8yIEWwYZhxM_ALDWJcKmRtHBVVdzvNSczEwr1-4ipwMS7AE4croIUzwuLdNUUh7FtRl0eftGsRvCjvxOn-uoo7CAQhcHhh4DNGA-yAolQ63ZT3gIrogdOeK0NUa04w",
          };
          setRows((prev) => [...prev, newEmployee]);
          setIsCreateModalOpen(false);
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
          setRows((prev) =>
            prev.map((emp) =>
              emp.id === editingEmployee.id
                ? {
                    ...emp,
                    name: values.name,
                    department: values.department,
                    status: values.status,
                  }
                : emp,
            ),
          );
          setEditingEmployee(null);
        }}
      />
    </div>
  );
}


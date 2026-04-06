"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createEmployee,
  getEmployees,
  updateEmployee,
  type ApiEmployee,
} from "@/services/employeeService";

export type EmployeeStatus = "active" | "inactive";

export type UiEmployee = {
  id: string;
  name: string;
  department: "デイサービス" | "訪問介護";
  status: EmployeeStatus;
  avatarUrl: string;
};

type CreateUiEmployeeInput = {
  name: string;
  department: "デイサービス" | "訪問介護";
  status: EmployeeStatus;
};

type UpdateUiEmployeeInput = {
  name?: string;
  department?: "デイサービス" | "訪問介護";
  status?: EmployeeStatus;
};

function toDepartment(employee: ApiEmployee): UiEmployee["department"] {
  return employee.can_visit ? "訪問介護" : "デイサービス";
}

function toStatus(employee: ApiEmployee): EmployeeStatus {
  return employee.is_active ? "active" : "inactive";
}

function fallbackAvatar(employeeId: string): string {
  return `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(employeeId)}`;
}

function toUiEmployee(employee: ApiEmployee): UiEmployee {
  return {
    id: employee.id,
    name: employee.name,
    department: toDepartment(employee),
    status: toStatus(employee),
    avatarUrl: fallbackAvatar(employee.id),
  };
}

export function useEmployees() {
  const [employees, setEmployees] = useState<UiEmployee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const items = await getEmployees(true);
      setEmployees(items.map(toUiEmployee));
    } catch (err) {
      const message = err instanceof Error ? err.message : "職員情報の取得に失敗しました。";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addEmployee = useCallback(async (input: CreateUiEmployeeInput) => {
    const base = await createEmployee({
      name: input.name,
      employment_type: input.department,
      can_visit: input.department === "訪問介護",
    });

    let saved = base;
    if (input.status === "inactive") {
      saved = await updateEmployee(base.id, { is_active: false });
    }

    const ui = toUiEmployee(saved);
    setEmployees((prev) => [...prev, ui]);
    return ui;
  }, []);

  const patchEmployee = useCallback(
    async (employeeId: string, input: UpdateUiEmployeeInput) => {
      const updated = await updateEmployee(employeeId, {
        name: input.name,
        employment_type: input.department,
        can_visit:
          input.department === undefined ? undefined : input.department === "訪問介護",
        is_active:
          input.status === undefined ? undefined : input.status === "active",
      });
      const ui = toUiEmployee(updated);
      setEmployees((prev) => prev.map((item) => (item.id === employeeId ? ui : item)));
      return ui;
    },
    [],
  );

  return {
    employees,
    isLoading,
    error,
    refresh,
    addEmployee,
    patchEmployee,
  };
}

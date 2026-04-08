import { apiFetch, parseApiError } from "@/lib/api";

export type ApiEmployee = {
  id: string;
  name: string;
  employment_type: string | null;
  can_visit: boolean;
  fixed_holiday: unknown;
  max_consecutive_days: number | null;
  max_weekly_days: number | null;
  is_active: boolean;
  user_id: string | null;
  created_at: string | null;
};

export type CreateEmployeeInput = {
  name: string;
  employment_type?: string | null;
  can_visit?: boolean;
  fixed_holiday?: unknown;
  max_consecutive_days?: number | null;
  max_weekly_days?: number | null;
};

export type UpdateEmployeeInput = {
  name?: string;
  employment_type?: string | null;
  can_visit?: boolean;
  fixed_holiday?: unknown;
  max_consecutive_days?: number | null;
  max_weekly_days?: number | null;
  is_active?: boolean;
};

export type InviteStaffInput = {
  email: string;
  role?: "staff";
};

export type InviteStaffResponse = {
  token: string;
  expires_at: string | null;
  email: string;
  role: "staff";
  signup_url_template: string;
};

export async function getEmployees(includeInactive = true): Promise<ApiEmployee[]> {
  const query = includeInactive ? "?include_inactive=true" : "";
  const response = await apiFetch(`/org/employees${query}`);
  if (!response.ok) {
    throw await parseApiError(response);
  }
  return (await response.json()) as ApiEmployee[];
}

export async function createEmployee(input: CreateEmployeeInput): Promise<ApiEmployee> {
  const response = await apiFetch("/org/employees", {
    method: "POST",
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw await parseApiError(response);
  }
  return (await response.json()) as ApiEmployee;
}

export async function updateEmployee(
  employeeId: string,
  input: UpdateEmployeeInput,
): Promise<ApiEmployee> {
  const response = await apiFetch(`/org/employees/${employeeId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw await parseApiError(response);
  }
  return (await response.json()) as ApiEmployee;
}

export async function inviteStaff(input: InviteStaffInput): Promise<InviteStaffResponse> {
  const response = await apiFetch("/org/invite", {
    method: "POST",
    body: JSON.stringify({
      email: input.email,
      role: input.role ?? "staff",
    }),
  });
  if (!response.ok) {
    throw await parseApiError(response);
  }
  return (await response.json()) as InviteStaffResponse;
}

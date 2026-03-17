import { apiFetch, parseApiError } from "@/lib/api";

export type ShiftAssignment = {
  id: string;
  date: string;
  slot: "AM" | "PM";
  department: "daycare" | "visit";
  employee_id: string;
};

export type ShiftUpdateInput = {
  employee_id?: string;
  department?: "daycare" | "visit";
  slot?: "AM" | "PM";
};

export type ShiftInfeasibleResponse = {
  status: "infeasible";
  missing_slots: Array<{
    date: string;
    slot: "AM" | "PM";
    department: "daycare" | "visit";
    required: number;
    assigned: number;
  }>;
};

export async function getShifts(year: number, month: number): Promise<ShiftAssignment[]> {
  const response = await apiFetch(`/org/shifts?year=${year}&month=${month}`);
  if (!response.ok) {
    throw await parseApiError(response);
  }
  return (await response.json()) as ShiftAssignment[];
}

export async function generateShifts(year: number, month: number): Promise<{ status: "ok" } | ShiftInfeasibleResponse> {
  const response = await apiFetch("/org/shifts/generate", {
    method: "POST",
    body: JSON.stringify({ year, month }),
  });

  if (response.status === 422) {
    const data = await response.json();
    if (data.status === "infeasible") {
      return data as ShiftInfeasibleResponse;
    }
  }

  if (!response.ok) {
    throw await parseApiError(response);
  }

  return (await response.json()) as { status: "ok" };
}

export async function updateShift(shiftId: string, input: ShiftUpdateInput): Promise<ShiftAssignment> {
  const response = await apiFetch(`/org/shifts/${shiftId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw await parseApiError(response);
  }
  return (await response.json()) as ShiftAssignment;
}

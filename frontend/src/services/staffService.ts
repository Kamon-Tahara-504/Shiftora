import { apiFetch, parseApiError } from "@/lib/api";
import { ShiftAssignment } from "./shiftService";

export type DayOffRequest = {
  id: string;
  date: string;
  employee_id: string;
};

export async function getMyShifts(year: number, month: number): Promise<ShiftAssignment[]> {
  const response = await apiFetch(`/staff/shifts?year=${year}&month=${month}`);
  if (!response.ok) {
    throw await parseApiError(response);
  }
  return (await response.json()) as ShiftAssignment[];
}

export async function getDayOffs(): Promise<DayOffRequest[]> {
  const response = await apiFetch("/staff/day-offs");
  if (!response.ok) {
    throw await parseApiError(response);
  }
  return (await response.json()) as DayOffRequest[];
}

export async function requestDayOff(date: string): Promise<DayOffRequest> {
  const response = await apiFetch("/staff/day-offs", {
    method: "POST",
    body: JSON.stringify({ date }),
  });
  if (!response.ok) {
    throw await parseApiError(response);
  }
  return (await response.json()) as DayOffRequest;
}

export async function cancelDayOff(id: string): Promise<void> {
  const response = await apiFetch(`/staff/day-offs/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw await parseApiError(response);
  }
}

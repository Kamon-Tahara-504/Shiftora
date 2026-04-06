import { useCallback, useState } from "react";
import { getShifts, updateShift, type ShiftAssignment, type ShiftUpdateInput } from "@/services/shiftService";

export function useShifts() {
  const [shifts, setShifts] = useState<ShiftAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchShifts = useCallback(async (year: number, month: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getShifts(year, month);
      setShifts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "シフトの取得に失敗しました。");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const patchShift = useCallback(async (shiftId: string, input: ShiftUpdateInput) => {
    try {
      const updated = await updateShift(shiftId, input);
      setShifts((prev) => prev.map((s) => (s.id === shiftId ? updated : s)));
      return updated;
    } catch (err) {
      throw err;
    }
  }, []);

  return {
    shifts,
    isLoading,
    error,
    fetchShifts,
    patchShift,
  };
}

import { useCallback, useState } from "react";
import { getMyShifts } from "@/services/staffService";
import { type ShiftAssignment } from "@/services/shiftService";

export function useMyShifts() {
  const [shifts, setShifts] = useState<ShiftAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMyShifts = useCallback(async (year: number, month: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getMyShifts(year, month);
      setShifts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "自分のシフトの取得に失敗しました。");
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    shifts,
    isLoading,
    error,
    fetchMyShifts,
  };
}

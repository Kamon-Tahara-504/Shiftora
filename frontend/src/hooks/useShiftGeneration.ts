import { useCallback, useState } from "react";
import { generateShifts, type ShiftInfeasibleResponse } from "@/services/shiftService";

export function useShiftGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infeasibleData, setInfeasibleData] = useState<ShiftInfeasibleResponse | null>(null);

  const triggerGeneration = useCallback(async (year: number, month: number) => {
    setIsGenerating(true);
    setError(null);
    setInfeasibleData(null);
    try {
      const result = await generateShifts(year, month);
      if ("status" in result && result.status === "infeasible") {
        setInfeasibleData(result as ShiftInfeasibleResponse);
        setError("一部の制約を満たせないため、シフトを生成できませんでした。");
        return false;
      }
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "シフト生成中にエラーが発生しました。");
      return false;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  return {
    isGenerating,
    error,
    infeasibleData,
    triggerGeneration,
  };
}

import { useCallback, useState, useEffect } from "react";
import { getDayOffs, requestDayOff, cancelDayOff, type DayOffRequest } from "@/services/staffService";

export function useDayOffs() {
  const [requests, setRequests] = useState<DayOffRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getDayOffs();
      setRequests(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "希望休の取得に失敗しました。");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const addRequest = useCallback(async (date: string) => {
    setError(null);
    try {
      // 既存の申請があるか確認
      const exists = requests.find((r) => r.date === date);
      if (exists) return;

      const newRequest = await requestDayOff(date);
      setRequests((prev) => [...prev, newRequest]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "希望休の申請に失敗しました。");
      throw err;
    }
  }, [requests]);

  const removeRequest = useCallback(async (id: string) => {
    setError(null);
    const previousRequests = [...requests];
    // Optimistic update
    setRequests((prev) => prev.filter((r) => r.id !== id));
    try {
      await cancelDayOff(id);
    } catch (err) {
      // Rollback
      setRequests(previousRequests);
      setError(err instanceof Error ? err.message : "希望休の取り消しに失敗しました。");
      throw err;
    }
  }, [requests]);

  return {
    requests,
    isLoading,
    error,
    refresh: fetchRequests,
    addRequest,
    removeRequest,
  };
}

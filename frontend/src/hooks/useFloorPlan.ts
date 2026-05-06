import { useCallback, useEffect, useRef, useState } from "react";
import { fetchFloorPlan } from "../api/restaurantApi";
import type { FloorPlanArea } from "../types/models";

const POLL_INTERVAL_MS = 30_000;

export function useFloorPlan() {
  const [areas, setAreas] = useState<FloorPlanArea[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchFloorPlan();
      setAreas(data.areas);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load floor plan");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load + polling
  useEffect(() => {
    void refresh();
    timerRef.current = setInterval(() => void refresh(), POLL_INTERVAL_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [refresh]);

  return { areas, loading, error, refresh };
}

"use client";

import { useEffect, useState } from "react";

import { ApiError } from "@/lib/api/client";
import { getAnalytics, type Analytics } from "@/lib/api/shop";

/** تحليلات المتجر لفترة — تُعاد عند تغيّر المتجر أو الفترة. */
export function useAnalytics(storeId: string, days: number) {
  const [data, setData] = useState<Analytics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setData(null);
      setError(null);
      try {
        const res = await getAnalytics(storeId, days);
        if (!cancelled) setData(res);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "تعذّر تحميل التحليلات.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [storeId, days]);

  return { data, error, loading: !data && !error };
}

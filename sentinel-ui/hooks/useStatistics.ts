"use client";

import useSWR from "swr";
import { fetcher, Statistics } from "@/lib/api";

export function useStatistics() {
  const { data, error, isLoading } = useSWR<Statistics>(
    "/api/proxy/statistics",
    fetcher,
    {
      refreshInterval: 5000,
      revalidateOnFocus: false,
      errorRetryCount: 3,
    }
  );

  return {
    stats: data ?? null,
    isLoading,
    isError: !!error,
  };
}

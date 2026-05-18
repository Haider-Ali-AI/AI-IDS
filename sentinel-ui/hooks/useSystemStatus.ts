"use client";

import useSWR from "swr";
import { fetcher, SystemStatus } from "@/lib/api";

export function useSystemStatus() {
  const { data, error, isLoading } = useSWR<SystemStatus>(
    "/api/proxy/status",
    fetcher,
    {
      refreshInterval: 3000,
      revalidateOnFocus: false,
      errorRetryCount: 3,
    }
  );

  return {
    status: data ?? null,
    isLoading,
    isError: !!error,
  };
}

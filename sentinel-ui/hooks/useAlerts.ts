"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import useSWR from "swr";
import { fetcher, Alert } from "@/lib/api";

const WS_BASE =
  process.env.NEXT_PUBLIC_WS_BASE ?? "ws://localhost:8000";

export function useAlerts(limit = 50) {
  const [wsAlerts, setWsAlerts] = useState<Alert[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  // Initial load via SWR
  const { data: initialAlertsData } = useSWR<{ alerts: Alert[] }>(
    `/api/proxy/alerts?limit=${limit}`,
    fetcher,
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );
  const initialAlerts = initialAlertsData?.alerts;

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const ws = new WebSocket(`${WS_BASE}/ws/alerts`);
      wsRef.current = ws;

      ws.onopen = () => setIsConnected(true);

      ws.onmessage = (event) => {
        try {
          const alert = JSON.parse(event.data) as Alert;
          setWsAlerts((prev) => [alert, ...prev].slice(0, 200));
        } catch {
          // ignore malformed messages
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        // Reconnect after 3 seconds
        setTimeout(connect, 3000);
      };

      ws.onerror = () => {
        setIsConnected(false);
        ws.close();
      };
    } catch {
      // WebSocket not available (SSR)
    }
  }, []);

  useEffect(() => {
    connect();
    return () => {
      wsRef.current?.close();
    };
  }, [connect]);

  // Merge WS alerts with initial SWR data, deduplicate by id
  const allAlerts = (() => {
    const seen = new Set<number>();
    const merged = [...wsAlerts, ...(initialAlerts ?? [])];
    return merged.filter((a) => {
      if (seen.has(a.id)) return false;
      seen.add(a.id);
      return true;
    });
  })();

  return { alerts: allAlerts, isConnected };
}

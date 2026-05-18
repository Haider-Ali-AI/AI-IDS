"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useSystemStatus } from "@/hooks/useSystemStatus";
import { Activity, Shield, Wifi, WifiOff, Cpu, MemoryStick, AlertTriangle } from "lucide-react";
import clsx from "clsx";

function StatusPill({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: "green" | "red" | "blue" | "yellow";
}) {
  const colors = {
    green: {
      bg: "rgba(0, 255, 136, 0.08)",
      border: "rgba(0, 255, 136, 0.3)",
      text: "#00ff88",
      dot: "#00ff88",
    },
    red: {
      bg: "rgba(255, 51, 102, 0.08)",
      border: "rgba(255, 51, 102, 0.3)",
      text: "#ff3366",
      dot: "#ff3366",
    },
    blue: {
      bg: "rgba(0, 212, 255, 0.08)",
      border: "rgba(0, 212, 255, 0.3)",
      text: "#00d4ff",
      dot: "#00d4ff",
    },
    yellow: {
      bg: "rgba(255, 215, 0, 0.08)",
      border: "rgba(255, 215, 0, 0.3)",
      text: "#ffd700",
      dot: "#ffd700",
    },
  };

  const c = colors[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2 px-4 py-2 rounded-full text-sm"
      style={{
        background: c.bg,
        border: `1px solid ${c.border}`,
      }}
    >
      {/* pulsing dot */}
      <span
        className="pulse-dot w-2 h-2 rounded-full shrink-0"
        style={{ background: c.dot }}
      />
      <span style={{ color: c.text }} className="opacity-70">
        {icon}
      </span>
      <span className="text-slate-400 text-xs">{label}</span>
      <span className="font-semibold text-xs" style={{ color: c.text }}>
        {value}
      </span>
    </motion.div>
  );
}

function LoadingBar() {
  return (
    <div className="flex items-center gap-2 px-4 py-2 rounded-full glass-card">
      <div
        className="w-2 h-2 rounded-full bg-slate-600 animate-pulse"
      />
      <span className="text-xs text-slate-600">Connecting…</span>
    </div>
  );
}

export default function StatusBar() {
  const { status, isLoading, isError } = useSystemStatus();

  const isRunning = status?.sniffer?.is_running ?? false;
  const sniffer = status?.sniffer;
  const triage = status?.triage;

  if (isLoading) {
    return (
      <div className="flex flex-wrap gap-3">
        {[1, 2, 3, 4].map((i) => (
          <LoadingBar key={i} />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <StatusPill
        icon={<WifiOff size={12} />}
        label="Backend"
        value="Offline"
        color="red"
      />
    );
  }

  return (
    <AnimatePresence>
      <div className="flex flex-wrap gap-3">
        <StatusPill
          icon={<Shield size={12} />}
          label="Sentinel"
          value={isRunning ? "Active" : "Stopped"}
          color={isRunning ? "green" : "red"}
        />
        <StatusPill
          icon={<Activity size={12} />}
          label="Processed"
          value={triage?.packets_processed?.toLocaleString() ?? "0"}
          color="blue"
        />
        <StatusPill
          icon={<AlertTriangle size={12} />}
          label="Flagged"
          value={triage?.packets_flagged?.toLocaleString() ?? "0"}
          color={(triage?.packets_flagged ?? 0) > 0 ? "yellow" : "green"}
        />
        <StatusPill
          icon={<Cpu size={12} />}
          label="Captured"
          value={sniffer?.packets_captured?.toLocaleString() ?? "0"}
          color="blue"
        />
        <StatusPill
          icon={<Wifi size={12} />}
          label="Interface"
          value={sniffer?.interface ?? "—"}
          color="blue"
        />
      </div>
    </AnimatePresence>
  );
}

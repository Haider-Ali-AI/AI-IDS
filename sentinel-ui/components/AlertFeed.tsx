"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAlerts } from "@/hooks/useAlerts";
import { Alert } from "@/lib/api";
import {
  Shield,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp,
  Wifi,
  WifiOff,
  Filter,
} from "lucide-react";

const THREAT_ICONS: Record<string, React.ReactNode> = {
  CRITICAL: <AlertTriangle size={14} className="text-red-400" />,
  HIGH: <AlertTriangle size={14} className="text-orange-400" />,
  MEDIUM: <AlertTriangle size={14} className="text-yellow-400" />,
  LOW: <Info size={14} className="text-green-400" />,
  INFO: <Info size={14} className="text-blue-400" />,
};

const THREAT_CLASS: Record<string, string> = {
  CRITICAL: "badge-critical",
  HIGH: "badge-high",
  MEDIUM: "badge-medium",
  LOW: "badge-low",
  INFO: "badge-low",
};

function AlertRow({ alert }: { alert: Alert }) {
  const [expanded, setExpanded] = useState(false);

  const ts = new Date(alert.timestamp).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.25 }}
      className="glass-card mb-2 overflow-hidden cursor-pointer"
      onClick={() => setExpanded((e) => !e)}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="shrink-0">
          {THREAT_ICONS[alert.threat_level] ?? <Shield size={14} />}
        </div>
        <div className="shrink-0">
          <span className={THREAT_CLASS[alert.threat_level] ?? "badge-low"}>
            {alert.threat_level}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-slate-200 truncate">
              {alert.threat_type || "Unknown Threat"}
            </span>
            <span className="text-xs text-slate-500">
              {alert.source_ip}:{alert.source_port} → {alert.dest_ip}:{alert.dest_port}
            </span>
          </div>
          <p className="text-xs text-slate-500 truncate mt-0.5">{alert.description}</p>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <span className="text-xs text-slate-600">{ts}</span>
          <span className="text-slate-600">
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </span>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div
              className="px-4 pb-4 pt-1 border-t space-y-2"
              style={{ borderColor: "rgba(0,212,255,0.1)" }}
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div>
                  <p className="text-slate-500">Protocol</p>
                  <p className="text-cyan-400 font-semibold">{alert.protocol}</p>
                </div>
                <div>
                  <p className="text-slate-500">Action Taken</p>
                  <p className="text-yellow-400 font-semibold">{alert.action_taken}</p>
                </div>
                <div>
                  <p className="text-slate-500">Packet Size</p>
                  <p className="text-slate-300">{alert.packet_size} bytes</p>
                </div>
                <div>
                  <p className="text-slate-500">Alert ID</p>
                  <p className="text-slate-500 font-mono text-[10px] truncate">{alert.id}</p>
                </div>
              </div>
              {alert.ai_analysis && (
                <div
                  className="rounded-lg p-3 text-xs text-slate-300 leading-relaxed"
                  style={{ background: "rgba(0,212,255,0.04)", border: "1px solid rgba(0,212,255,0.1)" }}
                >
                  <p className="text-cyan-400 font-semibold mb-1 uppercase text-[10px] tracking-wider">
                    AI Analysis
                  </p>
                  {alert.ai_analysis}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function AlertFeed() {
  const { alerts, isConnected } = useAlerts(50);
  const [levelFilter, setLevelFilter] = useState<string>("ALL");
  const [showFilter, setShowFilter] = useState(false);

  const levels = ["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"];
  const filtered =
    levelFilter === "ALL"
      ? alerts
      : alerts.filter((a) => a.threat_level === levelFilter);

  return (
    <div className="glass-card flex flex-col overflow-hidden" style={{ maxHeight: "600px" }}>
      {/* Header */}
      <div className="p-5 border-b shrink-0 flex items-center justify-between" style={{ borderColor: "rgba(0,212,255,0.15)" }}>
        <div>
          <h3
            className="text-sm font-bold text-cyan-400 uppercase tracking-widest"
            style={{ fontFamily: "var(--font-orbitron, monospace)" }}
          >
            Live Alert Feed
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {filtered.length} event{filtered.length !== 1 ? "s" : ""}
            {" — "}{levelFilter === "ALL" ? "all levels" : levelFilter}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* WS status */}
          <div className="flex items-center gap-1.5 text-xs">
            {isConnected ? (
              <>
                <span className="pulse-dot w-2 h-2 rounded-full" style={{ background: "#00ff88" }} />
                <span style={{ color: "#00ff88" }}>Live</span>
                <Wifi size={12} className="text-green-400" />
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-slate-600" />
                <span className="text-slate-500">Polling</span>
                <WifiOff size={12} className="text-slate-500" />
              </>
            )}
          </div>
          {/* Filter btn */}
          <button
            onClick={() => setShowFilter((s) => !s)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs transition-all"
            style={{
              background: showFilter ? "rgba(0,212,255,0.1)" : "transparent",
              border: "1px solid rgba(0,212,255,0.2)",
              color: "#00d4ff",
            }}
          >
            <Filter size={12} />
            Filter
          </button>
        </div>
      </div>

      {/* Filter row */}
      <AnimatePresence>
        {showFilter && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b"
            style={{ borderColor: "rgba(0,212,255,0.1)" }}
          >
            <div className="flex gap-2 p-3 flex-wrap">
              {levels.map((l) => (
                <button
                  key={l}
                  onClick={() => setLevelFilter(l)}
                  className="px-3 py-1 rounded-full text-xs font-semibold transition-all"
                  style={{
                    background:
                      levelFilter === l
                        ? l === "CRITICAL"
                          ? "rgba(255,51,102,0.2)"
                          : l === "HIGH"
                          ? "rgba(255,153,0,0.2)"
                          : "rgba(0,212,255,0.2)"
                        : "transparent",
                    border: `1px solid ${
                      levelFilter === l
                        ? l === "CRITICAL"
                          ? "#ff3366"
                          : l === "HIGH"
                          ? "#ff9900"
                          : "#00d4ff"
                        : "rgba(100,116,139,0.2)"
                    }`,
                    color:
                      levelFilter === l
                        ? l === "CRITICAL"
                          ? "#ff3366"
                          : l === "HIGH"
                          ? "#ff9900"
                          : "#00d4ff"
                        : "#64748b",
                  }}
                >
                  {l}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Alert list */}
      <div className="flex-1 overflow-y-auto p-4">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-3 text-slate-600">
            <Shield size={32} />
            <p className="text-sm">No alerts detected</p>
            <p className="text-xs">Sentinel is monitoring the network…</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {filtered.map((alert) => (
              <AlertRow key={alert.id} alert={alert} />
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

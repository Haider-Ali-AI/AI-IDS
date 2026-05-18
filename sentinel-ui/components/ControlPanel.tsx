"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import useSWR from "swr";
import { fetcher } from "@/lib/api";
import { useSystemStatus } from "@/hooks/useSystemStatus";
import {
  Shield,
  Play,
  Square,
  ChevronLeft,
  ChevronRight,
  Network,
  Search,
  Activity,
} from "lucide-react";

const INTERFACES = ["Wi-Fi", "Ethernet", "lo", "eth0", "wlan0"];

export default function ControlPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIface, setSelectedIface] = useState("Wi-Fi");
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [packetInput, setPacketInput] = useState("");
  const [analyzeResult, setAnalyzeResult] = useState("");
  const { status } = useSystemStatus();

  const isRunning = status?.sniffer?.is_running ?? false;
  const sniffer = status?.sniffer;
  const triage = status?.triage;

  const handleStart = async () => {
    if (isRunning) return;
    setIsStarting(true);
    try {
      const r = await fetch("/api/proxy/toggle-sniffing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interface: selectedIface }),
      });
      if (!r.ok) throw new Error("Failed to start");
    } catch {
      // ignore
    } finally {
      setIsStarting(false);
    }
  };

  const handleStop = async () => {
    if (!isRunning) return;
    setIsStopping(true);
    try {
      await fetch("/api/proxy/toggle-sniffing", { method: "POST" });
    } catch {
      // ignore
    } finally {
      setIsStopping(false);
    }
  };

  const handleAnalyze = async () => {
    if (!packetInput.trim()) return;
    setAnalyzeResult("Analyzing…");
    try {
      const r = await fetch("/api/proxy/analyze-sample", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
           src_ip: "127.0.0.1", 
           dst_ip: "127.0.0.1", 
           payload_hex: packetInput 
        }),
      });
      const data = await r.json();
      setAnalyzeResult(data?.analysis?.explanation ?? "Analysis complete. See alerts for details.");
    } catch (e) {
      setAnalyzeResult("Error: Could not reach backend.");
    }
  };

  const { data: interfacesData } = useSWR<{ interfaces: string[] }>(
    "/api/proxy/interfaces",
    fetcher
  );
  const interfaces = interfacesData?.interfaces ?? INTERFACES;

  const qFill =
    status?.queues && status.queues.packet_queue_max > 0
      ? (status.queues.packet_queue_size / status.queues.packet_queue_max) * 100
      : 0;

  return (
    <>
      {/* Toggle tab */}
      <motion.button
        onClick={() => setIsOpen((o) => !o)}
        className="fixed left-0 top-1/2 -translate-y-1/2 z-40 flex items-center justify-center w-8 h-16 rounded-r-lg transition-all"
        style={{ background: "rgba(0,212,255,0.12)", border: "1px solid rgba(0,212,255,0.3)", borderLeft: "none" }}
        whileHover={{ width: 36 }}
      >
        <motion.div animate={{ rotate: isOpen ? 0 : 0 }}>
          {isOpen ? <ChevronLeft size={16} className="text-cyan-400" /> : <ChevronRight size={16} className="text-cyan-400" />}
        </motion.div>
      </motion.button>

      {/* Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed left-0 top-0 bottom-0 z-30 w-72 flex flex-col"
            style={{
              background: "rgba(5, 12, 28, 0.97)",
              borderRight: "1px solid rgba(0,212,255,0.2)",
              backdropFilter: "blur(20px)",
            }}
          >
            {/* Header */}
            <div className="p-5 border-b" style={{ borderColor: "rgba(0,212,255,0.15)" }}>
              <div className="flex items-center gap-2 mb-1">
                <Shield size={18} className="text-cyan-400" />
                <h2
                  className="text-sm font-bold text-cyan-400 uppercase tracking-widest"
                  style={{ fontFamily: "var(--font-orbitron, monospace)" }}
                >
                  Sentinel Control
                </h2>
              </div>
              <p className="text-xs text-slate-500">Network monitoring controls</p>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {/* Status summary */}
              <div
                className="rounded-xl p-4"
                style={{
                  background: isRunning ? "rgba(0,255,136,0.05)" : "rgba(255,51,102,0.05)",
                  border: `1px solid ${isRunning ? "rgba(0,255,136,0.2)" : "rgba(255,51,102,0.2)"}`,
                }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className="pulse-dot w-2.5 h-2.5 rounded-full"
                    style={{ background: isRunning ? "#00ff88" : "#ff3366" }}
                  />
                  <span
                    className="text-xs font-bold uppercase tracking-wider"
                    style={{ color: isRunning ? "#00ff88" : "#ff3366" }}
                  >
                    Sentinel {isRunning ? "Active" : "Stopped"}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-slate-500">Packets Caught</p>
                    <p className="text-slate-200 font-semibold">{sniffer?.packets_captured?.toLocaleString() ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Alerts</p>
                    <p className="text-yellow-400 font-semibold">{triage?.packets_flagged?.toLocaleString() ?? "—"}</p>
                  </div>
                </div>
              </div>

              {/* Interface selector */}
              <div>
                <label className="flex items-center gap-1.5 text-xs text-slate-400 mb-2 font-semibold uppercase tracking-wider">
                  <Network size={12} />
                  Network Interface
                </label>
                <select
                  value={selectedIface}
                  onChange={(e) => setSelectedIface(e.target.value)}
                  className="w-full rounded-lg px-3 py-2 text-sm text-slate-200 outline-none"
                  style={{
                    background: "rgba(0,212,255,0.06)",
                    border: "1px solid rgba(0,212,255,0.2)",
                  }}
                >
                  {interfaces.map((iface) => (
                    <option key={iface} value={iface} style={{ background: "#070d1a" }}>
                      {iface}
                    </option>
                  ))}
                </select>
              </div>

              {/* Start/Stop buttons */}
              <div className="grid grid-cols-2 gap-3">
                <motion.button
                  onClick={handleStart}
                  disabled={isRunning || isStarting}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    background: "linear-gradient(135deg, rgba(0,255,136,0.2), rgba(0,255,136,0.1))",
                    border: "1px solid rgba(0,255,136,0.4)",
                    color: "#00ff88",
                  }}
                >
                  <Play size={14} />
                  {isStarting ? "Starting…" : "Start"}
                </motion.button>
                <motion.button
                  onClick={handleStop}
                  disabled={!isRunning || isStopping}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    background: "linear-gradient(135deg, rgba(255,51,102,0.2), rgba(255,51,102,0.1))",
                    border: "1px solid rgba(255,51,102,0.4)",
                    color: "#ff3366",
                  }}
                >
                  <Square size={14} />
                  {isStopping ? "Stopping…" : "Stop"}
                </motion.button>
              </div>

              {/* Queue fill */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold uppercase tracking-wider">
                    <Activity size={12} />
                    Queue Utilization
                  </span>
                  <span className="text-xs font-bold" style={{ color: qFill > 80 ? "#ff3366" : qFill > 50 ? "#ffd700" : "#00ff88" }}>
                    {qFill.toFixed(1)}%
                  </span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(100,116,139,0.2)" }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{
                      background:
                        qFill > 80
                          ? "linear-gradient(90deg, #ff3366, #ff0000)"
                          : qFill > 50
                          ? "linear-gradient(90deg, #ffd700, #ff9900)"
                          : "linear-gradient(90deg, #00d4ff, #00ff88)",
                    }}
                    animate={{ width: `${qFill}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  {status?.queues?.packet_queue_size ?? 0} / {status?.queues?.packet_queue_max ?? 0} packets
                </p>
              </div>

              {/* Manual packet analyzer */}
              <div>
                <label className="flex items-center gap-1.5 text-xs text-slate-400 mb-2 font-semibold uppercase tracking-wider">
                  <Search size={12} />
                  Manual Packet Analyzer
                </label>
                <textarea
                  value={packetInput}
                  onChange={(e) => setPacketInput(e.target.value)}
                  placeholder="Paste packet data or description…"
                  rows={3}
                  className="w-full rounded-lg px-3 py-2 text-xs text-slate-300 outline-none resize-none"
                  style={{
                    background: "rgba(0,212,255,0.05)",
                    border: "1px solid rgba(0,212,255,0.15)",
                    fontFamily: "monospace",
                  }}
                />
                <button
                  onClick={handleAnalyze}
                  className="mt-2 w-full py-2 rounded-lg text-xs font-bold transition-all"
                  style={{
                    background: "linear-gradient(135deg, rgba(168,85,247,0.2), rgba(168,85,247,0.1))",
                    border: "1px solid rgba(168,85,247,0.4)",
                    color: "#a855f7",
                  }}
                >
                  Analyze with AI
                </button>
                {analyzeResult && (
                  <div
                    className="mt-2 rounded-lg p-3 text-xs text-slate-300 leading-relaxed"
                    style={{ background: "rgba(168,85,247,0.05)", border: "1px solid rgba(168,85,247,0.15)" }}
                  >
                    {analyzeResult}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-20"
            style={{ background: "rgba(0,0,0,0.4)" }}
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

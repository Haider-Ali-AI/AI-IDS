"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const API = "http://127.0.0.1:8000";

interface SystemStatus {
  sniffer?: { is_running?: boolean; interface?: string };
  llm_analyzer?: { analyzed_count?: number; error_count?: number };
  queues?: { packet_queue_size?: number; packet_queue_max?: number; llm_queue_size?: number; llm_queue_max?: number };
  counts?: { total?: number; critical?: number; high?: number };
}

export default function ControlPanel() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [interfaces, setInterfaces] = useState<string[]>(["Wi-Fi"]);
  const [selected, setSelected] = useState("Wi-Fi");
  const [toggling, setToggling] = useState(false);
  const [open, setOpen] = useState(false);

  const fetchStatus = async () => {
    try {
      const r = await fetch(`${API}/status`);
      if (r.ok) setStatus(await r.json());
    } catch {}
    try {
      const r = await fetch(`${API}/interfaces`);
      if (r.ok) {
        const d = await r.json();
        setInterfaces(d.interfaces || ["Wi-Fi"]);
        setSelected(d.current || "Wi-Fi");
      }
    } catch {}
  };

  useEffect(() => {
    fetchStatus();
    const id = setInterval(fetchStatus, 3000);
    return () => clearInterval(id);
  }, []);

  const toggleSniffer = async () => {
    setToggling(true);
    try {
      await fetch(`${API}/toggle-sniffing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interface: selected })
      });
      await fetchStatus();
    } catch {}
    setToggling(false);
  };

  const snifferOn = status?.sniffer?.is_running;
  const pqSize = status?.queues?.packet_queue_size ?? 0;
  const pqMax = status?.queues?.packet_queue_max ?? 1;
  const lqSize = status?.queues?.llm_queue_size ?? 0;
  const lqMax = status?.queues?.llm_queue_max ?? 1;

  return (
    <>
      {/* Gear FAB */}
      <motion.button
        onClick={() => setOpen(o => !o)}
        whileHover={{ scale: 1.08, rotate: 15 }}
        whileTap={{ scale: 0.95 }}
        style={{
          position: "fixed", bottom: 96, left: 28, zIndex: 1000,
          width: 52, height: 52, borderRadius: "50%",
          background: "rgba(0,12,30,0.9)", border: "1.5px solid rgba(0,212,255,0.4)",
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 20, boxShadow: "0 0 20px rgba(0,212,255,0.2)"
        }}
      >
        ⚙️
      </motion.button>

      {/* Panel */}
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0 }}
          className="glass-card glow-blue"
          style={{
            position: "fixed", bottom: 160, left: 28, zIndex: 999,
            width: 300, padding: "20px"
          }}
        >
          <div style={{ fontFamily: "var(--font-display)", fontSize: 10, color: "var(--neon-blue)", letterSpacing: "0.2em", marginBottom: 16 }}>
            ⚙ CONTROL PANEL
          </div>

          {/* Interface selector */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-muted)", marginBottom: 6 }}>NETWORK INTERFACE</div>
            <select
              value={selected}
              onChange={e => setSelected(e.target.value)}
              style={{
                width: "100%", background: "rgba(0,212,255,0.05)",
                border: "1px solid rgba(0,212,255,0.25)", borderRadius: 8,
                padding: "6px 10px", fontFamily: "var(--font-mono)", fontSize: 11,
                color: "var(--text-primary)", outline: "none"
              }}
            >
              {interfaces.map(iface => <option key={iface} value={iface}>{iface}</option>)}
            </select>
          </div>

          {/* Start/Stop */}
          <button
            onClick={toggleSniffer}
            disabled={toggling}
            style={{
              width: "100%", padding: "10px", borderRadius: 10, cursor: "pointer",
              fontFamily: "var(--font-display)", fontSize: 11, letterSpacing: "0.1em",
              border: `1.5px solid ${snifferOn ? "rgba(255,51,102,0.6)" : "rgba(0,255,136,0.6)"}`,
              background: snifferOn ? "rgba(255,51,102,0.12)" : "rgba(0,255,136,0.1)",
              color: snifferOn ? "#ff3366" : "#00ff88",
              opacity: toggling ? 0.5 : 1, transition: "all 0.2s", marginBottom: 14
            }}
          >
            {toggling ? "⟳ PROCESSING…" : snifferOn ? "⏹ STOP SNIFFER" : "▶ START SNIFFER"}
          </button>

          {/* Queue meters */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-muted)", marginBottom: 4 }}>
                <span>PACKET QUEUE</span><span style={{ color: "var(--neon-blue)" }}>{pqSize}/{pqMax}</span>
              </div>
              <div style={{ height: 4, borderRadius: 2, background: "rgba(0,212,255,0.08)" }}>
                <div style={{ width: `${Math.min(100, (pqSize / pqMax) * 100)}%`, height: "100%", borderRadius: 2, background: "var(--neon-blue)", transition: "width 0.5s" }} />
              </div>
            </div>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-muted)", marginBottom: 4 }}>
                <span>LLM QUEUE</span><span style={{ color: "var(--neon-purple)" }}>{lqSize}/{lqMax}</span>
              </div>
              <div style={{ height: 4, borderRadius: 2, background: "rgba(168,85,247,0.08)" }}>
                <div style={{ width: `${Math.min(100, (lqSize / lqMax) * 100)}%`, height: "100%", borderRadius: 2, background: "var(--neon-purple)", transition: "width 0.5s" }} />
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </>
  );
}

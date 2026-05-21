"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

const API = "http://127.0.0.1:8000";

interface Status {
  sniffer?: { is_running?: boolean; packets_captured?: number };
  llm_analyzer?: { is_running?: boolean; analyzed_count?: number; queue_size?: number };
  triage?: { packets_flagged?: number };
  database?: { connected?: boolean };
  rag_engine?: { initialized?: boolean };
  queues?: { packet_queue_size?: number; packet_queue_max?: number; llm_queue_size?: number; llm_queue_max?: number };
}

function Pill({ label, active, warning }: { label: string; active: boolean; warning?: boolean }) {
  const color = active ? "#00ff88" : warning ? "#ffa500" : "#ff3366";
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 7, padding: "5px 14px",
      borderRadius: 999, border: `1px solid ${color}22`,
      background: `${color}0d`, fontSize: 11, fontFamily: "var(--font-mono)",
      color, whiteSpace: "nowrap"
    }}>
      <span className="pulse-dot" style={{ width: 7, height: 7, borderRadius: "50%", background: color, boxShadow: `0 0 8px ${color}`, flexShrink: 0 }} />
      {label}
    </div>
  );
}

export default function StatusBar() {
  const [status, setStatus] = useState<Status | null>(null);
  const [apiOnline, setApiOnline] = useState(false);

  useEffect(() => {
    const poll = async () => {
      try {
        const r = await fetch(`${API}/status`);
        if (r.ok) { setStatus(await r.json()); setApiOnline(true); }
        else setApiOnline(false);
      } catch { setApiOnline(false); }
    };
    poll();
    const id = setInterval(poll, 4000);
    return () => clearInterval(id);
  }, []);

  const snifferOn = status?.sniffer?.is_running;
  const llmOn = status?.llm_analyzer?.is_running;
  const ragOn = status?.rag_engine?.initialized;
  const dbOn = status?.database?.connected;

  return (
    <motion.div
      className="glass-card"
      style={{ padding: "12px 20px" }}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 10, justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Pill label={apiOnline ? "API ONLINE" : "API OFFLINE"} active={apiOnline} />
          <Pill label={snifferOn ? "SNIFFER ACTIVE" : "SNIFFER IDLE"} active={!!snifferOn} />
          <Pill label={llmOn ? "GEMINI ACTIVE" : "GEMINI IDLE"} active={!!llmOn} />
          <Pill label={ragOn ? "RAG LOADED" : "RAG OFFLINE"} active={!!ragOn} warning={!ragOn} />
          <Pill label={dbOn ? "DB CONNECTED" : "DB ERROR"} active={!!dbOn} />
        </div>
        {status && (
          <div style={{ display: "flex", gap: 20, fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)" }}>
            <span>PKT <span style={{ color: "var(--neon-blue)" }}>{(status.sniffer?.packets_captured ?? 0).toLocaleString()}</span></span>
            <span>FLAGGED <span style={{ color: "var(--neon-orange)" }}>{(status.triage?.packets_flagged ?? 0).toLocaleString()}</span></span>
            <span>ANALYZED <span style={{ color: "var(--neon-green)" }}>{(status.llm_analyzer?.analyzed_count ?? 0).toLocaleString()}</span></span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

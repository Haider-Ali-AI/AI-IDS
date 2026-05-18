"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import StatusBar from "@/components/StatusBar";
import MetricsTable from "@/components/MetricsTable";
import AlertFeed from "@/components/AlertFeed";
import ThreatCharts from "@/components/ThreatCharts";
import ControlPanel from "@/components/ControlPanel";
import ChatPanel from "@/components/ChatPanel";

// Dynamically import HeroGlobe to prevent SSR issues with Three.js
const HeroGlobe = dynamic(() => import("@/components/HeroGlobe"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="w-16 h-16 rounded-full animate-ping" style={{ background: "rgba(0,212,255,0.2)" }} />
    </div>
  ),
});

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-5">
      <h2
        className="text-base font-bold text-cyan-400 uppercase tracking-widest"
        style={{ fontFamily: "var(--font-orbitron, monospace)" }}
      >
        {title}
      </h2>
      {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <main
      className="min-h-screen hex-bg"
      style={{ paddingLeft: "2rem", paddingRight: "2rem", paddingBottom: "4rem" }}
    >
      {/* ── HERO SECTION ────────────────────────────────────────────────── */}
      <section className="relative flex items-center justify-center" style={{ height: "450px" }}>
        {/* Globe */}
        <div className="absolute inset-0">
          <HeroGlobe />
        </div>

        {/* Overlay gradient */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 40%, #070d1a 80%)",
          }}
        />

        {/* Headline */}
        <motion.div
          className="relative z-10 text-center"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <div className="flex items-center justify-center gap-3 mb-2">
            <motion.div
              className="w-1 h-8 rounded-full"
              style={{ background: "linear-gradient(180deg, #00d4ff, transparent)" }}
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <h1
              className="text-6xl md:text-7xl font-black gradient-text text-glow-blue tracking-tight"
              style={{
                fontFamily: "var(--font-orbitron, monospace)",
                letterSpacing: "-0.02em",
              }}
            >
              SENTINEL
            </h1>
            <motion.div
              className="w-1 h-8 rounded-full"
              style={{ background: "linear-gradient(180deg, #00ff88, transparent)" }}
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 2, repeat: Infinity, delay: 1 }}
            />
          </div>
          <motion.p
            className="text-slate-400 text-sm tracking-[0.3em] uppercase"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            AI-Powered Threat Intelligence Platform
          </motion.p>

          {/* Version badge */}
          <motion.div
            className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs"
            style={{
              background: "rgba(0,212,255,0.08)",
              border: "1px solid rgba(0,212,255,0.2)",
              color: "#00d4ff",
            }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1 }}
          >
            <span className="pulse-dot w-1.5 h-1.5 rounded-full" style={{ background: "#00ff88" }} />
            Gemini 2.0 Flash · Real-time Network Analysis · v2.0
          </motion.div>
        </motion.div>
      </section>

      {/* ── STATUS BAR ──────────────────────────────────────────────────── */}
      <motion.section
        className="mb-8"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <StatusBar />
      </motion.section>

      {/* ── METRICS TABLE ───────────────────────────────────────────────── */}
      <motion.section
        className="mb-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <SectionHeader
          title="System Performance"
          subtitle="Live telemetry — click column headers to sort"
        />
        <MetricsTable />
      </motion.section>

      {/* ── THREAT CHARTS ───────────────────────────────────────────────── */}
      <motion.section
        className="mb-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <SectionHeader
          title="Threat Intelligence"
          subtitle="Visual breakdown of detected threats and attack patterns"
        />
        <ThreatCharts />
      </motion.section>

      {/* ── ALERT FEED + SIDE STATS ─────────────────────────────────────── */}
      <motion.section
        className="mb-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <SectionHeader
          title="Live Alert Stream"
          subtitle="Real-time intrusion detection events with AI analysis"
        />
        <AlertFeed />
      </motion.section>

      {/* ── FLOATING ELEMENTS ───────────────────────────────────────────── */}
      <ControlPanel />
      <ChatPanel />

      {/* ── FOOTER ──────────────────────────────────────────────────────── */}
      <footer className="text-center pt-8 border-t" style={{ borderColor: "rgba(0,212,255,0.08)" }}>
        <p className="text-xs text-slate-600 tracking-wider uppercase">
          Sentinel IDS · Powered by Google Gemini 2.0 Flash · LLM-Enhanced Intrusion Detection
        </p>
      </footer>
    </main>
  );
}

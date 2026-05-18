"use client";

import type { PieLabelRenderProps } from "recharts";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { motion } from "framer-motion";
import { useStatistics } from "@/hooks/useStatistics";

const NEON = ["#ff3366", "#ff9900", "#ffd700", "#00d4ff", "#00ff88", "#a855f7"];

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="glass-card px-3 py-2 text-xs"
      style={{ border: "1px solid rgba(0,212,255,0.3)" }}
    >
      {label && <p className="text-slate-400 mb-1">{label}</p>}
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color }}>
          {entry.name}: <strong>{entry.value}</strong>
        </p>
      ))}
    </div>
  );
};

export default function ThreatCharts() {
  const { stats } = useStatistics();

  // Threat level donut data
  const threatData = stats?.threat_distribution
    ? stats.threat_distribution.map((d) => ({
        name: d.threat_level.toUpperCase(),
        value: d.count,
      }))
    : [
        { name: "CRITICAL", value: 0 },
        { name: "HIGH", value: 0 },
        { name: "MEDIUM", value: 0 },
        { name: "LOW", value: 0 },
      ];

  // Protocol breakdown data
  const protocolData = stats?.protocol_breakdown
    ? stats.protocol_breakdown
        .map((d) => ({ name: d.protocol, value: d.count }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6)
    : [];

  // Top source IPs data
  const topIpData = stats?.top_sources?.slice(0, 5).map((d) => ({
    name: d.src_ip,
    value: d.count,
  })) ?? [];

  const RADIAN = Math.PI / 180;
  const renderCustomLabel = (props: PieLabelRenderProps) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, percent } = props;
    if ((percent ?? 0) < 0.05) return null;
    const ir = Number(innerRadius ?? 0);
    const or = Number(outerRadius ?? 0);
    const ma = Number(midAngle ?? 0);
    const radius = ir + (or - ir) * 0.5;
    const x = Number(cx ?? 0) + radius * Math.cos(-ma * RADIAN);
    const y = Number(cy ?? 0) + radius * Math.sin(-ma * RADIAN);
    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={10}
      >
        {`${((percent ?? 0) * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {/* Threat Level Donut */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-5"
      >
        <h3
          className="text-xs font-bold text-cyan-400 uppercase tracking-widest mb-4"
          style={{ fontFamily: "var(--font-orbitron, monospace)" }}
        >
          Threat Distribution
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={threatData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={3}
              dataKey="value"
              labelLine={false}
              label={renderCustomLabel}
            >
              {threatData.map((entry, i) => (
                <Cell key={entry.name} fill={NEON[i % NEON.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              formatter={(value) => (
                <span style={{ color: "#94a3b8", fontSize: "11px" }}>{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Protocol Breakdown Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card p-5"
      >
        <h3
          className="text-xs font-bold text-cyan-400 uppercase tracking-widest mb-4"
          style={{ fontFamily: "var(--font-orbitron, monospace)" }}
        >
          Protocol Breakdown
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={protocolData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <XAxis
              dataKey="name"
              tick={{ fill: "#64748b", fontSize: 10 }}
              axisLine={{ stroke: "rgba(0,212,255,0.1)" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#64748b", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {protocolData.map((_, i) => (
                <Cell key={i} fill={NEON[i % NEON.length]} fillOpacity={0.8} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Top IPs Horizontal Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card p-5"
      >
        <h3
          className="text-xs font-bold text-cyan-400 uppercase tracking-widest mb-4"
          style={{ fontFamily: "var(--font-orbitron, monospace)" }}
        >
          Top Attack Sources
        </h3>
        {topIpData.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              layout="vertical"
              data={topIpData}
              margin={{ top: 0, right: 10, left: 0, bottom: 0 }}
            >
              <XAxis
                type="number"
                tick={{ fill: "#64748b", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fill: "#94a3b8", fontSize: 9 }}
                axisLine={false}
                tickLine={false}
                width={90}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {topIpData.map((_, i) => (
                  <Cell key={i} fill={NEON[i % NEON.length]} fillOpacity={0.8} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col items-center justify-center h-48 text-slate-600 text-xs gap-2">
            <span className="text-2xl">🛡</span>
            <span>No attack sources logged</span>
          </div>
        )}
      </motion.div>
    </div>
  );
}

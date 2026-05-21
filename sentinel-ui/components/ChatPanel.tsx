"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

interface Msg { role: "user" | "assistant"; content: string; }

export default function ChatPanel() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "ARIA online. I have full situational awareness of your network. Ask me anything — threat analysis, MITRE mappings, attack chains." }
  ]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streaming]);

  const send = async () => {
    const msg = input.trim();
    if (!msg || streaming) return;
    setInput("");
    const history = messages.map(m => ({ role: m.role, content: m.content }));
    setMessages(prev => [...prev, { role: "user", content: msg }]);
    setStreaming(true);

    // Add empty assistant message for streaming
    setMessages(prev => [...prev, { role: "assistant", content: "" }]);

    try {
      const res = await fetch(`${API}/api/aria/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, history })
      });
      if (!res.body) throw new Error("No body");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        full += chunk;
        setMessages(prev => {
          const next = [...prev];
          next[next.length - 1] = { role: "assistant", content: full };
          return next;
        });
      }
    } catch (e) {
      setMessages(prev => {
        const next = [...prev];
        next[next.length - 1] = { role: "assistant", content: "⚠ Could not reach ARIA. Is the backend running?" };
        return next;
      });
    }
    setStreaming(false);
  };

  return (
    <>
      {/* FAB */}
      <motion.button
        onClick={() => setOpen(o => !o)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        style={{
          position: "fixed", bottom: 28, right: 28, zIndex: 1000,
          width: 56, height: 56, borderRadius: "50%",
          background: "linear-gradient(135deg, rgba(0,212,255,0.25), rgba(0,255,136,0.15))",
          border: "1.5px solid rgba(0,212,255,0.5)",
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 0 24px rgba(0,212,255,0.4)"
        }}
      >
        <span style={{ fontSize: 22 }}>{open ? "✕" : "🤖"}</span>
      </motion.button>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="glass-card glow-blue"
            style={{
              position: "fixed", bottom: 96, right: 28, zIndex: 999,
              width: 380, maxHeight: 520, display: "flex", flexDirection: "column",
              overflow: "hidden"
            }}
          >
            {/* Header */}
            <div style={{
              padding: "12px 18px", borderBottom: "1px solid rgba(0,212,255,0.1)",
              display: "flex", alignItems: "center", gap: 10
            }}>
              <span className="pulse-dot" style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--neon-green)", boxShadow: "0 0 8px var(--neon-green)" }} />
              <span style={{ fontFamily: "var(--font-display)", fontSize: 11, color: "var(--neon-blue)", letterSpacing: "0.15em" }}>ARIA COPILOT</span>
              <span style={{ marginLeft: "auto", fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--text-muted)" }}>AI SECURITY ANALYST</span>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
              {messages.map((m, i) => (
                <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                  <div
                    className={m.role === "user" ? "chat-bubble-user" : "chat-bubble-ai"}
                    style={{
                      maxWidth: "85%", padding: "8px 12px",
                      fontSize: 12, lineHeight: 1.6,
                      color: m.role === "user" ? "var(--neon-blue)" : "#cbd5e1"
                    }}
                  >
                    {m.content || (streaming && i === messages.length - 1 ? (
                      <span style={{ color: "var(--neon-green)", fontFamily: "var(--font-mono)" }}>▮</span>
                    ) : "")}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div style={{
              padding: "10px 12px", borderTop: "1px solid rgba(0,212,255,0.1)",
              display: "flex", gap: 8
            }}>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && send()}
                placeholder="Ask ARIA…"
                disabled={streaming}
                style={{
                  flex: 1, background: "rgba(0,212,255,0.05)",
                  border: "1px solid rgba(0,212,255,0.2)", borderRadius: 8,
                  padding: "7px 12px", fontFamily: "var(--font-mono)", fontSize: 12,
                  color: "var(--text-primary)", outline: "none"
                }}
              />
              <button
                onClick={send}
                disabled={streaming || !input.trim()}
                style={{
                  padding: "7px 14px", borderRadius: 8, cursor: "pointer",
                  background: "rgba(0,212,255,0.15)", border: "1px solid rgba(0,212,255,0.4)",
                  color: "var(--neon-blue)", fontFamily: "var(--font-mono)", fontSize: 12,
                  opacity: (streaming || !input.trim()) ? 0.4 : 1, transition: "all 0.2s"
                }}
              >⊕</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

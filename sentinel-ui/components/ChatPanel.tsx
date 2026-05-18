"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Send, X, Bot, User, Loader2, MessageSquare } from "lucide-react";
import { useAlerts } from "@/hooks/useAlerts";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  ts: Date;
}

const OUT_OF_CONTEXT = "Query out of context. I am specialized only in Sentinel security data.";

export default function ChatPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hello. I am the **Sentinel AI Assistant**. Ask me anything about network security, current alerts, threat analysis, or IDS operations.",
      ts: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { alerts } = useAlerts(5);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 300);
  }, [isOpen]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      ts: new Date(),
    };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          context: alerts.slice(0, 5),
          history: messages.slice(-6).map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!res.ok) throw new Error("Failed");
      const data = await res.json();

      setMessages((m) => [
        ...m,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: data.reply ?? OUT_OF_CONTEXT,
          ts: new Date(),
        },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: "⚠️ Error connecting to Sentinel AI. Please ensure the backend is running.",
          ts: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const renderMarkdown = (text: string) => {
    // Very simple inline markdown: bold
    return text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\n/g, "<br>");
  };

  return (
    <>
      {/* FAB */}
      <motion.button
        onClick={() => setIsOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center"
        style={{
          background: "linear-gradient(135deg, #00d4ff, #00ff88)",
          boxShadow: "0 0 30px rgba(0,212,255,0.4), 0 0 60px rgba(0,212,255,0.2)",
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.92 }}
        aria-label="Open Sentinel Assistant"
        id="chat-fab"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div key="close" initial={{ rotate: -90 }} animate={{ rotate: 0 }} exit={{ rotate: 90 }}>
              <X size={20} color="#070d1a" />
            </motion.div>
          ) : (
            <motion.div key="open" initial={{ rotate: 90 }} animate={{ rotate: 0 }} exit={{ rotate: -90 }}>
              <MessageSquare size={20} color="#070d1a" />
            </motion.div>
          )}
        </AnimatePresence>
        {/* pulsing ring */}
        <span
          className="absolute inset-0 rounded-full animate-ping"
          style={{ background: "rgba(0,212,255,0.3)", animationDuration: "2s" }}
        />
      </motion.button>

      {/* Chat panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 60, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40, scale: 0.95 }}
            transition={{ type: "spring", damping: 22, stiffness: 200 }}
            className="fixed bottom-24 right-6 z-50 flex flex-col"
            style={{
              width: "min(420px, calc(100vw - 3rem))",
              height: "min(580px, calc(100vh - 10rem))",
              background: "rgba(5, 12, 28, 0.97)",
              border: "1px solid rgba(0,212,255,0.25)",
              borderRadius: "16px",
              backdropFilter: "blur(24px)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.5), 0 0 40px rgba(0,212,255,0.1)",
            }}
          >
            {/* Header */}
            <div
              className="flex items-center gap-3 px-4 py-3 border-b shrink-0"
              style={{ borderColor: "rgba(0,212,255,0.15)" }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, rgba(0,212,255,0.2), rgba(0,255,136,0.1))", border: "1px solid rgba(0,212,255,0.3)" }}
              >
                <Shield size={14} className="text-cyan-400" />
              </div>
              <div className="flex-1">
                <p
                  className="text-xs font-bold text-cyan-400 uppercase tracking-wider"
                  style={{ fontFamily: "var(--font-orbitron, monospace)" }}
                >
                  Sentinel Assistant
                </p>
                <p className="text-[10px] text-slate-500">Specialized in security data</p>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="pulse-dot w-1.5 h-1.5 rounded-full" style={{ background: "#00ff88" }} />
                <span className="text-[10px] text-green-400">Online</span>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                >
                  {/* Avatar */}
                  <div
                    className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center mt-0.5"
                    style={{
                      background:
                        msg.role === "user"
                          ? "rgba(0,212,255,0.15)"
                          : "rgba(0,255,136,0.1)",
                      border: `1px solid ${msg.role === "user" ? "rgba(0,212,255,0.3)" : "rgba(0,255,136,0.2)"}`,
                    }}
                  >
                    {msg.role === "user" ? (
                      <User size={12} className="text-cyan-400" />
                    ) : (
                      <Bot size={12} className="text-green-400" />
                    )}
                  </div>

                  {/* Bubble */}
                  <div
                    className={msg.role === "user" ? "chat-bubble-user" : "chat-bubble-ai"}
                    style={{ maxWidth: "80%", padding: "8px 12px" }}
                  >
                    <p
                      className="text-xs text-slate-200 leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                    />
                    <p className="text-[10px] text-slate-600 mt-1">
                      {msg.ts.toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </motion.div>
              ))}

              {/* Typing indicator */}
              {isLoading && (
                <div className="flex gap-2.5">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(0,255,136,0.1)", border: "1px solid rgba(0,255,136,0.2)" }}
                  >
                    <Bot size={12} className="text-green-400" />
                  </div>
                  <div className="chat-bubble-ai px-4 py-3 flex items-center gap-2">
                    <Loader2 size={12} className="text-cyan-400 animate-spin" />
                    <span className="text-xs text-slate-400">Analyzing…</span>
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div
              className="p-3 border-t shrink-0 flex gap-2 items-center"
              style={{ borderColor: "rgba(0,212,255,0.15)" }}
            >
              <input
                ref={inputRef}
                id="chat-input"
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about threats, alerts, network security…"
                className="flex-1 px-3 py-2 rounded-xl text-xs text-slate-200 outline-none placeholder:text-slate-600"
                style={{
                  background: "rgba(0,212,255,0.06)",
                  border: "1px solid rgba(0,212,255,0.15)",
                }}
                disabled={isLoading}
              />
              <motion.button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-all disabled:opacity-40"
                style={{
                  background: "linear-gradient(135deg, #00d4ff, #00ff88)",
                }}
                id="chat-send"
              >
                <Send size={14} color="#070d1a" />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

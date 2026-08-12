"use client";

/* eslint-disable react/no-unescaped-entities, @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect */
import { useEffect, useRef, useState } from "react";
import { canAccessMedAIAssistant, type MedAIAgentResponse } from "@/lib/medai-agent";
import { normalizeRole, type Role } from "@/lib/authorization";
import { useLanguage } from "@/lib/i18n";

interface MessageItem {
  id: string;
  sender: "user" | "medai";
  text: string;
  timestamp: string;
  riskTier?: "critical" | "high" | "moderate" | "stable";
  source?: string;
}

export function MedAIAssistantDrawer({
  currentRole,
  patientContext,
}: {
  currentRole?: string | Role;
  patientContext?: any;
}) {
  const { language } = useLanguage();
  const [role, setRole] = useState<Role>(() => {
    const norm = normalizeRole(currentRole || "nurse");
    return norm || "nurse";
  });
  const [isOpen, setIsOpen] = useState(false);
  const [inputPrompt, setInputPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<MessageItem[]>([
    {
      id: "init-1",
      sender: "medai",
      text: "👋 **Salom! Men MedAI Klinik AI Assistant agentiman.**\n\nNCD klinik yo'riqnomalari, dori vositalari o'zaro ta'siri, EKG va vital ko'rsatkichlar bo'yicha tezkor tahlil taqdim etaman. Qanday yordam bera olaman?",
      timestamp: new Date().toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Synchronize role state
  useEffect(() => {
    if (typeof window !== "undefined") {
      const cookies = document.cookie.split(";").map((c) => c.trim().split("="));
      const rawCookie = cookies.find(([name]) => name === "qm_demo_role")?.[1];
      setRole(normalizeRole(currentRole || rawCookie || sessionStorage.getItem("qm_demo_role")) || "nurse");
    }
  }, [currentRole]);

  // Auto-scroll messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  // Strict RBAC Guard: Do NOT render anything for Patient or Dispatcher roles
  if (!canAccessMedAIAssistant(role)) {
    return null;
  }

  const handleSendQuery = async (queryText?: string) => {
    const textToSend = (queryText || inputPrompt).trim();
    if (!textToSend || isLoading) return;

    const userMsg: MessageItem = {
      id: `msg-${Date.now()}`,
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!queryText) setInputPrompt("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/ai/medai-agent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": role,
        },
        body: JSON.stringify({
          prompt: textToSend,
          patientContext: patientContext || { patientName: "Joriy Bemor", vitals: { bp: "142/90", spo2: 94, hr: 98 } },
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data: MedAIAgentResponse = await res.json();
      const aiMsg: MessageItem = {
        id: `ai-${Date.now()}`,
        sender: "medai",
        text: data.report || "MedAI Javob bera olmadi.",
        timestamp: data.timestamp || new Date().toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" }),
        riskTier: data.riskTier,
        source: data.source,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      const errorMsg: MessageItem = {
        id: `err-${Date.now()}`,
        sender: "medai",
        text: "⚠️ MedAI agent bilan bog'lanishda xatolik yuz berdi. Lokal klinik tahlil motoriga ulanilmoqda...",
        timestamp: new Date().toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Trigger Button (Bottom Right) */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="fixed bottom-20 right-6 z-50 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white p-3.5 rounded-full shadow-2xl transition transform hover:scale-105 active:scale-95 flex items-center gap-2 border border-emerald-400/40 cursor-pointer"
        aria-label="Open MedAI Clinical Assistant"
        title="MedAI Clinical Assistant Agent"
      >
        <span className="text-xl animate-bounce">🤖</span>
        <span className="text-xs font-bold font-mono tracking-wide hidden sm:inline">MedAI Agent</span>
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-300 animate-ping" />
      </button>

      {/* Slide-Out MedAI Assistant Drawer */}
      {isOpen && (
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col font-sans transition animate-in slide-in-from-right">
          {/* Header */}
          <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-lg">
                🤖
              </div>
              <div>
                <h3 className="text-sm font-bold text-white leading-tight flex items-center gap-2">
                  MedAI Agent <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono font-semibold">v2.4 LOCAL AI</span>
                </h3>
                <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  {role === "doctor" ? "Doctor Specialist Assistant" : "Nurse Field Assistant"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setMessages([
                    {
                      id: "init-1",
                      sender: "medai",
                      text: " Thread tozalandi. Yangi klinik savolingizni kiriting:",
                      timestamp: new Date().toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" }),
                    },
                  ])
                }
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer text-xs"
                title="Tozalash"
              >
                🗑️
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer font-bold text-sm"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Quick Prompt Chips */}
          <div className="p-3 bg-slate-950/60 border-b border-slate-800/80 flex items-center gap-1.5 overflow-x-auto text-[11px]">
            <button
              type="button"
              onClick={() => handleSendQuery("📋 Bemor fayli va vital ko'rsatkichlar xulosasini ber")}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 rounded-lg font-medium whitespace-nowrap transition cursor-pointer shrink-0"
            >
              📋 Summarize File
            </button>
            <button
              type="button"
              onClick={() => handleSendQuery("💊 Dori vositalari o'zaro ta'siri va nojo'ya ta'sirlarini tekshir")}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-teal-300 border border-slate-700 rounded-lg font-medium whitespace-nowrap transition cursor-pointer shrink-0"
            >
              💊 Check Drug Interactions
            </button>
            <button
              type="button"
              onClick={() => handleSendQuery("⚡ AI xavf reytingi va EKG anomaliyalarini tushuntir")}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700 rounded-lg font-medium whitespace-nowrap transition cursor-pointer shrink-0"
            >
              ⚡ Explain AI Risk Rating
            </button>
          </div>

          {/* Messages Thread Container */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs bg-slate-900/40">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
              >
                <div className="flex items-center gap-1.5 mb-1 px-1 text-[10px] text-slate-400 font-mono">
                  <span>{msg.sender === "user" ? "🩺 You" : "🤖 MedAI Agent"}</span>
                  <span>·</span>
                  <span>{msg.timestamp}</span>
                  {msg.riskTier === "critical" && (
                    <span className="bg-red-500/20 text-red-300 px-1.5 py-0.2 rounded font-bold">FAVQULODDA</span>
                  )}
                  {msg.riskTier === "high" && (
                    <span className="bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded font-bold">YUQORI XAVF</span>
                  )}
                </div>

                <div
                  className={`p-3.5 rounded-2xl max-w-[90%] leading-relaxed ${
                    msg.sender === "user"
                      ? "bg-emerald-600 text-white rounded-tr-none shadow-md font-medium"
                      : "bg-slate-950 text-slate-200 border border-slate-800 rounded-tl-none shadow-lg whitespace-pre-wrap font-sans"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-300 text-xs w-fit">
                <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                <span className="font-mono text-[11px]">MedAI agent o'ylamoqda va tahlil qilmoqda...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Controls */}
          <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
            <input
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSendQuery();
              }}
              placeholder={language === "uz" ? "MedAI agentga klinik savol bering..." : "Ask MedAI clinical question..."}
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-emerald-500 font-sans"
            />
            <button
              type="button"
              onClick={() => handleSendQuery()}
              disabled={isLoading || !inputPrompt.trim()}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5 shadow-md"
            >
              <span>Yuborish</span>
              <span>➔</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}

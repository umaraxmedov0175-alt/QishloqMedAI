"use client";

import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import { useLanguage } from "@/lib/i18n";
import {
  getChatMessages,
  getChatThreads,
  sendMessage,
  subscribeToChatUpdates,
  type ChatMessage,
  type ChatThread,
} from "@/lib/realtime-chat";

export function MovableChatWidget() {
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(() => {
    if (typeof window !== "undefined") {
      return { x: window.innerWidth - 80, y: window.innerHeight - 80 };
    }
    return null;
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Chat State inside drawer
  const [threads, setThreads] = useState<ChatThread[]>(() => getChatThreads());
  const [activeThreadId, setActiveThreadId] = useState<string>("thread-doc-nurse-01");
  const [messages, setMessages] = useState<ChatMessage[]>(() => getChatMessages("thread-doc-nurse-01"));
  const [inputMessage, setInputMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcut listener (Cmd+K or Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Subscribe to real-time chat updates
  useEffect(() => {
    const unsubscribe = subscribeToChatUpdates(() => {
      setThreads([...getChatThreads()]);
      setMessages([...getChatMessages(activeThreadId)]);
    });
    return () => unsubscribe();
  }, [activeThreadId]);

  // Scroll to bottom of chat
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  // Dragging Handlers
  const handleMouseDown = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (isOpen) return;
    setIsDragging(true);
    if (position) {
      setDragOffset({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const newX = Math.max(16, Math.min(window.innerWidth - 64, e.clientX - dragOffset.x));
      const newY = Math.max(16, Math.min(window.innerHeight - 64, e.clientY - dragOffset.y));
      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;
    const text = inputMessage.trim();
    setInputMessage("");
    sendMessage({
      threadId: activeThreadId,
      senderId: "usr-nurse-01",
      senderName: "Mobil Hamshira",
      senderRole: "nurse",
      content: text,
    });
    setMessages([...getChatMessages(activeThreadId)]);
  };

  return (
    <>
      {/* Floating Circular Movable Launcher Button */}
      <div
        style={{
          position: "fixed",
          left: position ? `${position.x}px` : "auto",
          top: position ? `${position.y}px` : "auto",
          right: position ? "auto" : "24px",
          bottom: position ? "auto" : "24px",
          zIndex: 50,
          cursor: isDragging ? "grabbing" : "grab",
        }}
        onMouseDown={handleMouseDown}
        aria-label="Movable Chat Launcher"
        tabIndex={0}
        role="button"
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            setIsOpen(!isOpen);
          }
        }}
        className="select-none touch-none focus:outline-none"
      >
        <button
          type="button"
          onClick={() => !isDragging && setIsOpen(!isOpen)}
          className="w-14 h-14 rounded-full bg-emerald-700 hover:bg-emerald-600 text-white shadow-2xl flex items-center justify-center border-2 border-emerald-400/60 transition transform hover:scale-105 active:scale-95 cursor-pointer relative"
          title="Teleconsultation Chat (Cmd+K)"
        >
          <span className="text-2xl">{isOpen ? "✕" : "💬"}</span>
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 border-2 border-slate-900 animate-pulse" />
        </button>
      </div>

      {/* Slide-Over Secure Chat Drawer */}
      {isOpen && (
        <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-slate-900 border-l border-slate-800 text-white shadow-2xl z-50 flex flex-col font-sans animate-in slide-in-from-right duration-200">
          {/* Drawer Header */}
          <div className="p-4 bg-emerald-950 border-b border-emerald-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">💬</span>
              <div>
                <b className="text-sm font-bold text-white block">
                  {language === "uz" ? "Telemaslahat va Chat" : "Teleconsultation Chat"}
                </b>
                <span className="text-[10px] text-emerald-300 font-mono">
                  {language === "uz" ? "SHIFORXONA XAVFSIZ KANAL" : "SECURE CLINICAL CHANNEL"}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-emerald-200 hover:text-white p-1 rounded-lg border-0 bg-transparent text-sm cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* Active Thread Selector Tabs */}
          <div className="flex border-b border-slate-800 bg-slate-950/80 overflow-x-auto text-xs font-semibold">
            {threads.slice(0, 3).map((thread) => (
              <button
                key={thread.id}
                type="button"
                onClick={() => {
                  setActiveThreadId(thread.id);
                  setMessages([...getChatMessages(thread.id)]);
                }}
                className={`py-2 px-3 border-b-2 transition whitespace-nowrap text-left text-[11px] ${
                  activeThreadId === thread.id
                    ? "border-emerald-500 text-emerald-300 font-bold bg-slate-900"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                <div>{thread.participants[0]?.name || thread.id}</div>
                <div className="text-[9px] font-mono text-slate-500">{thread.id}</div>
              </button>
            ))}
          </div>

          {/* Messages Container */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-900/90 text-xs">
            {messages.length === 0 ? (
              <div className="text-center text-slate-500 text-xs py-8">
                {language === "uz" ? "Xabarlar mavjud emas" : "No chat messages yet"}
              </div>
            ) : (
              messages.map((msg) => {
                const isSelf = msg.senderRole === "nurse";
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isSelf ? "items-end" : "items-start"}`}
                  >
                    <div className="text-[10px] text-slate-400 mb-0.5 font-medium">
                      {msg.senderName} ({msg.senderRole})
                    </div>
                    <div
                      className={`max-w-[85%] p-3 rounded-2xl leading-relaxed text-xs ${
                        isSelf
                          ? "bg-emerald-700 text-white rounded-br-none"
                          : "bg-slate-800 text-slate-100 rounded-bl-none border border-slate-700"
                      }`}
                    >
                      {msg.content}
                    </div>
                    <span className="text-[9px] text-slate-500 font-mono mt-0.5">
                      {msg.timestamp}
                    </span>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Bar */}
          <form onSubmit={handleSendMessage} className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={language === "uz" ? "Klinik xabar yozing..." : "Type clinical message..."}
              className="flex-1 bg-slate-900 border border-slate-800 text-white text-xs rounded-xl px-3 py-2 outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition cursor-pointer"
            >
              {language === "uz" ? "Yuborish" : "Send"}
            </button>
          </form>
        </div>
      )}
    </>
  );
}

"use client";
/* eslint-disable @next/next/no-html-link-for-pages, react/no-unescaped-entities, jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions, react-hooks/set-state-in-effect */
import { useEffect, useRef, useState } from "react";
import { ImageViewerModal } from "@/app/ui/ImageViewerModal";
import { PatientRecordSidebar } from "@/app/ui/PatientRecordSidebar";
import { VideoTeleconsultModal } from "@/app/ui/VideoTeleconsultModal";
import { useLanguage } from "@/lib/i18n";
import {
  getChatMessages,
  getChatThreads,
  markThreadAsRead,
  sendMessage,
  subscribeToChatUpdates,
  INITIAL_THREADS,
  type Attachment,
  type ChatMessage,
  type ChatThread,
  type ChatUser,
  type UserRole,
} from "@/lib/realtime-chat";

export default function InnerChatPage() {
  const { language, setLanguage, t } = useLanguage();
  const [threads, setThreads] = useState<ChatThread[]>(INITIAL_THREADS);
  const [activeThreadId, setActiveThreadId] = useState<string>("thread-doc-nurse");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [filterTab, setFilterTab] = useState<"all" | "doctor_nurse" | "patient_threads">("all");
  const [threadQuery, setThreadQuery] = useState("");
  const [messageSearchQuery, setMessageSearchQuery] = useState("");
  const [showMessageSearch, setShowMessageSearch] = useState(false);

  // Active current user role simulator
  const [activeUserId, setActiveUserId] = useState<string>("doctor_tomir");

  // Input message state
  const [inputContent, setInputContent] = useState("");
  const [privacyToast, setPrivacyToast] = useState(false);

  // Modals & Sidebars
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [recordSidebarOpen, setRecordSidebarOpen] = useState(false);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [selectedImageSrc, setSelectedImageSrc] = useState("/og.png");
  const [selectedImageTitle, setSelectedImageTitle] = useState("Diagnostik EKG Tasviri");

  // Audio voice note simulation
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);

  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = subscribeToChatUpdates((updatedThreads) => {
      setThreads([...updatedThreads]);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (activeThreadId) {
      setMessages([...getChatMessages(activeThreadId)]);
      markThreadAsRead(activeThreadId, activeUserId);
    }
  }, [activeThreadId, activeUserId, threads]);

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const activeThread = threads.find((t) => t.id === activeThreadId) || threads[0];
  const otherParticipant: ChatUser =
    activeThread?.participants.find((p) => p.id !== activeUserId) ||
    activeThread?.participants[0] || {
      id: "unknown",
      name: "Foydalanuvchi",
      role: "nurse",
      roleTitle: { uz: "Hamshira", en: "Nurse" },
      specialtyOrDistrict: "Mobil klinika",
      presence: "online",
    };

  const activeUser = activeThread?.participants.find((p) => p.id === activeUserId) || {
    id: activeUserId,
    name: activeUserId === "doctor_tomir" ? "Dr. Tomir" : activeUserId === "nurse_malika" ? "Malika Hamshira" : "Tomir",
    role: (activeUserId.includes("doctor") ? "doctor" : activeUserId.includes("nurse") ? "nurse" : "patient") as UserRole,
  };

  // Filtered threads list
  const filteredThreads = threads.filter((thread) => {
    if (filterTab === "doctor_nurse" && thread.type !== "doctor_nurse") return false;
    if (filterTab === "patient_threads" && thread.type === "doctor_nurse") return false;

    if (threadQuery.trim()) {
      const q = threadQuery.toLowerCase();
      const matchName = thread.participants.some((p) => p.name.toLowerCase().includes(q));
      const matchCode = thread.patientCode?.toLowerCase().includes(q);
      const matchLastMsg = thread.lastMessage?.content.toLowerCase().includes(q);
      return matchName || matchCode || matchLastMsg;
    }
    return true;
  });

  // Filtered messages in active thread
  const displayedMessages = messages.filter((m) => {
    if (!messageSearchQuery.trim()) return true;
    const q = messageSearchQuery.toLowerCase();
    return m.sanitizedContent.toLowerCase().includes(q) || m.senderName.toLowerCase().includes(q);
  });

  function handleSend(contentToSend?: string, attachmentToSend?: Attachment, templateKey?: string) {
    const text = contentToSend !== undefined ? contentToSend : inputContent;
    if (!text.trim() && !attachmentToSend) return;

    const { wasRedacted } = sendMessage({
      threadId: activeThreadId,
      senderId: activeUser.id,
      senderName: activeUser.name,
      senderRole: activeUser.role,
      content: text,
      attachment: attachmentToSend,
      clinicalTemplateKey: templateKey,
    });

    if (wasRedacted) {
      setPrivacyToast(true);
      setTimeout(() => setPrivacyToast(false), 5000);
    }

    setInputContent("");
    setMessages([...getChatMessages(activeThreadId)]);
    setThreads([...getChatThreads()]);
  }

  function handleAttachEcg() {
    const sampleEcgAttachment: Attachment = {
      id: `att-${Date.now()}`,
      type: "ecg",
      name: `EKG_${activeThread?.patientCode || "QM-2027-0042"}_Yangi.png`,
      url: "/og.png",
      size: "1.8 MB",
    };
    handleSend("Biriktirilgan diagnostik EKG yozuvi taqdim etildi.", sampleEcgAttachment);
  }

  function handleSendVoiceNote() {
    setIsRecordingVoice(true);
    setTimeout(() => {
      setIsRecordingVoice(false);
      const voiceAttachment: Attachment = {
        id: `voice-${Date.now()}`,
        type: "voice_note",
        name: "Ovozli_xabar.mp3",
        url: "",
        metadata: { durationSeconds: 18 },
      };
      handleSend("Ovozli ko'rsatma yuborildi.", voiceAttachment);
    }, 1500);
  }

  return (
    <main className="min-h-screen bg-[#0F172A] text-white flex flex-col">
      {/* Top Main Navigation Header */}
      <header className="h-16 px-6 bg-slate-900/90 backdrop-blur text-white flex items-center justify-between shadow-xs shrink-0 border-b border-white/[0.08]">
        <div className="flex items-center gap-4">
          <a className="flex items-center gap-2 font-bold text-lg text-white no-underline" href="/">
            <span className="w-7 h-7 rounded-md bg-emerald-500/20 flex items-center justify-center text-sm">+</span>
            <span>Tomir AI</span>
          </a>
          <span className="text-xs text-slate-400 font-medium pl-3 border-l border-white/10 hidden md:inline-block">
            Ichki muloqot & Telekonsultatsiya
          </span>
        </div>

        <div className="flex items-center gap-4">
          {/* Active Demo Role Simulator Switcher */}
          <div className="flex items-center gap-2 bg-slate-800/60 px-3 py-1 rounded-full border border-white/10 text-xs">
            <span className="text-sky-300 font-medium">Sizning rolingiz:</span>
            <select
              value={activeUserId}
              onChange={(e) => setActiveUserId(e.target.value)}
              className="bg-transparent text-white font-bold outline-none cursor-pointer"
            >
              <option value="doctor_tomir" className="bg-emerald-900 text-white">Dr. Tomir (Vrach)</option>
              <option value="nurse_malika" className="bg-emerald-900 text-white">Malika (Hamshira)</option>
              <option value="patient_tomir" className="bg-emerald-900 text-white">Tomir (Bemor)</option>
            </select>
          </div>

          <select
            aria-label="Language"
            value={language}
            onChange={(e) => setLanguage(e.target.value as "uz" | "en")}
            className="px-2.5 py-1 bg-emerald-950/60 text-emerald-100 text-xs rounded border border-emerald-700/50 font-medium cursor-pointer"
          >
            <option value="uz">{"O'zbekcha"}</option>
            <option value="en">English</option>
          </select>
        </div>
      </header>

      {/* Sub Navigation Bar */}
      <nav className="bg-white border-b border-slate-200 px-6 flex items-center gap-2 overflow-x-auto text-xs font-semibold shrink-0">
        <span className="py-3 px-4 text-emerald-800 border-b-2 border-emerald-700 font-bold">
          💬 Telekonsultatsiya & Chat
        </span>
      </nav>

      {/* Privacy Redaction Warning Toast */}
      {privacyToast && (
        <div className="bg-amber-500 text-slate-950 text-xs font-bold px-6 py-2.5 flex items-center justify-between shadow-md transition animate-bounce">
          <div className="flex items-center gap-2 max-w-4xl mx-auto">
            <span>🔒</span>
            <span>{t("privacyPhoneRedactedToast")}</span>
          </div>
          <button type="button" onClick={() => setPrivacyToast(false)} className="text-slate-950 font-bold">✕</button>
        </div>
      )}

      {/* Main Split-Pane LinkedIn Messaging Container */}
      <section className="max-w-[1520px] mx-auto px-4 py-4 flex-1 w-full flex flex-col min-h-0">
        <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm flex-1 flex flex-col md:flex-row min-h-[620px]">
          
          {/* LEFT PANEL: Threads List */}
          <aside className="w-full md:w-80 lg:w-96 border-r border-slate-200 flex flex-col bg-slate-50/40">
            <div className="p-4 border-b border-slate-200 bg-white">
              <h2 className="text-lg font-serif font-bold text-slate-900 mb-1">{t("chatTitle")}</h2>
              <p className="text-[11px] text-slate-500 leading-snug mb-3">{t("chatSubtitle")}</p>

              {/* Thread Search */}
              <input
                type="text"
                placeholder={t("searchThreads")}
                value={threadQuery}
                onChange={(e) => setThreadQuery(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-lg p-2.5 outline-none focus:border-emerald-600 bg-slate-50"
              />
            </div>

            {/* Category Filter Tabs */}
            <div className="flex border-b border-slate-200 bg-white text-[11px] font-bold">
              <button
                type="button"
                className={`flex-1 py-2.5 text-center cursor-pointer border-b-2 ${filterTab === "all" ? "border-emerald-700 text-emerald-900 bg-emerald-50/50 font-extrabold" : "border-transparent text-slate-500 hover:text-slate-900"}`}
                onClick={() => setFilterTab("all")}
              >
                {t("allThreads")}
              </button>
              <button
                type="button"
                className={`flex-1 py-2.5 text-center cursor-pointer border-b-2 ${filterTab === "doctor_nurse" ? "border-emerald-700 text-emerald-900 bg-emerald-50/50 font-extrabold" : "border-transparent text-slate-500 hover:text-slate-900"}`}
                onClick={() => setFilterTab("doctor_nurse")}
              >
                {t("doctorNurseThreads")}
              </button>
              <button
                type="button"
                className={`flex-1 py-2.5 text-center cursor-pointer border-b-2 ${filterTab === "patient_threads" ? "border-emerald-700 text-emerald-900 bg-emerald-50/50 font-extrabold" : "border-transparent text-slate-500 hover:text-slate-900"}`}
                onClick={() => setFilterTab("patient_threads")}
              >
                {t("doctorPatientThreads")}
              </button>
            </div>

            {/* Threads List Items */}
            <div className="divide-y divide-slate-100 overflow-y-auto flex-1">
              {filteredThreads.map((thread) => {
                const partner = thread.participants.find((p) => p.id !== activeUserId) || thread.participants[0];
                const isSelected = thread.id === activeThreadId;
                const unread = thread.unreadCount[activeUserId] || 0;

                return (
                  <button
                    key={thread.id}
                    type="button"
                    onClick={() => {
                      setActiveThreadId(thread.id);
                      markThreadAsRead(thread.id, activeUserId);
                    }}
                    className={`w-full p-4 text-left flex items-start gap-3 transition cursor-pointer ${
                      isSelected ? "bg-emerald-50/80 border-l-4 border-emerald-700" : "hover:bg-slate-100/60"
                    }`}
                  >
                    {/* User Avatar with Presence dot */}
                    <div className="relative shrink-0">
                      <div className="w-10 h-10 rounded-full bg-emerald-800 text-white font-bold flex items-center justify-center text-sm shadow-2xs">
                        {partner.name.slice(0, 2).toUpperCase()}
                      </div>
                      <span
                        className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                          partner.presence === "online"
                            ? "bg-emerald-500"
                            : partner.presence === "away"
                              ? "bg-amber-500"
                              : "bg-slate-400"
                        }`}
                      ></span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <b className="text-xs font-bold text-slate-900 truncate">{partner.name}</b>
                        {thread.lastMessage && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(thread.lastMessage.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 mb-1">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                          partner.role === "doctor"
                            ? "bg-emerald-100 text-emerald-900"
                            : partner.role === "nurse"
                              ? "bg-sky-100 text-sky-900"
                              : "bg-amber-100 text-amber-900"
                        }`}>
                          [{partner.role}]
                        </span>
                        <span className="text-[10px] text-slate-500 truncate">{partner.specialtyOrDistrict}</span>
                      </div>

                      {thread.lastMessage && (
                        <p className="text-[11px] text-slate-600 truncate m-0 font-normal">
                          {thread.lastMessage.wasRedacted ? "🔒 [REDACTED FOR PRIVACY]" : thread.lastMessage.sanitizedContent}
                        </p>
                      )}
                    </div>

                    {unread > 0 && (
                      <span className="px-2 py-0.5 bg-emerald-600 text-white text-[10px] font-bold rounded-full shrink-0 shadow-2xs">
                        {unread}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </aside>

          {/* RIGHT PANEL: Active Conversation Workspace */}
          <article className="flex-1 flex flex-col bg-white">
            
            {/* Context-Rich Header */}
            <div className="p-4 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-slate-50/40">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-11 h-11 rounded-full bg-emerald-800 text-white font-bold flex items-center justify-center text-base shadow-sm">
                    {otherParticipant.name.slice(0, 2).toUpperCase()}
                  </div>
                  <span
                    className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white ${
                      otherParticipant.presence === "online"
                        ? "bg-emerald-500"
                        : otherParticipant.presence === "away"
                          ? "bg-amber-500"
                          : "bg-slate-400"
                    }`}
                  ></span>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">{otherParticipant.name}</h3>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 text-[10px] font-bold uppercase rounded">
                      [{otherParticipant.role}]
                    </span>
                    {activeThread?.patientCode && (
                      <span className="px-2 py-0.5 bg-slate-200 text-slate-800 text-[10px] font-mono font-bold rounded">
                        {activeThread.patientCode}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 m-0">
                    {otherParticipant.specialtyOrDistrict} ·{" "}
                    <span className="font-semibold text-emerald-700">
                      {otherParticipant.presence === "online" ? t("online") : otherParticipant.presence === "away" ? t("away") : t("offline")}
                    </span>
                  </p>
                </div>
              </div>

              {/* Header Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
                  onClick={() => setVideoModalOpen(true)}
                >
                  <span>📹</span>
                  <span>{t("startVideoCall")}</span>
                </button>

                <button
                  type="button"
                  className="px-3.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-bold rounded-lg shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
                  onClick={() => setRecordSidebarOpen(true)}
                >
                  <span>📋</span>
                  <span>{t("viewPatientRecord")}</span>
                </button>

                <button
                  type="button"
                  className="px-3.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-bold rounded-lg shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
                  onClick={handleAttachEcg}
                >
                  <span>📎</span>
                  <span>{t("attachFile")}</span>
                </button>

                <button
                  type="button"
                  className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition cursor-pointer"
                  onClick={() => setShowMessageSearch(!showMessageSearch)}
                  title={t("searchMessages")}
                >
                  🔍
                </button>
              </div>
            </div>

            {/* In-Thread Message Search Filter Bar */}
            {showMessageSearch && (
              <div className="p-3 bg-amber-50 border-b border-amber-200 flex items-center gap-2">
                <span className="text-xs font-bold text-amber-900">🔍 {t("searchMessages")}:</span>
                <input
                  type="text"
                  value={messageSearchQuery}
                  onChange={(e) => setMessageSearchQuery(e.target.value)}
                  placeholder="Xabar matnini qidiring..."
                  className="flex-1 text-xs border border-amber-300 rounded-md p-1.5 outline-none bg-white"
                />
                {messageSearchQuery && (
                  <button type="button" onClick={() => setMessageSearchQuery("")} className="text-xs text-amber-900 font-bold">
                    Clear
                  </button>
                )}
              </div>
            )}

            {/* Messages History List Container */}
            <div ref={messagesContainerRef} className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50/20 min-h-[380px] max-h-[calc(100vh-280px)]">
              {displayedMessages.map((msg) => {
                const isMe = msg.senderId === activeUser.id;

                return (
                  <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] font-bold text-slate-800">{msg.senderName}</span>
                      <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 bg-slate-200 text-slate-700 rounded">
                        [{msg.senderRole}]
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>

                    <div
                      className={`max-w-xl p-3.5 rounded-2xl text-xs leading-relaxed shadow-2xs ${
                        isMe
                          ? "bg-[#063c32] text-white rounded-br-xs"
                          : "bg-white border border-slate-200 text-slate-900 rounded-bl-xs"
                      }`}
                    >
                      {/* Clinical Template Key Badge */}
                      {msg.clinicalTemplateKey && (
                        <div className="mb-2 p-2 bg-emerald-950/60 border border-emerald-500/40 rounded-lg text-emerald-200 font-bold text-[11px] flex items-center gap-1.5">
                          <span>⚡</span>
                          <span>Klinik Ko'rsatma: {msg.clinicalTemplateKey.replace(/_/g, " ").toUpperCase()}</span>
                        </div>
                      )}

                      {/* Content with Redaction Warning */}
                      {msg.wasRedacted ? (
                        <div>
                          <span className="block font-bold text-amber-300 text-[11px] mb-1">
                            🔒 MAXFIYLIK REJIMIDA DEFORMATSIYA QILINDI
                          </span>
                          <span className="italic">{msg.sanitizedContent}</span>
                        </div>
                      ) : (
                        <span>{msg.sanitizedContent}</span>
                      )}

                      {/* Attached ECG or Image */}
                      {msg.attachment && msg.attachment.type === "ecg" && (
                        <div
                          className="mt-3 p-3 bg-slate-900 text-white rounded-xl cursor-pointer hover:border-emerald-500 border border-slate-700 transition"
                          onClick={() => {
                            setSelectedImageSrc(msg.attachment?.url || "/og.png");
                            setSelectedImageTitle(msg.attachment?.name || "Diagnostik Rentgen Tasviri");
                            setImageViewerOpen(true);
                          }}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <b className="text-xs font-bold text-emerald-400">📄 {msg.attachment.name}</b>
                            <span className="text-[10px] text-slate-400">{msg.attachment.size}</span>
                          </div>
                          <span className="text-[10px] text-slate-300 block">🔎 HD Interaktiv ko'rish uchun bosing</span>
                        </div>
                      )}

                      {/* Voice Note Attachment */}
                      {msg.attachment && msg.attachment.type === "voice_note" && (
                        <div className="mt-2.5 p-3 bg-emerald-950/80 border border-emerald-700/60 rounded-xl flex items-center gap-3 text-emerald-200">
                          <button
                            type="button"
                            className="w-8 h-8 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center text-xs font-bold shadow transition cursor-pointer"
                            onClick={() => alert("Ovozli xabar tinglanmoqda...")}
                          >
                            ▶
                          </button>
                          <div className="flex-1">
                            <span className="text-xs font-bold block">{t("voiceNote")}</span>
                            <div className="flex items-center gap-1 mt-1">
                              <span className="h-2 w-1 bg-emerald-400 rounded-full animate-pulse"></span>
                              <span className="h-4 w-1 bg-emerald-400 rounded-full animate-pulse"></span>
                              <span className="h-3 w-1 bg-emerald-400 rounded-full animate-pulse"></span>
                              <span className="h-5 w-1 bg-emerald-400 rounded-full animate-pulse"></span>
                              <span className="h-2 w-1 bg-emerald-400 rounded-full animate-pulse"></span>
                              <span className="text-[10px] font-mono text-emerald-300 ml-2">0:14 / 0:14</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Read status footer */}
                      <div className={`mt-1 text-[9px] text-right font-medium ${isMe ? "text-emerald-200/80" : "text-slate-400"}`}>
                        {msg.status === "read" ? "✓✓ O'qildi" : "✓ Yuborildi"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Clinical Action Template Chips (for Doctor ↔ Nurse threads) */}
            {activeThread?.type === "doctor_nurse" && (
              <div className="px-6 py-2.5 bg-slate-50 border-t border-slate-200 flex flex-wrap gap-2 text-xs">
                <span className="text-[11px] font-bold text-slate-500 self-center">Tezkor klinik sabablar:</span>
                <button
                  type="button"
                  className="px-3 py-1 bg-white hover:bg-emerald-50 border border-slate-300 hover:border-emerald-600 text-slate-800 text-xs font-semibold rounded-lg shadow-2xs transition cursor-pointer"
                  onClick={() => handleSend("Zudlik bilan takroriy EKG yozuvini yuboring va natijani baholaymiz.", undefined, "request_repeat_ecg")}
                >
                  {t("templateRequestEcg")}
                </button>
                <button
                  type="button"
                  className="px-3 py-1 bg-white hover:bg-emerald-50 border border-slate-300 hover:border-emerald-600 text-slate-800 text-xs font-semibold rounded-lg shadow-2xs transition cursor-pointer"
                  onClick={() => handleSend("Vital ko'rsatkichlar tasdiqlandi. Gipoksiyaga qarshi kislorod dozasini davom ettiring.", undefined, "confirm_vitals")}
                >
                  {t("templateConfirmVitals")}
                </button>
                <button
                  type="button"
                  className="px-3 py-1 bg-white hover:bg-emerald-50 border border-slate-300 hover:border-emerald-600 text-slate-800 text-xs font-semibold rounded-lg shadow-2xs transition cursor-pointer"
                  onClick={() => handleSend("Samarqand shoshilinch markaziga yo'llanma rasmiylashtirildi.", undefined, "approve_transfer")}
                >
                  {t("templateApproveTransfer")}
                </button>
                <button
                  type="button"
                  className="px-3 py-1 bg-white hover:bg-emerald-50 border border-slate-300 hover:border-emerald-600 text-slate-800 text-xs font-semibold rounded-lg shadow-2xs transition cursor-pointer"
                  onClick={() => handleSend("Kislorod miqdorini daqiqasiga 4 litrgacha oshiring.", undefined, "order_oxygen")}
                >
                  {t("templateOrderOxygen")}
                </button>
              </div>
            )}

            {/* Input Form Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="p-4 bg-white border-t border-slate-200 flex items-center gap-3"
            >
              <button
                type="button"
                onClick={handleSendVoiceNote}
                className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                  isRecordingVoice
                    ? "bg-red-600 text-white animate-pulse border-red-700"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300"
                }`}
                title={t("recordVoice")}
              >
                <span>🎙️</span>
                <span className="hidden sm:inline">{isRecordingVoice ? "Yozilmoqda..." : t("voiceNote")}</span>
              </button>

              <button
                type="button"
                onClick={handleAttachEcg}
                className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl border border-slate-300 transition cursor-pointer"
                title={t("attachFile")}
              >
                📎
              </button>

              <input
                type="text"
                value={inputContent}
                onChange={(e) => setInputContent(e.target.value)}
                placeholder={t("typeMessagePlaceholder")}
                className="flex-1 text-xs border border-slate-300 rounded-xl p-3 outline-none focus:border-emerald-600"
              />

              <button
                type="submit"
                disabled={!inputContent.trim()}
                className="px-5 py-3 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer flex items-center gap-1.5"
              >
                <span>{t("send")}</span>
                <span>➡️</span>
              </button>
            </form>
          </article>
        </div>
      </section>

      {/* Video Teleconsultation Modal */}
      <VideoTeleconsultModal
        isOpen={videoModalOpen}
        onClose={() => setVideoModalOpen(false)}
        participantName={otherParticipant.name}
        participantRole={otherParticipant.role}
        patientCode={activeThread.patientCode}
      />

      {/* Patient Medical Record Sidebar Drawer */}
      <PatientRecordSidebar
        isOpen={recordSidebarOpen}
        onClose={() => setRecordSidebarOpen(false)}
        patientCode={activeThread.patientCode || "QM-2027-0042"}
      />

      {/* HD Diagnostic Image Viewer Modal */}
      <ImageViewerModal
        isOpen={imageViewerOpen}
        onClose={() => setImageViewerOpen(false)}
        imageSrc={selectedImageSrc}
        imageTitle={selectedImageTitle}
      />
    </main>
  );
}

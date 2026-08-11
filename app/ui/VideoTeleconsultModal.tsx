"use client";
import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/i18n";

interface VideoTeleconsultModalProps {
  isOpen: boolean;
  onClose: () => void;
  participantName: string;
  participantRole: string;
  patientCode?: string;
}

export function VideoTeleconsultModal({
  isOpen,
  onClose,
  participantName,
  participantRole,
  patientCode,
}: VideoTeleconsultModalProps) {
  const { t } = useLanguage();
  const [micMuted, setMicMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);
  const [screenSharing, setScreenSharing] = useState(false);
  const [callSeconds, setCallSeconds] = useState(0);
  const [notes, setNotes] = useState("");
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const timer = setInterval(() => {
      setCallSeconds((s) => s + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  const minutes = Math.floor(callSeconds / 60);
  const seconds = callSeconds % 60;
  const formattedTime = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0b1d19] border border-emerald-800/80 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Top bar */}
        <div className="px-6 py-4 bg-[#062d25] border-b border-emerald-800/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-red-500 animate-ping"></span>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>📹 {t("videoCallTitle")}</span>
                {patientCode && (
                  <span className="px-2 py-0.5 bg-emerald-900/60 text-emerald-300 text-xs font-mono rounded">
                    {patientCode}
                  </span>
                )}
              </h3>
              <p className="text-xs text-emerald-200/70">
                {participantName} ({participantRole}) · {formattedTime}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-lg transition cursor-pointer"
          >
            ✕ {t("close")}
          </button>
        </div>

        {/* Video stream container */}
        <div className="relative bg-slate-950 flex-1 min-h-[360px] flex items-center justify-center overflow-hidden p-6">
          {/* Main participant video stream preview */}
          {!camOff ? (
            <div className="relative w-full h-full min-h-[320px] bg-[#0c241f] rounded-xl border border-emerald-800/40 flex flex-col items-center justify-center text-center p-6 shadow-inner">
              <div className="w-24 h-24 rounded-full bg-emerald-700/40 border-2 border-emerald-400/50 flex items-center justify-center text-3xl text-emerald-200 font-bold mb-3 shadow-lg">
                {participantName.slice(0, 2).toUpperCase()}
              </div>
              <h4 className="text-lg font-serif font-bold text-white mb-1">{participantName}</h4>
              <span className="text-xs text-emerald-300 font-medium bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-800">
                {participantRole} · Encrypted WebRTC Session
              </span>

              {/* Live Signal wave simulation */}
              <div className="mt-6 flex items-center gap-1.5 text-xs text-emerald-400/80 font-mono">
                <span className="w-1.5 h-3 bg-emerald-400 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-5 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.1s]"></span>
                <span className="w-1.5 h-4 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-1.5 h-6 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.3s]"></span>
                <span className="ml-2">HD Video 1080p · 24ms</span>
              </div>
            </div>
          ) : (
            <div className="w-full h-full min-h-[320px] bg-slate-900 rounded-xl flex items-center justify-center text-slate-400 text-sm">
              📷 Camera disabled
            </div>
          )}

          {/* Screen Share Overlay */}
          {screenSharing && (
            <div className="absolute top-4 left-4 bg-emerald-950/90 border border-emerald-500 text-emerald-200 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-lg">
              <span>💻</span>
              <span>Screen sharing active</span>
            </div>
          )}

          {/* Doctor Self Video PIP */}
          <div className="absolute bottom-4 right-4 w-40 h-28 bg-[#041a15] border-2 border-emerald-500/60 rounded-xl overflow-hidden shadow-2xl flex flex-col items-center justify-center p-2 text-center">
            <div className="w-10 h-10 rounded-full bg-emerald-800/60 text-white font-bold flex items-center justify-center text-xs mb-1">
              Dr
            </div>
            <span className="text-[10px] text-emerald-200 font-bold">Siz (Dr. Tomir)</span>
          </div>
        </div>

        {/* Clinical notes input */}
        <div className="px-6 py-3 bg-[#062d25] border-t border-emerald-800/60">
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-bold text-emerald-200">{t("callNotes")}:</label>
            {savedNotice && (
              <span className="text-xs font-bold text-emerald-400">✓ Saved to encounter</span>
            )}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Telekonsultatsiya davomida vrach mulohazalari va ko'rsatmalarini kiriting..."
              className="flex-1 text-xs bg-[#0b1d19] border border-emerald-700/70 text-emerald-100 rounded-lg p-2.5 outline-none focus:border-emerald-500"
            />
            <button
              type="button"
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg transition cursor-pointer"
              onClick={() => {
                if (notes.trim()) {
                  setSavedNotice(true);
                  setTimeout(() => setSavedNotice(false), 2500);
                }
              }}
            >
              Saqlash
            </button>
          </div>
        </div>

        {/* Video call control bar */}
        <div className="px-6 py-4 bg-[#031713] flex items-center justify-center gap-4">
          <button
            type="button"
            className={`px-4 py-2.5 rounded-full text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
              micMuted
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-emerald-900/80 text-emerald-200 hover:bg-emerald-800 border border-emerald-700"
            }`}
            onClick={() => setMicMuted(!micMuted)}
          >
            <span>{micMuted ? "🔇" : "🎙️"}</span>
            <span>{t("micMute")} {micMuted ? "(O'chirilgan)" : "(Yoqilgan)"}</span>
          </button>

          <button
            type="button"
            className={`px-4 py-2.5 rounded-full text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
              camOff
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-emerald-900/80 text-emerald-200 hover:bg-emerald-800 border border-emerald-700"
            }`}
            onClick={() => setCamOff(!camOff)}
          >
            <span>{camOff ? "📷" : "📹"}</span>
            <span>{t("camToggle")}</span>
          </button>

          <button
            type="button"
            className={`px-4 py-2.5 rounded-full text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
              screenSharing
                ? "bg-emerald-600 text-white"
                : "bg-emerald-900/80 text-emerald-200 hover:bg-emerald-800 border border-emerald-700"
            }`}
            onClick={() => setScreenSharing(!screenSharing)}
          >
            <span>💻</span>
            <span>{t("screenShare")}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-full shadow-lg transition cursor-pointer flex items-center gap-2"
          >
            <span>📞</span>
            <span>{t("endCall")}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

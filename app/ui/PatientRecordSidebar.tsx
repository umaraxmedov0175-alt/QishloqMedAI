"use client";
/* eslint-disable react/no-unescaped-entities */
import { DEMO_CASES } from "@/lib/demo-data";
import { useLanguage } from "@/lib/i18n";

interface PatientRecordSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  patientCode: string;
}

export function PatientRecordSidebar({
  isOpen,
  onClose,
  patientCode,
}: PatientRecordSidebarProps) {
  const { t } = useLanguage();
  const patient = DEMO_CASES.find((c) => c.code === patientCode) || DEMO_CASES[0];

  if (!isOpen) return null;

  return (
    <aside className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-[#0F172A]/95 backdrop-blur-xl border-l border-white/[0.08] shadow-2xl flex flex-col transition-all duration-300">
      {/* Sidebar Header */}
      <div className="p-5 bg-slate-900/90 backdrop-blur-md text-white flex items-center justify-between shadow-xs border-b border-white/[0.08]">
        <div>
          <span className="text-[10px] font-bold tracking-wider uppercase text-sky-300 block">
            {t("patientRecordSidebarTitle")}
          </span>
          <h3 className="text-lg font-sans font-bold text-white mt-0.5">{patient.code}</h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm transition cursor-pointer"
        >
          ✕
        </button>
      </div>

      {/* Sidebar Scroll Content */}
      <div className="p-6 overflow-y-auto flex-1 space-y-5 text-xs">
        {/* Patient Identity Card */}
        <div className="p-4 bg-slate-800/60 border border-white/[0.08] rounded-xl space-y-1.5">
          <div className="flex items-center justify-between">
            <b className="text-sm font-bold text-white">{patient.name}</b>
            <span className={`triage-badge ${patient.triage}`}>
              {patient.triage.toUpperCase()}
            </span>
          </div>
          <p className="text-slate-400 font-medium m-0">
            {patient.age} {t("years")} · {patient.sex} · {patient.village}, {patient.region}
          </p>
          <span className="text-[11px] text-slate-400 block font-mono">
            Klinika: {patient.clinic} · {patient.submitted}
          </span>
        </div>

        {/* Chief Complaint */}
        <div>
          <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            {t("chiefComplaint")}
          </h4>
          <p className="text-xs font-semibold text-slate-200 bg-slate-800/60 p-3 rounded-lg border border-white/[0.08] leading-relaxed m-0">
            {patient.complaint}
          </p>
        </div>

        {/* Vital Signs Grid */}
        <div>
          <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
            {t("step4Vitals")}
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 border border-white/[0.08] rounded-lg bg-slate-800/50">
              <span className="text-slate-400 block text-[11px] mb-0.5">🫁 SpO₂</span>
              <b className="text-base font-bold text-white">
                {patient.code === "QM-2027-0042" ? "89%" : "97%"}
              </b>
            </div>
            <div className="p-2.5 border border-white/[0.08] rounded-lg bg-slate-800/50">
              <span className="text-slate-400 block text-[11px] mb-0.5">💓 {t("pulseBpm")}</span>
              <b className="text-base font-bold text-white">
                {patient.code === "QM-2027-0042" ? "108 bpm" : "78 bpm"}
              </b>
            </div>
            <div className="p-2.5 border border-white/[0.08] rounded-lg bg-slate-800/50">
              <span className="text-slate-400 block text-[11px] mb-0.5">⏱ {t("systolicBp")}</span>
              <b className="text-base font-bold text-white">168/96 mmHg</b>
            </div>
            <div className="p-2.5 border border-white/[0.08] rounded-lg bg-slate-800/50">
              <span className="text-slate-400 block text-[11px] mb-0.5">🌡️ {t("tempC")}</span>
              <b className="text-base font-bold text-white">37.4 °C</b>
            </div>
          </div>
        </div>

        {/* AI Risk Score Banner */}
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
              🪄 AI BOSHLANG'ICH TAHLILI
            </span>
            <span className="px-2.5 py-0.5 bg-amber-500/15 text-amber-300 text-xs font-bold rounded-full border border-amber-500/20">
              92/100 · FAVQULODDA XAVF
            </span>
          </div>
          <p className="text-xs text-amber-200/80 font-medium leading-snug m-0">
            {patient.aiSummary}
          </p>
        </div>

        {/* Protocol Follow-Up Answers */}
        {patient.protocolAnswers && (
          <div className="p-4 bg-emerald-500/8 border border-emerald-500/15 rounded-xl space-y-2">
            <h4 className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider m-0">
              📋 MOSLASHUVCHAN KLINIK PROTOKOL
            </h4>
            <div className="space-y-1 text-[11px]">
              <div className="p-2 bg-slate-800/50 rounded border border-white/[0.06] flex justify-between">
                <span className="text-slate-300 font-medium">Og'riq tarqalishi:</span>
                <span className="font-bold text-red-700">Chap qo'lga, Jag'ga ⚠️</span>
              </div>
              <div className="p-2 bg-slate-800/50 rounded border border-white/[0.06] flex justify-between">
                <span className="text-slate-300 font-medium">Sovuq ter:</span>
                <span className="font-bold text-red-700">Ha (Tasdiqlandi) ⚠️</span>
              </div>
              <div className="p-2 bg-slate-800/50 rounded border border-white/[0.06] flex justify-between">
                <span className="text-slate-300 font-medium">Og'riq tezligi:</span>
                <span className="font-bold text-slate-500">🛑 O'TKAZIB YUBORILDI</span>
              </div>
              <div className="p-2 bg-slate-800/50 rounded border border-white/[0.06] flex justify-between">
                <span className="text-slate-300 font-medium">Og'riq intensivligi:</span>
                <span className="font-bold text-emerald-400">9 / 10</span>
              </div>
            </div>
          </div>
        )}

        {/* Diagnostic Files List */}
        <div>
          <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
            🖼 DIAGNOSTIK BIRIKTIRMALAR
          </h4>
          <div className="space-y-2">
            {patient.diagnostics.map((d, i) => (
              <div
                key={i}
                className="p-2.5 bg-slate-800/50 border border-white/[0.06] rounded-lg flex items-center justify-between text-xs"
              >
                <span className="font-semibold text-slate-200">📄 {d}</span>
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/15 px-2 py-0.5 rounded border border-emerald-500/20">
                  Mavjud
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Close */}
      <div className="p-4 bg-slate-900/80 border-t border-white/[0.08]">
        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-lg transition cursor-pointer shadow-lg shadow-sky-600/20"
        >
          {t("close")}
        </button>
      </div>
    </aside>
  );
}

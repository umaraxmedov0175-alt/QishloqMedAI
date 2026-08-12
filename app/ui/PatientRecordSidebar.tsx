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
    <aside className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white border-l border-slate-200 shadow-2xl flex flex-col transition-all duration-300">
      {/* Sidebar Header */}
      <div className="p-5 bg-[#063c32] text-white flex items-center justify-between shadow-xs">
        <div>
          <span className="text-[10px] font-bold tracking-wider uppercase text-emerald-300 block">
            {t("patientRecordSidebarTitle")}
          </span>
          <h3 className="text-lg font-serif font-bold text-white mt-0.5">{patient.code}</h3>
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
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
          <div className="flex items-center justify-between">
            <b className="text-sm font-bold text-slate-900">{patient.name}</b>
            <span className={`triage-badge ${patient.triage}`}>
              {patient.triage.toUpperCase()}
            </span>
          </div>
          <p className="text-slate-600 font-medium m-0">
            {patient.age} {t("years")} · {patient.sex} · {patient.village}, {patient.region}
          </p>
          <span className="text-[11px] text-slate-400 block font-mono">
            Klinika: {patient.clinic} · {patient.submitted}
          </span>
        </div>

        {/* Chief Complaint */}
        <div>
          <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            {t("chiefComplaint")}
          </h4>
          <p className="text-xs font-semibold text-slate-800 bg-slate-50 p-3 rounded-lg border border-slate-200 leading-relaxed m-0">
            {patient.complaint}
          </p>
        </div>

        {/* Vital Signs Grid */}
        <div>
          <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            {t("step4Vitals")}
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 border border-slate-200 rounded-lg bg-white">
              <span className="text-slate-500 block text-[11px] mb-0.5">🫁 SpO₂</span>
              <b className="text-base font-bold text-slate-900">
                {patient.code === "QM-2027-0042" ? "89%" : "97%"}
              </b>
            </div>
            <div className="p-2.5 border border-slate-200 rounded-lg bg-white">
              <span className="text-slate-500 block text-[11px] mb-0.5">💓 {t("pulseBpm")}</span>
              <b className="text-base font-bold text-slate-900">
                {patient.code === "QM-2027-0042" ? "108 bpm" : "78 bpm"}
              </b>
            </div>
            <div className="p-2.5 border border-slate-200 rounded-lg bg-white">
              <span className="text-slate-500 block text-[11px] mb-0.5">⏱ {t("systolicBp")}</span>
              <b className="text-base font-bold text-slate-900">168/96 mmHg</b>
            </div>
            <div className="p-2.5 border border-slate-200 rounded-lg bg-white">
              <span className="text-slate-500 block text-[11px] mb-0.5">🌡️ {t("tempC")}</span>
              <b className="text-base font-bold text-slate-900">37.4 °C</b>
            </div>
          </div>
        </div>

        {/* AI Risk Score Banner */}
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider">
              🪄 AI BOSHLANG'ICH TAHLILI
            </span>
            <span className="px-2.5 py-0.5 bg-amber-200 text-amber-950 text-xs font-bold rounded-full">
              92/100 · FAVQULODDA XAVF
            </span>
          </div>
          <p className="text-xs text-amber-900 font-medium leading-snug m-0">
            {patient.aiSummary}
          </p>
        </div>

        {/* Protocol Follow-Up Answers */}
        {patient.protocolAnswers && (
          <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-2">
            <h4 className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider m-0">
              📋 MOSLASHUVCHAN KLINIK PROTOKOL
            </h4>
            <div className="space-y-1 text-[11px]">
              <div className="p-2 bg-white rounded border border-emerald-100 flex justify-between">
                <span className="text-slate-700 font-medium">Og'riq tarqalishi:</span>
                <span className="font-bold text-red-700">Chap qo'lga, Jag'ga ⚠️</span>
              </div>
              <div className="p-2 bg-white rounded border border-emerald-100 flex justify-between">
                <span className="text-slate-700 font-medium">Sovuq ter:</span>
                <span className="font-bold text-red-700">Ha (Tasdiqlandi) ⚠️</span>
              </div>
              <div className="p-2 bg-white rounded border border-emerald-100 flex justify-between">
                <span className="text-slate-700 font-medium">Og'riq tezligi:</span>
                <span className="font-bold text-slate-500">🛑 O'TKAZIB YUBORILDI</span>
              </div>
              <div className="p-2 bg-white rounded border border-emerald-100 flex justify-between">
                <span className="text-slate-700 font-medium">Og'riq intensivligi:</span>
                <span className="font-bold text-emerald-900">9 / 10</span>
              </div>
            </div>
          </div>
        )}

        {/* Diagnostic Files List */}
        <div>
          <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            🖼 DIAGNOSTIK BIRIKTIRMALAR
          </h4>
          <div className="space-y-2">
            {patient.diagnostics.map((d, i) => (
              <div
                key={i}
                className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs"
              >
                <span className="font-semibold text-slate-800">📄 {d}</span>
                <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded">
                  Mavjud
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Close */}
      <div className="p-4 bg-slate-50 border-t border-slate-200">
        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg transition cursor-pointer"
        >
          {t("close")}
        </button>
      </div>
    </aside>
  );
}

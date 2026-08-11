"use client";

import { useState } from "react";

export interface TimelineStage {
  id: number;
  titleUz: string;
  titleEn: string;
  locationUz: string;
  locationEn: string;
  timestamp: string;
  status: "complete" | "current" | "pending";
  evidenceBadge: string;
  detailsUz: string;
  detailsEn: string;
}

const DEFAULT_STAGES: TimelineStage[] = [
  {
    id: 1,
    titleUz: "Boshlangʻich Simptom va Intak Roziligi",
    titleEn: "Initial Symptom & Intake Consent",
    locationUz: "Urgut tumani, G'us qishlog'i",
    locationEn: "Urgut District, G'us Village",
    timestamp: "08:15 · Bugun",
    status: "complete",
    evidenceBadge: "Rozilik OK · SpO₂ 91%",
    detailsUz: "Bemor Tomir (67 yosh) nafas qisishi va ko'krakda bosim bilan murojaat qildi.",
    detailsEn: "Patient Tomir (67y) reported acute dyspnea and retrosternal tightness.",
  },
  {
    id: 2,
    titleUz: "Mobil Laboratoriya Tezkor Analizi",
    titleEn: "Mobile Diagnostic Lab Panel",
    locationUz: "Tomir-01 Mobil Klinikasi",
    locationEn: "Tomir-01 Mobile Vehicle Unit",
    timestamp: "08:28 · Bugun",
    status: "complete",
    evidenceBadge: "Giperglikemiya · Troponin I (+)",
    detailsUz: "Qonda troponin I musbat, glyukoza 14.2 mmol/L. EKG tasviri olindi.",
    detailsEn: "Troponin I positive, blood glucose 14.2 mmol/L. 12-lead ECG recorded.",
  },
  {
    id: 3,
    titleUz: "AI Xavf Tahlili va Triaj",
    titleEn: "AI Risk Assessment & Triage",
    locationUz: "Tomir AI Triage Engine v2.4",
    locationEn: "Tomir AI Triage Engine v2.4",
    timestamp: "08:30 · Bugun",
    status: "complete",
    evidenceBadge: "FAVQULODDA · Score 92/100",
    detailsUz: "O'tkir koronar sindrom xavfi aniqlandi. Regional Kasalxonaga tezkor yo'llanma.",
    detailsEn: "High probability ACS flagged. Immediate routing to regional hospital.",
  },
  {
    id: 4,
    titleUz: "Regional Vrach Tasdig'i",
    titleEn: "Regional Specialist Review",
    locationUz: "Samarqand Viloyat Shoshilinch Markazi",
    locationEn: "Samarqand Regional Emergency Center",
    timestamp: "08:35 · Bugun",
    status: "current",
    evidenceBadge: "Tasdiq kutilmoqda",
    detailsUz: "Shoshilinch tibbiy mutaxassis AI xulosasini ko'rib chiqmoqda.",
    detailsEn: "Emergency cardiology specialist reviewing evidence and AI summary.",
  },
  {
    id: 5,
    titleUz: "Reanimatsiya Brigadasi Dispetcherligi",
    titleEn: "ICU Ambulance Dispatch",
    locationUz: "Urgut Tuman Markaziy Kasalxonasi",
    locationEn: "Urgut Regional Hospital",
    timestamp: "Kutilmoqda",
    status: "pending",
    evidenceBadge: "Marshrut tayyor",
    detailsUz: "Bemor tez tibbiy yordam avtomobilida regional kasalxonaga yetkaziladi.",
    detailsEn: "Patient to be transported by mobile ICU ambulance to nearest hospital.",
  },
];

interface CareTimelineProps {
  stages?: TimelineStage[];
  language?: "uz" | "en";
  className?: string;
}

export function CareTimeline({
  stages = DEFAULT_STAGES,
  language = "uz",
  className = "",
}: CareTimelineProps) {
  const [activeStageId, setActiveStageId] = useState<number>(4);

  return (
    <div
      className={`relative rounded-2xl border border-slate-700/80 p-5 bg-navy-950/90 backdrop-blur-xl shadow-2xl ${className}`}
      role="region"
      aria-label={language === "uz" ? "Bemor klinik parvarish vaqt shkalasi" : "Patient Care Journey Timeline"}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-6 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">📜</span>
            <h3 className="text-base font-serif font-bold text-white">
              {language === "uz" ? "Interaktiv Bemor Parvarish Tarixi Vaqt Shkalasi" : "Interactive Patient Care Journey Timeline"}
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {language === "uz" ? "Qishloq ko'rigidan boshlab regional shifoxonagacha klinik bosqichlar" : "Tracing clinical progression from rural village intake to regional hospital transport"}
          </p>
        </div>

        <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-lg border border-emerald-800/60 font-semibold">
          ⚡ WOW MOMENT 3: Sequential Milestone Trails
        </span>
      </div>

      {/* Horizontal Timeline Track */}
      <div className="relative mb-6 px-2 overflow-x-auto">
        <div className="min-w-[650px] flex items-center justify-between relative py-6">
          {/* Background Connecting Line */}
          <div className="absolute top-1/2 left-4 right-4 h-1 bg-slate-800 -translate-y-1/2 rounded-full z-0" />
          
          {/* Animated Glowing Progress Line */}
          <div
            className="absolute top-1/2 left-4 h-1 bg-gradient-to-r from-emerald-500 to-emerald-400 -translate-y-1/2 rounded-full z-0 transition-all duration-700 shadow-md shadow-emerald-500/50"
            style={{
              width: `${((activeStageId - 1) / (stages.length - 1)) * 96}%`,
            }}
          />

          {/* Timeline Nodes */}
          {stages.map((st) => {
            const isComplete = st.status === "complete";
            const isCurrent = st.id === activeStageId;

            return (
              <button
                key={st.id}
                type="button"
                onClick={() => setActiveStageId(st.id)}
                className="relative z-10 flex flex-col items-center group cursor-pointer border-0 bg-transparent"
              >
                {/* Node Circle */}
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 ${
                    isCurrent
                      ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/50 scale-125 border-2 border-white"
                      : isComplete
                      ? "bg-emerald-900/90 text-emerald-300 border-2 border-emerald-500"
                      : "bg-slate-900 text-slate-500 border-2 border-slate-700"
                  }`}
                >
                  {isComplete ? "✓" : st.id}
                </div>

                {/* Node Milestone Label */}
                <span
                  className={`text-[11px] font-semibold mt-2 whitespace-nowrap max-w-[110px] text-center truncate transition-colors ${
                    isCurrent ? "text-emerald-400 font-bold" : "text-slate-400"
                  }`}
                >
                  {language === "uz" ? st.titleUz : st.titleEn}
                </span>

                <span className="text-[9px] font-mono text-slate-500 block">
                  {st.timestamp}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Stage Detail Evidence Popover */}
      {(() => {
        const activeStage = stages.find((s) => s.id === activeStageId) || stages[0];
        return (
          <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {activeStage.evidenceBadge}
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  📍 {language === "uz" ? activeStage.locationUz : activeStage.locationEn}
                </span>
              </div>
              <h4 className="text-sm font-bold text-white">
                {language === "uz" ? activeStage.titleUz : activeStage.titleEn}
              </h4>
              <p className="text-xs text-slate-300 mt-1">
                {language === "uz" ? activeStage.detailsUz : activeStage.detailsEn}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-mono text-slate-400">
                {activeStage.timestamp}
              </span>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

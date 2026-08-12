"use client";
/* eslint-disable @next/next/no-html-link-for-pages, react/no-unescaped-entities, jsx-a11y/aria-role, react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import { DEMO_CASES } from "@/lib/demo-data";
import { RoleGuard } from "@/app/ui/RoleGuard";
import { SidebarNav } from "@/app/ui/SidebarNav";
import { MovableChatWidget } from "@/app/ui/MovableChatWidget";
import {
  getClinicalAction,
  saveClinicalAction,
} from "@/lib/clinical-store";
import { evaluateAnswers, getProtocol, type AnswerMap } from "@/lib/symptom-protocols/engine";
import { useLanguage } from "@/lib/i18n";
import { printClinicalReport } from "@/lib/report-generator";
import { downloadFhirJson } from "@/lib/fhir-mapping";
import { ImageViewerModal } from "@/app/ui/ImageViewerModal";
import { CarePulse } from "@/app/ui/CarePulse";
import { MedAIAssistantDrawer } from "@/app/ui/MedAIAssistantDrawer";
import {
  getAnatomyAssessments,
  subscribeToAnatomyUpdates,
  updateAnatomyStatus,
  type AnatomyAssessment,
} from "@/lib/anatomy-store";

export default function CentralReviewPage() {
  const { language, t } = useLanguage();
  const [collapsed, setCollapsed] = useState(false);
  const [cases] = useState(DEMO_CASES);
  const [selected, setSelected] = useState("QM-2027-0042");
  const active = cases.find((c) => c.code === selected) ?? cases[0];
  const [query, setQuery] = useState("");
  const [priority, setPriority] = useState("all");
  const [finalSummary, setFinalSummary] = useState("");
  const [decision, setDecision] = useState("");
  const [savedAt, setSavedAt] = useState("");
  const [viewerOpen, setViewerOpen] = useState(false);
  const [liveNurseAssessments, setLiveNurseAssessments] = useState<AnatomyAssessment[]>(() => getAnatomyAssessments());

  useEffect(() => {
    setLiveNurseAssessments(getAnatomyAssessments());
    const unsubscribe = subscribeToAnatomyUpdates((updated) => {
      setLiveNurseAssessments(updated);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let current = true;
    void getClinicalAction(active.code).then((action) => {
      if (!current) return;
      setFinalSummary(action?.finalSummary ?? active.clinicianFinal ?? "");
      setDecision(action?.decision ?? "");
      setSavedAt(action?.updatedAt ?? "");
    });
    return () => {
      current = false;
    };
  }, [active.code, active.clinicianFinal]);

  async function recordDecision(nextDecision: string) {
    const action = await saveClinicalAction({
      caseCode: active.code,
      finalSummary,
      decision: nextDecision,
      clinician: "Tomir",
    });
    setDecision(action.decision);
    setSavedAt(action.updatedAt);

    // Mutual Real-Time Synchronization back to Nurse Workspace
    const matchAssessment = liveNurseAssessments.find((a) => a.patientId === active.code || a.id.includes(active.code));
    if (matchAssessment) {
      updateAnatomyStatus(
        matchAssessment.id,
        nextDecision === "CONFIRM_REFERRAL" ? "approved" : "additional_info_requested",
        finalSummary || "Vrach xulosasi tasdiqlandi va hamshira ish maydoniga uzatildi."
      );
    }
  }

  const handlePrintReport = () => {
    printClinicalReport(
      {
        caseCode: active.code,
        patientName: active.name,
        age: active.age,
        sex: active.sex,
        location: `${active.village}, ${active.region}`,
        chiefComplaint: active.complaint,
        symptoms: active.reason,
        vitals: [
          { label: "SpO₂", value: active.code === "QM-2027-0042" ? "89%" : "97%", warning: active.code === "QM-2027-0042" },
          { label: "Yurak urishi", value: active.code === "QM-2027-0042" ? "108 bpm" : "78 bpm", warning: active.code === "QM-2027-0042" },
          { label: "Qon bosimi", value: "168/96 mmHg" },
          { label: "Harorat", value: "37.4 °C" },
        ],
        aiTriageLevel: active.triage,
        aiSummary: active.aiSummary,
        clinicianNotes: finalSummary || active.clinicianFinal,
        referral: decision.includes("referral")
          ? {
              facility: "Samarqand Viloyat Shoshilinch Tibbiy Yordam Markazi",
              specialty: "Kardiologiya / Pulmonologiya",
              urgency: active.triage,
              reason: active.reason,
            }
          : undefined,
        reviewedAt: savedAt ? new Date(savedAt).toLocaleString(language === "uz" ? "uz-UZ" : "en-US") : undefined,
      },
      language
    );
  };

  const handleExportFhir = () => {
    downloadFhirJson({
      caseCode: active.code,
      patientName: active.name,
      age: active.age,
      sex: active.sex,
      village: `${active.village}, ${active.region}`,
      chiefComplaint: active.complaint,
      symptoms: active.reason,
      triage: active.triage,
      vitals: [
        { label: "SpO2", value: active.code === "QM-2027-0042" ? "89%" : "97%" },
        { label: "Heart Rate", value: active.code === "QM-2027-0042" ? "108 bpm" : "78 bpm" },
        { label: "BP", value: "168/96 mmHg" },
        { label: "Temperature", value: "37.4 °C" },
      ],
      referral: decision.includes("referral")
        ? {
            facility: "Regional Emergency Center",
            specialty: "Cardiology",
            urgency: active.triage,
          }
        : undefined,
    });
  };

  return (
    <RoleGuard requiredRole="doctor">
      <div className="min-h-screen bg-[#f6f3ea] text-[#2b2621]">
        <SidebarNav role="doctor" activePath="/central" onToggleCollapse={setCollapsed} />
        <main className={`transition-[margin] duration-300 ${collapsed ? "ml-16" : "ml-64"} min-h-screen overflow-y-auto`}>

      <section className="max-w-[1520px] mx-auto px-6 py-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <span className="text-[11px] font-bold text-emerald-800 tracking-wider uppercase">{t("roleSpecialist")}</span>
            <h1 className="text-3xl font-serif font-bold text-slate-900 mt-1 mb-1">{t("specialistQueue")}</h1>
            <p className="text-slate-500 text-xs">{t("evidenceFirstNotice")}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintReport}
              className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-semibold rounded-lg shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
            >
              ⏱ {t("printReport")}
            </button>
            <button
              onClick={handleExportFhir}
              className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-semibold rounded-lg shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
            >
              📥 {t("exportFhir")}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          {[
            ["5", t("awaitingReview")],
            ["1", t("emergency")],
            ["2", t("urgent")],
            ["3", t("reviewedToday")],
            ["18 min", t("avgTurnaround")],
          ].map(([n, l]) => (
            <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs" key={l}>
              <b className="text-2xl font-bold text-slate-900 block leading-tight">{n}</b>
              <span className="text-[11px] text-slate-500 font-medium">{l}</span>
            </div>
          ))}
        </div>

        <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column: Patient Queue List */}
          <aside className="lg:col-span-3 bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-2xs flex flex-col">
            <div className="p-3 border-b border-slate-100 grid grid-cols-3 gap-2">
              <input
                aria-label={t("searchPlaceholder")}
                placeholder={t("searchPlaceholder")}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="col-span-2 text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-emerald-600"
              />
              <select
                aria-label={t("triageLevel")}
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="text-xs border border-slate-200 rounded-lg px-1.5 py-1.5 outline-none bg-white font-medium"
              >
                <option value="all">{t("allPriorities")}</option>
                <option value="emergency">{t("emergency")}</option>
                <option value="urgent">{t("urgent")}</option>
                <option value="priority">{t("priority")}</option>
                <option value="routine">{t("routine")}</option>
              </select>
            </div>

            <div className="divide-y divide-slate-100 overflow-y-auto max-h-[750px]">
              {cases.map((c) => (
                <button
                  className={`w-full text-left p-3.5 transition cursor-pointer ${selected === c.code ? "bg-emerald-50/60 border-l-4 border-emerald-700" : "hover:bg-slate-50"}`}
                  key={c.code}
                  onClick={() => setSelected(c.code)}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`triage-badge ${c.triage}`}>
                      {c.triage === "emergency" ? "▲ FAVQULODDA (KRITIK)" : c.triage === "urgent" ? "■ SHOSHILINCH" : c.triage === "priority" ? "◆ USTUVOR" : "● REJALI (ODATIY)"}
                    </span>
                  </div>
                  <div className="font-bold text-xs text-slate-900 mb-0.5">
                    {c.code} · {c.age} {t("years")} · {c.sex}
                  </div>
                  <div className="text-[11px] text-slate-500 mb-1">
                    {c.village}, {c.region} · {c.submitted}
                  </div>
                  <div className="text-[10px] font-medium text-slate-400 mb-1.5">
                    {c.diagnostics.join(" · ")}
                  </div>
                  <p className="text-[11px] text-slate-700 bg-amber-50/60 p-2 rounded border border-amber-100/80 leading-snug">
                    <strong className="text-amber-900 block font-semibold mb-0.5">{t("whyPrioritized")}:</strong> {c.reason}
                  </p>
                </button>
              ))}
            </div>
          </aside>

          {/* Middle Column: Zone A — Evidence (Read Only) */}
          <article id="zone-a-evidence" className="lg:col-span-4 space-y-4">
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                <span className="inline-block px-2.5 py-1 bg-slate-100 text-slate-800 font-bold text-[10px] tracking-wider rounded uppercase">
                  📋 ZONE A: KLINIK DALILLAR (OʻQISH REJIMI)
                </span>
                <span className="text-xs text-slate-500 font-semibold font-mono">QM-RECORD-RAW</span>
              </div>

              <h2 className="text-xl font-bold font-serif text-slate-900 mb-1">{active.code} — {active.name}</h2>
              <p className="text-xs text-slate-500 mb-4 font-medium">
                {active.age} {t("years")} · {active.sex} · {active.village}, {active.region}
              </p>

              {/* Live Care Pulse Telemetry Waveform */}
              <CarePulse
                spo2={active.triage === "emergency" || active.triage === "urgent" ? 91 : 97}
                heartRate={active.triage === "emergency" ? 112 : 76}
                systolicBp={active.triage === "emergency" ? 168 : 122}
                diastolicBp={active.triage === "emergency" ? 96 : 80}
                isCriticalOverride={active.triage === "emergency"}
                label={language === "uz" ? "Markaziy Telemetriya Analizi" : "Central Telemetry Waveform"}
                className="mb-4"
              />

              <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-1.5">{t("chiefComplaint")}</h3>
              <p className="text-sm font-semibold text-slate-800 bg-slate-50 p-3 rounded-lg border border-slate-200/60 mb-4">
                {active.complaint}
              </p>

              {/* Protocol Follow-up Questions & Red Flags for Specialist */}
              {(() => {
                const protocol = active.protocolAnswers
                  ? getProtocol(active.protocolAnswers.protocolId)
                  : getProtocol(active.complaint);
                if (!protocol) return null;

                const answers = (active.protocolAnswers?.answers || {}) as AnswerMap;
                const evalResult = evaluateAnswers(protocol, answers, language);

                return (
                  <div className="mb-4 p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-200/60 pb-2.5">
                      <div>
                        <span className="text-xs font-bold text-emerald-900 block">
                          📋 {t("adaptiveProtocol")}: {protocol.label[language as "uz" | "en"] || protocol.label.en}
                        </span>
                        <span className="text-[10px] text-emerald-700 font-mono">
                          {t("protocolSource")}: {protocol.source}
                        </span>
                      </div>
                      <span className="text-[11px] font-bold px-2.5 py-0.5 bg-white border border-emerald-300 text-emerald-900 rounded-full">
                        {t("completeness")}: {evalResult.completeness.answered}/{evalResult.completeness.total} ({evalResult.completeness.percentage}%)
                        {evalResult.completeness.skipped > 0 && ` · ${evalResult.completeness.skipped} ${t("skipped").toLowerCase()}`}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {protocol.questions.map((q) => {
                        const entry = answers[q.id];
                        const isSkipped = entry?.status === "skipped";
                        const isAnswered = entry?.status === "answered";
                        const isRedFlag = isAnswered && evalResult.redFlags.some((rf) => rf.questionId === q.id);

                        let formattedAnswer = "";
                        if (isAnswered) {
                          const val = entry.value;
                          if (typeof val === "boolean") {
                            formattedAnswer = val ? (language === "uz" ? "Ha" : language === "ru" ? "Да" : "Yes") : (language === "uz" ? "Yoʻq" : language === "ru" ? "Нет" : "No");
                          } else if (Array.isArray(val)) {
                            const langKey = (language === "ru" ? "en" : language) as "uz" | "en";
                            formattedAnswer = val
                              .map((v) => q.options?.find((o) => o.value === v)?.[langKey] || v)
                              .join(", ");
                          } else if (q.options) {
                            const langKey = (language === "ru" ? "en" : language) as "uz" | "en";
                            formattedAnswer = q.options.find((o) => o.value === String(val))?.[langKey] || String(val);
                          } else {
                            formattedAnswer = q.unit ? `${val} ${q.unit}` : String(val);
                          }
                        }

                        return (
                          <div
                            key={q.id}
                            className={`p-2.5 rounded-lg border text-xs transition ${
                              isRedFlag
                                ? "bg-red-50 border-red-300 text-red-950 font-medium"
                                : isSkipped
                                  ? "bg-slate-100 border-slate-200 text-slate-500"
                                  : "bg-white border-slate-200 text-slate-800"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="font-semibold text-slate-900 leading-tight">{q.text[language as "uz" | "en"] || q.text.en}</span>
                              {isSkipped ? (
                                <span className="px-2 py-0.5 bg-slate-200 text-slate-700 font-bold text-[10px] rounded">
                                  🛑 {t("skipped").toUpperCase()}
                                </span>
                              ) : isAnswered ? (
                                <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${isRedFlag ? "bg-red-200 text-red-900" : "bg-emerald-100 text-emerald-900"}`}>
                                  {formattedAnswer}
                                </span>
                              ) : (
                                <span className="text-slate-400 italic text-[10px]">[Javob yoʻq]</span>
                              )}
                            </div>
                            {isRedFlag && (
                              <small className="block mt-1 text-red-800 font-bold text-[10px]">
                                ⚠️ XAVFLI BELGI / RED FLAG — {q.source}
                              </small>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {evalResult.suggestedActions.length > 0 && (
                      <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-950 font-medium space-y-0.5">
                        <strong className="block font-bold text-amber-900 text-[11px]">
                          💡 PROTOKOL TAVSIYASI:
                        </strong>
                        {evalResult.suggestedActions.map((act, idx) => (
                          <div key={idx}>• {act}</div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}

              <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-1">{t("step4Vitals")}</h3>
              <div className="grid grid-cols-2 gap-2.5 mb-4">
                <div className="border border-slate-200 rounded-lg p-3 bg-white">
                  <span className="text-xs text-slate-500 block mb-1">🫁 SpO₂</span>
                  <b className="text-lg font-bold text-slate-900">{active.code === "QM-2027-0042" ? "89%" : "97%"}</b>
                </div>
                <div className="border border-slate-200 rounded-lg p-3 bg-white">
                  <span className="text-xs text-slate-500 block mb-1">💓 {t("pulseBpm")}</span>
                  <b className="text-lg font-bold text-slate-900">{active.code === "QM-2027-0042" ? "108 bpm" : "78 bpm"}</b>
                </div>
                <div className="border border-slate-200 rounded-lg p-3 bg-white">
                  <span className="text-xs text-slate-500 block mb-1">⏱ {t("systolicBp")}</span>
                  <b className="text-lg font-bold text-slate-900">168/96 mmHg</b>
                </div>
                <div className="border border-slate-200 rounded-lg p-3 bg-white">
                  <span className="text-xs text-slate-500 block mb-1">🌡️ {t("tempC")}</span>
                  <b className="text-lg font-bold text-slate-900">37.4 °C</b>
                </div>
              </div>

              <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-1">{t("nurseNotes")}</h3>
              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-md border border-slate-200/50">
                {language === "uz"
                  ? `${active.clinic} klinikasidan sinxronlangan simptomlar va koʻrsatkichlar.`
                  : `Symptoms and measurements synchronized from ${active.clinic}. Units preserved as entered.`}
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <span className="inline-block px-2.5 py-1 bg-slate-100 text-slate-700 font-bold text-[10px] tracking-wider rounded uppercase mb-3">
                🖼 DIAGNOSTIK DALILLAR
              </span>

              {active.diagnostics.includes("Rentgen") || active.diagnostics.includes("X-ray") ? (
                <div className="dark-upload-box">
                  <h4 className="font-bold text-sm text-white">Diagnostik rasm yuklash (Rentgen, lab surati)</h4>
                  <p className="text-xs text-slate-400">JPEG namoyish tasviri</p>
                  <button
                    type="button"
                    className="mt-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full text-xs font-bold shadow-md transition cursor-pointer"
                    onClick={() => setViewerOpen(true)}
                  >
                    HD Tasvirni koʻrish va analiz qilish
                  </button>
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  {t("noImageAttached")}
                </div>
              )}
            </div>
          </article>

          {/* Right Column: Zone B (MedAI Agent Analysis) & Zone C (Doctor Decision) */}
          <article className="lg:col-span-4 space-y-5">
            {/* ZONE B: MedAI Agent Diagnostic Analysis & Suggestions Panel */}
            <div id="zone-b-ai" className="bg-gradient-to-br from-slate-900 to-purple-950 text-white border border-purple-500/40 rounded-xl p-5 space-y-3.5 shadow-xl">
              <div className="flex items-center justify-between border-b border-purple-800/80 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🤖</span>
                  <span className="font-bold text-xs text-purple-200 uppercase tracking-wider">
                    [ MedAI Agent Analysis & Suggestions ]
                  </span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-emerald-400/40 bg-emerald-500/20 text-emerald-300 font-mono">
                  LOCAL MEDAI ONLINE
                </span>
              </div>

              {/* Attribution & Confidence Badge */}
              <div className="p-2.5 bg-purple-900/40 border border-purple-700/50 rounded-lg text-[11px] text-purple-200 font-mono flex items-center justify-between">
                <span>Model: <b>MedAI Agent v2.4</b></span>
                <span>Confidence: <b className="text-emerald-400">94/100</b></span>
              </div>

              <div className="bg-slate-950/80 p-3 rounded-lg border border-purple-900/60 text-xs text-slate-200 leading-relaxed font-sans">
                <b className="block font-bold text-emerald-400 text-xs mb-1">
                  🤖 MEDAI KLINIK TAHLILI VA TASHXIS TAKLIFI:
                </b>
                {active.aiSummary}
                <div className="mt-2 pt-2 border-t border-slate-800 text-[11px] text-slate-300">
                  • <b>Tavsiya terapiya</b>: Aspirin 300mg, Enalapril 10mg. EKG troponin monitoring kutilmoqda.
                </div>
              </div>

              <div>
                <h4 className="text-[11px] font-bold text-red-400 uppercase tracking-wider mb-1">🚨 CRITICAL RED FLAGS</h4>
                <p className="text-xs text-red-200 bg-red-950/60 p-2.5 rounded border border-red-800/60 font-medium">
                  {active.reason}
                </p>
              </div>

              {/* Doctor One-Click AI Action Controls */}
              <div className="pt-2 space-y-2">
                <span className="text-[10px] font-bold uppercase text-purple-300 tracking-wider block">⚡ VRACH TEZKOR QARORLARI</span>
                <div className="grid grid-cols-1 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFinalSummary(`[MedAI Agent Tasdiqlandi]: ${active.aiSummary} Tavsiya etilgan davolash rejasi tasdiqlandi.`);
                      void recordDecision("CONFIRM_REFERRAL");
                    }}
                    className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 shadow-md"
                  >
                    <span>✓</span>
                    <span>Approve AI Treatment Plan</span>
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => void recordDecision("REQUEST_MORE_INFO")}
                      className="py-1.5 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[11px] rounded-lg transition cursor-pointer border border-slate-700"
                    >
                      ❓ Request Repeat Labs
                    </button>
                    <button
                      type="button"
                      onClick={() => void recordDecision("CREATE_REFERRAL")}
                      className="py-1.5 px-2.5 bg-purple-800 hover:bg-purple-700 text-purple-200 font-bold text-[11px] rounded-lg transition cursor-pointer border border-purple-700"
                    >
                      🏥 Urgent Teleconsult
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* ZONE C: Doctor Decision Container (Starts Completely Empty) */}
            <div id="zone-c-doctor" className="bg-white border-3 border-[#0B5FFF] shadow-md rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-blue-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#0B5FFF] animate-pulse"></span>
                  <span className="font-extrabold text-xs text-blue-950 uppercase tracking-wider">ZONE C: VRACH QARORI</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-600 text-white shadow-xs">
                  ✓ VRACH
                </span>
              </div>

              <div>
                <label htmlFor="finalSummary" className="block text-xs font-bold text-slate-900 mb-1.5">
                  {t("clinicianFinalLabel")} *
                </label>
                <textarea
                  id="finalSummary"
                  rows={4}
                  className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg p-3 focus:bg-white focus:border-[#0B5FFF] focus:ring-2 focus:ring-blue-500/20 outline-none"
                  value={finalSummary}
                  onChange={(e) => setFinalSummary(e.target.value)}
                  placeholder="Yakuniy klinik xulosangizni va davolash rejasini kiriting..."
                />
              </div>

              {savedAt && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-950 font-bold">
                  ✓ {t("durablyRecorded")} {decision} ({new Date(savedAt).toLocaleTimeString()})
                </div>
              )}

              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  className="w-full py-2.5 px-4 bg-[#0B5FFF] hover:bg-blue-700 text-white font-extrabold text-xs rounded-lg shadow-sm transition cursor-pointer"
                  onClick={() => void recordDecision("APPROVED_WITH_EDITS")}
                >
                  ✓ {t("confirmReview")}
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    className="py-2 px-3 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-lg transition cursor-pointer"
                    onClick={() => void recordDecision("REQUEST_MORE_INFO")}
                  >
                    ❓ {t("requestInfo")}
                  </button>
                  <button
                    type="button"
                    className="py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition cursor-pointer"
                    onClick={() => void recordDecision("CREATE_REFERRAL")}
                  >
                    🏥 {t("createReferral")}
                  </button>
                </div>
              </div>
            </div>
          </article>
        </section>
      </section>

      {/* HD Diagnostic Image Viewer Modal */}
      <ImageViewerModal
        isOpen={viewerOpen}
        onClose={() => setViewerOpen(false)}
        imageSrc="/og.png"
        imageTitle={`${active.code} - Diagnostik Rentgen Tasviri`}
      />
    </main>
        <MovableChatWidget />
        <MedAIAssistantDrawer currentRole="doctor" patientContext={{ patientName: active.clinic, vitals: { bp: "168/96", hr: 108, spo2: 89 } }} />
      </div>
    </RoleGuard>
  );
}

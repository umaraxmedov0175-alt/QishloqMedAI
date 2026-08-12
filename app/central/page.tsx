"use client";
/* eslint-disable @next/next/no-html-link-for-pages, react/no-unescaped-entities, jsx-a11y/aria-role */
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

export default function CentralReviewPage() {
  const { language, t } = useLanguage();
  const [collapsed, setCollapsed] = useState(false);
  const [cases] = useState(DEMO_CASES);
  const [selected, setSelected] = useState("QM-2027-0042");
  const [query, setQuery] = useState("");
  const [priority, setPriority] = useState("all");
  const [finalSummary, setFinalSummary] = useState("");
  const [decision, setDecision] = useState("");
  const [savedAt, setSavedAt] = useState("");
  const [viewerOpen, setViewerOpen] = useState(false);

  const active = cases.find((c) => c.code === selected) ?? cases[0];

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
      <div className="min-h-screen bg-[#0F172A] text-white">
        <SidebarNav role="doctor" activePath="/central" onToggleCollapse={setCollapsed} />
        <main className={`transition-[margin] duration-300 ${collapsed ? "ml-16" : "ml-64"} min-h-screen overflow-y-auto`}>

      <section className="max-w-[1520px] mx-auto px-6 py-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <span className="text-[11px] font-bold text-sky-400 tracking-wider uppercase">{t("roleSpecialist")}</span>
            <h1 className="text-3xl font-sans font-bold text-white mt-1 mb-1">{t("specialistQueue")}</h1>
            <p className="text-slate-400 text-xs">{t("evidenceFirstNotice")}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintReport}
              className="px-4 py-2 bg-slate-800/60 border border-white/[0.08] hover:border-white/20 text-slate-200 text-xs font-semibold rounded-lg shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
            >
              ⏱ {t("printReport")}
            </button>
            <button
              onClick={handleExportFhir}
              className="px-4 py-2 bg-slate-800/60 border border-white/[0.08] hover:border-white/20 text-slate-200 text-xs font-semibold rounded-lg shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
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
            <div className="bg-slate-800/60 border border-white/[0.08] rounded-xl p-4 shadow-2xs backdrop-blur" key={l}>
              <b className="text-2xl font-bold text-white block leading-tight">{n}</b>
              <span className="text-[11px] text-slate-400 font-medium">{l}</span>
            </div>
          ))}
        </div>

        <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column: Patient Queue List */}
          <aside className="lg:col-span-3 bg-slate-800/60 border border-white/[0.08] rounded-xl overflow-hidden shadow-2xs flex flex-col backdrop-blur">
            <div className="p-3 border-b border-white/[0.06] grid grid-cols-3 gap-2">
              <input
                aria-label={t("searchPlaceholder")}
                placeholder={t("searchPlaceholder")}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="col-span-2 text-xs border border-white/[0.08] rounded-lg px-2.5 py-1.5 outline-none focus:border-sky-500 bg-slate-900/60 text-white placeholder:text-slate-500"
              />
              <select
                aria-label={t("triageLevel")}
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="text-xs border border-white/[0.08] rounded-lg px-1.5 py-1.5 outline-none bg-slate-900/60 text-white font-medium"
              >
                <option value="all">{t("allPriorities")}</option>
                <option value="emergency">{t("emergency")}</option>
                <option value="urgent">{t("urgent")}</option>
                <option value="priority">{t("priority")}</option>
                <option value="routine">{t("routine")}</option>
              </select>
            </div>

            <div className="divide-y divide-white/[0.06] overflow-y-auto max-h-[750px]">
              {cases.map((c) => (
                <button
                  className={`w-full text-left p-3.5 transition cursor-pointer ${selected === c.code ? "bg-sky-600/15 border-l-4 border-sky-500" : "hover:bg-white/[0.04]"}`}
                  key={c.code}
                  onClick={() => setSelected(c.code)}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`triage-badge ${c.triage}`}>
                      {c.triage === "emergency" ? "▲ FAVQULODDA (KRITIK)" : c.triage === "urgent" ? "■ SHOSHILINCH" : c.triage === "priority" ? "◆ USTUVOR" : "● REJALI (ODATIY)"}
                    </span>
                  </div>
                  <div className="font-bold text-xs text-white mb-0.5">
                    {c.code} · {c.age} {t("years")} · {c.sex}
                  </div>
                  <div className="text-[11px] text-slate-500 mb-1">
                    {c.village}, {c.region} · {c.submitted}
                  </div>
                  <div className="text-[10px] font-medium text-slate-400 mb-1.5">
                    {c.diagnostics.join(" · ")}
                  </div>
                  <p className="text-[11px] text-slate-300 bg-amber-500/10 p-2 rounded border border-amber-500/20 leading-snug">
                    <strong className="text-amber-400 block font-semibold mb-0.5">{t("whyPrioritized")}:</strong> {c.reason}
                  </p>
                </button>
              ))}
            </div>
          </aside>

          {/* Middle Column: Zone A — Evidence (Read Only) */}
          <article id="zone-a-evidence" className="lg:col-span-4 space-y-4">
            <div className="bg-slate-800/60 border border-white/[0.08] rounded-xl p-5 shadow-xs backdrop-blur">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3 mb-3">
                <span className="inline-block px-2.5 py-1 bg-slate-700/60 text-slate-200 font-bold text-[10px] tracking-wider rounded uppercase">
                  📋 ZONE A: KLINIK DALILLAR (OʻQISH REJIMI)
                </span>
                <span className="text-xs text-slate-500 font-semibold font-mono">QM-RECORD-RAW</span>
              </div>

              <h2 className="text-xl font-bold font-sans text-white mb-1">{active.code} — {active.name}</h2>
              <p className="text-xs text-slate-400 mb-4 font-medium">
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

              <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-1.5">{t("chiefComplaint")}</h3>
              <p className="text-sm font-semibold text-slate-200 bg-slate-700/40 p-3 rounded-lg border border-white/[0.06] mb-4">
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
                  <div className="mb-4 p-4 bg-emerald-500/8 border border-emerald-500/15 rounded-xl space-y-3 backdrop-blur">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-500/15 pb-2.5">
                      <div>
                        <span className="text-xs font-bold text-emerald-400 block">
                          📋 {t("adaptiveProtocol")}: {protocol.label[language]}
                        </span>
                        <span className="text-[10px] text-emerald-500/80 font-mono">
                          {t("protocolSource")}: {protocol.source}
                        </span>
                      </div>
                      <span className="text-[11px] font-bold px-2.5 py-0.5 bg-slate-800 border border-emerald-500/25 text-emerald-300 rounded-full">
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
                            formattedAnswer = val ? (language === "uz" ? "Ha" : "Yes") : (language === "uz" ? "Yoʻq" : "No");
                          } else if (Array.isArray(val)) {
                            formattedAnswer = val
                              .map((v) => q.options?.find((o) => o.value === v)?.[language] || v)
                              .join(", ");
                          } else if (q.options) {
                            formattedAnswer = q.options.find((o) => o.value === String(val))?.[language] || String(val);
                          } else {
                            formattedAnswer = q.unit ? `${val} ${q.unit}` : String(val);
                          }
                        }

                        return (
                          <div
                            key={q.id}
                            className={`p-2.5 rounded-lg border text-xs transition ${
                              isRedFlag
                                ? "bg-red-500/10 border-red-500/25 text-red-200 font-medium"
                                : isSkipped
                                  ? "bg-slate-800/40 border-white/[0.06] text-slate-500"
                                  : "bg-slate-800/40 border-white/[0.08] text-slate-200"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="font-semibold text-white leading-tight">{q.text[language]}</span>
                              {isSkipped ? (
                                <span className="px-2 py-0.5 bg-slate-700 text-slate-400 font-bold text-[10px] rounded">
                                  🛑 {t("skipped").toUpperCase()}
                                </span>
                              ) : isAnswered ? (
                                <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${isRedFlag ? "bg-red-500/15 text-red-300" : "bg-emerald-500/15 text-emerald-300"}`}>
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
                      <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-200 font-medium space-y-0.5">
                        <strong className="block font-bold text-amber-400 text-[11px]">
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

              <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-1">{t("step4Vitals")}</h3>
              <div className="grid grid-cols-2 gap-2.5 mb-4">
                <div className="border border-white/[0.08] rounded-lg p-3 bg-slate-800/50">
                  <span className="text-xs text-slate-400 block mb-1">🫁 SpO₂</span>
                  <b className="text-lg font-bold text-white">{active.code === "QM-2027-0042" ? "89%" : "97%"}</b>
                </div>
                <div className="border border-white/[0.08] rounded-lg p-3 bg-slate-800/50">
                  <span className="text-xs text-slate-400 block mb-1">💓 {t("pulseBpm")}</span>
                  <b className="text-lg font-bold text-white">{active.code === "QM-2027-0042" ? "108 bpm" : "78 bpm"}</b>
                </div>
                <div className="border border-white/[0.08] rounded-lg p-3 bg-slate-800/50">
                  <span className="text-xs text-slate-400 block mb-1">⏱ {t("systolicBp")}</span>
                  <b className="text-lg font-bold text-white">168/96 mmHg</b>
                </div>
                <div className="border border-white/[0.08] rounded-lg p-3 bg-slate-800/50">
                  <span className="text-xs text-slate-400 block mb-1">🌡️ {t("tempC")}</span>
                  <b className="text-lg font-bold text-white">37.4 °C</b>
                </div>
              </div>

              <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-1">{t("nurseNotes")}</h3>
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-700/40 p-2.5 rounded-md border border-white/[0.06]">
                {language === "uz"
                  ? `${active.clinic} klinikasidan sinxronlangan simptomlar va koʻrsatkichlar.`
                  : `Symptoms and measurements synchronized from ${active.clinic}. Units preserved as entered.`}
              </p>
            </div>

            <div className="bg-slate-800/60 border border-white/[0.08] rounded-xl p-5 shadow-xs backdrop-blur">
              <span className="inline-block px-2.5 py-1 bg-slate-700/60 text-slate-300 font-bold text-[10px] tracking-wider rounded uppercase mb-3">
                🖼 DIAGNOSTIK DALILLAR
              </span>

              {active.diagnostics.includes("Rentgen") || active.diagnostics.includes("X-ray") ? (
                <div className="dark-upload-box">
                  <h4 className="font-bold text-sm text-white">Diagnostik rasm yuklash (Rentgen, lab surati)</h4>
                  <p className="text-xs text-slate-400">JPEG namoyish tasviri</p>
                  <button
                    type="button"
                    className="mt-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-full text-xs font-bold shadow-md shadow-sky-600/20 transition cursor-pointer"
                    onClick={() => setViewerOpen(true)}
                  >
                    HD Tasvirni koʻrish va analiz qilish
                  </button>
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-slate-500 bg-slate-800/30 rounded-xl border border-dashed border-white/[0.08]">
                  {t("noImageAttached")}
                </div>
              )}
            </div>
          </article>

          {/* Right Column: Zone B (AI Decision Support) & Zone C (Doctor Decision) */}
          <article className="lg:col-span-4 space-y-5">
            {/* ZONE B: AI Decision Support */}
            <div id="zone-b-ai" className="bg-violet-950/30 border-l-4 border-l-violet-500/60 border border-violet-500/15 rounded-r-xl p-5 space-y-3 backdrop-blur">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span className="font-bold text-xs text-violet-300 uppercase tracking-wider">ZONE B: AI DECISION SUPPORT</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold border border-violet-500/30 bg-violet-500/15 text-violet-300 border-dashed">
                  ◷ AI TAKLIFI
                </span>
              </div>

              {/* Attribution Strip */}
              <div className="p-2.5 bg-violet-500/10 border border-violet-500/20 rounded-lg text-[11px] text-violet-200 font-medium">
                Yaratildi: <b>Tomir Triage v2.4</b> · Ishonch: <b>92/100</b> · <i>AI yordamchi vosita (Tashxis emas)</i>
              </div>

              <div className="bg-slate-800/50 p-3 rounded-lg border border-violet-500/15 text-xs text-slate-200 leading-relaxed font-medium">
                <b className="block font-bold text-violet-300 text-xs mb-1">
                  AI BOSHLANGʻICH TAHLILI:
                </b>
                {active.aiSummary}
              </div>

              <div>
                <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider mb-1">{t("redFlags")}</h4>
                <p className="text-xs text-slate-200 bg-red-500/10 p-2.5 rounded border border-red-500/20 font-medium">
                  {active.reason}
                </p>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{t("limitations")}</h4>
                <p className="text-xs text-slate-400 bg-slate-800/40 p-2.5 rounded border border-violet-500/10 text-[11px] leading-relaxed">
                  {language === "uz"
                    ? "Chala anamnez va tasdiqlanmagan qurilma integratsiyasi. Faqat dastlabki qaror yordami."
                    : "Incomplete history and no validated device integration. Preliminary support only."}
                </p>
              </div>
            </div>

            {/* ZONE C: Doctor Decision Container (Starts Completely Empty) */}
            <div id="zone-c-doctor" className="bg-slate-800/40 border-2 border-sky-500/50 shadow-md shadow-sky-500/10 rounded-xl p-5 space-y-4 backdrop-blur">
              <div className="flex items-center justify-between border-b border-sky-500/20 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-sky-500 animate-pulse"></span>
                  <span className="font-extrabold text-xs text-sky-300 uppercase tracking-wider">ZONE C: VRACH QARORI</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-sky-600 text-white shadow-xs">
                  ✓ VRACH
                </span>
              </div>

              <div>
                <label htmlFor="finalSummary" className="block text-xs font-bold text-white mb-1.5">
                  {t("clinicianFinalLabel")} *
                </label>
                <textarea
                  id="finalSummary"
                  rows={4}
                  className="w-full text-xs font-medium bg-slate-900/60 border border-white/[0.12] rounded-lg p-3 text-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none placeholder:text-slate-500"
                  value={finalSummary}
                  onChange={(e) => setFinalSummary(e.target.value)}
                  placeholder="Yakuniy klinik xulosangizni va davolash rejasini kiriting..."
                />
              </div>

              {savedAt && (
                <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs text-emerald-300 font-bold">
                  ✓ {t("durablyRecorded")} {decision} ({new Date(savedAt).toLocaleTimeString()})
                </div>
              )}

              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs rounded-lg shadow-sm shadow-sky-600/20 transition cursor-pointer"
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
      </div>
    </RoleGuard>
  );
}

"use client";
/* eslint-disable @next/next/no-html-link-for-pages, react/no-unescaped-entities */
import { useEffect, useState } from "react";
import { DEMO_CASES } from "@/lib/demo-data";
import { DemoRoleLink } from "@/app/ui/DemoRoleLink";
import {
  getClinicalAction,
  saveClinicalAction,
} from "@/lib/clinical-store";
import { useLanguage } from "@/lib/i18n";
import { printClinicalReport } from "@/lib/report-generator";
import { downloadFhirJson } from "@/lib/fhir-mapping";
import { ImageViewerModal } from "@/app/ui/ImageViewerModal";

export default function CentralReviewPage() {
  const { language, setLanguage, t } = useLanguage();
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
      clinician: "Demo specialist",
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
    <main className="min-h-screen bg-[#f6f3ea] text-[#2b2621]">
      <header className="h-16 px-6 bg-[#063c32] text-white flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-4">
          <a href="/" className="flex items-center gap-2 font-bold text-lg text-white no-underline">
            <span className="w-7 h-7 rounded-md bg-emerald-500/20 flex items-center justify-center text-sm">+</span>
            <span>QishloqMed AI</span>
          </a>
          <span className="text-xs text-emerald-200/80 font-medium pl-3 border-l border-emerald-800/60 hidden md:inline-block">
            Toshkent Markaziy Tibbiy Ko'rik Markazi
          </span>
        </div>

        <div className="flex items-center gap-6">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as "uz" | "en")}
            className="px-2.5 py-1 bg-emerald-950/60 text-emerald-100 text-xs rounded border border-emerald-700/50 font-medium"
          >
            <option value="uz">{"O'zbekcha"}</option>
            <option value="en">English</option>
          </select>

          <nav className="flex items-center gap-1 text-xs font-medium">
            <DemoRoleLink workspace="mobile_nurse" className="px-3 py-1.5 text-emerald-200 hover:text-white rounded-md transition">
              {t("dashboard")}
            </DemoRoleLink>
            <a className="px-3 py-1.5 text-white bg-white/10 rounded-md font-semibold border-b-2 border-emerald-400" href="/central">
              {t("specialistQueue")}
            </a>
            <DemoRoleLink workspace="dispatcher" className="px-3 py-1.5 text-emerald-200 hover:text-white rounded-md transition">
              {t("roleDispatcher")}
            </DemoRoleLink>
          </nav>
        </div>
      </header>

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

          {/* Middle Column: Detailed Nurse & Diagnostic Evidence */}
          <article className="lg:col-span-5 space-y-4">
            <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-2xs">
              <span className="inline-block px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold text-[10px] tracking-wider rounded uppercase mb-3">
                📋 HAMSHIRA KIRITGAN MA'LUMOTLAR
              </span>
              <h2 className="text-xl font-bold font-serif text-slate-900 mb-1">{active.code}</h2>
              <p className="text-xs text-slate-500 mb-4">
                {active.age} {t("years")} · {active.sex} · {active.village}, {active.region}
              </p>

              <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-1.5">{t("chiefComplaint")}</h3>
              <p className="text-sm font-semibold text-slate-800 bg-slate-50 p-3 rounded-lg border border-slate-200/60 mb-4">
                {active.complaint}
              </p>

              <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">{t("step4Vitals")}</h3>
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
                  ? `${active.clinic} klinikasidan sinxronlangan simptomlar va ko'rsatkichlar.`
                  : `Symptoms and measurements synchronized from ${active.clinic}. Units preserved as entered.`}
              </p>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-2xs">
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
                    HD Tasvirni ko'rish va analiz qilish
                  </button>
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  {t("noImageAttached")}
                </div>
              )}
            </div>
          </article>

          {/* Right Column: AI Tahlili & Decision Panel */}
          <article className="lg:col-span-4 bg-white border border-slate-200/80 rounded-xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="inline-block px-2.5 py-1 bg-amber-100 text-amber-900 font-bold text-[10px] tracking-wider rounded uppercase">
                🪄 AI TAHLILI
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${active.triage === "emergency" ? "bg-red-100 text-red-900 border border-red-200" : "bg-amber-100 text-amber-900 border border-amber-200"}`}>
                {active.triage === "emergency" ? "92/100 · Favqulodda Xavf" : "75/100 · Yuqori Xavf"}
              </span>
            </div>

            <div className="ai-warning-box">
              <b className="block font-bold text-amber-950 text-xs mb-1 uppercase tracking-wide">
                AI BOSHLANG'ICH TAHLILI — SHIFOKOR TASDIQ'I TALAB ETILADI
              </b>
              {active.aiSummary}
            </div>

            <div>
              <h4 className="text-xs font-bold text-red-700 uppercase tracking-wider mb-1">{t("redFlags")}</h4>
              <p className="text-xs text-slate-800 bg-red-50 p-2.5 rounded border border-red-100 font-medium">
                {active.reason}
              </p>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{t("limitations")}</h4>
              <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-200/60 leading-relaxed">
                {language === "uz"
                  ? "Chala anamnez va tasdiqlanmagan qurilma integratsiyasi. Faqat dastlabki qaror yordami."
                  : "Incomplete history and no validated device integration. Preliminary support only."}
              </p>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <label htmlFor="finalSummary" className="block text-xs font-bold text-slate-900 mb-1.5">
                {t("clinicianFinalLabel")} *
              </label>
              <textarea
                id="finalSummary"
                rows={4}
                value={finalSummary}
                onChange={(e) => setFinalSummary(e.target.value)}
                placeholder={t("clinicianNotesPlaceholder")}
                className="w-full text-xs p-3 border border-slate-200 rounded-lg outline-none focus:border-emerald-600 resize-y"
              />

              <div className="grid grid-cols-2 gap-2 mt-3">
                <button
                  disabled={!finalSummary}
                  onClick={() => void recordDecision("approved with edits")}
                  className="p-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold rounded-lg border border-amber-200/80 transition cursor-pointer disabled:opacity-50"
                >
                  {t("approvedWithEdits")}
                </button>
                <button
                  disabled={!finalSummary}
                  onClick={() => void recordDecision("AI rejected")}
                  className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-bold rounded-lg border border-slate-200 transition cursor-pointer disabled:opacity-50"
                >
                  {t("rejectAi")}
                </button>
                <button
                  onClick={() => void recordDecision("additional information requested")}
                  className="p-2.5 bg-sky-50 hover:bg-sky-100 text-sky-900 text-xs font-bold rounded-lg border border-sky-200 transition cursor-pointer"
                >
                  {t("requestInfo")}
                </button>
                <button
                  disabled={!finalSummary}
                  onClick={() => void recordDecision("referral created")}
                  className="p-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-xs font-bold rounded-lg border border-emerald-200 transition cursor-pointer disabled:opacity-50"
                >
                  {t("createReferral")}
                </button>
              </div>

              {decision && (
                <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-lg">
                  {t("durablyRecorded")} {decision}. {t("originalPreserved")}
                  {savedAt && (
                    <small className="block mt-1 text-slate-500 font-mono text-[10px]">
                      {t("savedOn")} {new Date(savedAt).toLocaleString(language === "uz" ? "uz-UZ" : "en-GB")}
                    </small>
                  )}
                </div>
              )}
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
  );
}

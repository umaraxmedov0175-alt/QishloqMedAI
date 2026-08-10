/* eslint-disable @next/next/no-html-link-for-pages */
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
    <main className="portal">
      <header className="portal-header">
        <a href="/" className="field-brand">
          + QishloqMed AI
        </a>
        <b>{t("specialistHeader")}</b>
        <div className="flex items-center space-x-3 ml-auto mr-4">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as "uz" | "en")}
            className="px-2 py-1 bg-slate-800 text-slate-200 text-xs rounded border border-slate-700 font-medium"
          >
            <option value="uz">{"O'zbekcha"}</option>
            <option value="en">English</option>
          </select>
        </div>
        <nav>
          <DemoRoleLink workspace="mobile_nurse">{t("dashboard")}</DemoRoleLink>
          <a className="active" href="/central">
            {t("specialistQueue")}
          </a>
          <DemoRoleLink workspace="dispatcher">{t("roleDispatcher")}</DemoRoleLink>
        </nav>
      </header>

      <section className="portal-body">
        <div className="portal-title">
          <div>
            <span className="eyebrow">{t("roleSpecialist")}</span>
            <h1>{t("specialistQueue")}</h1>
            <p>{t("evidenceFirstNotice")}</p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrintReport}
              className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded shadow-sm transition"
            >
              📄 {t("printReport")}
            </button>
            <button
              onClick={handleExportFhir}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded shadow-sm transition"
            >
              📦 {t("exportFhir")}
            </button>
          </div>
        </div>

        <div className="summary-row">
          {[
            ["5", t("awaitingReview")],
            ["1", t("emergency")],
            ["2", t("urgent")],
            ["3", t("reviewedToday")],
            ["18 min", t("avgTurnaround")],
          ].map(([n, l]) => (
            <div className="summary-card" key={l}>
              <b>{n}</b>
              <span>{l}</span>
            </div>
          ))}
        </div>

        <section className="review-layout">
          <aside className="review-queue">
            <div className="queue-filters">
              <input
                aria-label={t("searchPlaceholder")}
                placeholder={t("searchPlaceholder")}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <select
                aria-label={t("triageLevel")}
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="all">{t("allPriorities")}</option>
                <option value="emergency">{t("emergency")}</option>
                <option value="urgent">{t("urgent")}</option>
                <option value="priority">{t("priority")}</option>
                <option value="routine">{t("routine")}</option>
              </select>
            </div>
            {cases.map((c) => (
              <button
                className={`review-item ${selected === c.code ? "selected" : ""}`}
                key={c.code}
                onClick={() => setSelected(c.code)}
              >
                <div>
                  <b>
                    {c.code} · {c.age} {t("years")} · {c.sex}
                  </b>
                  <span>
                    {c.village}, {c.region} · {c.submitted}
                  </span>
                  <small>{c.diagnostics.join(" · ")}</small>
                </div>
                <span className={`triage-label ${c.triage}`}>
                  ▲ {c.triage === "emergency" ? t("emergency") : c.triage === "urgent" ? t("urgent") : c.triage === "priority" ? t("priority") : t("routine")}
                </span>
                <p>
                  <strong>{t("whyPrioritized")}</strong> {c.reason}
                </p>
              </button>
            ))}
          </aside>

          <article className="clinical-review">
            <div className="evidence-pane">
              <div className="review-section">
                <span className="source-label nurse">{t("nurseEntered")}</span>
                <h2>{active.code}</h2>
                <p>
                  {active.age} {t("years")} · {active.sex} · {active.village},{" "}
                  {active.region}
                </p>
                <h3>{t("chiefComplaint")}</h3>
                <p>{active.complaint}</p>
                <h3>{t("step4Vitals")}</h3>
                <div className="evidence-grid">
                  <span>
                    SpO₂ <b>{active.code === "QM-2027-0042" ? "89%" : "97%"}</b>
                  </span>
                  <span>
                    {t("pulseBpm")}{" "}
                    <b>
                      {active.code === "QM-2027-0042" ? "108 bpm" : "78 bpm"}
                    </b>
                  </span>
                  <span>
                    {t("systolicBp")} <b>168/96 mmHg</b>
                  </span>
                  <span>
                    {t("tempC")} <b>37.4 °C</b>
                  </span>
                </div>
                <h3>{t("nurseNotes")}</h3>
                <p>
                  {language === "uz"
                    ? `${active.clinic} klinikasidan sinxronlangan simptomlar va ko'rsatkichlar.`
                    : `Symptoms and measurements synchronized from ${active.clinic}. Units preserved as entered.`}
                </p>
              </div>
            </div>

            <div className="image-pane">
              <span className="source-label nurse">{t("diagnosticEvidence")}</span>
              {active.diagnostics.includes("Rentgen") || active.diagnostics.includes("X-ray") ? (
                <button
                  type="button"
                  className="image-placeholder cursor-pointer hover:border-sky-500 transition group relative text-left w-full"
                  onClick={() => setViewerOpen(true)}
                >
                  <b className="group-hover:text-sky-400">{t("uploadImage")}</b>
                  <span>JPEG namoyish tasviri</span>
                  <span className="mt-2 inline-block px-3 py-1 bg-sky-600 text-white rounded text-xs font-semibold shadow">
                    🔍 {t("inspectImage")}
                  </span>
                </button>
              ) : (
                <div className="empty">
                  {t("noImageAttached")}
                </div>
              )}
            </div>

            <div className="assessment-pane">
              <span className="source-label ai">AI TAHLILI</span>
              <h3>
                {t("aiSummaryNotice")}
              </h3>
              <p>{active.aiSummary}</p>
              <h4>{t("redFlags")}</h4>
              <ul>
                <li>{active.reason}</li>
              </ul>
              <h4>{t("limitations")}</h4>
              <p>
                {language === "uz"
                  ? "Chala anamnez va tasdiqlanmagan qurilma integratsiyasi. Faqat dastlabki qaror yordami."
                  : "Incomplete history and no validated device integration. Preliminary support only."}
              </p>
              <label htmlFor="finalSummary">
                <b>{t("clinicianFinalLabel")}</b>
              </label>
              <textarea
                id="finalSummary"
                value={finalSummary}
                onChange={(e) => setFinalSummary(e.target.value)}
                placeholder={t("clinicianNotesPlaceholder")}
              />
              <div className="review-actions">
                <button
                  disabled={!finalSummary}
                  onClick={() => void recordDecision("approved with edits")}
                >
                  {t("approvedWithEdits")}
                </button>
                <button
                  disabled={!finalSummary}
                  onClick={() => void recordDecision("AI rejected")}
                >
                  {t("rejectAi")}
                </button>
                <button
                  onClick={() =>
                    void recordDecision("additional information requested")
                  }
                >
                  {t("requestInfo")}
                </button>
                <button
                  disabled={!finalSummary}
                  onClick={() => void recordDecision("referral created")}
                >
                  {t("createReferral")}
                </button>
              </div>
              {decision && (
                <div className="field-notice">
                  {t("durablyRecorded")} {decision}. {t("originalPreserved")}
                  {savedAt && (
                    <small>
                      {t("savedOn")} {new Date(savedAt).toLocaleString(language === "uz" ? "uz-UZ" : "en-GB")}
                    </small>
                  )}
                </div>
              )}
              {(active.clinicianFinal || (decision && finalSummary)) && (
                <div className="comparison">
                  <div>
                    <span>AI DASTLABKI TAHLILI</span>
                    <p>{active.aiSummary}</p>
                  </div>
                  <div>
                    <span>VRACH YAKUNIY XULOSASI</span>
                    <p>{finalSummary || active.clinicianFinal}</p>
                  </div>
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

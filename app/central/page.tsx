"use client";
/* eslint-disable @next/next/no-html-link-for-pages */
import { useEffect, useMemo, useState } from "react";
import { DEMO_CASES, sortByTriage } from "@/lib/demo-data";
import { DemoRoleLink } from "@/app/ui/DemoRoleLink";
import { getClinicalAction, saveClinicalAction } from "@/lib/clinical-store";
export default function CentralPage() {
  const [query, setQuery] = useState("");
  const [priority, setPriority] = useState("all");
  const [selected, setSelected] = useState("QM-2027-0042");
  const [finalSummary, setFinalSummary] = useState("");
  const [decision, setDecision] = useState("");
  const [savedAt, setSavedAt] = useState("");
  const cases = useMemo(
    () =>
      sortByTriage(DEMO_CASES).filter(
        (c) =>
          (priority === "all" || c.triage === priority) &&
          (c.code + c.name + c.region)
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [query, priority],
  );
  const active = DEMO_CASES.find((c) => c.code === selected) ?? DEMO_CASES[0];
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
  return (
    <main className="portal">
      <header className="portal-header">
        <a href="/" className="field-brand">
          + QishloqMed AI
        </a>
        <b>Tashkent Central Review Center</b>
        <nav>
          <DemoRoleLink workspace="mobile_nurse">Mobile</DemoRoleLink>
          <a className="active" href="/central">
            Review Queue
          </a>
          <DemoRoleLink workspace="dispatcher">Operations</DemoRoleLink>
        </nav>
      </header>
      <section className="portal-body">
        <div className="portal-title">
          <div>
            <span className="eyebrow">Central specialist workspace</span>
            <h1>Clinical review queue</h1>
            <p>
              Original evidence first. AI remains secondary decision support.
            </p>
          </div>
          <span className="synthetic">SYNTHETIC DEMO DATA</span>
        </div>
        <div className="summary-row">
          {[
            ["5", "Awaiting review"],
            ["1", "Emergency"],
            ["2", "Urgent"],
            ["3", "Reviewed today"],
            ["18 min", "Average turnaround · demo"],
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
                aria-label="Search queue"
                placeholder="Search code, name, region"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <select
                aria-label="Filter priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="all">All priorities</option>
                <option value="emergency">Emergency</option>
                <option value="urgent">Urgent</option>
                <option value="priority">Priority</option>
                <option value="routine">Routine</option>
              </select>
            </div>
            {cases.map((c) => (
              <button
                className={`review-item ${selected === c.code ? "selected" : ""}`}
                key={c.code}
                onClick={() => {
                  setSelected(c.code);
                }}
              >
                <div>
                  <b>
                    {c.code} · {c.age} · {c.sex}
                  </b>
                  <span>
                    {c.village}, {c.region} · {c.submitted}
                  </span>
                  <small>{c.diagnostics.join(" · ")}</small>
                </div>
                <span className={`triage-label ${c.triage}`}>▲ {c.triage}</span>
                <p>
                  <strong>Why prioritized:</strong> {c.reason}
                </p>
              </button>
            ))}
          </aside>
          <article className="clinical-review">
            <div className="evidence-pane">
              <div className="review-section">
                <span className="source-label nurse">NURSE ENTERED</span>
                <h2>{active.code}</h2>
                <p>
                  {active.age} years · {active.sex} · {active.village},{" "}
                  {active.region}
                </p>
                <h3>Chief complaint</h3>
                <p>{active.complaint}</p>
                <h3>Vital signs</h3>
                <div className="evidence-grid">
                  <span>
                    SpO₂ <b>{active.code === "QM-2027-0042" ? "89%" : "97%"}</b>
                  </span>
                  <span>
                    Heart rate{" "}
                    <b>
                      {active.code === "QM-2027-0042" ? "108 bpm" : "78 bpm"}
                    </b>
                  </span>
                  <span>
                    BP <b>168/96 mmHg</b>
                  </span>
                  <span>
                    Temperature <b>37.4 °C</b>
                  </span>
                </div>
                <h3>Clinical notes</h3>
                <p>
                  Symptoms and measurements synchronized from {active.clinic}.
                  Units preserved as entered.
                </p>
              </div>
            </div>
            <div className="image-pane">
              <span className="source-label nurse">DIAGNOSTIC EVIDENCE</span>
              {active.diagnostics.includes("X-ray") ? (
                <div className="image-placeholder">
                  <b>Synthetic X-ray preview</b>
                  <span>JPEG demonstration asset</span>
                  <small>
                    Basic file checks passed; not radiology quality validation.
                  </small>
                </div>
              ) : (
                <div className="empty">
                  No diagnostic image uploaded. AI must not claim image
                  inspection.
                </div>
              )}
            </div>
            <div className="assessment-pane">
              <span className="source-label ai">AI GENERATED</span>
              <h3>
                AI preliminary assessment — physician verification required
              </h3>
              <p>{active.aiSummary}</p>
              <h4>Red flags</h4>
              <ul>
                <li>{active.reason}</li>
              </ul>
              <h4>Limitations</h4>
              <p>
                Incomplete history and no validated device integration.
                Preliminary support only.
              </p>
              <label htmlFor="finalSummary">
                <b>Clinician final summary *</b>
              </label>
              <textarea
                id="finalSummary"
                value={finalSummary}
                onChange={(e) => setFinalSummary(e.target.value)}
                placeholder="Edit or replace the AI summary before completion"
              />
              <div className="review-actions">
                <button
                  disabled={!finalSummary}
                  onClick={() => void recordDecision("approved with edits")}
                >
                  Approve with edits
                </button>
                <button
                  disabled={!finalSummary}
                  onClick={() => void recordDecision("AI rejected")}
                >
                  Reject AI assessment
                </button>
                <button
                  onClick={() =>
                    void recordDecision("additional information requested")
                  }
                >
                  Request information
                </button>
                <button
                  disabled={!finalSummary}
                  onClick={() => void recordDecision("referral created")}
                >
                  Create referral
                </button>
              </div>
              {decision && (
                <div className="field-notice">
                  Clinician action recorded durably: {decision}. Original AI
                  text is preserved separately.
                  {savedAt && (
                    <small>
                      Saved {new Date(savedAt).toLocaleString("en-GB")}
                    </small>
                  )}
                </div>
              )}
              {(active.clinicianFinal || (decision && finalSummary)) && (
                <div className="comparison">
                  <div>
                    <span>AI PRELIMINARY</span>
                    <p>{active.aiSummary}</p>
                  </div>
                  <div>
                    <span>CLINICIAN FINAL</span>
                    <p>{finalSummary || active.clinicianFinal}</p>
                  </div>
                </div>
              )}
            </div>
          </article>
        </section>
      </section>
    </main>
  );
}

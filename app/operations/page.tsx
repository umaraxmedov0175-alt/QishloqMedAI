"use client";
/* eslint-disable @next/next/no-html-link-for-pages, react/no-unescaped-entities */
import { useEffect, useState } from "react";
import { DEMO_CASES } from "@/lib/demo-data";
import { DemoRoleLink } from "@/app/ui/DemoRoleLink";
import { listClinicalActions, type ClinicalAction } from "@/lib/clinical-store";
import { useLanguage } from "@/lib/i18n";

export default function OperationsPage() {
  const { language, setLanguage } = useLanguage();
  const [recordedReferrals, setRecordedReferrals] = useState<ClinicalAction[]>(
    [],
  );
  useEffect(() => {
    void listClinicalActions().then((actions) =>
      setRecordedReferrals(
        actions.filter((action) => action.decision === "referral created"),
      ),
    );
  }, []);
  return (
    <main className="portal">
      <header className="portal-header">
        <a href="/" className="field-brand">
          + QishloqMed AI
        </a>
        <b>Operations</b>
        <div className="flex items-center space-x-3 ml-auto mr-4">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as "uz" | "en")}
            className="px-2 py-1 bg-slate-800 text-slate-200 text-xs rounded border border-slate-700 font-medium"
          >
            <option value="uz">O'zbekcha</option>
            <option value="en">English</option>
          </select>
        </div>
        <nav>
          <DemoRoleLink workspace="mobile_nurse">Mobile</DemoRoleLink>
          <DemoRoleLink workspace="specialist">Clinical</DemoRoleLink>
          <a className="active" href="/operations">
            Operations
          </a>
        </nav>
      </header>
      <section className="portal-body">
        <div className="portal-title">
          <div>
            <span className="eyebrow">Dispatcher workspace</span>
            <h1>Referral & fleet operations</h1>
            <p>
              Logistical fields only. Detailed clinical evidence is
              intentionally hidden.
            </p>
          </div>
          <span className="synthetic">SYNTHETIC AGGREGATES</span>
        </div>
        <div className="summary-row">
          {[
            [String(4 + recordedReferrals.length), "Open referrals"],
            ["1", "Mobile clinic operating"],
            ["27", "Synchronized cases"],
            ["1", "Pending sync"],
            ["3", "Regions served"],
          ].map(([n, l]) => (
            <div className="summary-card" key={l}>
              <b>{n}</b>
              <span>{l}</span>
            </div>
          ))}
        </div>
        <div className="operations-grid">
          <section className="work-card">
            <div className="work-head">
              <div>
                <h2>Referral status board</h2>
                <p>No unnecessary clinical detail</p>
              </div>
            </div>
            <div className="ops-table">
              <div className="ops-row header">
                <span>Patient token</span>
                <span>Destination</span>
                <span>Specialty</span>
                <span>Urgency</span>
                <span>Status</span>
              </div>
              {DEMO_CASES.filter((c) => c.triage !== "routine")
                .slice(0, 5)
                .map((c, i) => (
                  <div className="ops-row" key={c.code}>
                    <b>{c.code}</b>
                    <span>
                      {i % 2 ? "Samarqand Regional" : "Tashkent Central"}
                    </span>
                    <span>
                      {
                        [
                          "Cardiology",
                          "Pulmonology",
                          "Neurology",
                          "Internal Medicine",
                        ][i % 4]
                      }
                    </span>
                    <span className={`triage-label ${c.triage}`}>
                      {c.triage}
                    </span>
                    <span>{i === 3 ? "scheduled" : "pending"}</span>
                  </div>
                ))}
              {recordedReferrals.map((referral) => (
                <div className="ops-row" key={`recorded-${referral.caseCode}`}>
                  <b>{referral.caseCode}</b>
                  <span>Tashkent Central</span>
                  <span>Specialist assigned</span>
                  <span className="triage-label urgent">urgent</span>
                  <span>clinician created</span>
                </div>
              ))}
            </div>
          </section>
          <aside className="work-card">
            <div className="work-head">
              <div>
                <h2>QishloqMed-01</h2>
                <p>Mobile clinic vehicle</p>
              </div>
              <span className="sync-tag synced">operating</span>
            </div>
            <div className="route-timeline">
              <div>
                <b>08:30</b>
                <span>Urgut · arrived</span>
              </div>
              <div>
                <b>13:15</b>
                <span>G'us · operating</span>
              </div>
              <div>
                <b>17:30</b>
                <span>Jomboy · planned</span>
              </div>
            </div>
            <div className="system-status">
              <h3>System status</h3>
              <span>
                <i /> Database <b>Demo</b>
              </span>
              <span>
                <i /> Private storage <b>Demo</b>
              </span>
              <span>
                <i /> AI provider <b>Demo</b>
              </span>
              <span>
                <i /> Offline queue <b>1 pending</b>
              </span>
            </div>
          </aside>
        </div>
        <section className="work-card analytics">
          <div className="work-head">
            <div>
              <h2>Regional simulation</h2>
              <p>Aggregated synthetic information; not government statistics</p>
            </div>
          </div>
          <div className="trend-bars">
            {[42, 61, 53, 78, 70, 89, 83].map((n, i) => (
              <div key={i}>
                <span style={{ height: `${n}%` }} />
                <small>
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i]}
                </small>
              </div>
            ))}
          </div>
          <div className="signal">
            <b>Potential regional signal</b>
            <p>
              Demo aggregate shows an increase in respiratory observations. This
              is planning assistance, not a confirmed outbreak detector.
            </p>
          </div>
        </section>
      </section>
    </main>
  );
}

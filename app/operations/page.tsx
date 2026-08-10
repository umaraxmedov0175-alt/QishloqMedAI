"use client";
/* eslint-disable @next/next/no-html-link-for-pages, react/no-unescaped-entities */
import { useEffect, useState } from "react";
import { DEMO_CASES } from "@/lib/demo-data";
import { DemoRoleLink } from "@/app/ui/DemoRoleLink";
import { listClinicalActions, type ClinicalAction } from "@/lib/clinical-store";
import { useLanguage } from "@/lib/i18n";

export default function OperationsPage() {
  const { language, setLanguage, t } = useLanguage();
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
        <b>{t("roleDispatcher")}</b>
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
          <DemoRoleLink workspace="specialist">{t("specialistView")}</DemoRoleLink>
          <a className="active" href="/operations">
            {t("roleDispatcher")}
          </a>
        </nav>
      </header>

      <section className="portal-body">
        <div className="portal-title">
          <div>
            <span className="eyebrow">{t("roleDispatcher")}</span>
            <h1>{t("dispatcherTitle")}</h1>
            <p>{t("dispatcherSubtitle")}</p>
          </div>
          <span className="synthetic">{t("syntheticDemoData")}</span>
        </div>

        <div className="summary-row">
          {[
            [String(4 + recordedReferrals.length), t("openReferrals")],
            ["1", t("operatingClinics")],
            ["27", t("syncedCasesCount")],
            ["1", t("pendingSyncCount")],
            ["3", t("regionsServed")],
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
                <h2>{t("referralBoard")}</h2>
                <p>{t("noUnnecessaryDetails")}</p>
              </div>
            </div>
            <div className="ops-table">
              <div className="ops-row header">
                <span>{t("patientToken")}</span>
                <span>{t("destination")}</span>
                <span>{t("specialty")}</span>
                <span>{t("urgency")}</span>
                <span>{t("status")}</span>
              </div>
              {DEMO_CASES.filter((c) => c.triage !== "routine")
                .slice(0, 5)
                .map((c, i) => (
                  <div className="ops-row" key={c.code}>
                    <b>{c.code}</b>
                    <span>
                      {i % 2
                        ? language === "uz"
                          ? "Samarqand Viloyat Shifoxonasi"
                          : "Samarqand Regional"
                        : language === "uz"
                          ? "Toshkent Markaziy Shifoxonasi"
                          : "Tashkent Central"}
                    </span>
                    <span>
                      {
                        [
                          language === "uz" ? "Kardiologiya" : "Cardiology",
                          language === "uz" ? "Pulmonologiya" : "Pulmonology",
                          language === "uz" ? "Nevrologiya" : "Neurology",
                          language === "uz" ? "Ichki kasalliklar" : "Internal Medicine",
                        ][i % 4]
                      }
                    </span>
                    <span className={`triage-label ${c.triage}`}>
                      {c.triage === "emergency"
                        ? t("emergency")
                        : c.triage === "urgent"
                          ? t("urgent")
                          : c.triage === "priority"
                            ? t("priority")
                            : t("routine")}
                    </span>
                    <span>
                      {i === 3
                        ? language === "uz"
                          ? "Rejalashtirilgan"
                          : "scheduled"
                        : t("awaitingReview")}
                    </span>
                  </div>
                ))}
              {recordedReferrals.map((referral) => (
                <div className="ops-row" key={`recorded-${referral.caseCode}`}>
                  <b>{referral.caseCode}</b>
                  <span>{language === "uz" ? "Toshkent Markaziy Shifoxonasi" : "Tashkent Central"}</span>
                  <span>{language === "uz" ? "Vrach biriktirilgan" : "Specialist assigned"}</span>
                  <span className="triage-label urgent">{t("urgent")}</span>
                  <span>{language === "uz" ? "Vrach yaratgan" : "clinician created"}</span>
                </div>
              ))}
            </div>
          </section>

          <aside className="work-card">
            <div className="work-head">
              <div>
                <h2>QishloqMed-01</h2>
                <p>{language === "uz" ? "Mobil klinika transport vositasi" : "Mobile clinic vehicle"}</p>
              </div>
              <span className="sync-tag synced">{language === "uz" ? "Faol rejimda" : "operating"}</span>
            </div>
            <div className="route-timeline">
              <div>
                <b>08:30</b>
                <span>Urgut · {language === "uz" ? "Yetib kelgan" : "arrived"}</span>
              </div>
              <div>
                <b>13:15</b>
                <span>G'us · {language === "uz" ? "Ish faoliyatida" : "operating"}</span>
              </div>
              <div>
                <b>17:30</b>
                <span>Jomboy · {language === "uz" ? "Rejalashtirilgan" : "planned"}</span>
              </div>
            </div>
            <div className="system-status">
              <h3>{t("systemStatus")}</h3>
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
                <i /> Offline queue <b>1 {t("syncPending")}</b>
              </span>
            </div>
          </aside>
        </div>

        <section className="work-card analytics">
          <div className="work-head">
            <div>
              <h2>{language === "uz" ? "Hududiy demo simulyatsiya" : "Regional simulation"}</h2>
              <p>{language === "uz" ? "Sintetik statistik ma'lumotlar; davlat statistikasi emas" : "Aggregated synthetic information; not government statistics"}</p>
            </div>
          </div>
          <div className="trend-bars">
            {[42, 61, 53, 78, 70, 89, 83].map((n, i) => (
              <div key={i}>
                <span style={{ height: `${n}%` }} />
                <small>
                  {language === "uz"
                    ? ["Dush", "Sesh", "Chorsh", "Pay", "Jum", "Shan", "Yak"][i]
                    : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i]}
                </small>
              </div>
            ))}
          </div>
          <div className="signal">
            <b>{language === "uz" ? "Kutilyotgan hududiy klinik signal" : "Potential regional signal"}</b>
            <span>
              {language === "uz"
                ? "SpO₂ pastligi bo'yicha ko'tarilgan tendensiya vrachlar e'tiborini talab etadi."
                : "SpO2 elevation trend detected in Urgut region requiring clinician review."}
            </span>
          </div>
        </section>
      </section>
    </main>
  );
}

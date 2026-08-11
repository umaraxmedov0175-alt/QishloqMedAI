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
    <main className="min-h-screen bg-[#f6f3ea] text-[#2b2621]">
      <header className="h-16 px-6 bg-[#063c32] text-white flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-4">
          <a href="/" className="flex items-center gap-2 font-bold text-lg text-white no-underline">
            <span className="w-7 h-7 rounded-md bg-emerald-500/20 flex items-center justify-center text-sm">+</span>
            <span>QishloqMed AI</span>
          </a>
          <span className="text-xs text-emerald-200/80 font-medium pl-3 border-l border-emerald-800/60 hidden md:inline-block">
            Dispetcher / Koordinator
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
            <DemoRoleLink workspace="specialist" className="px-3 py-1.5 text-emerald-200 hover:text-white rounded-md transition">
              {t("specialistView")}
            </DemoRoleLink>
            <a className="px-3 py-1.5 text-white bg-white/10 rounded-md font-semibold border-b-2 border-emerald-400" href="/operations">
              {t("roleDispatcher")}
            </a>
          </nav>
        </div>
      </header>

      <section className="max-w-[1520px] mx-auto px-6 py-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <span className="text-[11px] font-bold text-emerald-800 tracking-wider uppercase">{t("roleDispatcher")}</span>
            <h1 className="text-3xl font-serif font-bold text-slate-900 mt-1 mb-1">{t("dispatcherTitle")}</h1>
            <p className="text-slate-500 text-xs">{t("dispatcherSubtitle")}</p>
          </div>
          <div>
            <span className="synthetic">{t("syntheticDemoData")}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          {[
            [String(4 + recordedReferrals.length), t("openReferrals")],
            ["1", t("operatingClinics")],
            ["27", t("syncedCasesCount")],
            ["1", t("pendingSyncCount")],
            ["3", t("regionsServed")],
          ].map(([n, l]) => (
            <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs" key={l}>
              <b className="text-2xl font-bold text-slate-900 block leading-tight">{n}</b>
              <span className="text-[11px] text-slate-500 font-medium">{l}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-6">
          {/* Left Table: Hospital Referrals Board */}
          <section className="lg:col-span-8 bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-2xs">
            <div className="p-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900 mb-0.5">{t("referralBoard")}</h2>
              <p className="text-xs text-slate-500">{t("noUnnecessaryDetails")}</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] text-slate-400 font-bold uppercase tracking-wider bg-slate-50/50">
                    <th className="p-3.5 font-bold">{t("patientToken")}</th>
                    <th className="p-3.5 font-bold">{t("destination")}</th>
                    <th className="p-3.5 font-bold">{t("specialty")}</th>
                    <th className="p-3.5 font-bold">{t("urgency")}</th>
                    <th className="p-3.5 font-bold">{t("status")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {DEMO_CASES.filter((c) => c.triage !== "routine")
                    .slice(0, 5)
                    .map((c, i) => (
                      <tr className="hover:bg-slate-50/60 transition" key={c.code}>
                        <td className="p-3.5 font-bold text-slate-900">{c.code}</td>
                        <td className="p-3.5 text-slate-700">
                          {i % 2
                            ? language === "uz"
                              ? "Samarqand Viloyat Shifoxonasi"
                              : "Samarqand Regional Hospital"
                            : language === "uz"
                              ? "Toshkent Markaziy Shifoxonasi"
                              : "Tashkent Central Hospital"}
                        </td>
                        <td className="p-3.5 text-slate-700">
                          {
                            [
                              language === "uz" ? "Kardiologiya" : "Cardiology",
                              language === "uz" ? "Pulmonologiya" : "Pulmonology",
                              language === "uz" ? "Nevrologiya" : "Neurology",
                              language === "uz" ? "Ichki kasalliklar" : "Internal Medicine",
                            ][i % 4]
                          }
                        </td>
                        <td className="p-3.5">
                          <span className={`triage-badge ${c.triage}`}>
                            {c.triage === "emergency" ? "▲ FAVQULODDA (KRITIK)" : c.triage === "urgent" ? "■ SHOSHILINCH" : c.triage === "priority" ? "◆ USTUVOR" : "● REJALI (ODATIY)"}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-600">
                          {i === 3
                            ? language === "uz"
                              ? "Rejalashtirilgan"
                              : "scheduled"
                            : language === "uz"
                              ? "Ko'rib chiqish kutilmoqda"
                              : "Awaiting review"}
                        </td>
                      </tr>
                    ))}
                  {recordedReferrals.map((referral) => (
                    <tr className="hover:bg-slate-50/60 transition" key={`recorded-${referral.caseCode}`}>
                      <td className="p-3.5 font-bold text-slate-900">{referral.caseCode}</td>
                      <td className="p-3.5 text-slate-700">{language === "uz" ? "Toshkent Markaziy Shifoxonasi" : "Tashkent Central Hospital"}</td>
                      <td className="p-3.5 text-slate-700">{language === "uz" ? "Vrach biriktirilgan" : "Specialist assigned"}</td>
                      <td className="p-3.5"><span className="triage-badge urgent">■ SHOSHILINCH</span></td>
                      <td className="p-3.5 text-slate-600">{language === "uz" ? "Vrach yaratgan" : "clinician created"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Right Sidebar: Vehicle Timeline & System Status */}
          <aside className="lg:col-span-4 space-y-4">
            <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-2xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">🚚 QishloqMed-01</h3>
                  <p className="text-xs text-slate-500">{language === "uz" ? "Mobil klinika transport vositasi" : "Mobile clinic vehicle"}</p>
                </div>
                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded-full uppercase">
                  {language === "uz" ? "Faol rejimda" : "operating"}
                </span>
              </div>

              <div className="relative pl-6 space-y-4 border-l-2 border-emerald-600 text-xs">
                <div className="relative">
                  <span className="absolute -left-[31px] top-0 w-3 h-3 rounded-full bg-emerald-600"></span>
                  <b className="text-slate-900 block font-bold">08:30</b>
                  <span className="text-slate-600">📍 Urgut · {language === "uz" ? "Yetib kelgan" : "arrived"}</span>
                </div>
                <div className="relative">
                  <span className="absolute -left-[31px] top-0 w-3 h-3 rounded-full bg-white border-2 border-emerald-600"></span>
                  <b className="text-slate-900 block font-bold">13:15</b>
                  <span className="text-slate-600">📍 G'us · {language === "uz" ? "Ish faoliyatida" : "operating"}</span>
                </div>
                <div className="relative">
                  <span className="absolute -left-[31px] top-0 w-3 h-3 rounded-full bg-white border-2 border-slate-300"></span>
                  <b className="text-slate-900 block font-bold">17:30</b>
                  <span className="text-slate-600">📍 Jomboy · {language === "uz" ? "Rejalashtirilgan" : "planned"}</span>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-2xs text-xs">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-3">{t("systemStatus")}</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between py-1.5 border-t border-slate-100">
                  <span className="flex items-center gap-2 text-slate-600">🟢 Database</span>
                  <b className="text-slate-900 font-bold">Demo</b>
                </div>
                <div className="flex items-center justify-between py-1.5 border-t border-slate-100">
                  <span className="flex items-center gap-2 text-slate-600">🟢 Private storage</span>
                  <b className="text-slate-900 font-bold">Demo</b>
                </div>
                <div className="flex items-center justify-between py-1.5 border-t border-slate-100">
                  <span className="flex items-center gap-2 text-slate-600">🟢 AI provider</span>
                  <b className="text-slate-900 font-bold">Demo</b>
                </div>
                <div className="flex items-center justify-between py-1.5 border-t border-slate-100">
                  <span className="flex items-center gap-2 text-slate-600">🟡 Offline queue</span>
                  <b className="text-slate-900 font-bold">1 ta yuborilmagan navbat holati</b>
                </div>
              </div>
            </div>
          </aside>
        </div>

        {/* Bottom Section: Regional Analytics Bar Chart & Warning Signal */}
        <section className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-2xs">
          <div className="mb-4">
            <h2 className="text-base font-bold font-serif text-slate-900 mb-0.5">{language === "uz" ? "Hududiy demo simulyatsiya" : "Regional simulation"}</h2>
            <p className="text-xs text-slate-500">{language === "uz" ? "Sintetik statistik ma'lumotlar; davlat statistikasi emas" : "Aggregated synthetic information; not government statistics"}</p>
          </div>

          <div className="h-44 flex items-end justify-between gap-4 px-6 py-4 bg-slate-50/50 rounded-xl border border-slate-100 mb-4">
            {[42, 61, 53, 78, 70, 89, 83].map((n, i) => (
              <div className="flex-1 flex flex-col items-center h-full justify-end" key={i}>
                <span className="w-full max-w-[48px] bg-emerald-700 rounded-t-md transition-all duration-300" style={{ height: `${n}%` }} />
                <small className="text-[11px] text-slate-500 font-bold mt-2">
                  {language === "uz"
                    ? ["Dush", "Sesh", "Chorsh", "Pay", "Jum", "Shan", "Yak"][i]
                    : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i]}
                </small>
              </div>
            ))}
          </div>

          <div className="p-4 bg-amber-50/80 border border-amber-200/80 rounded-xl text-xs text-amber-950">
            <b className="block font-bold mb-1 text-amber-900 text-xs uppercase tracking-wide">
              {language === "uz" ? "Kutilayotgan hududiy klinik signal" : "Potential regional signal"}
            </b>
            <span className="text-amber-900/90 leading-relaxed">
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

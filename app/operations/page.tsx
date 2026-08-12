"use client";

/* eslint-disable @next/next/no-html-link-for-pages, react/no-unescaped-entities */
import { useEffect, useState } from "react";
import { DEMO_CASES } from "@/lib/demo-data";
import { SunlightToggle } from "@/app/ui/DemoRoleLink";
import { RoleGuard } from "@/app/ui/RoleGuard";
import { DispatcherMap } from "@/app/ui/DispatcherMap";
import {
  InnerChatIcon,
  MobileLabBadgeIcon,
  NearestHospitalIcon,
} from "@/app/ui/MedicalIcons";
import { listClinicalActions, type ClinicalAction } from "@/lib/clinical-store";
import {
  getDispatchItems,
  subscribeToDispatchUpdates,
  updateDispatchStatus,
  type DispatchItem,
} from "@/lib/realtime-dispatcher";
import { useLanguage } from "@/lib/i18n";

export default function OperationsPage() {
  const { language, setLanguage, t } = useLanguage();
  const [recordedReferrals, setRecordedReferrals] = useState<ClinicalAction[]>([]);
  const [dispatchItems, setDispatchItems] = useState<DispatchItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string>("");

  useEffect(() => {
    queueMicrotask(() => {
      void listClinicalActions().then((actions) =>
        setRecordedReferrals(
          actions.filter((action) => action.decision === "referral created")
        )
      );
      setDispatchItems(getDispatchItems());
    });
    const unsubscribe = subscribeToDispatchUpdates((items) => setDispatchItems(items));
    return () => unsubscribe();
  }, []);

  const handleAssignVehicle = (id: string, vehicle: string = "Tomir-01 Mobile Bus") => {
    const updated = updateDispatchStatus(id, "dispatched", {
      assignedVehicle: vehicle,
      notes: `Mobil klinika (${vehicle}) yuborildi.`,
    });
    if (updated) {
      setNotice(`✅ ${updated.patientName} uchun ${vehicle} biriktirildi!`);
      setTimeout(() => setNotice(""), 4000);
    }
  };

  const handleScheduleTeleconsult = (id: string, doctor: string = "Dr. Tomir") => {
    const updated = updateDispatchStatus(id, "teleconsult_scheduled", {
      assignedDoctor: doctor,
      notes: `Telemaslahat seansi ${doctor} bilan rejalashtirildi.`,
    });
    if (updated) {
      setNotice(`💻 ${updated.patientName} uchun telemaslahat rejalashtirildi (${doctor})!`);
      setTimeout(() => setNotice(""), 4000);
    }
  };

  const emergencyItemsCount = dispatchItems.filter((i) => i.triage === "emergency").length;

  return (
    <RoleGuard requiredRole="dispatcher">
      <main className="min-h-screen bg-[#0F172A] text-white">
      {/* Top Header Bar */}
      <header className="px-4 md:px-6 bg-slate-900/90 backdrop-blur text-white flex flex-wrap md:flex-nowrap items-center justify-between shadow-sm z-20 relative py-2.5 md:h-16 gap-3 border-b border-white/[0.08]">
        <div className="flex items-center gap-3 shrink-0">
          <a href="/" className="flex items-center gap-2 font-bold text-base md:text-lg text-white no-underline shrink-0">
            <span className="w-7 h-7 rounded-md bg-emerald-500/20 flex items-center justify-center text-sm font-black">+</span>
            <span className="tracking-tight">Tomir AI</span>
          </a>
          <span className="text-xs text-slate-400 font-medium pl-3 border-l border-white/10 hidden lg:inline-block">
            Dispetcherlik va Tibbiy logistika boshqaruvi
          </span>
        </div>

        <div className="flex items-center flex-wrap md:flex-nowrap gap-2 md:gap-3 shrink-0">
          <a
            href="/chat"
            className="px-3 py-1.5 bg-sky-500/15 hover:bg-sky-500/25 text-sky-200 text-xs font-semibold rounded-lg border border-sky-400/25 transition flex items-center gap-1.5 shrink-0 shadow-2xs"
          >
            <InnerChatIcon className="w-4 h-4 shrink-0" />
            <span className="whitespace-nowrap">Chat & Telemaslahat</span>
          </a>

          <a
            href="/dispatcher/radar"
            className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-100 text-xs font-semibold rounded-lg border border-red-400/30 transition flex items-center gap-1.5 shrink-0 shadow-2xs"
          >
            <span className="text-sm leading-none">☣️</span>
            <span className="whitespace-nowrap">Outbreak Radar</span>
          </a>

          <a
            href="/hospital/outbreak"
            className="px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-100 text-xs font-semibold rounded-lg border border-blue-400/30 transition flex items-center gap-1.5 shrink-0 shadow-2xs"
          >
            <span className="text-sm leading-none">🏥</span>
            <span className="whitespace-nowrap">Hududiy Shifoxonalar</span>
          </a>

          <a
            href="/dispatcher"
            className="px-3 py-1.5 bg-sky-500/15 hover:bg-sky-500/25 text-sky-200 text-xs font-semibold rounded-lg border border-sky-400/25 transition flex items-center gap-1.5 shrink-0 shadow-2xs"
          >
            <span className="text-sm leading-none">🗺️</span>
            <span className="whitespace-nowrap">{t("fullGisMap")}</span>
          </a>

          <SunlightToggle />

          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as "uz" | "en")}
            className="px-2.5 py-1 bg-slate-800 text-slate-200 text-xs rounded-lg border border-white/10 font-semibold outline-none shrink-0"
          >
            <option value="uz">{"Oʻzbekcha"}</option>
            <option value="en">English</option>
          </select>

          <nav className="flex items-center gap-1 text-xs font-semibold shrink-0">
            <span className="px-3 py-1.5 text-white bg-sky-600/30 rounded-md font-bold border-b-2 border-sky-400 whitespace-nowrap shadow-2xs">
              🏢 {t("roleDispatcher")}
            </span>
          </nav>
        </div>
      </header>

      <section className="max-w-[1520px] mx-auto px-6 py-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold text-sky-400 tracking-wider uppercase">{t("roleDispatcher")}</span>
            <h1 className="text-3xl font-sans font-bold text-white mt-1 mb-1">{t("dispatcherTitle")}</h1>
            <p className="text-slate-400 text-xs">{t("dispatcherSubtitle")}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="synthetic">{t("syntheticDemoData")}</span>
          </div>
        </div>

        {/* Summary metric cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            [String(4 + recordedReferrals.length), t("openReferrals")],
            [String(emergencyItemsCount), "🚨 Favqulodda (Kritik)"],
            [String(dispatchItems.length), "🗺️ GIS Pin Xaritasida"],
            ["1", t("pendingSyncCount")],
            ["3", t("regionsServed")],
          ].map(([n, l], idx) => (
            <div className={`bg-slate-800/60 backdrop-blur border rounded-xl p-4 shadow-2xs ${idx === 1 && emergencyItemsCount > 0 ? "border-red-500/30 bg-red-500/10" : "border-white/[0.08]"}`} key={l}>
              <b className={`text-2xl font-bold block leading-tight ${idx === 1 && emergencyItemsCount > 0 ? "text-red-400" : "text-white"}`}>{n}</b>
              <span className="text-[11px] text-slate-400 font-medium">{l}</span>
            </div>
          ))}
        </div>

        {notice && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-semibold text-xs rounded-xl shadow-xs">
            {notice}
          </div>
        )}

        {/* GIS Geospatial Map Section */}
        <section className="bg-slate-800/60 backdrop-blur border border-white/[0.08] rounded-xl p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white font-sans">🗺️ Dispetcherlik Geografik Xaritasi (GIS Triage)</h2>
              <p className="text-xs text-slate-400">Real-vaqt rejimida bemorlarning geografik joylashuvi va xavf darajalari</p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-500 font-semibold">Triage belgilar:</span>
              <span className="px-2 py-0.5 bg-red-100 text-red-800 font-extrabold text-[10px] rounded-full">🔴 Kritik</span>
              <span className="px-2 py-0.5 bg-amber-100 text-amber-800 font-extrabold text-[10px] rounded-full">🟡 Shoshilinch</span>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-extrabold text-[10px] rounded-full">🟢 Rejali</span>
            </div>
          </div>

          <div className="h-[480px] w-full relative rounded-lg overflow-hidden border border-white/[0.08]">
            <DispatcherMap
              items={dispatchItems}
              selectedId={selectedId}
              onSelect={(item) => setSelectedId(item.id)}
              onAssignVehicle={handleAssignVehicle}
              onScheduleTeleconsult={handleScheduleTeleconsult}
              language={language}
            />
          </div>
        </section>

        {/* Hospital Referrals & Mobile Bus Timeline Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Hospital Referrals Board */}
          <section className="lg:col-span-8 bg-slate-800/60 backdrop-blur border border-white/[0.08] rounded-xl overflow-hidden shadow-2xs">
            <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white mb-0.5 flex items-center gap-2">
                  <NearestHospitalIcon className="w-5 h-5 shrink-0" />
                  <span>{t("referralBoard")}</span>
                </h2>
                <p className="text-xs text-slate-400">{t("noUnnecessaryDetails")}</p>
              </div>
              <span className="text-xs font-bold text-slate-300 bg-slate-700/60 px-3 py-1 rounded-full border border-white/10">
                Jami: {DEMO_CASES.filter((c) => c.triage !== "routine").length + recordedReferrals.length} ta yo'llanma
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/[0.06] text-[11px] text-slate-400 font-bold uppercase tracking-wider bg-slate-900/40">
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
                      <tr className="hover:bg-white/[0.04] transition cursor-pointer" key={c.code} onClick={() => setSelectedId(c.code)}>
                        <td className="p-3.5 font-bold text-white">{c.code}</td>
                        <td className="p-3.5 text-slate-300 font-bold">
                          {i === 0
                            ? "Urgut Tuman Markaziy Kasalxonasi (4.2 km)"
                            : i === 1
                              ? "Payariq Tuman Tibbiyot Birlashmasi (5.8 km)"
                              : i === 2
                                ? "Samarqand Viloyat Shoshilinch Markazi (12.1 km)"
                                : "Kegeyli Tuman Tibbiyot Birlashmasi (8.5 km)"}
                        </td>
                        <td className="p-3.5 text-slate-400">
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
                        <td className="p-3.5 text-slate-400">
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
                      <td className="p-3.5 font-bold text-white">{referral.caseCode}</td>
                      <td className="p-3.5 text-slate-300">{language === "uz" ? "Toshkent Markaziy Shifoxonasi" : "Tashkent Central Hospital"}</td>
                      <td className="p-3.5 text-slate-300">{language === "uz" ? "Vrach biriktirilgan" : "Specialist assigned"}</td>
                      <td className="p-3.5"><span className="triage-badge urgent">■ SHOSHILINCH</span></td>
                      <td className="p-3.5 text-slate-600">{language === "uz" ? "Vrach yaratgan" : "clinician created"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Vehicle Timeline & System Status Sidebar */}
          <aside className="lg:col-span-4 space-y-4">
            <div className="bg-slate-800/60 backdrop-blur border border-white/[0.08] rounded-xl p-5 shadow-2xs">
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.06] mb-4">
                <div>
                  <h3 className="font-bold text-white text-sm flex items-center gap-1.5">
                    <MobileLabBadgeIcon className="w-5 h-5 shrink-0" />
                    <span>Tomir-01</span>
                  </h3>
                  <p className="text-xs text-slate-500">{language === "uz" ? "Mobil diagnostik laboratoriya vositasi" : "Mobile diagnostic lab vehicle"}</p>
                </div>
                <span className="px-2.5 py-1 bg-emerald-500/15 text-emerald-300 font-bold text-[10px] rounded-full uppercase border border-emerald-500/20">
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

            <div className="bg-slate-800/60 backdrop-blur border border-white/[0.08] rounded-xl p-5 shadow-2xs text-xs">
              <h3 className="font-bold text-white text-xs uppercase tracking-wider mb-3">{t("systemStatus")}</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between py-1.5 border-t border-white/[0.06]">
                  <span className="flex items-center gap-2 text-slate-400">🟢 Database</span>
                  <b className="text-white font-bold">Demo</b>
                </div>
                <div className="flex items-center justify-between py-1.5 border-t border-white/[0.06]">
                  <span className="flex items-center gap-2 text-slate-600">🟢 Private storage</span>
                  <b className="text-white font-bold">Demo</b>
                </div>
                <div className="flex items-center justify-between py-1.5 border-t border-white/[0.06]">
                  <span className="flex items-center gap-2 text-slate-600">🟢 AI provider</span>
                  <b className="text-white font-bold">Demo</b>
                </div>
                <div className="flex items-center justify-between py-1.5 border-t border-white/[0.06]">
                  <span className="flex items-center gap-2 text-slate-600">🟢 Live GIS Stream</span>
                  <b className="text-white font-bold">Active</b>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
    </RoleGuard>
  );
}

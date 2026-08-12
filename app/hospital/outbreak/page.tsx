"use client";

/* eslint-disable react/no-unescaped-entities */
import { useState } from "react";
import Link from "next/link";
import { REGIONAL_HOSPITALS } from "@/lib/regional-routing";
import { analyzeOutbreakRadar } from "@/lib/outbreak-radar";

export default function HospitalOutbreakPage() {
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>("hosp-urgut");
  const [radarData] = useState(() => analyzeOutbreakRadar());
  const [referralStatusMsg, setReferralStatusMsg] = useState<string | null>(null);

  const selectedHospital =
    REGIONAL_HOSPITALS.find((h) => h.id === selectedHospitalId) || REGIONAL_HOSPITALS[0];

  // Filter outbreak alerts and preventive dispatches for this hospital zone
  const hospitalAlerts = radarData.alerts.filter(
    (a) => a.nearestHospitalId === selectedHospital.id || selectedHospital.id === "hosp-samarkand-central"
  );

  const hospitalDispatches = radarData.preventiveDispatches.filter(
    (d) => d.nearestHospitalId === selectedHospital.id || selectedHospital.id === "hosp-samarkand-central"
  );

  const handleApproveReferral = (clusterOrPatientId: string) => {
    setReferralStatusMsg(`✅ Tibbiy Yo'llanma Tasdiqlandi: Reanimatsiya va Qabul bo'limi tayyor holatga keltirildi (${clusterOrPatientId}).`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 md:p-6 space-y-6">
      {/* Top Header Workspace Nav */}
      <header className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 font-extrabold text-xl shadow-inner">
            🏥
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              HUDUDIY SHIFOXONALAR EPIDEMIK BOSHQRUV MARKAZI
            </h1>
            <p className="text-xs text-slate-400">
              Shifoxonalar sig'imi, o'rinlar monitoringi va tumanlararo epidemik spayk ogohlantirishlari
            </p>
          </div>
        </div>

        {/* Quick Navigation Toolbar */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
          <Link
            href="/dispatcher/radar"
            className="px-3 py-2 rounded-lg bg-red-950/60 hover:bg-red-900/80 text-red-200 border border-red-700/60 transition flex items-center gap-1.5"
          >
            ☣️ Outbreak Radar
          </Link>
        </div>
      </header>

      {/* Hospital Selector Dropdown Bar */}
      <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-lg flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <label htmlFor="hosp-select" className="text-xs font-bold text-slate-300">
            🏥 Shifoxona Muassasasini Tanlang:
          </label>
          <select
            id="hosp-select"
            value={selectedHospitalId}
            onChange={(e) => setSelectedHospitalId(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-bold text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            {REGIONAL_HOSPITALS.map((hosp) => (
              <option key={hosp.id} value={hosp.id}>
                {hosp.name} ({hosp.district}, {hosp.region})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3 text-xs font-semibold text-slate-300">
          <span>📞 Tezkor Navbatchi Tel: <b className="text-emerald-400 font-mono">{selectedHospital.emergencyPhone}</b></span>
          <span>Bosh Vrach: <b className="text-sky-300">{selectedHospital.specialistsAvailable[0]}</b></span>
        </div>
      </div>

      {referralStatusMsg && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-600/60 text-emerald-200 rounded-xl text-xs font-bold flex items-center justify-between shadow-lg">
          <span>{referralStatusMsg}</span>
          <button
            onClick={() => setReferralStatusMsg(null)}
            className="px-2 py-0.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded text-[10px]"
          >
            Yopish ✕
          </button>
        </div>
      )}

      {/* Selected Hospital Overview KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-900 border border-blue-900/50 rounded-xl shadow-lg space-y-1">
          <span className="text-xs text-slate-400 font-semibold">Jami O'rinlar Sig'imi</span>
          <div className="text-2xl font-extrabold text-blue-400 flex items-center justify-between">
            <span>{selectedHospital.availableBeds} / {selectedHospital.totalBeds} bo'sh</span>
            <span className="text-xs px-2 py-0.5 rounded bg-blue-950 text-blue-200">
              {Math.round((selectedHospital.availableBeds / selectedHospital.totalBeds) * 100)}% Zaxira
            </span>
          </div>
          <p className="text-[11px] text-slate-500">Reanimatsiya (ICU): {selectedHospital.icuBedsAvailable} ta bo'sh o'rin</p>
        </div>

        <div className="p-4 bg-slate-900 border border-red-900/50 rounded-xl shadow-lg space-y-1">
          <span className="text-xs text-slate-400 font-semibold">Hududdagi Anomaliya Ogohlantirishlari</span>
          <div className="text-2xl font-extrabold text-red-400 flex items-center justify-between">
            <span>{hospitalAlerts.length} ta Ogohlantirish</span>
            <span className="text-xs px-2 py-0.5 rounded bg-red-950 text-red-200">Z-Score High</span>
          </div>
          <p className="text-[11px] text-slate-500">Mas'ul tuman: {selectedHospital.district}</p>
        </div>

        <div className="p-4 bg-slate-900 border border-emerald-900/50 rounded-xl shadow-lg space-y-1">
          <span className="text-xs text-slate-400 font-semibold">Biriktirilgan Mobil Lab Ekipajlari</span>
          <div className="text-2xl font-extrabold text-emerald-400 flex items-center justify-between">
            <span>{hospitalDispatches.length} Ekipaj</span>
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-950 text-emerald-200">Safarda</span>
          </div>
          <p className="text-[11px] text-slate-500">Tomir-01 Mobil Diagnostika</p>
        </div>

        <div className="p-4 bg-slate-900 border border-purple-900/50 rounded-xl shadow-lg space-y-1">
          <span className="text-xs text-slate-400 font-semibold">Navbatchi Mutaxassislar</span>
          <div className="text-lg font-bold text-purple-300">
            {selectedHospital.specialistsAvailable.length} nafar shifokor
          </div>
          <p className="text-[11px] text-slate-500">{selectedHospital.specialistsAvailable.join(", ")}</p>
        </div>
      </div>

      {/* Main Grid: Hospital Zone Anomaly Alerts + Preventive Mobil Lab Routing */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Hospital Outbreak Alert Vector Panel */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <span>☣️ Hududiy Epidemik Spayklar va Vektor Analitika</span>
            </h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-800">
              {selectedHospital.district} ZONE
            </span>
          </div>

          {hospitalAlerts.length === 0 ? (
            <div className="p-6 bg-slate-950 rounded-xl text-center text-xs text-slate-400">
              Ushbu shifoxona hududida faol epidemik spayklar mavjud emas.
            </div>
          ) : (
            <div className="space-y-3">
              {hospitalAlerts.map((alert) => (
                <div key={alert.id} className="p-4 bg-slate-950 border border-red-900/60 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <b className="text-red-400 font-bold">{alert.title}</b>
                    <span className="px-2 py-0.5 rounded bg-red-950 text-red-300 font-mono text-[10px]">
                      Z-Score {alert.zScore}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{alert.description}</p>
                  <div className="p-2 bg-slate-900 rounded border border-slate-800 text-[11px] text-amber-300">
                    <b>Tavsiya etilgan amaliyot:</b> {alert.preventiveAction}
                  </div>
                  <div className="flex justify-end pt-1">
                    <button
                      onClick={() => handleApproveReferral(alert.id)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded text-xs transition shadow"
                    >
                      ✅ Qabul va Reanimatsiya Zaxirasini Ochish
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Preventive Mobile Lab Dispatch Tracker */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <span>🚑 Mobil Diagnostika Lab Ekipajlari Marshruti</span>
            </h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
              PREVENTIVE FLEET
            </span>
          </div>

          {hospitalDispatches.length === 0 ? (
            <div className="p-6 bg-slate-950 rounded-xl text-center text-xs text-slate-400">
              Hozirda faol mobil lab ekipajlari mavjud emas.
            </div>
          ) : (
            <div className="space-y-3">
              {hospitalDispatches.map((dispatch) => (
                <div key={dispatch.id} className="p-4 bg-slate-950 border border-emerald-900/60 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <b className="text-emerald-400 font-bold">{dispatch.recommendedUnit}</b>
                    <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-mono text-[10px]">
                      ~{dispatch.estimatedReachMinutes} daqiqa (Masofa: {dispatch.distanceKm} km)
                    </span>
                  </div>
                  <div className="text-xs text-slate-300">
                    📍 Mo'ljal qishloq: <b className="text-white">{dispatch.targetVillage}</b> ({dispatch.district})
                  </div>
                  <p className="text-[11px] text-slate-400 bg-slate-900 p-2 rounded border border-slate-800">
                    <b>Sabab:</b> {dispatch.reasoning}
                  </p>
                  <div className="flex items-center justify-between text-[11px] pt-1">
                    <span className="text-slate-400">Status: <b className="text-emerald-400">Safarbar etilgan</b></span>
                    <button
                      onClick={() => handleApproveReferral(dispatch.id)}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded text-xs transition"
                    >
                      Boshqaruv Koordinatsiyasi
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Regional Network Capacity Table */}
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <span>📊 Samarqand, Jizzax va Qoraqalpog'iston Mintaqaviy Shifoxonalar Tarmog'i Statusi</span>
          </h2>
          <span className="text-[10px] font-mono text-slate-400">7 ta Mintaqaviy Markaz</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/80">
                <th className="p-3 font-semibold">Shifoxona Muassasasi</th>
                <th className="p-3 font-semibold">Viloyat / Tuman</th>
                <th className="p-3 font-semibold">Jami O'rinlar</th>
                <th className="p-3 font-semibold">Bo'sh O'rinlar</th>
                <th className="p-3 font-semibold">ICU O'rinlar</th>
                <th className="p-3 font-semibold">Navbatchi Mutaxassis</th>
                <th className="p-3 font-semibold">Tezkor Bog'lanish</th>
                <th className="p-3 font-semibold text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {REGIONAL_HOSPITALS.map((hosp) => (
                <tr
                  key={hosp.id}
                  className={`hover:bg-slate-800/50 transition ${
                    hosp.id === selectedHospital.id ? "bg-blue-950/30" : ""
                  }`}
                >
                  <td className="p-3 font-bold text-white flex items-center gap-2">
                    <span>🏥</span>
                    <span>{hosp.name}</span>
                  </td>
                  <td className="p-3 text-slate-300">{hosp.region}, {hosp.district}</td>
                  <td className="p-3 text-slate-300 font-mono">{hosp.totalBeds}</td>
                  <td className="p-3 font-bold text-emerald-400 font-mono">{hosp.availableBeds}</td>
                  <td className="p-3 font-bold text-amber-400 font-mono">{hosp.icuBedsAvailable}</td>
                  <td className="p-3 text-slate-300">{hosp.specialistsAvailable[0]}</td>
                  <td className="p-3 text-sky-400 font-mono">{hosp.emergencyPhone}</td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => setSelectedHospitalId(hosp.id)}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold border border-slate-700 transition"
                    >
                      Tanlash
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

"use client";

/* eslint-disable react/no-unescaped-entities, jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */
import { useState } from "react";
import Link from "next/link";
import { RoleGuard } from "@/app/ui/RoleGuard";
import { OutbreakRadarMap } from "@/app/ui/OutbreakRadarMap";
import { analyzeOutbreakRadar } from "@/lib/outbreak-radar";
import {
  encodeZeroConnectivityPayload,
  decodeZeroConnectivityPayload,
  validatePayloadChecksum,
  type DecodedZeroConnectivityPayload,
} from "@/lib/zero-connectivity-payload";
import { TomirLogo } from "@/app/ui/TomirLogo";

export default function DispatcherRadarPage() {
  const [radarData, setRadarData] = useState(() => analyzeOutbreakRadar());
  const [selectedClusterId, setSelectedClusterId] = useState<string | null>(null);

  // Zero-Connectivity SMS Payload Simulator state
  const [smsInput, setSmsInput] = useState<string>(
    "QK1!PAT940!394050.672480!145.92.88.104.372!148.1.0.0!3.CHEST!92F1"
  );
  const [decodedResult, setDecodedResult] = useState<DecodedZeroConnectivityPayload | null>(null);
  const [smsError, setSmsError] = useState<string | null>(null);
  const [dispatchStatusMsg, setDispatchStatusMsg] = useState<string | null>(null);

  const sampleDemoPayloads = [
    {
      label: "🚨 Urgut (O'tkir Miokard Infarkti SMS)",
      payload: encodeZeroConnectivityPayload({
        patientCode: "PAT-URGUT-01",
        lat: 39.405,
        lng: 67.248,
        sbp: 155,
        dbp: 95,
        pulseRate: 112,
        spo2: 89,
        temperature: 37.2,
        glucose: 14.8,
        troponinPos: true,
        triage: "emergency",
        complaintCode: "CHEST",
        timestamp: 1723380000000,
      }),
    },
    {
      label: "⚠️ Payariq (Giperglikemiya SMS)",
      payload: encodeZeroConnectivityPayload({
        patientCode: "PAT-PAYARIQ-02",
        lat: 39.9,
        lng: 66.86,
        sbp: 138,
        dbp: 84,
        pulseRate: 90,
        spo2: 96,
        temperature: 36.8,
        glucose: 16.5,
        troponinPos: false,
        triage: "urgent",
        complaintCode: "DIAB",
        timestamp: 1723380000000,
      }),
    },
  ];

  const handleDecodeSms = () => {
    try {
      setSmsError(null);
      if (!validatePayloadChecksum(smsInput)) {
        setSmsError("❌ Payload CRC-16 checksum tekshiruvidan o'tmadi! SMS paketi shikastlangan bo'lishi mumkin.");
        setDecodedResult(null);
        return;
      }
      const decoded = decodeZeroConnectivityPayload(smsInput);
      setDecodedResult(decoded);

      // Dynamically add to radar state
      const updated = analyzeOutbreakRadar([
        {
          lat: decoded.data.lat,
          lng: decoded.data.lng,
          triage: decoded.data.triage,
        },
      ]);
      setRadarData(updated);
      setDispatchStatusMsg(`✅ SMS Deshifrlandi! Bemor (${decoded.data.patientCode}) Dispatcher va Radar xaritasida sinxronlandi.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Deshifrlash amalga oshmadi";
      setSmsError(`❌ Xatolik: ${msg}`);
      setDecodedResult(null);
    }
  };

  const handleTriggerDispatch = (clusterId: string) => {
    setDispatchStatusMsg(`🚑 Proaktiv Mobil Laboratoriya Safarbar Etildi (Klaster: ${clusterId})! Hududiy shifoxonaga xabar yuborildi.`);
  };

  return (
    <RoleGuard requiredRole="dispatcher">
      <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 md:p-6 space-y-6">
      {/* Top Header Workspace Nav */}
      <header className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <TomirLogo variant="glass" size="md" />
          <div className="border-l border-slate-700/60 pl-3">
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              Outbreak Radar & Zero-Connectivity Triage Engine
            </h1>
            <p className="text-xs text-slate-400">
              Mintaqaviy epidemik spayklarni bashorat qilish, proaktiv dispanserizatsiya va oflayn SMS mesh sinxronizatsiyasi
            </p>
          </div>
        </div>

        {/* Quick Navigation Toolbar */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
          <Link
            href="/dispatcher"
            className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center gap-1.5"
          >
            📡 Live Dispatcher
          </Link>
          <Link
            href="/hospital/outbreak"
            className="px-3 py-2 rounded-lg bg-blue-900/60 hover:bg-blue-800/80 text-blue-200 border border-blue-700/60 transition flex items-center gap-1.5"
          >
            🏥 Hududiy Shifoxonalar Radari
          </Link>
        </div>
      </header>

      {/* Action status notification */}
      {dispatchStatusMsg && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-600/60 text-emerald-200 rounded-xl text-xs font-bold flex items-center justify-between shadow-lg animate-pulse">
          <span>{dispatchStatusMsg}</span>
          <button
            onClick={() => setDispatchStatusMsg(null)}
            className="px-2 py-0.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded text-[10px]"
          >
            Yopish ✕
          </button>
        </div>
      )}

      {/* KPI Metrics Dashboard Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-900/90 border border-red-900/40 rounded-xl shadow-lg space-y-1">
          <div className="text-xs font-semibold text-slate-400">Faol Anomaliya Klasterlari</div>
          <div className="text-2xl font-extrabold text-red-400 flex items-center justify-between">
            <span>{radarData.summary.totalClusters} ta klaster</span>
            <span className="text-xs px-2 py-0.5 rounded bg-red-900/60 text-red-200">
              {radarData.summary.criticalSurges} Kritik
            </span>
          </div>
          <p className="text-[11px] text-slate-500">Eng yuqori xavf: {radarData.summary.topRiskDistrict}</p>
        </div>

        <div className="p-4 bg-slate-900/90 border border-amber-900/40 rounded-xl shadow-lg space-y-1">
          <div className="text-xs font-semibold text-slate-400">Mintaqaviy Z-Skor Anomaliya Spayki</div>
          <div className="text-2xl font-extrabold text-amber-400 flex items-center justify-between">
            <span>Z = +3.42</span>
            <span className="text-xs px-2 py-0.5 rounded bg-amber-900/60 text-amber-200">p &lt; 0.001</span>
          </div>
          <p className="text-[11px] text-slate-500">Normadan 342% statik siljish aniqlandi</p>
        </div>

        <div className="p-4 bg-slate-900/90 border border-emerald-900/40 rounded-xl shadow-lg space-y-1">
          <div className="text-xs font-semibold text-slate-400">Proaktiv Mobil Lab Safarbarliklari</div>
          <div className="text-2xl font-extrabold text-emerald-400 flex items-center justify-between">
            <span>{radarData.summary.activePreventiveDispatches} Ekipaj</span>
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-900/60 text-emerald-200">Faol</span>
          </div>
          <p className="text-[11px] text-slate-500">Boshlang'ich qamrov: {radarData.summary.preventiveCoveragePercent}%</p>
        </div>

        <div className="p-4 bg-slate-900/90 border border-blue-900/40 rounded-xl shadow-lg space-y-1">
          <div className="text-xs font-semibold text-slate-400">Zero-Connectivity Mesh Qabul Qilish</div>
          <div className="text-2xl font-extrabold text-blue-400 flex items-center justify-between">
            <span>100% Oflayn</span>
            <span className="text-xs px-2 py-0.5 rounded bg-blue-900/60 text-blue-200">CRC-16 Active</span>
          </div>
          <p className="text-[11px] text-slate-500">140-simvolli SMS / WebRTC P2P Mesh payload</p>
        </div>
      </div>

      {/* Main Split Interface: Map + Anomaly Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interactive GIS Outbreak Radar Map */}
        <div className="lg:col-span-2 h-[560px] rounded-2xl overflow-hidden shadow-2xl border border-slate-800">
          <OutbreakRadarMap
            clusters={radarData.clusters}
            preventiveDispatches={radarData.preventiveDispatches}
            selectedId={selectedClusterId}
            mode="radar"
            onSelectCluster={(c) => setSelectedClusterId(c.id)}
            onTriggerPreventiveDispatch={handleTriggerDispatch}
          />
        </div>

        {/* Right Sidebar: Outbreak Anomaly Alerts & Action Feed */}
        <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <span>⚡ Real-Vaqt Epidemik Ogohlantirishlar Feed'i</span>
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-800/50">
                LIVE ANOMALIES
              </span>
            </div>

            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {radarData.alerts.map((alert) => (
                <div
                  key={alert.id}
                  onClick={() => setSelectedClusterId(alert.id.replace("alert-", ""))}
                  className={`p-3 rounded-xl border transition cursor-pointer ${
                    alert.riskLevel === "critical"
                      ? "bg-red-950/40 border-red-800/60 hover:bg-red-950/70"
                      : "bg-amber-950/40 border-amber-800/60 hover:bg-amber-950/70"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <b className="text-xs text-white">{alert.title}</b>
                    <span className="text-[10px] font-mono text-slate-400">{alert.timestamp}</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed mb-2">{alert.description}</p>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-800/80 pt-2">
                    <span>🏥 Biriktirilgan Shifoxona: <b>{alert.nearestHospitalName}</b></span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTriggerDispatch(alert.id);
                      }}
                      className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition shadow"
                    >
                      Safarbar etish
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <div className="font-bold text-slate-200">💡 Epidemiologik Algoritm Haqida:</div>
            <p>
              Tizim dalada to'plangan tahlil natijalarining spatial-temporal tarqalishini z-skor statistik modeli bo'yicha tahlil qiladi. Anomaliya chegarasidan oshganda eng yaqin tuman tibbiyot birlashmasiga proaktiv ogohlantirish yuboradi.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Section: Zero-Connectivity SMS & P2P Mesh Decoder Engine */}
      <div className="p-5 bg-slate-900 border border-blue-900/50 rounded-2xl shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">📡</span>
            <h2 className="text-sm font-bold text-white">
              Zero-Connectivity Ultra-Low Bandwidth SMS & P2P Mesh Deshifrlash Moduli
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
              Payload &lt; 65 chars · CRC-16 Validated
            </span>
          </div>

          {/* Preset Demo Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {sampleDemoPayloads.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => setSmsInput(preset.payload)}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold border border-slate-700 transition"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Input & Decode Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-3">
            <input
              type="text"
              value={smsInput}
              onChange={(e) => setSmsInput(e.target.value)}
              placeholder="140-simvolli SMS/Mesh payloadini kiriting (masalan: QK1!PAT940!394050.672480!145...)"
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-emerald-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={handleDecodeSms}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs shadow-lg transition flex items-center justify-center gap-2"
          >
            <span>🔓 Deshifrlash va Sinxronlash</span>
          </button>
        </div>

        {smsError && (
          <div className="p-3 bg-red-950/80 border border-red-700 text-red-200 rounded-xl text-xs font-semibold">
            {smsError}
          </div>
        )}

        {/* Decoded Result View */}
        {decodedResult && (
          <div className="p-4 bg-slate-950 border border-emerald-900/60 rounded-xl space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2 text-xs">
              <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                ✓ Checksum CRC-16 Muvaffaqiyatli Tekshirildi · Uzunlik: {decodedResult.charLength} simvol ({decodedResult.byteLength} bayt)
              </span>
              <span className="font-mono text-slate-400">ID: {decodedResult.data.patientCode}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 text-xs">
              <div className="p-2 bg-slate-900 rounded border border-slate-800">
                <span className="text-[10px] text-slate-400 block">GPS Koordinata</span>
                <b className="text-white font-mono">{decodedResult.data.lat.toFixed(4)}, {decodedResult.data.lng.toFixed(4)}</b>
              </div>

              <div className="p-2 bg-slate-900 rounded border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Arterial Bosim</span>
                <b className="text-white">{decodedResult.data.sbp}/{decodedResult.data.dbp} mmHg</b>
              </div>

              <div className="p-2 bg-slate-900 rounded border border-slate-800">
                <span className="text-[10px] text-slate-400 block">SpO2 / Puls</span>
                <b className={decodedResult.data.spo2 < 90 ? "text-red-400" : "text-white"}>
                  {decodedResult.data.spo2}% · {decodedResult.data.pulseRate} bpm
                </b>
              </div>

              <div className="p-2 bg-slate-900 rounded border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Tana Harorati</span>
                <b className="text-white">{decodedResult.data.temperature}°C</b>
              </div>

              <div className="p-2 bg-slate-900 rounded border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Qon Shakari</span>
                <b className="text-amber-400">{decodedResult.data.glucose ? `${decodedResult.data.glucose} mmol/L` : "—"}</b>
              </div>

              <div className="p-2 bg-slate-900 rounded border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Troponin I Express</span>
                <b className={decodedResult.data.troponinPos ? "text-red-400 font-extrabold" : "text-emerald-400"}>
                  {decodedResult.data.troponinPos ? "IJOBIY ⚠️" : "Salbiy"}
                </b>
              </div>
            </div>

            {decodedResult.labAlerts.length > 0 && (
              <div className="p-2.5 bg-red-950/50 border border-red-900/60 rounded-lg text-xs space-y-1 text-red-200">
                <div className="font-bold">🚨 SMS Diagnostik Qizil Bayroqlar:</div>
                {decodedResult.labAlerts.map((alert, idx) => (
                  <div key={idx}>• {alert}</div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      </div>
    </RoleGuard>
  );
}

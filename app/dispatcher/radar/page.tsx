"use client";

/* eslint-disable react/no-unescaped-entities, jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */
import { useState } from "react";
import Link from "next/link";
import { RoleGuard } from "@/app/ui/RoleGuard";
import { OutbreakRadarMap } from "@/app/ui/OutbreakRadarMap";
import {
  analyzeOutbreakRadar,
  verifyOutbreakCluster,
  type OutbreakCluster,
  type ClusterVerificationStatus,
  type TimeframeFilter,
} from "@/lib/outbreak-radar";
import {
  encodeZeroConnectivityPayload,
  decodeZeroConnectivityPayload,
  validatePayloadChecksum,
  type DecodedZeroConnectivityPayload,
} from "@/lib/zero-connectivity-payload";
import { TomirLogo } from "@/app/ui/TomirLogo";

export default function DispatcherRadarPage() {
  const [timeframe, setTimeframe] = useState<TimeframeFilter>("30d");
  const [radarData, setRadarData] = useState(() => analyzeOutbreakRadar([], timeframe));
  const [selectedClusterId, setSelectedClusterId] = useState<string | null>("cluster-kegeyli-04");
  const [specialistNotesInput, setSpecialistNotesInput] = useState("");

  // Zero-Connectivity SMS Payload Simulator state
  const [smsInput, setSmsInput] = useState<string>(
    "QK1!PAT940!394050.672480!145.92.88.104.372!148.1.0.0!3.CHEST!92F1"
  );
  const [decodedResult, setDecodedResult] = useState<DecodedZeroConnectivityPayload | null>(null);
  const [smsError, setSmsError] = useState<string | null>(null);
  const [dispatchStatusMsg, setDispatchStatusMsg] = useState<string | null>(null);

  const activeCluster: OutbreakCluster | undefined = radarData.clusters.find(
    (c) => c.id === selectedClusterId
  ) || radarData.clusters[0];

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

  const handleTimeframeChange = (tf: TimeframeFilter) => {
    setTimeframe(tf);
    setRadarData(analyzeOutbreakRadar([], tf));
  };

  const handleVerifyAction = (status: ClusterVerificationStatus) => {
    if (!activeCluster) return;
    const res = verifyOutbreakCluster(
      activeCluster.id,
      status,
      "Dr. Alisher Qodirov (Bosh Epidemiolog)",
      specialistNotesInput
    );
    setRadarData(analyzeOutbreakRadar([], timeframe));
    setSpecialistNotesInput("");

    if (status === "confirmed") {
      setDispatchStatusMsg(
        `✅ OUTBREAK TASDIQLANDI & PROTOKOL ISHGA TUSHIRILDI! Task ID: ${res.task?.taskId}. Mobil Diagnostik Ekipaj (${res.task?.assignedUnit}) safarbar etildi va ${res.task?.targetVillage} hamshiralariga topshiriq yuborildi.`
      );
    } else if (status === "false_positive") {
      setDispatchStatusMsg(`🛡️ Klaster '${activeCluster.villageName}' Atrof-muhit shovqini / Soxta anomaliya (False Positive) sifatida belgilandi.`);
    } else if (status === "retest_requested") {
      setDispatchStatusMsg(`🔬 '${activeCluster.villageName}' klasteri uchun qayta qamrovli laboratoriya tahlili so'raldi.`);
    }
  };

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
      const updated = analyzeOutbreakRadar(
        [
          {
            lat: decoded.data.lat,
            lng: decoded.data.lng,
            triage: decoded.data.triage,
          },
        ],
        timeframe
      );
      setRadarData(updated);
      setDispatchStatusMsg(`✅ SMS Deshifrlandi! Bemor (${decoded.data.patientCode}) Dispatcher va Radar xaritasida sinxronlandi.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Deshifrlash amalga oshmadi";
      setSmsError(`❌ Xatolik: ${msg}`);
      setDecodedResult(null);
    }
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
                Epidemiological Outbreak Surveillance & Intervention Engine
              </h1>
              <p className="text-xs text-slate-400">
                Transparent attack rates, human-in-the-loop specialist verification, and automated mobile lab field tasking
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

        {/* Action Status Alert Banner */}
        {dispatchStatusMsg && (
          <div className="p-3.5 bg-emerald-950/90 border border-emerald-500 text-emerald-100 rounded-xl text-xs font-bold flex items-center justify-between shadow-xl animate-pulse">
            <span className="leading-relaxed">{dispatchStatusMsg}</span>
            <button
              onClick={() => setDispatchStatusMsg(null)}
              className="px-2.5 py-1 bg-emerald-800 hover:bg-emerald-700 text-white rounded text-xs ml-3 shrink-0"
            >
              Yopish ✕
            </button>
          </div>
        )}

        {/* KPI Transparent Epidemiological Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-900/90 border border-red-900/40 rounded-xl shadow-lg space-y-1">
            <div className="text-xs font-semibold text-slate-400">Anomaliya Klasterlari & Tyerlar</div>
            <div className="text-2xl font-extrabold text-red-400 flex items-center justify-between">
              <span>{radarData.summary.totalClusters} ta Klaster</span>
              <span className="text-xs px-2 py-0.5 rounded bg-red-900/60 text-red-200">
                {radarData.summary.criticalSurges} Kritik
              </span>
            </div>
            <p className="text-[11px] text-slate-500">Eng yuqori xavf: {radarData.summary.topRiskDistrict}</p>
          </div>

          <div className="p-4 bg-slate-900/90 border border-amber-900/40 rounded-xl shadow-lg space-y-1">
            <div className="text-xs font-semibold text-slate-400">Shifokor Verifikatsiyasi Navbati</div>
            <div className="text-2xl font-extrabold text-amber-400 flex items-center justify-between">
              <span>{radarData.summary.pendingVerifications} Kutilmoqda</span>
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-900/60 text-emerald-200">
                {radarData.summary.confirmedOutbreaks} Tasdiqlangan
              </span>
            </div>
            <p className="text-[11px] text-slate-500">Insoniy (Human-in-the-Loop) ko'rik talab qilinadi</p>
          </div>

          <div className="p-4 bg-slate-900/90 border border-emerald-900/40 rounded-xl shadow-lg space-y-1">
            <div className="text-xs font-semibold text-slate-400">Proaktiv Mobil Lab Field Tasking</div>
            <div className="text-2xl font-extrabold text-emerald-400 flex items-center justify-between">
              <span>{radarData.summary.activePreventiveDispatches} Ekipaj</span>
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-900/60 text-emerald-200">Faol</span>
            </div>
            <p className="text-[11px] text-slate-500">Laboratoriya va hamshiralar qamrovi: {radarData.summary.preventiveCoveragePercent}%</p>
          </div>

          <div className="p-4 bg-slate-900/90 border border-blue-900/40 rounded-xl shadow-lg space-y-1">
            <div className="text-xs font-semibold text-slate-400">Attack Rate Surge Maksimumi</div>
            <div className="text-2xl font-extrabold text-blue-400 flex items-center justify-between">
              <span>22.5x Surge</span>
              <span className="text-xs px-2 py-0.5 rounded bg-blue-900/60 text-blue-200">Kegeyli</span>
            </div>
            <p className="text-[11px] text-slate-500">48 soatda 18 holat vs 0.8/hafta baseline</p>
          </div>
        </div>

        {/* Main Split Interface: Interactive GIS Map + Specialist Verification Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Interactive GIS Outbreak Radar Map with Polygons & Timeframe Slider */}
          <div className="lg:col-span-2 h-[600px] rounded-2xl overflow-hidden shadow-2xl border border-slate-800">
            <OutbreakRadarMap
              clusters={radarData.clusters}
              preventiveDispatches={radarData.preventiveDispatches}
              selectedId={selectedClusterId}
              mode="radar"
              timeframe={timeframe}
              onSelectCluster={(c) => setSelectedClusterId(c.id)}
              onTimeframeChange={handleTimeframeChange}
            />
          </div>

          {/* Right Sidebar: Human-in-the-Loop Specialist Verification Workspace */}
          <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
                <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <span>🩺 Shifokor & Epidemiolog Verifikatsiya Markazi</span>
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800/50">
                  HUMAN-IN-THE-LOOP
                </span>
              </div>

              {/* Cluster Selector Tabs */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {radarData.clusters.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedClusterId(c.id)}
                    className={`px-2.5 py-1 rounded text-xs font-bold border transition ${
                      selectedClusterId === c.id
                        ? "bg-blue-600 text-white border-blue-400 shadow-md"
                        : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
                    }`}
                  >
                    {c.district} ({c.verificationStatus === "confirmed" ? "✅" : c.verificationStatus === "false_positive" ? "🛡️" : "⏳"})
                  </button>
                ))}
              </div>

              {/* Active Cluster Specialist Detail View */}
              {activeCluster && (
                <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <b className="text-sm font-bold text-white">
                      ☣️ {activeCluster.district} · {activeCluster.villageName}
                    </b>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                        activeCluster.verificationStatus === "confirmed"
                          ? "bg-emerald-600 text-white"
                          : activeCluster.verificationStatus === "false_positive"
                            ? "bg-slate-700 text-slate-300"
                            : "bg-amber-600 text-white animate-pulse"
                      }`}
                    >
                      {activeCluster.verificationStatus === "confirmed"
                        ? "TASDIQLANGAN"
                        : activeCluster.verificationStatus === "false_positive"
                          ? "RAD ETILGAN"
                          : "VERIFIKATSIYA KUTILMOQDA"}
                    </span>
                  </div>

                  {/* Transparent Metrics Box */}
                  <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-xs space-y-1.5">
                    <div>
                      <b className="text-amber-400">Epidemik Tyer:</b>{" "}
                      <span className="text-slate-200">{activeCluster.severityTier}</span>
                    </div>
                    <div>
                      <b className="text-sky-300">Attack Rate Metrics:</b>{" "}
                      <span className="text-emerald-300 font-medium">{activeCluster.attackRate.formattedSummary}</span>
                    </div>
                    <div>
                      <b className="text-purple-300">Biomarker Driver:</b>{" "}
                      <span className="text-slate-300">{activeCluster.biomarkerDriver}</span>
                    </div>
                  </div>

                  {/* Anonymized Record Inspector */}
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 block mb-1">
                      🔬 Bemorlarning Anonimlashtirilgan Yozuvlari ({activeCluster.underlyingRecords.length} ta namuna):
                    </span>
                    <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1 text-xs">
                      {activeCluster.underlyingRecords.map((rec) => (
                        <div key={rec.recordId} className="p-2 bg-slate-900 rounded border border-slate-800/80 space-y-0.5">
                          <div className="flex items-center justify-between text-[11px]">
                            <b className="text-slate-200">{rec.patientCode} ({rec.age} yosh, {rec.gender})</b>
                            <span className="text-slate-500 font-mono text-[10px]">{rec.timestampAgo}</span>
                          </div>
                          <div className="text-slate-300 text-[11px]">
                            <b>Vitals:</b> SpO2 {rec.vitals.spo2}% · HR {rec.vitals.hr} bpm · BP {rec.vitals.sbp}/{rec.vitals.dbp} mmHg
                          </div>
                          <div className="text-emerald-400 text-[10px] font-mono">
                            <b>Tahlil:</b> {rec.labOutput}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Specialist Action Buttons */}
                  <div className="pt-2 border-t border-slate-800 space-y-2">
                    <textarea
                      rows={2}
                      value={specialistNotesInput}
                      onChange={(e) => setSpecialistNotesInput(e.target.value)}
                      placeholder="Epidemiologik xulosa / izoh kiritish (ixtiyoriy)..."
                      className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <button
                        onClick={() => handleVerifyAction("confirmed")}
                        className="py-2 px-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs shadow transition flex items-center justify-center gap-1"
                      >
                        ✅ Tasdiqlash
                      </button>
                      <button
                        onClick={() => handleVerifyAction("false_positive")}
                        className="py-2 px-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-bold text-xs border border-slate-700 transition flex items-center justify-center gap-1"
                      >
                        🛡️ Rad Etish
                      </button>
                      <button
                        onClick={() => handleVerifyAction("retest_requested")}
                        className="py-2 px-2 bg-blue-900/80 hover:bg-blue-800 text-blue-200 rounded-lg font-bold text-xs border border-blue-700 transition flex items-center justify-center gap-1"
                      >
                        🔬 Re-Test
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Generated Field Tasking Protocol Preview */}
            {activeCluster?.fieldInterventionTask && (
              <div className="p-3 bg-emerald-950/60 border border-emerald-700/60 rounded-xl space-y-2 text-xs">
                <div className="flex items-center justify-between border-b border-emerald-800 pb-1 font-bold text-emerald-300">
                  <span>📋 Mobil Lab Field Task ({activeCluster.fieldInterventionTask.taskId})</span>
                  <span>{activeCluster.fieldInterventionTask.issuedAt}</span>
                </div>
                <div className="text-emerald-100 text-[11px] space-y-1">
                  <div><b>Ekipaj:</b> {activeCluster.fieldInterventionTask.assignedUnit}</div>
                  <div><b>To'plam (Kit Checklist):</b> {activeCluster.fieldInterventionTask.kitChecklist.map((k) => k.item).join(", ")}</div>
                  <div><b>Ustuvor Xonadonlar:</b> {activeCluster.fieldInterventionTask.prioritizedHouseholds.length} ta oilada skrining</div>
                </div>
              </div>
            )}
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

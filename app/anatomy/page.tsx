"use client";

/* eslint-disable @next/next/no-html-link-for-pages, react/no-unescaped-entities, jsx-a11y/aria-role, react-hooks/set-state-in-effect, jsx-a11y/label-has-associated-control */
import { useEffect, useState } from "react";
import { RoleGuard } from "@/app/ui/RoleGuard";
import { SidebarNav } from "@/app/ui/SidebarNav";
import { MovableChatWidget } from "@/app/ui/MovableChatWidget";
import { MedAIAssistantDrawer } from "@/app/ui/MedAIAssistantDrawer";
import { Anatomy3DCanvas } from "@/app/ui/Anatomy3DCanvas";
import {
  createAnatomyAssessment,
  getAnatomyAssessments,
  subscribeToAnatomyUpdates,
  updateAnatomyStatus,
  type AnatomicalRegion,
  type AnatomyAssessment,
  type AnatomyNodeTag,
  type SeverityLevel,
} from "@/lib/anatomy-store";
import { normalizeRole, type Role } from "@/lib/authorization";
import { useLanguage } from "@/lib/i18n";

export default function Anatomy3DWorkspacePage({ initialRole }: { initialRole?: Role } = {}) {
  const { language } = useLanguage();

  // Lazy state initialization
  const [role, setRole] = useState<Role>(() => {
    if (initialRole) return initialRole;
    if (typeof window !== "undefined") {
      const cookies = document.cookie.split(";").map((c) => c.trim().split("="));
      const rawCookie = cookies.find(([name]) => name === "qm_demo_role")?.[1];
      return normalizeRole(rawCookie || sessionStorage.getItem("qm_demo_role")) || "nurse";
    }
    return "nurse";
  });

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [assessments, setAssessments] = useState<AnatomyAssessment[]>(() => getAnatomyAssessments());
  const [activeAssessmentId, setActiveAssessmentId] = useState<string>("ANAT-2027-001");
  const [notice, setNotice] = useState<string>("");

  // Nurse Tagging Form State
  const [selectedRegion, setSelectedRegion] = useState<AnatomicalRegion>("chest");
  const [taggedNodes, setTaggedNodes] = useState<AnatomyNodeTag[]>([
    {
      region: "chest",
      label: { uz: "Ko'krak Qafasi (Yurak / O'pka)", en: "Chest (Heart / Lungs)" },
      symptoms: ["Ko'krakda qisuvchi og'riq", "Nafas siqilishi (Dispnoe)"],
      severity: "high",
      description: "Og'riq chap yelkaga tarqalyapti.",
    },
  ]);
  const [customSymptom, setCustomSymptom] = useState("");
  const [selectedSeverity, setSelectedSeverity] = useState<SeverityLevel>("high");
  const [nodeDescription, setNodeDescription] = useState("");
  const [patientName, setPatientName] = useState("Jasur Bekmirzayev");

  // Vitals State
  const [bp, setBp] = useState("142/90");
  const [hr, setHr] = useState(98);
  const [spo2, setSpo2] = useState(94);
  const [temp, setTemp] = useState(37.2);
  const [glucose, setGlucose] = useState(6.8);

  // Load 3D Anatomy assessments & subscribe to real-time updates
  useEffect(() => {
    setAssessments(getAnatomyAssessments());
    const unsubscribe = subscribeToAnatomyUpdates((updated) => {
      setAssessments(updated);
    });
    return () => unsubscribe();
  }, []);

  const activeAssessment = assessments.find((a) => a.id === activeAssessmentId) || assessments[0];

  // Nurse: Add node tag
  const handleAddNodeTag = () => {
    const regionLabels: Record<AnatomicalRegion, { uz: string; en: string }> = {
      head: { uz: "Bosh / Miya", en: "Head / Brain" },
      chest: { uz: "Ko'krak / Yurak", en: "Chest / Heart" },
      abdomen: { uz: "Qorin / Oshqozon", en: "Abdomen / GI" },
      spine: { uz: "Umurtqa / Orqa", en: "Spine / Back" },
      left_arm: { uz: "Chap Qo'l", en: "Left Arm" },
      right_arm: { uz: "O'ng Qo'l", en: "Right Arm" },
      legs: { uz: "Oyoqlar / Bo'g'imlar", en: "Legs / Joints" },
    };

    const newTag: AnatomyNodeTag = {
      region: selectedRegion,
      label: regionLabels[selectedRegion],
      symptoms: customSymptom.trim() ? [customSymptom.trim()] : ["Spetsifik simptom ko'rsatilgan"],
      severity: selectedSeverity,
      description: nodeDescription.trim() || "Klinik baholash belgilandi.",
    };

    setTaggedNodes((prev) => [...prev.filter((n) => n.region !== selectedRegion), newTag]);
    setCustomSymptom("");
    setNodeDescription("");
    setNotice(`📍 3D Soha (${regionLabels[selectedRegion].uz}) muvaffaqiyatli biriktirildi!`);
    setTimeout(() => setNotice(""), 3000);
  };

  // Nurse: Submit 3D Assessment to Doctor
  const handleDispatchToDoctor = () => {
    if (taggedNodes.length === 0) {
      setNotice("⚠️ Kamida bitta 3D a'zo sohasini belgilang!");
      setTimeout(() => setNotice(""), 3000);
      return;
    }

    const created = createAnatomyAssessment({
      patientId: `QM-2027-${Math.floor(1000 + Math.random() * 9000)}`,
      patientName: patientName.trim() || "Noma'lum Bemor",
      nurseId: "NURSE-01",
      nurseName: "Mobil Hamshira",
      taggedNodes,
      vitals: { bp, hr, spo2, temp, glucose },
      aiRiskScore: taggedNodes.some((n) => n.severity === "high") ? 82 : 45,
      aiAssessment: taggedNodes.some((n) => n.severity === "high")
        ? "Yuqori darajali o'tkir simptomlar aniqlandi. Shoshilinch vrach ko'rigi talab etiladi."
        : "O'rtacha darajali klinik ko'rsatkichlar.",
    });

    setActiveAssessmentId(created.id);
    setNotice(`✅ 3D Baholash (${created.id}) Hududiy Vrachga yuborildi!`);
    setTimeout(() => setNotice(""), 4000);
  };

  // Doctor: Approve Treatment Plan
  const handleApprovePlan = (id: string) => {
    if (!id) return;
    updateAnatomyStatus(id, "approved", "Davolash rejasi vrach tomonidan tasdiqlandi.");
    setNotice(`✅ 3D Diagnostik Reja (${id}) muvaffaqiyatli TASDIQLANDI!`);
    setTimeout(() => setNotice(""), 4000);
  };

  // Doctor: Request Additional Vitals
  const handleRequestVitals = (id: string) => {
    if (!id) return;
    updateAnatomyStatus(id, "additional_info_requested", "Qayta qon bosimi va lab tahlillarini yuboring.");
    setNotice(`ℹ️ (${id}) bo'yicha qo'shimcha tahlillar so'raldi.`);
    setTimeout(() => setNotice(""), 4000);
  };

  // Doctor: Schedule Urgent Teleconsult
  const handleScheduleTeleconsult = (id: string) => {
    if (!id) return;
    updateAnatomyStatus(id, "teleconsult_scheduled", "Shoshilinch videomaslahat belgilandi.");
    setNotice(`📞 (${id}) bo'yicha Shoshilinch Telekonsultatsiya belgilandi!`);
    setTimeout(() => setNotice(""), 4000);
  };

  const pendingCount = assessments.filter((a) => a.status === "pending").length;

  return (
    <RoleGuard requiredRole={role}>
      <div className="min-h-screen bg-slate-950 text-white font-sans">
      <SidebarNav role={role} activePath="/anatomy" onToggleCollapse={setSidebarCollapsed} />
      <main className={`transition-[margin] duration-300 ${sidebarCollapsed ? "ml-16" : "ml-64"} min-h-screen overflow-y-auto flex flex-col`}>
        {/* Top Header */}
        <header className="h-16 px-6 bg-slate-900 border-b border-slate-800 flex items-center justify-between shadow-xs shrink-0 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <span className="text-xl">🧍</span>
            <div>
              <h1 className="text-base font-bold text-white leading-tight">
                {language === "uz" ? "3D Odam Anatomiyasi va Simptom Tagger" : "3D Human Anatomy & Symptom Tagger"}
              </h1>
              <span className="text-[10px] text-emerald-400 font-mono">
                {role === "doctor" ? "VRACH TEKSHIRUV VA TASDIQLASH PANELI" : "HAMSHIRA REJIMI · REAL-TIME 3D TAGGING"}
              </span>
            </div>
          </div>

          {/* Interactive Role Switcher & Notifications */}
          <div className="flex items-center gap-3">
            {role === "doctor" && pendingCount > 0 && (
              <span className="px-3 py-1 bg-red-500/20 text-red-300 text-xs font-mono font-bold rounded-lg border border-red-500/40 animate-pulse">
                🔔 {pendingCount} Tasdiqlanmagan 3D Signal
              </span>
            )}

            <div className="flex bg-slate-800 border border-slate-700 rounded-xl p-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setRole("nurse")}
                className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                  role === "nurse" ? "bg-emerald-600 text-white font-bold shadow-xs" : "text-slate-300 hover:text-white"
                }`}
              >
                📋 Nurse Mode
              </button>
              <button
                type="button"
                onClick={() => setRole("doctor")}
                className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                  role === "doctor" ? "bg-emerald-600 text-white font-bold shadow-xs" : "text-slate-300 hover:text-white"
                }`}
              >
                🩺 Doctor Review Mode
              </button>
            </div>
          </div>
        </header>

        {/* Global Toast Notice Banner */}
        {notice && (
          <div className="bg-emerald-600 text-white text-xs font-bold px-6 py-2.5 flex items-center justify-between shadow-lg transition animate-in fade-in">
            <span>{notice}</span>
            <button type="button" onClick={() => setNotice("")} className="text-white font-bold cursor-pointer border-0 bg-transparent">✕</button>
          </div>
        )}

        {/* Main Workspace Grid */}
        <div className="flex-1 p-6 max-w-[1720px] w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
          {role === "nurse" ? (
            /* ==================== NURSE 3D TAGGING WORKSPACE ==================== */
            <>
              {/* Left Column: Interactive 3D Anatomy Model */}
              <div className="lg:col-span-5 flex flex-col gap-4">
                <Anatomy3DCanvas
                  selectedRegion={selectedRegion}
                  onSelectRegion={(r) => setSelectedRegion(r)}
                  taggedNodes={taggedNodes}
                  interactive={true}
                />
              </div>

              {/* Right Column: Symptom Tagging Form & Linkage */}
              <div className="lg:col-span-7 flex flex-col gap-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>📍</span> 3D Sohani Belgilash: <span className="text-emerald-400 font-mono uppercase">{selectedRegion}</span>
                  </h2>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded font-mono font-bold">
                    STEP 2 / 3D SIMPTOM TAGGER
                  </span>
                </div>

                {/* Patient Name Input */}
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">Bemor F.I.SH:</label>
                  <input
                    type="text"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                    placeholder="Bemor ismini kiriting..."
                  />
                </div>

                {/* Symptom Input, Quick-Select Clinical Chips & Severity Rating Slider */}
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-400 block mb-1">Anatomik Simptom / Og'riq Tavsifi:</label>
                    <input
                      type="text"
                      value={customSymptom}
                      onChange={(e) => setCustomSymptom(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                      placeholder="masalan: Qisuvchi o'tkir og'riq..."
                    />
                  </div>

                  {/* Quick-Select Clinical Chips */}
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 block mb-1.5">Tezkor Klinik Tayyor Chiplar:</label>
                    <div className="flex flex-wrap gap-1.5 text-xs">
                      {[
                        "Radiating pain (Nurlanuvchi og'riq)",
                        "Tenderness (Paypaslaganda og'riq)",
                        "Acute dyspnea (O'tkir nafas siqilishi)",
                        "Severe pressure (Kuchli bosim)",
                        "Local swelling (Mahalliy shish)",
                        "Burning sensation (Achishish)",
                      ].map((chip) => (
                        <button
                          key={chip}
                          type="button"
                          onClick={() => setCustomSymptom(chip)}
                          className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 text-emerald-400 border border-slate-800 rounded-lg text-[11px] font-medium transition cursor-pointer"
                        >
                          + {chip}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-400 block mb-1">Xavflilik Darajasi (Severity Tyer):</label>
                      <select
                        value={selectedSeverity}
                        onChange={(e) => setSelectedSeverity(e.target.value as SeverityLevel)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none cursor-pointer"
                      >
                        <option value="high">🔴 Yuqori / High (Kritik / OKS)</option>
                        <option value="moderate">🟡 O'rtacha / Moderate</option>
                        <option value="low">🟢 Past / Low (Barqaror)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-400 block mb-1">Og'riq Shkalasi (1 – 10 VAS Score):</label>
                      <div className="flex items-center gap-3 bg-slate-950 border border-slate-800 p-2 rounded-xl">
                        <input
                          type="range"
                          min="1"
                          max="10"
                          defaultValue="8"
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setSelectedSeverity(val >= 7 ? "high" : val >= 4 ? "moderate" : "low");
                          }}
                          className="w-full accent-emerald-500 cursor-pointer"
                        />
                        <span className="text-xs font-mono font-bold text-emerald-400 shrink-0">8 / 10</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">Qo'shimcha Izoh / Radiatsiya Yo'nalishi:</label>
                  <textarea
                    rows={2}
                    value={nodeDescription}
                    onChange={(e) => setNodeDescription(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                    placeholder="Batafsil izoh kiriting..."
                  />
                </div>

                <button
                  type="button"
                  onClick={handleAddNodeTag}
                  className="w-full py-3 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-emerald-300 font-bold text-xs rounded-xl border border-slate-700 transition cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                >
                  <span>➕</span> Ushbu 3D Sohani Belgilash va Ro'yxatga Qo'shish
                </button>

                {/* Currently Tagged Nodes List */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-300 block">Belgilangan 3D Sohalar Ro'yxati ({taggedNodes.length}):</span>
                  {taggedNodes.length === 0 ? (
                    <div className="text-xs text-slate-500 text-center py-4 bg-slate-950 rounded-xl border border-slate-800">
                      Hozircha hech qanday 3D soha belgilanmagan
                    </div>
                  ) : (
                    taggedNodes.map((tag) => (
                      <div
                        key={tag.region}
                        className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs"
                      >
                        <div>
                          <b className="text-white block">{tag.label.uz}</b>
                          <span className="text-[11px] text-slate-400">{tag.symptoms.join(", ")}</span>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                            tag.severity === "high"
                              ? "bg-red-500/20 text-red-300 border border-red-500/30"
                              : tag.severity === "moderate"
                              ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                              : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          }`}
                        >
                          {tag.severity.toUpperCase()}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                {/* Vitals Telemetry Inputs */}
                <div className="border-t border-slate-800 pt-4">
                  <span className="text-xs font-bold text-slate-300 block mb-2">Bog'langan Vitals & Laboratoriya Ko'rsatkichlari:</span>
                  <div className="grid grid-cols-5 gap-2 text-center text-xs">
                    <div className="p-2 bg-slate-950 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-mono">QON BOSIMI</span>
                      <input
                        type="text"
                        value={bp}
                        onChange={(e) => setBp(e.target.value)}
                        className="w-full bg-transparent text-center text-xs font-bold text-emerald-400 outline-none"
                      />
                    </div>
                    <div className="p-2 bg-slate-950 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-mono">PULS (HR)</span>
                      <input
                        type="number"
                        value={hr}
                        onChange={(e) => setHr(Number(e.target.value))}
                        className="w-full bg-transparent text-center text-xs font-bold text-emerald-400 outline-none"
                      />
                    </div>
                    <div className="p-2 bg-slate-950 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-mono">SPO2 (%)</span>
                      <input
                        type="number"
                        value={spo2}
                        onChange={(e) => setSpo2(Number(e.target.value))}
                        className="w-full bg-transparent text-center text-xs font-bold text-emerald-400 outline-none"
                      />
                    </div>
                    <div className="p-2 bg-slate-950 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-mono">HARORAT (°C)</span>
                      <input
                        type="number"
                        step="0.1"
                        value={temp}
                        onChange={(e) => setTemp(Number(e.target.value))}
                        className="w-full bg-transparent text-center text-xs font-bold text-emerald-400 outline-none"
                      />
                    </div>
                    <div className="p-2 bg-slate-950 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-mono">GLUKOZA</span>
                      <input
                        type="number"
                        step="0.1"
                        value={glucose}
                        onChange={(e) => setGlucose(Number(e.target.value))}
                        className="w-full bg-transparent text-center text-xs font-bold text-emerald-400 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Dispatch Primary CTA Button */}
                <button
                  type="button"
                  onClick={handleDispatchToDoctor}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-lg transition cursor-pointer flex items-center justify-center gap-2 border border-emerald-400/40 mt-2"
                >
                  <span>🚀</span> [ Dispatch 3D Assessment to Regional Doctor ]
                </button>
              </div>
            </>
          ) : (
            /* ==================== DOCTOR REVIEW & APPROVAL WORKSPACE ==================== */
            <>
              {/* Left Column: Incoming Patient Selector */}
              <div className="lg:col-span-3 flex flex-col gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
                <h3 className="text-xs font-bold text-slate-300 border-b border-slate-800 pb-2">
                  📋 Kelib Tushgan 3D Arizalar ({assessments.length})
                </h3>
                <div className="space-y-2 overflow-y-auto max-h-[480px]">
                  {assessments.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => setActiveAssessmentId(a.id)}
                      className={`w-full text-left p-3 rounded-xl border transition cursor-pointer text-xs ${
                        activeAssessment?.id === a.id
                          ? "bg-slate-800 border-emerald-500 text-white font-bold"
                          : "bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800/60"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-[10px] text-emerald-400">{a.id}</span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${
                            a.status === "approved"
                              ? "bg-emerald-500/20 text-emerald-300"
                              : "bg-red-500/20 text-red-300 animate-pulse"
                          }`}
                        >
                          {a.status.toUpperCase()}
                        </span>
                      </div>
                      <b className="block text-white text-xs truncate">{a.patientName}</b>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Hamshira: {a.nurseName}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Center Column: Glowing 3D Anatomy Model Viewer */}
              <div className="lg:col-span-5 flex flex-col gap-4">
                <Anatomy3DCanvas
                  selectedRegion={null}
                  taggedNodes={activeAssessment?.taggedNodes || []}
                  interactive={false}
                />
              </div>

              {/* Right Column: Doctor Inspection & One-Click Approval */}
              <div className="lg:col-span-4 flex flex-col gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
                <div className="border-b border-slate-800 pb-3">
                  <span className="text-[10px] font-mono text-emerald-400 font-bold block">
                    PATIENT ID: {activeAssessment?.patientId || "QM-2027-0042"}
                  </span>
                  <h2 className="text-lg font-bold text-white">{activeAssessment?.patientName || "Jasur Bekmirzayev"}</h2>
                </div>

                {/* AI Risk Score Badge */}
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 font-mono block">AI KLINIK XAVF BALLI</span>
                    <b className="text-red-400 text-base">{activeAssessment?.aiRiskScore || 82} / 100</b>
                  </div>
                  <span className="px-2 py-1 bg-red-500/20 text-red-300 rounded font-mono text-[10px] font-bold border border-red-500/30">
                    OKS / KRITIK SHUBHA
                  </span>
                </div>

                {/* Tagged 3D Nodes Summary */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-300 block">Jarohatlangan 3D Sohalar:</span>
                  {activeAssessment?.taggedNodes.map((node) => (
                    <div key={node.region} className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs">
                      <b className="text-emerald-300 block mb-1">{node.label.uz}</b>
                      <p className="text-slate-300 text-[11px] m-0 mb-1">{node.description}</p>
                      <div className="flex items-center gap-1 flex-wrap">
                        {node.symptoms.map((s) => (
                          <span key={s} className="px-2 py-0.5 bg-slate-800 text-slate-200 text-[10px] rounded">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Vitals Summary */}
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono grid grid-cols-3 gap-2 text-center">
                  <div>
                    <span className="text-[9px] text-slate-500 block">BP</span>
                    <b className="text-white text-xs">{activeAssessment?.vitals.bp || "140/90"}</b>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 block">PULS</span>
                    <b className="text-white text-xs">{activeAssessment?.vitals.hr || 98} bpm</b>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 block">SPO2</span>
                    <b className="text-emerald-400 text-xs">{activeAssessment?.vitals.spo2 || 94}%</b>
                  </div>
                </div>

                {/* Doctor Action Buttons */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => activeAssessment && handleApprovePlan(activeAssessment.id)}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer flex items-center justify-center gap-2 border border-emerald-400/30"
                  >
                    <span>✅</span> [ Approve Treatment Plan ]
                  </button>
                  <button
                    type="button"
                    onClick={() => activeAssessment && handleRequestVitals(activeAssessment.id)}
                    className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-2 border border-slate-700"
                  >
                    <span>ℹ️</span> [ Request Additional Vitals/Lab ]
                  </button>
                  <button
                    type="button"
                    onClick={() => activeAssessment && handleScheduleTeleconsult(activeAssessment.id)}
                    className="w-full py-2.5 bg-blue-600/30 hover:bg-blue-600/50 text-blue-200 font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-2 border border-blue-500/40"
                  >
                    <span>📞</span> [ Schedule Urgent Teleconsult ]
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
      <MovableChatWidget />
      <MedAIAssistantDrawer currentRole={role} />
    </div>
    </RoleGuard>
  );
}

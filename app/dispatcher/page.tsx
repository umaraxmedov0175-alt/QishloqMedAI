"use client";

/* eslint-disable @next/next/no-html-link-for-pages, react/no-unescaped-entities, jsx-a11y/aria-role */
import { useEffect, useState } from "react";
import { RoleGuard } from "@/app/ui/RoleGuard";
import { SidebarNav } from "@/app/ui/SidebarNav";
import { MovableChatWidget } from "@/app/ui/MovableChatWidget";
import { DispatcherMap } from "@/app/ui/DispatcherMap";
import {
  getDispatchItems,
  subscribeToDispatchUpdates,
  updateDispatchStatus,
  type DispatchItem,
  type DispatchStatus,
  type TriageSeverity,
} from "@/lib/realtime-dispatcher";
import { useLanguage } from "@/lib/i18n";

export default function DispatcherWorkspacePage() {
  const { language } = useLanguage();
  const [collapsed, setCollapsed] = useState(false);
  const [items, setItems] = useState<DispatchItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Filters
  const [severityFilter, setSeverityFilter] = useState<"all" | TriageSeverity>("all");
  const [districtFilter, setDistrictFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | DispatchStatus>("all");
  const [notice, setNotice] = useState<string>("");

  useEffect(() => {
    queueMicrotask(() => {
      setItems(getDispatchItems());
    });
    const unsubscribe = subscribeToDispatchUpdates((newItems) => {
      setItems(newItems);
    });
    return () => unsubscribe();
  }, []);

  const handleAssignVehicle = (id: string, vehicle: string = "Tomir-01 Mobile Bus") => {
    const updated = updateDispatchStatus(id, "dispatched", {
      assignedVehicle: vehicle,
      notes: `Mobil klinika avtobusi (${vehicle}) dispetcher tomonidan yuborildi.`,
    });
    if (updated) {
      setNotice(`✅ ${updated.patientName} uchun ${vehicle} biriktirildi!`);
      setTimeout(() => setNotice(""), 4000);
    }
  };

  const handleScheduleTeleconsult = (id: string, doctor: string = "Dr. Tomir") => {
    const updated = updateDispatchStatus(id, "teleconsult_scheduled", {
      assignedDoctor: doctor,
      notes: `Telemaslahat seansi ${doctor} bilan belgilandi.`,
    });
    if (updated) {
      setNotice(`💻 ${updated.patientName} uchun telemaslahat rejalashtirildi (${doctor})!`);
      setTimeout(() => setNotice(""), 4000);
    }
  };

  // Filtered Items
  const filteredItems = items.filter((item) => {
    if (severityFilter !== "all" && item.triage !== severityFilter) return false;
    if (districtFilter !== "all" && item.district !== districtFilter) return false;
    if (statusFilter !== "all" && item.status !== statusFilter) return false;
    return true;
  });

  const emergencyCount = items.filter((i) => i.triage === "emergency").length;
  const urgentCount = items.filter((i) => i.triage === "urgent").length;
  const unassignedCount = items.filter((i) => i.status === "unassigned").length;
  const dispatchedCount = items.filter((i) => i.status === "dispatched").length;

  const districts = Array.from(new Set(items.map((i) => i.district)));

  return (
    <RoleGuard requiredRole="dispatcher">
      <div className="min-h-screen bg-slate-900 text-white font-sans">
        <SidebarNav role="dispatcher" activePath="/dispatcher" onToggleCollapse={setCollapsed} />
        <main className={`transition-[margin] duration-300 ${collapsed ? "ml-16" : "ml-64"} min-h-screen overflow-y-auto flex flex-col`}>

      {/* Main Workspace Body */}
      <div className="flex-1 max-w-[1720px] w-full mx-auto px-6 py-6 flex flex-col gap-5">
        {/* Top Control Bar & Metrics */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-800/60 backdrop-blur p-4 rounded-xl border border-white/[0.08] shadow-2xs">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 bg-red-100 text-red-800 text-[10px] font-extrabold rounded-full uppercase tracking-wider">
                LIVE GIS DISPATCH
              </span>
              <span className="text-xs text-slate-500 font-medium">Samarqand va Jizzax Viloyatlari Triage Tizimi</span>
            </div>
            <h1 className="text-2xl font-sans font-bold text-white">Dispetcherlik Geolokatsion Xaritasi va Triaj Boshqaruvi</h1>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-red-500/10 border border-red-500/25 px-3 py-2 rounded-lg text-center">
              <b className="text-lg font-bold text-red-300 block leading-none">{emergencyCount}</b>
              <span className="text-[10px] font-bold text-red-400 uppercase">Favqulodda (Kritik)</span>
            </div>
            <div className="bg-amber-500/10 border border-amber-500/20 px-3 py-2 rounded-lg text-center">
              <b className="text-lg font-bold text-amber-300 block leading-none">{urgentCount}</b>
              <span className="text-[10px] font-bold text-amber-400 uppercase">Shoshilinch</span>
            </div>
            <div className="bg-sky-500/10 border border-sky-500/20 px-3 py-2 rounded-lg text-center">
              <b className="text-lg font-bold text-sky-300 block leading-none">{unassignedCount}</b>
              <span className="text-[10px] font-bold text-sky-400 uppercase">Biriktirilmagan</span>
            </div>
            <div className="bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-lg text-center">
              <b className="text-lg font-bold text-emerald-300 block leading-none">{dispatchedCount}</b>
              <span className="text-[10px] font-bold text-emerald-400 uppercase">Yo'lga Chiqqan</span>
            </div>
          </div>
        </div>

        {notice && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold rounded-lg shadow-xs flex items-center justify-between">
            <span>{notice}</span>
            <button onClick={() => setNotice("")} className="text-emerald-800 font-bold hover:underline">✕</button>
          </div>
        )}

        {/* Filter Action Bar */}
        <div className="bg-slate-800/60 backdrop-blur p-4 rounded-xl border border-white/[0.08] shadow-2xs flex flex-wrap items-center justify-between gap-4">
          {/* Triage Severity Filter Pills */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 font-bold mr-1">Daraja:</span>
            <button
              onClick={() => setSeverityFilter("all")}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                severityFilter === "all" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              Barchasi ({items.length})
            </button>
            <button
              onClick={() => setSeverityFilter("emergency")}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1 ${
                severityFilter === "emergency" ? "bg-red-700 text-white shadow-xs" : "bg-red-50 text-red-800 hover:bg-red-100 border border-red-200"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
              <span>Kritik ({items.filter((i) => i.triage === "emergency").length})</span>
            </button>
            <button
              onClick={() => setSeverityFilter("urgent")}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                severityFilter === "urgent" ? "bg-amber-700 text-white shadow-xs" : "bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200"
              }`}
            >
              Shoshilinch ({items.filter((i) => i.triage === "urgent").length})
            </button>
            <button
              onClick={() => setSeverityFilter("routine")}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                severityFilter === "routine" ? "bg-emerald-700 text-white shadow-xs" : "bg-emerald-50 text-emerald-900 hover:bg-emerald-100 border border-emerald-200"
              }`}
            >
              Rejali ({items.filter((i) => i.triage === "routine").length})
            </button>
          </div>

          {/* District & Status Dropdown Filters */}
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <label htmlFor="select-district" className="text-slate-500 font-bold">Tuman:</label>
              <select
                id="select-district"
                value={districtFilter}
                onChange={(e) => setDistrictFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800 focus:outline-none focus:border-emerald-600"
              >
                <option value="all">Barcha tumanlar</option>
                {districts.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <label htmlFor="select-status" className="text-slate-500 font-bold">Holat:</label>
              <select
                id="select-status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as "all" | DispatchStatus)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800 focus:outline-none focus:border-emerald-600"
              >
                <option value="all">Barcha holatlar</option>
                <option value="unassigned">Biriktirilmagan</option>
                <option value="reviewing">Ko'rib chiqilmoqda</option>
                <option value="dispatched">Mobil Avtobus Yo'lga Chiqqan</option>
                <option value="teleconsult_scheduled">Telemaslahat Belgilangan</option>
                <option value="resolved">Yakunlangan</option>
              </select>
            </div>
          </div>
        </div>

        {/* Workspace Layout: Left Map Engine + Right Request Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 min-h-[600px]">
          {/* Main Map Box */}
          <div className="lg:col-span-8 flex flex-col bg-white rounded-xl border border-slate-200 p-2 shadow-2xs">
            <div className="flex-1 relative w-full h-full min-h-[550px]">
              <DispatcherMap
                items={filteredItems}
                selectedId={selectedId}
                onSelect={(item) => setSelectedId(item.id)}
                onAssignVehicle={handleAssignVehicle}
                onScheduleTeleconsult={handleScheduleTeleconsult}
                language={language}
              />
            </div>
          </div>

          {/* Right Sidebar: Real-Time Incoming Request List */}
          <aside className="lg:col-span-4 flex flex-col bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">📋 Kelib tushgan murojaatlar navbati</h3>
                <p className="text-xs text-slate-500">Murojaat ustiga bosing — Xaritada pin faollashadi</p>
              </div>
              <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-full">
                {filteredItems.length} ta
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[620px]">
              {filteredItems.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  Tanlangan mezonlarga mos murojaatlar topilmadi.
                </div>
              ) : (
                filteredItems.map((item) => {
                  const isSelected = item.id === selectedId;
                  return (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => setSelectedId(item.id)}
                      className={`w-full text-left p-3.5 rounded-xl border text-xs transition cursor-pointer ${
                        isSelected
                          ? "border-emerald-600 bg-emerald-50/50 shadow-xs ring-1 ring-emerald-600"
                          : item.triage === "emergency"
                            ? "border-red-200 bg-red-50/30 hover:bg-red-50/60"
                            : item.triage === "urgent"
                              ? "border-amber-200 bg-amber-50/30 hover:bg-amber-50/60"
                              : "border-slate-200 bg-white hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <b className="text-sm font-bold text-slate-900 block leading-snug">{item.patientName}</b>
                          <span className="text-[11px] text-slate-500 font-medium">
                            {item.patientCode} · {item.age} yosh · 📍 {item.village}, {item.district}
                          </span>
                        </div>

                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase shrink-0 ${
                            item.triage === "emergency"
                              ? "bg-red-600 text-white"
                              : item.triage === "urgent"
                                ? "bg-amber-600 text-white"
                                : item.triage === "priority"
                                  ? "bg-sky-600 text-white"
                                  : "bg-emerald-600 text-white"
                          }`}
                        >
                          {item.triage === "emergency" ? "KRITIK" : item.triage === "urgent" ? "SHOSHILINCH" : item.triage === "priority" ? "USTUVOR" : "REJALI"}
                        </span>
                      </div>

                      {/* Complaint & Vitals summary */}
                      <p className="text-slate-800 font-semibold mb-2 line-clamp-2 leading-relaxed">
                        "{item.chiefComplaint}"
                      </p>

                      <div className="grid grid-cols-2 gap-2 bg-slate-50/80 p-2 rounded-lg text-[11px] mb-3 border border-slate-100">
                        <div>
                          <span className="text-slate-500 block text-[10px]">🫁 SpO₂ saturatsiya:</span>
                          <b className={(item.vitals.spo2 ?? 96) < 90 ? "text-red-600 font-extrabold" : "text-slate-900"}>
                            {item.vitals.spo2 ?? "--"}%
                          </b>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px]">💓 Pulse / BP:</span>
                          <b className="text-slate-900">
                            {item.vitals.heartRate ?? "--"} bpm | {item.vitals.systolicBp ?? "--"}/{item.vitals.diastolicBp ?? "--"}
                          </b>
                        </div>
                      </div>

                      {/* Status indicator */}
                      <div className="flex items-center justify-between text-[11px] border-t border-slate-100 pt-2 mb-3">
                        <span className="text-slate-500">Holat:</span>
                        <span className="font-bold text-slate-800">
                          {item.status === "unassigned"
                            ? "⏳ Biriktirilmagan"
                            : item.status === "reviewing"
                              ? "👁️ Ko'rib chiqilmoqda"
                              : item.status === "dispatched"
                                ? "🚑 Mobil Avtobus Yo'lda"
                                : item.status === "teleconsult_scheduled"
                                  ? "💻 Telemaslahat Belgilangan"
                                  : "✅ Yakunlangan"}
                        </span>
                      </div>

                      {/* Direct Action Buttons */}
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleScheduleTeleconsult(item.id);
                          }}
                          className="py-1.5 px-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-[11px] text-center transition cursor-pointer"
                        >
                          💻 Telemaslahat
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAssignVehicle(item.id);
                          }}
                          className="py-1.5 px-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-[11px] text-center transition cursor-pointer"
                        >
                          🚑 Avtobus Yuborish
                        </button>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </aside>
        </div>
      </div>
    </main>
        <MovableChatWidget />
      </div>
    </RoleGuard>
  );
}

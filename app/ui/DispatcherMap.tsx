"use client";

import { useEffect, useRef, useState } from "react";
import { findNearestHospital, REGIONAL_HOSPITALS } from "@/lib/regional-routing";
import type { DispatchItem } from "@/lib/realtime-dispatcher";
import { EMERGENCY_MARKER_SVG_HTML, NEAREST_HOSPITAL_SVG_HTML } from "@/app/ui/MedicalIcons";
import type L from "leaflet";

interface DispatcherMapProps {
  items: DispatchItem[];
  selectedId: string | null;
  onSelect: (item: DispatchItem) => void;
  onAssignVehicle: (id: string, vehicle: string) => void;
  onScheduleTeleconsult: (id: string, doctor: string) => void;
  language?: "uz" | "en";
}

export function DispatcherMap({
  items,
  selectedId,
  onSelect,
  onAssignVehicle,
  onScheduleTeleconsult,
  language = "uz",
}: DispatcherMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const leafletRef = useRef<typeof L | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    let isMounted = true;

    // Dynamically import Leaflet to prevent SSR window reference issues
    import("leaflet").then((LModule) => {
      if (!isMounted || !mapContainerRef.current || mapInstanceRef.current) return;

      leafletRef.current = LModule;

      // Make sure Leaflet CSS is dynamically included if not present
      if (!document.getElementById("leaflet-css")) {
        const link = document.createElement("link");
        link.id = "leaflet-css";
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }

      // Default center: Samarqand / Urgut region coordinates
      const map = LModule.map(mapContainerRef.current, {
        center: [39.6542, 67.0],
        zoom: 10,
        zoomControl: true,
        preferCanvas: true, // High performance GPU canvas rendering for batch markers
      });

      // CartoDB Voyager crisp clean basemap tiles for medical dispatch clarity
      LModule.tileLayer(
        "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: "abcd",
          maxZoom: 19,
        }
      ).addTo(map);

      const markersGroup = LModule.layerGroup().addTo(map);
      markersGroupRef.current = markersGroup;
      mapInstanceRef.current = map;

      setMapLoaded(true);
    });

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update map markers whenever items or selectedId changes
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current || !markersGroupRef.current || !leafletRef.current) return;

    const LModule = leafletRef.current;
    const map = mapInstanceRef.current;
    const markersGroup = markersGroupRef.current;

    markersGroup.clearLayers();

    const bounds = LModule.latLngBounds([]);

    // 1. Plot Regional Hospitals SVG Markers
    REGIONAL_HOSPITALS.forEach((hosp) => {
      bounds.extend([hosp.lat, hosp.lng]);
      const hospIcon = LModule.divIcon({
        className: "custom-hosp-icon",
        html: NEAREST_HOSPITAL_SVG_HTML,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16],
      });

      const hospMarker = LModule.marker([hosp.lat, hosp.lng], { icon: hospIcon });
      const hospPopup = document.createElement("div");
      hospPopup.className = "p-1 font-sans text-xs max-w-[260px]";
      hospPopup.innerHTML = `
        <b class="text-sm font-bold text-blue-900 block mb-0.5">🏥 ${hosp.name}</b>
        <span class="text-[11px] text-slate-500 block mb-1 font-semibold">${hosp.district}, ${hosp.region}</span>
        <div class="p-2 bg-blue-50 border border-blue-200 rounded text-[11px] text-blue-950 space-y-1">
          <div><b>O'rinlar:</b> ${hosp.availableBeds}/${hosp.totalBeds} bo'sh (${hosp.icuBedsAvailable} ICU)</div>
          <div><b>Navbatchi:</b> ${hosp.specialistsAvailable[0]}</div>
          <div><b>Tel:</b> ${hosp.emergencyPhone}</div>
        </div>
      `;
      hospMarker.bindPopup(hospPopup);
      markersGroup.addLayer(hospMarker);
    });

    // 2. Plot Patient Emergency Incidents
    items.forEach((item) => {
      const isSelected = item.id === selectedId;
      const nearest = item.nearestHospital
        ? { hospital: { name: item.nearestHospital.name }, distanceKm: item.nearestHospital.distanceKm }
        : findNearestHospital(item.lat, item.lng);

      const colorClass =
        item.triage === "emergency"
          ? "emergency-pin"
          : item.triage === "urgent"
            ? "urgent-pin"
            : item.triage === "priority"
              ? "priority-pin"
              : "routine-pin";

      const pinHtml =
        item.triage === "emergency"
          ? EMERGENCY_MARKER_SVG_HTML
          : `
            <div class="relative group cursor-pointer ${isSelected ? "scale-125 z-50" : "z-10"}">
              <div class="relative flex items-center justify-center w-8 h-8 rounded-full border-2 border-white shadow-md text-white font-bold text-xs ${
                item.triage === "urgent"
                  ? "bg-amber-600 shadow-amber-500/50"
                  : item.triage === "priority"
                    ? "bg-sky-600 shadow-sky-500/50"
                    : "bg-emerald-600 shadow-emerald-500/50"
              }">
                <span>${item.triage === "urgent" ? "⚠️" : "🩺"}</span>
              </div>
            </div>
          `;

      const customIcon = LModule.divIcon({
        className: `custom-div-icon ${colorClass}`,
        html: pinHtml,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -18],
      });

      const marker = LModule.marker([item.lat, item.lng], { icon: customIcon });

      // Popup Content with Nearest Hospital Badge & Vitals
      const popupContent = document.createElement("div");
      popupContent.className = "p-1 font-sans text-xs max-w-[290px]";
      popupContent.innerHTML = `
        <div class="flex items-center justify-between border-b border-slate-200 pb-2 mb-2">
          <div>
            <b class="text-sm font-bold text-slate-900 block">${item.patientName}</b>
            <span class="text-[11px] text-slate-500">${item.patientCode} · ${item.age} yosh (${item.sex})</span>
          </div>
          <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
            item.triage === "emergency"
              ? "bg-red-100 text-red-800 border border-red-300"
              : item.triage === "urgent"
                ? "bg-amber-100 text-amber-800 border border-amber-300"
                : "bg-emerald-100 text-emerald-800 border border-emerald-300"
          }">
            ${item.triage === "emergency" ? "FAVQULODDA" : item.triage === "urgent" ? "SHOSHILINCH" : "REJALI"}
          </span>
        </div>

        <!-- NEAREST REGIONAL HOSPITAL BADGE -->
        <div class="p-2 bg-blue-50 border border-blue-200 rounded-md text-[11px] text-blue-950 font-bold mb-2">
          🏥 YAQIN REGIONAL SHIFOXONA: ${nearest.hospital.name} (${nearest.distanceKm} km)
        </div>

        <div class="space-y-1 mb-3 text-slate-700 bg-slate-50 p-2 rounded-md border border-slate-100">
          <div class="flex justify-between">
            <span>📍 Joylashuv:</span>
            <b class="text-slate-900">${item.village}, ${item.district}</b>
          </div>
          <div class="flex justify-between">
            <span>🫁 Saturatsiya (SpO₂):</span>
            <b class="${(item.vitals.spo2 ?? 96) < 90 ? "text-red-600 font-extrabold" : "text-slate-900"}">
              ${item.vitals.spo2 ?? "--"}%
            </b>
          </div>
          <div class="flex justify-between">
            <span>💓 Pulse / BP:</span>
            <b class="text-slate-900">${item.vitals.heartRate ?? "--"} bpm | ${item.vitals.systolicBp ?? "--"}/${item.vitals.diastolicBp ?? "--"}</b>
          </div>
          <div class="flex justify-between">
            <span>📋 Shikoyat:</span>
            <span class="text-slate-800 font-medium truncate max-w-[150px]">${item.chiefComplaint}</span>
          </div>
        </div>

        <div class="text-[10px] text-slate-400 mb-3 flex justify-between items-center">
          <span>GPS: ${item.lat.toFixed(4)}, ${item.lng.toFixed(4)}</span>
          <span>${new Date(item.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>

        <div class="grid grid-cols-2 gap-1.5 pt-1 border-t border-slate-200">
          <button id="btn-teleconsult-${item.id}" class="py-1.5 px-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded text-[11px] text-center transition cursor-pointer">
            💻 ${language === "uz" ? "Telemaslahat" : "Teleconsult"}
          </button>
          <button id="btn-bus-${item.id}" class="py-1.5 px-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded text-[11px] text-center transition cursor-pointer">
            🚑 ${language === "uz" ? "Avtobus Biriktirish" : "Assign Bus"}
          </button>
        </div>
      `;

      marker.bindPopup(popupContent);

      marker.on("click", () => {
        onSelect(item);
      });

      marker.on("popupopen", () => {
        onSelect(item);

        const teleBtn = document.getElementById(`btn-teleconsult-${item.id}`);
        if (teleBtn) {
          teleBtn.onclick = () => {
            onScheduleTeleconsult(item.id, "Dr. Tomir (Markaziy Shifoxona)");
            marker.closePopup();
          };
        }

        const busBtn = document.getElementById(`btn-bus-${item.id}`);
        if (busBtn) {
          busBtn.onclick = () => {
            onAssignVehicle(item.id, "Tomir-01 Mobile Bus");
            marker.closePopup();
          };
        }
      });

      marker.addTo(markersGroup);
      bounds.extend([item.lat, item.lng]);

      if (isSelected) {
        map.panTo([item.lat, item.lng], { animate: true, duration: 0.3 });
        marker.openPopup();
      }
    });

    if (items.length > 0 && !selectedId) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
    }
  }, [items, selectedId, mapLoaded, onSelect, onAssignVehicle, onScheduleTeleconsult, language]);

  return (
    <div className="relative w-full h-full min-h-[450px] bg-slate-100 rounded-xl overflow-hidden border border-slate-200 shadow-inner">
      <div 
        ref={mapContainerRef} 
        className="w-full h-full min-h-[450px] z-0" 
        role="region"
        aria-label={language === "uz" ? "Dispetcherlik interaktiv GIS xaritasi" : "Interactive Dispatcher GIS Map"}
      />
      
      {/* Map Shape Glyphs Legend */}
      <div 
        className="absolute bottom-3 left-3 z-[400] bg-white/95 backdrop-blur-xs p-2.5 rounded-lg shadow-md border border-slate-200 text-[11px] font-bold text-slate-800 space-y-1"
        role="complementary"
        aria-label={language === "uz" ? "GIS xarita legendasi" : "GIS map legend"}
      >
        <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1 font-mono">GIS XARITA LEGENDASI (SHAKL & RANG)</div>
        <div className="flex items-center gap-2"><span className="text-red-600">🚨 ⬛ 🔴</span> <span>Favqulodda (Emergency)</span></div>
        <div className="flex items-center gap-2"><span className="text-amber-600">⚠️ ◼️ 🟡</span> <span>Shoshilinch (Urgent)</span></div>
        <div className="flex items-center gap-2"><span className="text-emerald-600">🩺 🔵 🟢</span> <span>Rejali (Routine)</span></div>
        <div className="flex items-center gap-2"><span className="text-blue-700">🏥 🔷</span> <span>Regional Shifoxona</span></div>
      </div>

      {!mapLoaded && (
        <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-xs flex items-center justify-center text-slate-700 font-bold text-xs">
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-md border border-slate-200">
            <span className="w-3 h-3 rounded-full bg-emerald-600 animate-ping"></span>
            <span>{"Interaktiv dispetcher xaritasi yuklanmoqda..."}</span>
          </div>
        </div>
      )}
    </div>
  );
}

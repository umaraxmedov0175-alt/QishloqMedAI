"use client";

import { useEffect, useRef, useState } from "react";
import { findNearestHospital, REGIONAL_HOSPITALS } from "@/lib/regional-routing";
import type { DispatchItem } from "@/lib/realtime-dispatcher";
import type { OutbreakCluster, PreventiveDispatchRecommendation } from "@/lib/outbreak-radar";
import { EMERGENCY_MARKER_SVG_HTML, NEAREST_HOSPITAL_SVG_HTML } from "@/app/ui/MedicalIcons";
import type L from "leaflet";

interface OutbreakRadarMapProps {
  items?: DispatchItem[];
  clusters?: OutbreakCluster[];
  preventiveDispatches?: PreventiveDispatchRecommendation[];
  selectedId?: string | null;
  mode?: "dispatch" | "radar";
  onSelectDispatch?: (item: DispatchItem) => void;
  onSelectCluster?: (cluster: OutbreakCluster) => void;
  onTriggerPreventiveDispatch?: (clusterId: string) => void;
  onModeToggle?: (newMode: "dispatch" | "radar") => void;
  language?: "uz" | "en";
}

export function OutbreakRadarMap({
  items = [],
  clusters = [],
  selectedId = null,
  mode = "radar",
  onSelectDispatch,
  onSelectCluster,
  onTriggerPreventiveDispatch,
  onModeToggle,
}: OutbreakRadarMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const leafletRef = useRef<typeof L | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [activeMode, setActiveMode] = useState<"dispatch" | "radar">(mode);

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    let isMounted = true;

    import("leaflet").then((LModule) => {
      if (!isMounted || !mapContainerRef.current || mapInstanceRef.current) return;

      leafletRef.current = LModule;

      if (!document.getElementById("leaflet-css")) {
        const link = document.createElement("link");
        link.id = "leaflet-css";
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }

      // Default center: Samarqand / Urgut region
      const map = LModule.map(mapContainerRef.current, {
        center: [39.6542, 67.0],
        zoom: 9,
        zoomControl: true,
        preferCanvas: true,
      });

      // CartoDB Dark Matter / Voyager tile layer
      LModule.tileLayer(
        "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
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

  // Update map contents when mode, items, clusters, or selectedId changes
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current || !markersGroupRef.current || !leafletRef.current) return;

    const LModule = leafletRef.current;
    const markersGroup = markersGroupRef.current;

    markersGroup.clearLayers();

    // 1. Plot Regional Hospitals
    REGIONAL_HOSPITALS.forEach((hosp) => {
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
          <div><b>Bo'sh o'rinlar:</b> ${hosp.availableBeds}/${hosp.totalBeds} (${hosp.icuBedsAvailable} ICU)</div>
          <div><b>Navbatchi vrach:</b> ${hosp.specialistsAvailable[0]}</div>
          <div><b>Tezkor aloqa:</b> ${hosp.emergencyPhone}</div>
        </div>
      `;
      hospMarker.bindPopup(hospPopup);
      markersGroup.addLayer(hospMarker);
    });

    if (activeMode === "radar") {
      // 2. Render Epidemiological Outbreak Anomaly Clusters
      clusters.forEach((cluster) => {
        const isSelected = cluster.id === selectedId;
        const color =
          cluster.riskLevel === "critical"
            ? "#dc2626"
            : cluster.riskLevel === "elevated"
              ? "#d97706"
              : "#ca8a04";

        // Spatial density circle
        const circle = LModule.circle([cluster.centerLat, cluster.centerLng], {
          color,
          fillColor: color,
          fillOpacity: isSelected ? 0.45 : 0.25,
          radius: cluster.radiusKm * 1000, // meters
          weight: isSelected ? 3 : 2,
          dashArray: cluster.riskLevel === "critical" ? "6, 4" : undefined,
        });

        // Directional Expansion Vector Line
        const targetVectorLat = cluster.centerLat + cluster.expansionVector.dLat;
        const targetVectorLng = cluster.centerLng + cluster.expansionVector.dLng;
        const vectorLine = LModule.polyline(
          [
            [cluster.centerLat, cluster.centerLng],
            [targetVectorLat, targetVectorLng],
          ],
          {
            color: "#991b1b",
            weight: 3,
            dashArray: "4, 4",
          }
        );
        markersGroup.addLayer(vectorLine);

        // Center Pulsing Anomaly Icon
        const anomalyIcon = LModule.divIcon({
          className: "custom-anomaly-icon",
          html: `
            <div class="relative flex items-center justify-center cursor-pointer">
              <div class="absolute w-8 h-8 rounded-full ${
                cluster.riskLevel === "critical"
                  ? "bg-red-500 animate-ping opacity-75"
                  : "bg-amber-500 animate-pulse opacity-60"
              }"></div>
              <div class="relative flex items-center justify-center w-7 h-7 rounded-full border-2 border-white text-white font-extrabold text-[11px] shadow-lg ${
                cluster.riskLevel === "critical"
                  ? "bg-red-700 shadow-red-500/60"
                  : "bg-amber-600 shadow-amber-500/60"
              }">
                ☣️
              </div>
            </div>
          `,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
          popupAnchor: [0, -14],
        });

        const marker = LModule.marker([cluster.centerLat, cluster.centerLng], { icon: anomalyIcon });
        const popupDiv = document.createElement("div");
        popupDiv.className = "p-1 font-sans text-xs max-w-[280px]";
        popupDiv.innerHTML = `
          <div class="flex items-center justify-between gap-2 mb-1 border-b pb-1">
            <b class="text-sm font-bold text-red-900">☣️ Cluster: ${cluster.district}</b>
            <span class="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase text-white ${
              cluster.riskLevel === "critical" ? "bg-red-600" : "bg-amber-600"
            }">Z-Score ${cluster.zScore}</span>
          </div>
          <div class="text-[11px] text-slate-700 font-semibold mb-1">${cluster.villageName} · ${cluster.patientCount} ta Bemorda Anomaliya</div>
          <div class="p-2 bg-slate-900 text-slate-100 rounded text-[11px] space-y-1 mb-2">
            <div><b class="text-amber-400">Marker:</b> ${cluster.primaryMarkerLabel}</div>
            <div><b class="text-sky-300">Vektor Yo'nalishi:</b> ${cluster.expansionVector.directionLabel} (${cluster.expansionVector.magnitudeKm} km)</div>
          </div>
          <div class="space-y-1 text-[10px] text-slate-600 mb-2">
            ${cluster.labAlertSummary.map((alert) => `<div>• ${alert}</div>`).join("")}
          </div>
          <button id="dispatch-btn-${cluster.id}" class="w-full py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-xs shadow transition flex items-center justify-center gap-1.5">
            🚑 Proaktiv Mobil Lab Safarbar Etish
          </button>
        `;

        popupDiv.addEventListener("click", (e) => {
          const target = e.target as HTMLElement;
          if (target && (target.id === `dispatch-btn-${cluster.id}` || target.closest(`#dispatch-btn-${cluster.id}`))) {
            if (onTriggerPreventiveDispatch) {
              onTriggerPreventiveDispatch(cluster.id);
            }
          }
        });

        marker.bindPopup(popupDiv);
        circle.bindPopup(popupDiv);

        circle.on("click", () => {
          if (onSelectCluster) onSelectCluster(cluster);
        });
        marker.on("click", () => {
          if (onSelectCluster) onSelectCluster(cluster);
        });

        markersGroup.addLayer(circle);
        markersGroup.addLayer(marker);
      });
    } else {
      // 3. Render Live Patient Emergency Dispatches
      items.forEach((item) => {
        const isSelected = item.id === selectedId;
        const nearest = item.nearestHospital || findNearestHospital(item.lat, item.lng).hospital;

        const pinHtml =
          item.triage === "emergency"
            ? EMERGENCY_MARKER_SVG_HTML
            : `
              <div class="relative cursor-pointer ${isSelected ? "scale-125 z-50" : "z-10"}">
                <div class="flex items-center justify-center w-8 h-8 rounded-full border-2 border-white shadow-md text-white font-bold text-xs ${
                  item.triage === "urgent"
                    ? "bg-amber-600"
                    : item.triage === "priority"
                      ? "bg-blue-600"
                      : "bg-emerald-600"
                }">
                  ${item.triage === "urgent" ? "⚠️" : item.triage === "priority" ? "⚡" : "✓"}
                </div>
              </div>
            `;

        const icon = LModule.divIcon({
          className: "custom-patient-icon",
          html: pinHtml,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
          popupAnchor: [0, -16],
        });

        const marker = LModule.marker([item.lat, item.lng], { icon });
        const popupDiv = document.createElement("div");
        popupDiv.className = "p-1 font-sans text-xs max-w-[260px]";
        popupDiv.innerHTML = `
          <b class="text-sm font-bold text-slate-900 block mb-0.5">${item.patientName} (${item.age} yosh)</b>
          <div class="text-[11px] text-slate-600 mb-1">📍 ${item.village}, ${item.district}</div>
          <div class="p-2 bg-slate-100 rounded text-[11px] mb-1">
            <div><b>Shikoyat:</b> ${item.chiefComplaint}</div>
            <div><b>Vitals:</b> SpO2 ${item.vitals?.spo2 || 95}% · HR ${item.vitals?.heartRate || 75} bpm · BP ${item.vitals?.systolicBp || 120}/${item.vitals?.diastolicBp || 80}</div>
          </div>
          <div class="text-[10px] text-blue-900 font-bold">🏥 Yakindagi Shifoxona: ${nearest.name} (${item.nearestHospital?.distanceKm || "4.2"} km)</div>
        `;
        marker.bindPopup(popupDiv);
        marker.on("click", () => {
          if (onSelectDispatch) onSelectDispatch(item);
        });
        markersGroup.addLayer(marker);
      });
    }
  }, [mapLoaded, activeMode, items, clusters, selectedId]);

  const handleToggle = (newMode: "dispatch" | "radar") => {
    setActiveMode(newMode);
    if (onModeToggle) onModeToggle(newMode);
  };

  return (
    <div className="relative w-full h-full min-h-[440px] rounded-xl overflow-hidden border border-slate-700 bg-slate-950 shadow-2xl">
      {/* Mode Control Bar Header */}
      <div className="absolute top-3 left-3 right-3 z-[1000] flex flex-wrap items-center justify-between gap-2 p-2 bg-slate-900/90 backdrop-blur-md rounded-lg border border-slate-700 shadow-lg text-xs">
        <div className="flex items-center gap-2 font-semibold text-slate-200">
          <span className="flex items-center gap-1 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <b>TOMIR AI RADAR:</b>
          </span>
          <span className="hidden sm:inline text-slate-400">Epidemik anomaliya va proaktiv marshrutlash</span>
        </div>

        {/* Mode Toggle Pills */}
        <div className="flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700" role="toolbar" aria-label="Map Display Layer Controls">
          <button
            type="button"
            onClick={() => handleToggle("dispatch")}
            aria-label="Live Patient Dispatch Layer Toggle"
            title="Toggle Live Patient Dispatch Layer"
            tabIndex={0}
            className={`px-3 py-1.5 rounded-md font-bold text-xs transition flex items-center gap-1.5 ${
              activeMode === "dispatch"
                ? "bg-blue-600 text-white shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            📡 Live Bemorlar Dispatch
          </button>

          <button
            type="button"
            onClick={() => handleToggle("radar")}
            aria-label="Predictive Outbreak Radar Heatmap Toggle"
            title="Toggle Predictive Outbreak Radar Heatmap"
            tabIndex={0}
            className={`px-3 py-1.5 rounded-md font-bold text-xs transition flex items-center gap-1.5 ${
              activeMode === "radar"
                ? "bg-red-600 text-white shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            ☣️ Epidemik Outbreak Radar
          </button>
        </div>
      </div>

      {/* Map Container */}
      <div 
        ref={mapContainerRef} 
        className="w-full h-full min-h-[440px] z-0" 
        role="region"
        aria-label="Epidemiological Outbreak Radar GIS Map Canvas"
      />
    </div>
  );
}

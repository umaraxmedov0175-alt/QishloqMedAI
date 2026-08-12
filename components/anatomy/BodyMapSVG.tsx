"use client";

import { useState } from "react";
import { BODY_REGIONS, type BodyRegionId } from "@/lib/anatomy/regions";

export interface BodyMapSVGProps {
  value: BodyRegionId[];
  onChange: (regions: BodyRegionId[]) => void;
  maxSelections?: number;
  locale?: "uz" | "ru" | "en";
  className?: string;
}

export function BodyMapSVG({
  value = [],
  onChange,
  maxSelections = 5,
  locale = "uz",
  className = "",
}: BodyMapSVGProps) {
  const [activeView, setActiveView] = useState<"front" | "back">("front");
  const [notice, setNotice] = useState("");

  const handleRegionClick = (id: BodyRegionId) => {
    const isSelected = value.includes(id);
    if (isSelected) {
      onChange(value.filter((r) => r !== id));
    } else {
      if (value.length >= maxSelections) {
        setNotice(
          locale === "uz"
            ? `⚠️ Maksimal ${maxSelections} ta soha tanlanishi mumkin!`
            : locale === "ru"
            ? `⚠️ Максимум ${maxSelections} областей!`
            : `⚠️ Maximum ${maxSelections} regions allowed!`
        );
        setTimeout(() => setNotice(""), 3000);
        return;
      }
      onChange([...value, id]);
    }
  };

  const isSelected = (id: BodyRegionId) => value.includes(id);

  const regionPaths: { id: BodyRegionId; path: string; label: string; view: "front" | "back" | "both" }[] = [
    { id: "head", path: "M 150 30 C 120 30 120 80 150 80 C 180 80 180 30 150 30 Z", label: "Bosh / Head", view: "both" },
    { id: "face", path: "M 135 55 C 135 75 165 75 165 55 Z", label: "Yuz / Face", view: "front" },
    { id: "neck", path: "M 138 80 L 162 80 L 165 100 L 135 100 Z", label: "Bo'yin / Neck", view: "both" },
    { id: "shoulder_left", path: "M 100 105 L 130 100 L 125 125 L 95 120 Z", label: "Chap Yelka / L. Shoulder", view: "both" },
    { id: "shoulder_right", path: "M 170 100 L 200 105 L 205 120 L 175 125 Z", label: "O'ng Yelka / R. Shoulder", view: "both" },
    { id: "chest_left", path: "M 125 105 L 148 105 L 148 150 L 125 145 Z", label: "Chap Ko'krak / L. Chest", view: "front" },
    { id: "chest_right", path: "M 152 105 L 175 105 L 175 145 L 152 150 Z", label: "O'ng Ko'krak / R. Chest", view: "front" },
    { id: "abdomen_upper", path: "M 125 152 L 175 152 L 175 180 L 125 180 Z", label: "Yuqori Qorin / Upper Abdomen", view: "front" },
    { id: "abdomen_lower", path: "M 125 182 L 175 182 L 170 215 L 130 215 Z", label: "Pastki Qorin / Lower Abdomen", view: "front" },
    { id: "back_upper", path: "M 125 105 L 175 105 L 175 160 L 125 160 Z", label: "Yuqori Orqa / Upper Back", view: "back" },
    { id: "back_lower", path: "M 125 162 L 175 162 L 170 215 L 130 215 Z", label: "Beli / Lower Back", view: "back" },
    { id: "arm_upper_left", path: "M 90 125 L 115 125 L 110 180 L 85 175 Z", label: "Chap Qo'l / L. Arm", view: "both" },
    { id: "arm_upper_right", path: "M 185 125 L 210 125 L 215 175 L 190 180 Z", label: "O'ng Qo'l / R. Arm", view: "both" },
    { id: "forearm_left", path: "M 82 182 L 105 184 L 98 240 L 75 235 Z", label: "Chap Bilak / L. Forearm", view: "both" },
    { id: "forearm_right", path: "M 195 184 L 218 182 L 225 235 L 202 240 Z", label: "O'ng Bilak / R. Forearm", view: "both" },
    { id: "hand_left", path: "M 72 242 L 95 245 L 88 275 L 65 270 Z", label: "Chap Kaft / L. Hand", view: "both" },
    { id: "hand_right", path: "M 205 245 L 228 242 L 235 270 L 212 275 Z", label: "O'ng Kaft / R. Hand", view: "both" },
    { id: "groin", path: "M 135 218 L 165 218 L 160 240 L 140 240 Z", label: "Chot / Groin", view: "front" },
    { id: "thigh_left", path: "M 125 220 L 146 242 L 140 310 L 115 310 Z", label: "Chap Son / L. Thigh", view: "both" },
    { id: "thigh_right", path: "M 154 242 L 175 220 L 185 310 L 160 310 Z", label: "O'ng Son / R. Thigh", view: "both" },
    { id: "knee_left", path: "M 115 312 L 140 312 L 138 340 L 117 340 Z", label: "Chap Tizda / L. Knee", view: "both" },
    { id: "knee_right", path: "M 160 312 L 185 312 L 183 340 L 162 340 Z", label: "O'ng Tizda / R. Knee", view: "both" },
    { id: "shin_left", path: "M 116 342 L 138 342 L 132 410 L 112 410 Z", label: "Chap Boldiq / L. Shin", view: "both" },
    { id: "shin_right", path: "M 162 342 L 184 342 L 188 410 L 168 410 Z", label: "O'ng Boldiq / R. Shin", view: "both" },
    { id: "foot_left", path: "M 110 412 L 132 412 L 128 440 L 100 440 Z", label: "Chap Kaft / L. Foot", view: "both" },
    { id: "foot_right", path: "M 168 412 L 190 412 L 200 440 L 172 440 Z", label: "O'ng Kaft / R. Foot", view: "both" },
  ];

  const visiblePaths = regionPaths.filter((r) => r.view === "both" || r.view === activeView);

  return (
    <div className={`relative bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col items-center select-none ${className}`}>
      {/* View Switcher & Header */}
      <div className="w-full flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-emerald-400">⚡ Vector 2D Anatomy Map</span>
          <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
            {value.length}/{maxSelections}
          </span>
        </div>

        <div className="flex bg-slate-800 p-0.5 rounded-lg border border-slate-700">
          <button
            type="button"
            onClick={() => setActiveView("front")}
            className={`px-3 py-1 text-xs font-bold rounded-md transition cursor-pointer ${
              activeView === "front" ? "bg-emerald-600 text-white shadow-2xs" : "text-slate-400 hover:text-white"
            }`}
          >
            {locale === "uz" ? "Oldi (Front)" : locale === "ru" ? "Спереди" : "Front"}
          </button>
          <button
            type="button"
            onClick={() => setActiveView("back")}
            className={`px-3 py-1 text-xs font-bold rounded-md transition cursor-pointer ${
              activeView === "back" ? "bg-emerald-600 text-white shadow-2xs" : "text-slate-400 hover:text-white"
            }`}
          >
            {locale === "uz" ? "Orqasi (Back)" : locale === "ru" ? "Сзади" : "Back"}
          </button>
        </div>
      </div>

      {notice && (
        <div className="w-full text-center text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 p-2 rounded-lg mb-2">
          {notice}
        </div>
      )}

      {/* SVG Interactive Body */}
      <svg viewBox="0 0 300 460" className="w-full max-w-[320px] h-[380px] drop-shadow-md">
        <defs>
          <radialGradient id="bodyBg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#0f172a" />
          </radialGradient>
        </defs>

        {/* Silhouette Body Outline */}
        <path
          d="M 150 25 C 110 25 110 80 135 95 L 90 110 L 70 245 L 85 245 L 110 310 L 105 442 L 135 442 L 148 320 L 152 320 L 165 442 L 195 442 L 190 310 L 215 245 L 230 245 L 210 110 L 165 95 C 190 80 190 25 150 25 Z"
          fill="url(#bodyBg)"
          stroke="#334155"
          strokeWidth="2"
        />

        {/* Clickable Anatomical Region Paths */}
        {visiblePaths.map((r) => {
          const active = isSelected(r.id);
          const meta = BODY_REGIONS[r.id];
          const displayLabel = meta ? meta.label[locale] || meta.label.uz : r.label;

          return (
            <path
              key={r.id}
              d={r.path}
              className={`transition-all duration-200 cursor-pointer ${
                active
                  ? "fill-emerald-500/80 stroke-emerald-300 stroke-[2.5] filter drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]"
                  : "fill-slate-700/60 hover:fill-emerald-400/50 stroke-slate-600 hover:stroke-emerald-300 stroke-1"
              }`}
              onClick={() => handleRegionClick(r.id)}
            >
              <title>{displayLabel}</title>
            </path>
          );
        })}
      </svg>
    </div>
  );
}

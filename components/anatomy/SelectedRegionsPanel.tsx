"use client";

import { useState } from "react";
import { BODY_REGIONS, type BodyRegionId } from "@/lib/anatomy/regions";

export interface SelectedRegionsPanelProps {
  value: BodyRegionId[];
  onChange: (regions: BodyRegionId[]) => void;
  locale?: "uz" | "ru" | "en";
  className?: string;
}

export function SelectedRegionsPanel({
  value = [],
  onChange,
  locale = "uz",
  className = "",
}: SelectedRegionsPanelProps) {
  const [showAccessibleList, setShowAccessibleList] = useState(false);

  const handleToggleRegion = (id: BodyRegionId) => {
    if (value.includes(id)) {
      onChange(value.filter((r) => r !== id));
    } else {
      onChange([...value, id]);
    }
  };

  const allRegionEntries = Object.values(BODY_REGIONS);

  return (
    <div className={`bg-slate-900/90 border border-slate-800 rounded-2xl p-4 text-white text-xs space-y-3 ${className}`}>
      {/* Header & Accessibility Toggle */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <span className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">
          📍 {locale === "uz" ? "Belgilangan 3D Sohalar" : locale === "ru" ? "Выбранные области" : "Selected Body Regions"}
        </span>
        <button
          type="button"
          onClick={() => setShowAccessibleList(!showAccessibleList)}
          className="text-[11px] font-medium text-emerald-400 hover:text-emerald-300 underline cursor-pointer bg-transparent border-0"
        >
          {showAccessibleList
            ? (locale === "uz" ? "3D Xaritaning o'zini ko'rsatish" : locale === "ru" ? "Показать 3D карту" : "Show 3D Canvas")
            : (locale === "uz" ? "♿ Matnli Ro'yxat Rejimi (Klavyatura)" : locale === "ru" ? "♿ Текстовый список (Доступность)" : "♿ Accessible List View")}
        </button>
      </div>

      {/* Selected Region Chips */}
      {value.length === 0 ? (
        <div className="p-3 bg-slate-800/40 border border-dashed border-slate-700/80 rounded-xl text-center text-slate-400 italic">
          👉 {locale === "uz" ? "Simptom joylashgan sohani tanlang (bosing)" : locale === "ru" ? "Нажмите на пораженную область на модели" : "Tap affected region on the 3D body model"}
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {value.map((id) => {
            const region = BODY_REGIONS[id];
            const label = region ? region.label[locale] || region.label.uz : id;

            return (
              <span
                key={id}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-950/80 border border-emerald-700/60 text-emerald-200 rounded-full font-semibold shadow-2xs"
              >
                <span>📍 {label}</span>
                <button
                  type="button"
                  onClick={() => handleToggleRegion(id)}
                  className="w-4 h-4 rounded-full bg-emerald-800/60 hover:bg-red-600 text-emerald-200 hover:text-white flex items-center justify-center font-bold text-[10px] cursor-pointer border-0 transition"
                  title="Remove"
                  aria-label={`Remove ${label}`}
                >
                  ✕
                </button>
              </span>
            );
          })}
        </div>
      )}

      {/* Collapsible Accessible Keyboard Checkbox List */}
      {showAccessibleList && (
        <div className="mt-3 p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2 max-h-56 overflow-y-auto">
          <span className="text-[11px] font-bold text-slate-400 block mb-1">
            ♿ {locale === "uz" ? "Barcha Anatomik Sohalar Ro'yxati:" : locale === "ru" ? "Полный список анатомических областей:" : "All Anatomical Regions Checklist:"}
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {allRegionEntries.map((region) => {
              const checked = value.includes(region.id);
              const label = region.label[locale] || region.label.uz;

              return (
                <label
                  key={region.id}
                  className={`flex items-center gap-2 p-1.5 rounded border text-[11px] font-medium cursor-pointer transition ${
                    checked
                      ? "bg-emerald-900/40 border-emerald-600 text-emerald-200"
                      : "bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => handleToggleRegion(region.id)}
                    className="accent-emerald-500 rounded cursor-pointer"
                  />
                  <span>{label}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

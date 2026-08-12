"use client";
/* eslint-disable react/no-unescaped-entities */

import { useState } from "react";
import type { AnatomicalRegion, AnatomyNodeTag } from "@/lib/anatomy-store";

interface Anatomy3DCanvasProps {
  selectedRegion?: AnatomicalRegion | null;
  onSelectRegion?: (region: AnatomicalRegion) => void;
  taggedNodes?: AnatomyNodeTag[];
  interactive?: boolean;
}

export function Anatomy3DCanvas({
  selectedRegion,
  onSelectRegion,
  taggedNodes = [],
  interactive = true,
}: Anatomy3DCanvasProps) {
  const [viewAngle, setViewAngle] = useState<"front" | "back" | "side">("front");
  const [hoveredRegion, setHoveredRegion] = useState<AnatomicalRegion | null>(null);

  const regionLabels: Record<AnatomicalRegion, { uz: string; en: string }> = {
    head: { uz: "Bosh / Miya", en: "Head / Brain" },
    chest: { uz: "Ko'krak / Yurak", en: "Chest / Heart" },
    abdomen: { uz: "Qorin / Oshqozon", en: "Abdomen / GI" },
    spine: { uz: "Umurtqa / Orqa", en: "Spine / Back" },
    left_arm: { uz: "Chap Qo'l", en: "Left Arm" },
    right_arm: { uz: "O'ng Qo'l", en: "Right Arm" },
    legs: { uz: "Oyoqlar / Bo'g'imlar", en: "Legs / Joints" },
  };

  const getNodeForRegion = (region: AnatomicalRegion) => {
    return taggedNodes.find((n) => n.region === region);
  };

  const getSeverityGlowColor = (region: AnatomicalRegion) => {
    const node = getNodeForRegion(region);
    if (!node) return null;
    switch (node.severity) {
      case "high":
        return "text-red-500 fill-red-500/40 stroke-red-400 animate-pulse";
      case "moderate":
        return "text-amber-500 fill-amber-500/40 stroke-amber-400";
      case "low":
        return "text-emerald-500 fill-emerald-500/40 stroke-emerald-400";
    }
  };

  const isSelected = (region: AnatomicalRegion) => selectedRegion === region;
  const isHovered = (region: AnatomicalRegion) => hoveredRegion === region;

  const handleRegionClick = (region: AnatomicalRegion) => {
    if (!interactive) return;
    onSelectRegion?.(region);
  };

  return (
    <div className="relative w-full h-[520px] bg-slate-950 rounded-2xl border border-slate-800 p-4 flex flex-col items-center justify-between overflow-hidden shadow-2xl select-none font-sans">
      {/* Top 3D View Angle Controls */}
      <div className="w-full flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-xs font-mono font-bold text-slate-300">
            3D ANATOMY MODEL · {viewAngle.toUpperCase()} VIEW
          </span>
        </div>
        <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1 text-[11px] font-semibold text-slate-300">
          <button
            type="button"
            onClick={() => setViewAngle("front")}
            className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
              viewAngle === "front" ? "bg-emerald-600 text-white font-bold" : "hover:bg-slate-800"
            }`}
          >
            Oldi / Front
          </button>
          <button
            type="button"
            onClick={() => setViewAngle("back")}
            className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
              viewAngle === "back" ? "bg-emerald-600 text-white font-bold" : "hover:bg-slate-800"
            }`}
          >
            Orqa / Back
          </button>
          <button
            type="button"
            onClick={() => setViewAngle("side")}
            className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
              viewAngle === "side" ? "bg-emerald-600 text-white font-bold" : "hover:bg-slate-800"
            }`}
          >
            Yon / Side
          </button>
        </div>
      </div>

      {/* Interactive 3D Human Anatomy Vector Canvas */}
      <div className="relative w-full max-w-[280px] h-[400px] flex items-center justify-center">
        <svg
          viewBox="0 0 200 400"
          className="w-full h-full drop-shadow-[0_0_15px_rgba(16,185,129,0.15)] transition-all duration-300"
        >
          <defs>
            <filter id="glow-red" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glow-emerald" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Base Human Silhouette Mesh */}
          <g className="stroke-slate-700 stroke-1 fill-slate-900/80 transition-all duration-300">
            {/* Head Mesh */}
            <circle
              cx="100"
              cy="45"
              r="22"
              onMouseEnter={() => setHoveredRegion("head")}
              onMouseLeave={() => setHoveredRegion(null)}
              onClick={() => handleRegionClick("head")}
              className={`cursor-pointer transition-all duration-200 ${
                isSelected("head")
                  ? "fill-emerald-500/40 stroke-emerald-400 stroke-2"
                  : isHovered("head")
                  ? "fill-slate-800 stroke-emerald-500"
                  : getSeverityGlowColor("head") || "fill-slate-900"
              }`}
            />

            {/* Spine Node (Back View Only) */}
            {viewAngle === "back" && (
              <rect
                x="94"
                y="75"
                width="12"
                height="110"
                rx="6"
                onMouseEnter={() => setHoveredRegion("spine")}
                onMouseLeave={() => setHoveredRegion(null)}
                onClick={() => handleRegionClick("spine")}
                className={`cursor-pointer transition-all duration-200 ${
                  isSelected("spine")
                    ? "fill-emerald-500/40 stroke-emerald-400 stroke-2"
                    : isHovered("spine")
                    ? "fill-slate-800 stroke-emerald-500"
                    : getSeverityGlowColor("spine") || "fill-slate-900"
                }`}
              />
            )}

            {/* Chest Mesh */}
            {viewAngle !== "back" && (
              <path
                d="M 70,72 Q 100,68 130,72 L 125,130 Q 100,135 75,130 Z"
                onMouseEnter={() => setHoveredRegion("chest")}
                onMouseLeave={() => setHoveredRegion(null)}
                onClick={() => handleRegionClick("chest")}
                className={`cursor-pointer transition-all duration-200 ${
                  isSelected("chest")
                    ? "fill-emerald-500/40 stroke-emerald-400 stroke-2"
                    : isHovered("chest")
                    ? "fill-slate-800 stroke-emerald-500"
                    : getSeverityGlowColor("chest") || "fill-slate-900"
                }`}
              />
            )}

            {/* Abdomen Mesh */}
            {viewAngle !== "back" && (
              <path
                d="M 75,132 Q 100,135 125,132 L 120,185 Q 100,192 80,185 Z"
                onMouseEnter={() => setHoveredRegion("abdomen")}
                onMouseLeave={() => setHoveredRegion(null)}
                onClick={() => handleRegionClick("abdomen")}
                className={`cursor-pointer transition-all duration-200 ${
                  isSelected("abdomen")
                    ? "fill-emerald-500/40 stroke-emerald-400 stroke-2"
                    : isHovered("abdomen")
                    ? "fill-slate-800 stroke-emerald-500"
                    : getSeverityGlowColor("abdomen") || "fill-slate-900"
                }`}
              />
            )}

            {/* Left Arm Mesh */}
            <path
              d="M 132,74 Q 148,110 152,150 Q 156,180 158,200"
              strokeWidth="14"
              strokeLinecap="round"
              onMouseEnter={() => setHoveredRegion("left_arm")}
              onMouseLeave={() => setHoveredRegion(null)}
              onClick={() => handleRegionClick("left_arm")}
              className={`cursor-pointer transition-all duration-200 ${
                isSelected("left_arm")
                  ? "stroke-emerald-400 fill-none"
                  : isHovered("left_arm")
                  ? "stroke-emerald-500 fill-none"
                  : getSeverityGlowColor("left_arm") || "stroke-slate-800 fill-none"
              }`}
            />

            {/* Right Arm Mesh */}
            <path
              d="M 68,74 Q 52,110 48,150 Q 44,180 42,200"
              strokeWidth="14"
              strokeLinecap="round"
              onMouseEnter={() => setHoveredRegion("right_arm")}
              onMouseLeave={() => setHoveredRegion(null)}
              onClick={() => handleRegionClick("right_arm")}
              className={`cursor-pointer transition-all duration-200 ${
                isSelected("right_arm")
                  ? "stroke-emerald-400 fill-none"
                  : isHovered("right_arm")
                  ? "stroke-emerald-500 fill-none"
                  : getSeverityGlowColor("right_arm") || "stroke-slate-800 fill-none"
              }`}
            />

            {/* Legs Mesh */}
            <g
              onMouseEnter={() => setHoveredRegion("legs")}
              onMouseLeave={() => setHoveredRegion(null)}
              onClick={() => handleRegionClick("legs")}
              className={`cursor-pointer transition-all duration-200 ${
                isSelected("legs")
                  ? "stroke-emerald-400"
                  : isHovered("legs")
                  ? "stroke-emerald-500"
                  : getSeverityGlowColor("legs") || "stroke-slate-800"
              }`}
            >
              <path d="M 85,190 Q 80,270 78,370" strokeWidth="18" strokeLinecap="round" fill="none" />
              <path d="M 115,190 Q 120,270 122,370" strokeWidth="18" strokeLinecap="round" fill="none" />
            </g>
          </g>

          {/* Node Severity Glowing Indicators Overlay */}
          {taggedNodes.map((node) => {
            let coords = { x: 100, y: 100 };
            if (node.region === "head") coords = { x: 100, y: 45 };
            if (node.region === "chest") coords = { x: 100, y: 100 };
            if (node.region === "abdomen") coords = { x: 100, y: 155 };
            if (node.region === "spine") coords = { x: 100, y: 130 };
            if (node.region === "left_arm") coords = { x: 145, y: 140 };
            if (node.region === "right_arm") coords = { x: 55, y: 140 };
            if (node.region === "legs") coords = { x: 100, y: 280 };

            const colorClass =
              node.severity === "high"
                ? "fill-red-500 stroke-red-300 animate-ping"
                : node.severity === "moderate"
                ? "fill-amber-500 stroke-amber-300"
                : "fill-emerald-500 stroke-emerald-300";

            return (
              <g key={node.region}>
                <circle cx={coords.x} cy={coords.y} r="8" className={colorClass} opacity="0.8" />
                <circle cx={coords.x} cy={coords.y} r="4" className="fill-white" />
              </g>
            );
          })}
        </svg>
      </div>

      {/* Bottom Region Tooltip Status */}
      <div className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-center text-xs">
        {hoveredRegion ? (
          <span className="text-emerald-300 font-bold font-mono">
            🎯 {regionLabels[hoveredRegion].uz} ({regionLabels[hoveredRegion].en})
          </span>
        ) : selectedRegion ? (
          <span className="text-emerald-400 font-bold">
            📍 Tanlangan a'zo: {regionLabels[selectedRegion].uz}
          </span>
        ) : (
          <span className="text-slate-400 text-[11px]">
            {interactive
              ? "Symptom biriktirish uchun 3D odam tanasi a'zosini bosing"
              : "Bemorning 3D anomaliya sohalari ko'rsatilgan"}
          </span>
        )}
      </div>
    </div>
  );
}

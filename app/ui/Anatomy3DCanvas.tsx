"use client";

/* eslint-disable react/no-unescaped-entities */
import { useEffect, useRef, useState } from "react";
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
  const [rotationY, setRotationY] = useState(0);
  const [isAutoRotating, setIsAutoRotating] = useState(false);
  const [hoveredRegion, setHoveredRegion] = useState<AnatomicalRegion | null>(null);

  const requestRef = useRef<number | null>(null);

  // Smooth 60 FPS requestAnimationFrame Loop for 3D Auto-Rotation
  useEffect(() => {
    if (!isAutoRotating) {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      return;
    }

    const animate = () => {
      setRotationY((prev) => (prev + 0.8) % 360);
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isAutoRotating]);

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
        return "fill-red-500/50 stroke-red-400 animate-pulse stroke-2";
      case "moderate":
        return "fill-amber-500/50 stroke-amber-400 stroke-2";
      case "low":
        return "fill-emerald-500/50 stroke-emerald-400 stroke-2";
    }
  };

  const isSelected = (region: AnatomicalRegion) => selectedRegion === region;
  const isHovered = (region: AnatomicalRegion) => hoveredRegion === region;

  const handleRegionClick = (region: AnatomicalRegion) => {
    if (!interactive) return;
    onSelectRegion?.(region);
  };

  // Compute effective Y rotation based on viewAngle or free rotation
  const computedRotationY =
    viewAngle === "back" ? 180 : viewAngle === "side" ? 90 : rotationY;

  return (
    <div className="relative w-full h-[540px] bg-slate-950 rounded-2xl border border-slate-800 p-4 flex flex-col items-center justify-between overflow-hidden shadow-2xl select-none font-sans">
      {/* Top 3D View Angle & Auto-Rotate Controls */}
      <div className="w-full flex items-center justify-between z-10 gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-xs font-mono font-bold text-slate-300">
            3D ANATOMY MODEL · {Math.round(computedRotationY)}° Y-AXIS
          </span>
        </div>

        <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1 text-[11px] font-semibold text-slate-300 gap-1">
          <button
            type="button"
            onClick={() => {
              setIsAutoRotating(false);
              setViewAngle("front");
              setRotationY(0);
            }}
            className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
              viewAngle === "front" && !isAutoRotating
                ? "bg-emerald-600 text-white font-bold shadow-xs"
                : "hover:bg-slate-800"
            }`}
          >
            Oldi / Front
          </button>
          <button
            type="button"
            onClick={() => {
              setIsAutoRotating(false);
              setViewAngle("back");
              setRotationY(180);
            }}
            className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
              viewAngle === "back" && !isAutoRotating
                ? "bg-emerald-600 text-white font-bold shadow-xs"
                : "hover:bg-slate-800"
            }`}
          >
            Orqa / Back
          </button>
          <button
            type="button"
            onClick={() => {
              setIsAutoRotating(false);
              setViewAngle("side");
              setRotationY(90);
            }}
            className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
              viewAngle === "side" && !isAutoRotating
                ? "bg-emerald-600 text-white font-bold shadow-xs"
                : "hover:bg-slate-800"
            }`}
          >
            Yon / Side
          </button>
          <button
            type="button"
            onClick={() => setIsAutoRotating((prev) => !prev)}
            className={`px-2.5 py-1 rounded-lg transition cursor-pointer border ${
              isAutoRotating
                ? "bg-red-500/20 text-red-300 border-red-500/40 font-bold"
                : "bg-slate-800 text-slate-300 border-slate-700 hover:text-white"
            }`}
          >
            {isAutoRotating ? "⏹️ Stop 60FPS" : "🔄 360° Rotate"}
          </button>
        </div>
      </div>

      {/* GPU-Accelerated 3D Interactive Human Model Mesh Container */}
      <div
        className="relative w-full max-w-[290px] h-[410px] flex items-center justify-center transition-transform duration-100 ease-linear transform-gpu"
        style={{
          transform: `perspective(800px) rotateY(${computedRotationY}deg)`,
        }}
      >
        <svg
          viewBox="0 0 200 400"
          className="w-full h-full drop-shadow-[0_0_20px_rgba(16,185,129,0.2)]"
        >
          {/* Head Mesh */}
          <circle
            cx="100"
            cy="45"
            r="22"
            onMouseEnter={() => setHoveredRegion("head")}
            onMouseLeave={() => setHoveredRegion(null)}
            onClick={() => handleRegionClick("head")}
            className={`cursor-pointer transition-all duration-200 pointer-events-auto ${
              isSelected("head")
                ? "fill-emerald-500/50 stroke-emerald-300 stroke-2"
                : isHovered("head")
                ? "fill-emerald-600/40 stroke-emerald-400 stroke-2"
                : getSeverityGlowColor("head") || "fill-slate-900/90 stroke-slate-700"
            }`}
          />

          {/* Spine Mesh */}
          <rect
            x="93"
            y="72"
            width="14"
            height="115"
            rx="7"
            onMouseEnter={() => setHoveredRegion("spine")}
            onMouseLeave={() => setHoveredRegion(null)}
            onClick={() => handleRegionClick("spine")}
            className={`cursor-pointer transition-all duration-200 pointer-events-auto ${
              isSelected("spine")
                ? "fill-emerald-500/50 stroke-emerald-300 stroke-2"
                : isHovered("spine")
                ? "fill-emerald-600/40 stroke-emerald-400 stroke-2"
                : getSeverityGlowColor("spine") || "fill-slate-900/90 stroke-slate-700"
            }`}
          />

          {/* Chest Mesh */}
          <path
            d="M 68,72 Q 100,66 132,72 L 126,132 Q 100,138 74,132 Z"
            onMouseEnter={() => setHoveredRegion("chest")}
            onMouseLeave={() => setHoveredRegion(null)}
            onClick={() => handleRegionClick("chest")}
            className={`cursor-pointer transition-all duration-200 pointer-events-auto ${
              isSelected("chest")
                ? "fill-emerald-500/50 stroke-emerald-300 stroke-2"
                : isHovered("chest")
                ? "fill-emerald-600/40 stroke-emerald-400 stroke-2"
                : getSeverityGlowColor("chest") || "fill-slate-900/90 stroke-slate-700"
            }`}
          />

          {/* Abdomen Mesh */}
          <path
            d="M 74,134 Q 100,138 126,134 L 120,188 Q 100,195 80,188 Z"
            onMouseEnter={() => setHoveredRegion("abdomen")}
            onMouseLeave={() => setHoveredRegion(null)}
            onClick={() => handleRegionClick("abdomen")}
            className={`cursor-pointer transition-all duration-200 pointer-events-auto ${
              isSelected("abdomen")
                ? "fill-emerald-500/50 stroke-emerald-300 stroke-2"
                : isHovered("abdomen")
                ? "fill-emerald-600/40 stroke-emerald-400 stroke-2"
                : getSeverityGlowColor("abdomen") || "fill-slate-900/90 stroke-slate-700"
            }`}
          />

          {/* Left Arm Mesh */}
          <path
            d="M 132,74 Q 148,110 152,150 Q 156,180 158,200"
            strokeWidth="16"
            strokeLinecap="round"
            onMouseEnter={() => setHoveredRegion("left_arm")}
            onMouseLeave={() => setHoveredRegion(null)}
            onClick={() => handleRegionClick("left_arm")}
            className={`cursor-pointer transition-all duration-200 pointer-events-auto ${
              isSelected("left_arm")
                ? "stroke-emerald-400 fill-emerald-500/20"
                : isHovered("left_arm")
                ? "stroke-emerald-400 fill-emerald-600/30"
                : getSeverityGlowColor("left_arm") || "stroke-slate-700 fill-slate-900/90"
            }`}
          />

          {/* Right Arm Mesh */}
          <path
            d="M 68,74 Q 52,110 48,150 Q 44,180 42,200"
            strokeWidth="16"
            strokeLinecap="round"
            onMouseEnter={() => setHoveredRegion("right_arm")}
            onMouseLeave={() => setHoveredRegion(null)}
            onClick={() => handleRegionClick("right_arm")}
            className={`cursor-pointer transition-all duration-200 pointer-events-auto ${
              isSelected("right_arm")
                ? "stroke-emerald-400 fill-emerald-500/20"
                : isHovered("right_arm")
                ? "stroke-emerald-400 fill-emerald-600/30"
                : getSeverityGlowColor("right_arm") || "stroke-slate-700 fill-slate-900/90"
            }`}
          />

          {/* Legs Mesh */}
          <g
            onMouseEnter={() => setHoveredRegion("legs")}
            onMouseLeave={() => setHoveredRegion(null)}
            onClick={() => handleRegionClick("legs")}
            className={`cursor-pointer transition-all duration-200 pointer-events-auto ${
              isSelected("legs")
                ? "stroke-emerald-400 fill-emerald-500/20"
                : isHovered("legs")
                ? "stroke-emerald-400 fill-emerald-600/30"
                : getSeverityGlowColor("legs") || "stroke-slate-700 fill-slate-900/90"
            }`}
          >
            <path d="M 85,190 Q 80,270 78,370" strokeWidth="20" strokeLinecap="round" />
            <path d="M 115,190 Q 120,270 122,370" strokeWidth="20" strokeLinecap="round" />
          </g>

          {/* Tagged Severity Nodes Overlay */}
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
              <g key={node.region} className="pointer-events-none">
                <circle cx={coords.x} cy={coords.y} r="10" className={colorClass} opacity="0.85" />
                <circle cx={coords.x} cy={coords.y} r="5" className="fill-white" />
              </g>
            );
          })}
        </svg>
      </div>

      {/* Bottom Tooltip Status Bar */}
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

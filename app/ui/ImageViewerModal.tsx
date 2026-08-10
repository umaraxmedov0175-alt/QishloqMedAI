"use client";

import React, { useState } from "react";
import { useLanguage } from "@/lib/i18n";

export interface AnnotationPin {
  id: string;
  xPercent: number;
  yPercent: number;
  note: string;
}

interface ImageViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  imageTitle?: string;
}

export function ImageViewerModal({
  isOpen,
  onClose,
  imageSrc,
  imageTitle = "Diagnostic Asset",
}: ImageViewerModalProps) {
  const { t } = useLanguage();

  const [zoom, setZoom] = useState<number>(100);
  const [brightness, setBrightness] = useState<number>(100);
  const [contrast, setContrast] = useState<number>(100);
  const [rotation, setRotation] = useState<number>(0);
  const [annotations, setAnnotations] = useState<AnnotationPin[]>([]);
  const [isAnnotating, setIsAnnotating] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isAnnotating) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const xPercent = ((e.clientX - rect.left) / rect.width) * 100;
    const yPercent = ((e.clientY - rect.top) / rect.height) * 100;

    const note = prompt(t("clickToAnnotate")) || "Observation Pin";
    if (note) {
      setAnnotations((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          xPercent,
          yPercent,
          note,
        },
      ]);
    }
    setIsAnnotating(false);
  };

  const resetControls = () => {
    setZoom(100);
    setBrightness(100);
    setContrast(100);
    setRotation(0);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <div className="flex flex-col w-full max-w-5xl h-[85vh] bg-slate-900 rounded-xl border border-slate-700 shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center space-x-3">
            <span className="p-2 bg-sky-500/20 text-sky-400 rounded-lg font-mono text-sm font-semibold">
              HD VIEWER
            </span>
            <h3 className="font-semibold text-lg">{imageTitle}</h3>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-sm bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 font-medium transition"
          >
            {t("close")}
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-4 px-6 py-3 bg-slate-900 border-b border-slate-800 text-xs">
          <div className="flex items-center space-x-2">
            <span className="text-slate-400">Zoom:</span>
            <button
              onClick={() => setZoom((z) => Math.max(50, z - 25))}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded"
            >
              -
            </button>
            <span className="w-12 text-center font-mono">{zoom}%</span>
            <button
              onClick={() => setZoom((z) => Math.min(400, z + 25))}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded"
            >
              +
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-slate-400">{t("brightness")}:</span>
            <input
              type="range"
              min="50"
              max="150"
              value={brightness}
              onChange={(e) => setBrightness(Number(e.target.value))}
              className="w-24 accent-sky-500 cursor-pointer"
            />
            <span className="w-8 font-mono">{brightness}%</span>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-slate-400">{t("contrast")}:</span>
            <input
              type="range"
              min="50"
              max="150"
              value={contrast}
              onChange={(e) => setContrast(Number(e.target.value))}
              className="w-24 accent-sky-500 cursor-pointer"
            />
            <span className="w-8 font-mono">{contrast}%</span>
          </div>

          <button
            onClick={() => setRotation((r) => (r + 90) % 360)}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-200"
          >
            {t("rotate")} ({rotation}°)
          </button>

          <button
            onClick={() => setIsAnnotating(!isAnnotating)}
            className={`px-3 py-1 rounded font-medium transition ${
              isAnnotating
                ? "bg-amber-500 text-slate-950 font-bold"
                : "bg-sky-600 hover:bg-sky-500 text-white"
            }`}
          >
            {isAnnotating ? t("clickToAnnotate") : t("addAnnotation")}
          </button>

          <button
            onClick={resetControls}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded ml-auto"
          >
            {t("resetZoom")}
          </button>
        </div>

        {/* Body Viewport */}
        <div className="flex flex-1 overflow-hidden relative">
          <div
            role="button"
            tabIndex={0}
            className="flex-1 flex items-center justify-center bg-black overflow-auto relative p-8 cursor-crosshair select-none"
            onClick={handleImageClick}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                handleImageClick(e as unknown as React.MouseEvent<HTMLDivElement>);
              }
            }}
          >
            <div
              className="relative transition-transform duration-100 ease-out"
              style={{
                transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                filter: `brightness(${brightness}%) contrast(${contrast}%)`,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageSrc}
                alt="Diagnostic"
                className="max-h-[60vh] object-contain rounded shadow-lg"
              />

              {/* Annotation Markers */}
              {annotations.map((pin, index) => (
                <div
                  key={pin.id}
                  className="absolute z-20 -translate-x-1/2 -translate-y-1/2 flex items-center group cursor-pointer"
                  style={{
                    left: `${pin.xPercent}%`,
                    top: `${pin.yPercent}%`,
                  }}
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-500 text-white text-xs font-bold ring-2 ring-white shadow-md">
                    {index + 1}
                  </span>
                  <div className="hidden group-hover:block absolute left-8 top-0 z-30 bg-slate-900 text-xs text-slate-100 p-2 rounded shadow-xl border border-slate-700 whitespace-nowrap">
                    {pin.note}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Annotations Panel */}
          {annotations.length > 0 && (
            <div className="w-64 bg-slate-950 border-l border-slate-800 p-4 text-xs overflow-y-auto">
              <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
                <span className="font-semibold text-slate-300">
                  Annotations ({annotations.length})
                </span>
                <button
                  onClick={() => setAnnotations([])}
                  className="text-rose-400 hover:underline text-[10px]"
                >
                  {t("clearAnnotations")}
                </button>
              </div>
              <div className="space-y-2">
                {annotations.map((pin, i) => (
                  <div
                    key={pin.id}
                    className="p-2 bg-slate-900 rounded border border-slate-800 flex items-start space-x-2"
                  >
                    <span className="px-1.5 py-0.5 bg-rose-500/20 text-rose-400 font-bold rounded text-[10px]">
                      #{i + 1}
                    </span>
                    <span className="text-slate-300 flex-1">{pin.note}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

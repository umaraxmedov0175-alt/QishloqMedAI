"use client";
/* eslint-disable react/no-unknown-property */

import { Component, type ReactNode, useState, Suspense } from "react";
import dynamic from "next/dynamic";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { type BodyRegionId } from "@/lib/anatomy/regions";
import { useWebGLSupport } from "@/lib/anatomy/useWebGLSupport";
import { BodyMapSVG } from "@/components/anatomy/BodyMapSVG";
import { SelectedRegionsPanel } from "@/components/anatomy/SelectedRegionsPanel";
import { InteractiveBody } from "@/components/anatomy/InteractiveBody";

export interface BodySymptomPickerProps {
  value: BodyRegionId[];
  onChange: (regions: BodyRegionId[]) => void;
  maxSelections?: number;
  locale?: "uz" | "ru" | "en";
  className?: string;
}

// WebGL Error Boundary to catch 3D context loss or GLTF loading failures
interface ErrorBoundaryProps {
  fallback: ReactNode;
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class WebGLErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.warn("WebGL Error Boundary caught rendering error:", error.message);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

export function BodySymptomPickerContent({
  value = [],
  onChange,
  maxSelections = 5,
  locale = "uz",
  className = "",
}: BodySymptomPickerProps) {
  const webglStatus = useWebGLSupport();
  const [force2D, setForce2D] = useState(false);
  const [cameraAzimuth, setCameraAzimuth] = useState(0);

  const toggleMode = () => {
    const nextMode = !force2D;
    setForce2D(nextMode);
    if (typeof window !== "undefined") {
      localStorage.setItem("qm_anatomy_mode", nextMode ? "2d" : "3d");
    }
  };

  const is2DMode = force2D || !webglStatus.isSupported;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Top 3D / 2D Mode Switcher Banner */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-300">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-bold text-white">
            {is2DMode
              ? (locale === "uz" ? "2D Vektor Rejim (Past Quvvat)" : locale === "ru" ? "2D Векторный режим" : "2D Vector Mode")
              : (locale === "uz" ? "3D Interaktiv Odam Modeli" : locale === "ru" ? "3D Интерактивная модель" : "3D Interactive Body Model")}
          </span>
          {webglStatus.reason && (
            <span className="text-[10px] text-amber-400 font-mono hidden sm:inline">
              ({webglStatus.reason})
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {!is2DMode && (
            <div className="flex bg-slate-800 p-0.5 rounded-lg border border-slate-700">
              <button
                type="button"
                onClick={() => setCameraAzimuth(0)}
                className={`px-2.5 py-0.5 text-[11px] font-bold rounded transition cursor-pointer ${
                  cameraAzimuth === 0 ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                {locale === "uz" ? "Oldi" : locale === "ru" ? "Спереди" : "Front"}
              </button>
              <button
                type="button"
                onClick={() => setCameraAzimuth(Math.PI)}
                className={`px-2.5 py-0.5 text-[11px] font-bold rounded transition cursor-pointer ${
                  cameraAzimuth === Math.PI ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                {locale === "uz" ? "Orqasi" : locale === "ru" ? "Сзади" : "Back"}
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={toggleMode}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 font-bold rounded-lg border border-slate-700 transition cursor-pointer text-[11px]"
          >
            {is2DMode ? "🧊 3D Rejimga o'tish" : "⚡ 2D Rejimga o'tish"}
          </button>
        </div>
      </div>

      {/* Main 3D Canvas / 2D Vector SVG Fallback */}
      {is2DMode ? (
        <BodyMapSVG
          value={value}
          onChange={onChange}
          maxSelections={maxSelections}
          locale={locale}
        />
      ) : (
        <WebGLErrorBoundary
          fallback={
            <BodyMapSVG
              value={value}
              onChange={onChange}
              maxSelections={maxSelections}
              locale={locale}
            />
          }
        >
          <div className="relative w-full h-[420px] bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <Canvas
              dpr={[1, 1.5]}
              gl={{ antialias: false, powerPreference: "low-power" }}
              shadows={false}
              className="w-full h-full"
            >
              <PerspectiveCamera makeDefault position={[0, 0, 4.2]} fov={35} />
              <ambientLight intensity={0.8} />
              <directionalLight position={[2, 4, 3]} intensity={1.2} />

              <Suspense fallback={null}>
                <InteractiveBody
                  value={value}
                  onChange={onChange}
                  maxSelections={maxSelections}
                  locale={locale}
                  isBackView={cameraAzimuth === Math.PI}
                />
              </Suspense>

              <OrbitControls
                enablePan={false}
                enableZoom={true}
                minPolarAngle={Math.PI / 2 - 0.2}
                maxPolarAngle={Math.PI / 2 + 0.2}
                minDistance={3.0}
                maxDistance={5.5}
                rotateSpeed={0.8}
              />
            </Canvas>
          </div>
        </WebGLErrorBoundary>
      )}

      {/* Selected Regions Control Panel */}
      <SelectedRegionsPanel
        value={value}
        onChange={onChange}
        locale={locale}
      />
    </div>
  );
}

// Export dynamic client-side component (never renders SSR)
export const BodySymptomPicker = dynamic(
  () => Promise.resolve(BodySymptomPickerContent),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[420px] bg-slate-900 border border-slate-800 rounded-2xl flex flex-col items-center justify-center p-6 text-slate-400 space-y-3 animate-pulse">
        <span className="text-3xl">🧍</span>
        <span className="text-xs font-bold font-mono">3D Interactive Anatomy Model Loading…</span>
      </div>
    ),
  }
);

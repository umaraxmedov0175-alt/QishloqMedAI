"use client";

interface CarePulseProps {
  spo2?: number;
  heartRate?: number;
  systolicBp?: number;
  diastolicBp?: number;
  isCriticalOverride?: boolean;
  label?: string;
  className?: string;
}

export function CarePulse({
  spo2 = 96,
  heartRate = 72,
  systolicBp = 120,
  diastolicBp = 80,
  isCriticalOverride = false,
  label = "Care Pulse Live Telemetry",
  className = "",
}: CarePulseProps) {
  const isCritical =
    isCriticalOverride || spo2 < 92 || systolicBp >= 160 || diastolicBp >= 100;

  const bpm = isCritical ? Math.max(heartRate, 110) : heartRate;
  const pulseDurationSec = 60 / bpm; // Dynamic animation duration in seconds

  const themeColor = isCritical ? "#EF4444" : "#10B981";
  const themeBg = isCritical ? "bg-red-950/40 border-red-500/40" : "bg-emerald-950/40 border-emerald-500/40";
  const glowShadow = isCritical ? "shadow-red-500/30" : "shadow-emerald-500/30";

  return (
    <div
      className={`relative overflow-hidden rounded-xl border p-4 backdrop-blur-md transition-all duration-500 ${themeBg} ${glowShadow} shadow-lg ${className}`}
    >
      {/* Background Radial Ambient Pulse Glow */}
      <div
        className="absolute inset-0 pointer-events-none rounded-xl transition-opacity duration-500 opacity-20"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${themeColor} 0%, transparent 70%)`,
          animation: `carePulseGlow ${pulseDurationSec}s infinite ease-in-out`,
        }}
      />

      {/* Header Bar */}
      <div className="relative z-10 flex items-center justify-between mb-3 text-xs">
        <div className="flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-full flex items-center justify-center"
            style={{ backgroundColor: themeColor }}
          >
            <span
              className="w-3 h-3 rounded-full animate-ping opacity-75"
              style={{ backgroundColor: themeColor }}
            />
          </span>
          <span className="font-bold text-white uppercase tracking-wider font-mono">
            {label}
          </span>
        </div>

        <div className="flex items-center gap-3 font-mono font-bold text-xs">
          <span className={isCritical ? "text-red-400 font-extrabold" : "text-emerald-400"}>
            SpO₂: {spo2}%
          </span>
          <span className="text-white">HR: {bpm} bpm</span>
          <span className={systolicBp >= 140 ? "text-amber-400" : "text-slate-300"}>
            BP: {systolicBp}/{diastolicBp}
          </span>
        </div>
      </div>

      {/* Live Animated ECG Waveform Canvas / SVG */}
      <div className="relative z-10 h-16 w-full bg-slate-950/60 rounded-lg overflow-hidden border border-slate-800 flex items-center">
        <svg
          className="w-full h-full"
          viewBox="0 0 500 100"
          preserveAspectRatio="none"
        >
          {/* Grid Background */}
          <pattern
            id="ecg-grid"
            width="20"
            height="20"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 20 0 L 0 0 0 20"
              fill="none"
              stroke="rgba(255,255,255,0.05)"
              strokeWidth="1"
            />
          </pattern>
          <rect width="100%" height="100%" fill="url(#ecg-grid)" />

          {/* ECG Wave Path */}
          <path
            d="M 0 50 L 80 50 L 90 40 L 100 60 L 110 50 L 140 50 L 150 15 L 165 90 L 180 35 L 195 65 L 205 50 L 250 50 L 260 42 L 270 58 L 280 50 L 340 50 L 350 15 L 365 90 L 380 35 L 395 65 L 405 50 L 500 50"
            fill="none"
            stroke={themeColor}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              strokeDasharray: "500",
              animation: `ecgDash ${pulseDurationSec * 2}s linear infinite`,
            }}
          />
        </svg>

        {/* Pulse Leading Light Beam */}
        <div
          className="absolute top-0 bottom-0 w-8 bg-gradient-to-r from-transparent to-white/30 pointer-events-none"
          style={{
            animation: `ecgBeam ${pulseDurationSec * 2}s linear infinite`,
          }}
        />
      </div>

      {/* Critical Alert Warning Bar */}
      {isCritical && (
        <div className="relative z-10 mt-2 p-2 bg-red-900/60 border border-red-500/50 rounded-lg text-red-200 text-xs font-bold flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-1.5">
            <span>🚨</span>
            <span>KRITIK VITAL KOʻRSATKICHLAR DIQQAT TALAB ETADI</span>
          </div>
          <span className="font-mono text-[10px] bg-red-800 px-2 py-0.5 rounded text-white uppercase">
            Tezkor Triage
          </span>
        </div>
      )}
    </div>
  );
}

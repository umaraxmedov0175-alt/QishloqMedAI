"use client";

interface TomirLogoProps {
  size?: "sm" | "md" | "lg";
  variant?: "light" | "dark" | "glass";
  showSubtitle?: boolean;
  className?: string;
}

export function TomirLogo({
  size = "md",
  variant = "dark",
  showSubtitle = true,
  className = "",
}: TomirLogoProps) {
  const iconSizes = {
    sm: "w-7 h-7",
    md: "w-9 h-9",
    lg: "w-12 h-12",
  };

  const textSizes = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-3xl",
  };

  const badgeSizes = {
    sm: "text-[9px] px-1.5 py-0.5",
    md: "text-[10px] px-2 py-0.5",
    lg: "text-xs px-2.5 py-1",
  };

  const isLight = variant === "light";
  const isGlass = variant === "glass";

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Icon: Pulse Wave into Geometric Leaf/Node */}
      <div
        className={`relative ${iconSizes[size]} rounded-xl flex items-center justify-center transition-all duration-300 shadow-md ${
          isGlass
            ? "bg-white/10 backdrop-blur-md border border-white/20 text-emerald-400"
            : isLight
            ? "bg-emerald-950 text-emerald-400 border border-emerald-800/40"
            : "bg-emerald-600 text-white shadow-emerald-600/30 shadow-lg"
        }`}
      >
        <svg
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full p-1.5"
        >
          {/* Outer Ring / Node Orbit */}
          <circle
            cx="20"
            cy="20"
            r="16"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray="4 2"
            className="opacity-40 animate-spin-slow"
          />
          {/* Vein / Pulse SVG Path */}
          <path
            d="M6 20H13L16 11L21 29L25 15L28 22H34"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Node Dots */}
          <circle cx="21" cy="29" r="2" fill="currentColor" />
          <circle cx="25" cy="15" r="2" fill="currentColor" />
        </svg>

        {/* Ambient Pulse Dot */}
        <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping opacity-75" />
      </div>

      {/* Brand Text */}
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          <span
            className={`font-serif font-extrabold tracking-tight ${textSizes[size]} ${
              isGlass || isLight ? "text-white" : "text-slate-900"
            }`}
          >
            Tomir
          </span>
          <span
            className={`font-mono font-bold rounded-md uppercase tracking-wider ${badgeSizes[size]} ${
              isGlass
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30"
                : isLight
                ? "bg-emerald-500/30 text-emerald-200 border border-emerald-400/30"
                : "bg-emerald-100 text-emerald-900 border border-emerald-200"
            }`}
          >
            AI
          </span>
        </div>
        {showSubtitle && (
          <span
            className={`text-[10px] font-semibold tracking-wider uppercase -mt-0.5 ${
              isGlass || isLight ? "text-emerald-300/80" : "text-slate-500"
            }`}
          >
            Qishloq Med AI Ecosystem
          </span>
        )}
      </div>
    </div>
  );
}

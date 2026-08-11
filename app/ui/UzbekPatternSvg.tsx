"use client";

interface UzbekPatternSvgProps {
  className?: string;
  opacity?: number;
  color?: string;
}

export function UzbekPatternSvg({
  className = "",
  opacity = 0.08,
  color = "currentColor",
}: UzbekPatternSvgProps) {
  return (
    <svg
      viewBox="0 0 200 200"
      xmlns="http://www.w3.org/2000/svg"
      className={`pointer-events-none select-none ${className}`}
      style={{ opacity }}
      aria-hidden="true"
    >
      <defs>
        <pattern
          id="islimi-pattern"
          width="40"
          height="40"
          patternUnits="userSpaceOnUse"
        >
          {/* Traditional Uzbek Octagonal Star / Islimi Tile Motif */}
          <path
            d="M20 0 L25 15 L40 20 L25 25 L20 40 L15 25 L0 20 L15 15 Z"
            fill="none"
            stroke={color}
            strokeWidth="0.8"
          />
          <circle cx="20" cy="20" r="4" fill="none" stroke={color} strokeWidth="0.6" />
          <path
            d="M0 0 L10 10 M40 0 L30 10 M40 40 L30 30 M0 40 L10 30"
            stroke={color}
            strokeWidth="0.5"
            strokeDasharray="1 1"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#islimi-pattern)" />
    </svg>
  );
}

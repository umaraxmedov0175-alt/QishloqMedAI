"use client";

import { useMemo } from "react";
import type { AnatomicalRegion, AnatomyNodeTag } from "@/lib/anatomy-store";

interface Anatomy3DCanvasProps {
  selectedRegion?: AnatomicalRegion | null;
  onSelectRegion?: (region: AnatomicalRegion) => void;
  taggedNodes?: AnatomyNodeTag[];
  interactive?: boolean;
}

export function Anatomy3DCanvas({
  selectedRegion = null,
  taggedNodes = [],
}: Anatomy3DCanvasProps) {
  const iframeSrc = useMemo(() => {
    const params = new URLSearchParams();

    if (selectedRegion) {
      params.set("region", selectedRegion);
    }

    if (taggedNodes.length > 0) {
      params.set(
        "tags",
        taggedNodes.map((node) => node.region).join(","),
      );
    }

    return `/anatomy-viewer${params.toString() ? `?${params}` : ""}`;
  }, [selectedRegion, taggedNodes]);

  return (
    <div className="relative w-full h-[520px] overflow-hidden rounded-2xl border border-slate-800 bg-slate-950">
      <div class="sketchfab-embed-wrapper"> <iframe title="Ecorche Anatomy Study" frameborder="0" allowfullscreen mozallowfullscreen="true" webkitallowfullscreen="true" allow="autoplay; fullscreen; xr-spatial-tracking" xr-spatial-tracking execution-while-out-of-viewport execution-while-not-rendered web-share src="https://sketchfab.com/models/85249bf91630484dbfa60fee568875d3/embed"> </iframe> <p style="font-size: 13px; font-weight: normal; margin: 5px; color: #4A4A4A;"> <a href="https://sketchfab.com/3d-models/ecorche-anatomy-study-85249bf91630484dbfa60fee568875d3" target="_blank" rel="nofollow" style="font-weight: bold; color: #1CAAD9;"> Ecorche Anatomy Study </a> by <a href="https://sketchfab.com/naiis" target="_blank" rel="nofollow" style="font-weight: bold; color: #1CAAD9;"> Anaïs Sánchez </a> on <a href="https://sketchfab.com" target="_blank" rel="nofollow" style="font-weight: bold; color: #1CAAD9;">Sketchfab</a></p></div>

      <div className="absolute top-3 left-3 pointer-events-none">
        <span className="px-2.5 py-1 rounded-lg bg-slate-900/80 border border-slate-700 text-[10px] font-mono text-emerald-400">
          3D ANATOMY VIEWER
        </span>
      </div>
    </div>
  );
}
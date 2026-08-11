"use client";

import { useEffect, useRef, useState } from "react";

export interface DistrictNode {
  id: string;
  name: string;
  region: string;
  x: number; // percentage coordinate 0-100 on canvas
  y: number; // percentage coordinate 0-100 on canvas
  activeCases: number;
  criticalCases: number;
  nearestHospital: string;
}

const DEMO_NODES: DistrictNode[] = [
  { id: "urgut", name: "Urgut", region: "Samarqand", x: 60, y: 62, activeCases: 14, criticalCases: 3, nearestHospital: "Urgut Tuman Markaziy Kasalxonasi" },
  { id: "payariq", name: "Payariq", region: "Samarqand", x: 55, y: 55, activeCases: 8, criticalCases: 1, nearestHospital: "Payariq Tuman Tibbiyot Birlashmasi" },
  { id: "zomin", name: "Zomin", region: "Jizzax", x: 68, y: 58, activeCases: 11, criticalCases: 2, nearestHospital: "Zomin Tuman Markaziy Kasalxonasi" },
  { id: "baxmal", name: "Baxmal", region: "Jizzax", x: 65, y: 65, activeCases: 6, criticalCases: 0, nearestHospital: "Baxmal Tuman Kasalxonasi" },
  { id: "kegeyli", name: "Kegeyli", region: "Qoraqalpog'iston", x: 22, y: 35, activeCases: 19, criticalCases: 5, nearestHospital: "Kegeyli District Hospital" },
  { id: "nukus", name: "Nukus", region: "Qoraqalpog'iston", x: 18, y: 38, activeCases: 24, criticalCases: 4, nearestHospital: "Nukus Regional Medical Center" },
  { id: "tashkent", name: "Toshkent Central", region: "Toshkent", x: 82, y: 48, activeCases: 45, criticalCases: 8, nearestHospital: "Tashkent Central Hospital" },
];

interface Particle {
  x: number;
  y: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  progress: number;
  speed: number;
  size: number;
  color: string;
}

interface CinematicUzbekistanMapProps {
  onSelectNode?: (node: DistrictNode) => void;
  className?: string;
  language?: "uz" | "en";
}

export function CinematicUzbekistanMap({
  onSelectNode,
  className = "",
  language = "uz",
}: CinematicUzbekistanMapProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [selectedNode, setSelectedNode] = useState<DistrictNode | null>(DEMO_NODES[0]);
  const [zoomTarget, setZoomTarget] = useState<{ x: number; y: number; scale: number }>({
    x: 0.5,
    y: 0.5,
    scale: 1,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 800);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 450);

    const handleResize = () => {
      if (!canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };

    window.addEventListener("resize", handleResize);

    // Initialize particle streams connecting nodes to regional central hospitals
    const particles: Particle[] = [];
    const createParticle = () => {
      const source = DEMO_NODES[Math.floor(Math.random() * (DEMO_NODES.length - 1))];
      const target = DEMO_NODES[DEMO_NODES.length - 1]; // Toshkent Central or nearest regional
      const sx = (source.x / 100) * width;
      const sy = (source.y / 100) * height;
      const ex = (target.x / 100) * width;
      const ey = (target.y / 100) * height;

      particles.push({
        x: sx,
        y: sy,
        startX: sx,
        startY: sy,
        endX: ex,
        endY: ey,
        progress: 0,
        speed: 0.003 + Math.random() * 0.005,
        size: 2 + Math.random() * 2,
        color: source.criticalCases > 2 ? "#EF4444" : "#10B981",
      });
    };

    for (let i = 0; i < 24; i++) {
      createParticle();
    }

    let currentScale = 1;
    let currentX = width * 0.5;
    let currentY = height * 0.5;

    const render = () => {
      // Smooth interpolation for camera zoom
      const targetX = zoomTarget.x * width;
      const targetY = zoomTarget.y * height;
      currentX += (targetX - currentX) * 0.05;
      currentY += (targetY - currentY) * 0.05;
      currentScale += (zoomTarget.scale - currentScale) * 0.05;

      ctx.save();
      ctx.clearRect(0, 0, width, height);

      // Deep Navy background fill
      ctx.fillStyle = "#0A1128";
      ctx.fillRect(0, 0, width, height);

      // Draw subtle grid lines
      ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw Uzbekistan Stylized Vector Boundary Outline
      ctx.strokeStyle = "rgba(14, 165, 233, 0.25)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      // Approximate map bounds contour
      ctx.moveTo(width * 0.1, height * 0.35);
      ctx.lineTo(width * 0.35, height * 0.25);
      ctx.lineTo(width * 0.55, height * 0.45);
      ctx.lineTo(width * 0.85, height * 0.4);
      ctx.lineTo(width * 0.75, height * 0.75);
      ctx.lineTo(width * 0.45, height * 0.7);
      ctx.lineTo(width * 0.15, height * 0.55);
      ctx.closePath();
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw connection lines between nodes
      DEMO_NODES.forEach((node) => {
        const nx = (node.x / 100) * width;
        const ny = (node.y / 100) * height;

        DEMO_NODES.forEach((other) => {
          if (node.id !== other.id && node.region === other.region) {
            const ox = (other.x / 100) * width;
            const oy = (other.y / 100) * height;
            ctx.beginPath();
            ctx.moveTo(nx, ny);
            ctx.lineTo(ox, oy);
            ctx.strokeStyle = "rgba(16, 185, 129, 0.15)";
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        });
      });

      // Update and draw streaming particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.progress += p.speed;
        if (p.progress >= 1) {
          particles.splice(i, 1);
          createParticle();
          continue;
        }

        p.x = p.startX + (p.endX - p.startX) * p.progress;
        p.y = p.startY + (p.endY - p.startY) * p.progress;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Draw District Nodes
      DEMO_NODES.forEach((node) => {
        const nx = (node.x / 100) * width;
        const ny = (node.y / 100) * height;
        const isSelected = selectedNode?.id === node.id;
        const isCritical = node.criticalCases > 2;

        // Radial Pulse Ring
        const time = Date.now() * 0.003;
        const pulseRadius = (isSelected ? 18 : 12) + Math.sin(time + nx) * 4;

        ctx.beginPath();
        ctx.arc(nx, ny, pulseRadius, 0, Math.PI * 2);
        ctx.fillStyle = isCritical
          ? "rgba(239, 68, 68, 0.2)"
          : isSelected
          ? "rgba(14, 165, 233, 0.25)"
          : "rgba(16, 185, 129, 0.15)";
        ctx.fill();

        // Node Circle
        ctx.beginPath();
        ctx.arc(nx, ny, isSelected ? 8 : 5, 0, Math.PI * 2);
        ctx.fillStyle = isCritical ? "#EF4444" : isSelected ? "#0EA5E9" : "#10B981";
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 2;
        ctx.fill();
        ctx.stroke();

        // Node Label
        ctx.font = isSelected ? "bold 12px Inter" : "10px Inter";
        ctx.fillStyle = "#F8FAFC";
        ctx.fillText(node.name, nx + 12, ny + 4);
      });

      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [zoomTarget, selectedNode]);

  const handleNodeClick = (node: DistrictNode) => {
    setSelectedNode(node);
    setZoomTarget({
      x: node.x / 100,
      y: node.y / 100,
      scale: 1.4,
    });
    if (onSelectNode) onSelectNode(node);
  };

  return (
    <div
      className={`relative w-full h-full min-h-[380px] rounded-2xl overflow-hidden border border-slate-700/60 shadow-2xl bg-navy-950 ${className}`}
      role="region"
      aria-label={language === "uz" ? "Oʻzbekiston interaktiv 3D/Canvas xaritasi" : "Interactive Uzbekistan 3D/Canvas Map"}
    >
      {/* Canvas Stream */}
      <canvas ref={canvasRef} className="w-full h-full block cursor-pointer" />

      {/* Header Overlay Overlay */}
      <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between p-3 bg-slate-900/80 backdrop-blur-md rounded-xl border border-slate-700/70 text-xs shadow-lg">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="font-bold text-white uppercase tracking-wider font-mono">
            {language === "uz" ? "Oʻzbekiston Hududiy Tibbiy Tarmoq Canvas Xaritasi" : "Uzbekistan Regional Health Network Canvas Map"}
          </span>
        </div>
        <span className="text-[11px] text-emerald-400 font-mono font-semibold">
          60 FPS · Hardware Accelerated
        </span>
      </div>

      {/* District Node Selection Chips */}
      <div className="absolute bottom-3 left-3 right-3 z-10 flex items-center gap-2 overflow-x-auto p-2 bg-slate-900/80 backdrop-blur-md rounded-xl border border-slate-700/70">
        {DEMO_NODES.map((node) => (
          <button
            key={node.id}
            type="button"
            onClick={() => handleNodeClick(node)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
              selectedNode?.id === node.id
                ? "bg-emerald-600 text-white shadow-md border border-emerald-400"
                : "bg-slate-800/80 text-slate-300 hover:text-white border border-slate-700"
            }`}
          >
            <span>{node.criticalCases > 2 ? "🚨" : "🟢"}</span>
            <span>{node.name}</span>
            <span className="text-[10px] bg-slate-900/60 px-1.5 py-0.5 rounded text-slate-300">
              {node.activeCases}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

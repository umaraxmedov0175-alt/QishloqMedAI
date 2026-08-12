"use client";

/* eslint-disable react/no-unescaped-entities */
import { useEffect, useRef, useState } from "react";
import type { AnatomicalRegion, AnatomyNodeTag } from "@/lib/anatomy-store";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";

interface Anatomy3DCanvasProps {
  selectedRegion?: AnatomicalRegion | null;
  onSelectRegion?: (region: AnatomicalRegion) => void;
  taggedNodes?: AnatomyNodeTag[];
  interactive?: boolean;
}

export function Anatomy3DCanvas({
  selectedRegion = null,
  onSelectRegion,
  taggedNodes = [],
  interactive = true,
}: Anatomy3DCanvasProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [viewAngle, setViewAngle] = useState<"front" | "back" | "side">("front");
  const [isAutoRotating, setIsAutoRotating] = useState(false);
  const [hoveredRegion, setHoveredRegion] = useState<AnatomicalRegion | null>(null);
  const [isLoadingModel, setIsLoadingModel] = useState(true);
  const [currentRotationY, setCurrentRotationY] = useState(0);

  // References for Three.js WebGL Instance
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());
  const regionsGroupRef = useRef<THREE.Group | null>(null);
  const taggedGroupRef = useRef<THREE.Group | null>(null);
  const humanMeshGroupRef = useRef<THREE.Group | null>(null);
  const requestFrameRef = useRef<number | null>(null);

  const regionLabels: Record<AnatomicalRegion, { uz: string; en: string }> = {
    head: { uz: "Bosh / Miya (Cranial)", en: "Head / Brain (Cranial)" },
    chest: { uz: "Ko'krak / Yurak (Cardiothoracic)", en: "Chest / Heart (Cardiothoracic)" },
    abdomen: { uz: "Qorin / Oshqozon (Abdominal)", en: "Abdomen / GI (Abdominal)" },
    spine: { uz: "Umurtqa / Orqa (Musculoskeletal)", en: "Spine / Back (Musculoskeletal)" },
    left_arm: { uz: "Chap Qo'l (Upper Extremity)", en: "Left Arm (Upper Extremity)" },
    right_arm: { uz: "O'ng Qo'l (Upper Extremity)", en: "Right Arm (Upper Extremity)" },
    legs: { uz: "Oyoqlar (Lower Extremities)", en: "Legs (Lower Extremities)" },
  };

  // 3D Node position mappings in WebGL world space
  const nodePositions: Record<AnatomicalRegion, THREE.Vector3> = {
    head: new THREE.Vector3(0, 1.68, 0),
    chest: new THREE.Vector3(0, 1.18, 0.12),
    abdomen: new THREE.Vector3(0, 0.78, 0.12),
    spine: new THREE.Vector3(0, 1.08, -0.14),
    left_arm: new THREE.Vector3(0.50, 1.08, 0),
    right_arm: new THREE.Vector3(-0.50, 1.08, 0),
    legs: new THREE.Vector3(0, 0.12, 0),
  };

  // Camera Target Zoom Focus points per anatomical region
  const cameraZoomTargets: Record<AnatomicalRegion, { pos: THREE.Vector3; target: THREE.Vector3 }> = {
    head: { pos: new THREE.Vector3(0, 1.70, 2.0), target: new THREE.Vector3(0, 1.68, 0) },
    chest: { pos: new THREE.Vector3(0, 1.20, 2.2), target: new THREE.Vector3(0, 1.18, 0) },
    abdomen: { pos: new THREE.Vector3(0, 0.80, 2.2), target: new THREE.Vector3(0, 0.78, 0) },
    spine: { pos: new THREE.Vector3(0, 1.10, -2.2), target: new THREE.Vector3(0, 1.08, 0) },
    left_arm: { pos: new THREE.Vector3(0.8, 1.10, 1.8), target: new THREE.Vector3(0.5, 1.08, 0) },
    right_arm: { pos: new THREE.Vector3(-0.8, 1.10, 1.8), target: new THREE.Vector3(-0.5, 1.08, 0) },
    legs: { pos: new THREE.Vector3(0, 0.20, 2.5), target: new THREE.Vector3(0, 0.12, 0) },
  };

  // Initialize Three.js WebGL Engine with Three-Point Clinical Lighting
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 340;
    const height = container.clientHeight || 460;

    // 1. Scene Setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera Setup
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 1.0, 4.2);
    cameraRef.current = camera;

    // 3. WebGL Hardware-Accelerated Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    rendererRef.current = renderer;

    container.appendChild(renderer.domElement);

    // 4. OrbitControls Setup
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 1.8;
    controls.minDistance = 1.8;
    controls.maxDistance = 7.5;
    controls.target.set(0, 0.9, 0);
    controlsRef.current = controls;

    // 5. Three-Point Clinical Lighting Setup
    // Key Light (Main clinical illumination)
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.5);
    keyLight.position.set(4, 8, 5);
    keyLight.castShadow = true;
    scene.add(keyLight);

    // Fill Light (Soft cyan anatomical fill)
    const fillLight = new THREE.DirectionalLight(0x0ea5e9, 1.4);
    fillLight.position.set(-4, -1, 4);
    scene.add(fillLight);

    // Subtle Rim Light (Volumetric muscle outline depth)
    const rimLight = new THREE.PointLight(0x38bdf8, 2.0, 12);
    rimLight.position.set(0, 2.5, -4);
    scene.add(rimLight);

    // Ambient Base
    const ambient = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambient);

    // 6. Interactive Mesh Groups Setup
    const humanMeshGroup = new THREE.Group();
    humanMeshGroupRef.current = humanMeshGroup;
    scene.add(humanMeshGroup);

    const regionsGroup = new THREE.Group();
    regionsGroupRef.current = regionsGroup;
    humanMeshGroup.add(regionsGroup);

    const taggedGroup = new THREE.Group();
    taggedGroupRef.current = taggedGroup;
    humanMeshGroup.add(taggedGroup);

    // 7. Build High-Precision Anatomical Region Meshes
    const buildAnatomicalRegions = () => {
      const regionGeometries: Record<AnatomicalRegion, THREE.BufferGeometry> = {
        head: new THREE.SphereGeometry(0.24, 32, 32),
        chest: new THREE.CylinderGeometry(0.30, 0.25, 0.44, 32),
        abdomen: new THREE.CylinderGeometry(0.25, 0.23, 0.40, 32),
        spine: new THREE.BoxGeometry(0.15, 0.85, 0.15),
        left_arm: new THREE.CylinderGeometry(0.09, 0.07, 0.70, 24),
        right_arm: new THREE.CylinderGeometry(0.09, 0.07, 0.70, 24),
        legs: new THREE.CylinderGeometry(0.19, 0.13, 1.15, 24),
      };

      Object.entries(regionGeometries).forEach(([regKey, geom]) => {
        const reg = regKey as AnatomicalRegion;
        const pos = nodePositions[reg];

        const mat = new THREE.MeshStandardMaterial({
          color: 0x1e293b,
          roughness: 0.4,
          metalness: 0.1,
          transparent: true,
          opacity: 0.45,
          wireframe: false,
        });

        const mesh = new THREE.Mesh(geom, mat);
        mesh.position.copy(pos);
        mesh.userData = { region: reg };
        regionsGroup.add(mesh);
      });
    };

    buildAnatomicalRegions();

    // 8. Load High-Definition 3D Human OBJ Model (`/models/Male.OBJ`)
    const loader = new OBJLoader();
    const modelCandidates = [
      "/models/Male.OBJ",
      "/models/male.obj",
      "/models/hd_human_anatomy.glb",
    ];

    const tryLoadModel = (candidateIndex: number) => {
      if (candidateIndex >= modelCandidates.length) {
        // Fallback gracefully to high-density procedural volume meshes if no candidate loads
        setIsLoadingModel(false);
        return;
      }

      const modelUrl = modelCandidates[candidateIndex];

      loader.load(
        modelUrl,
        (obj) => {
          obj.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              const m = child as THREE.Mesh;
              if (m.geometry) {
                m.geometry.computeVertexNormals();
              }
              m.material = new THREE.MeshStandardMaterial({
                color: 0x475569,
                roughness: 0.35,
                metalness: 0.15,
                transparent: true,
                opacity: 0.92,
                side: THREE.DoubleSide,
              });
              m.castShadow = true;
              m.receiveShadow = true;
            }
          });

          const box = new THREE.Box3().setFromObject(obj);
          const size = box.getSize(new THREE.Vector3());
          const center = box.getCenter(new THREE.Vector3());

          const maxDim = Math.max(size.x, size.y, size.z);
          const scale = 2.25 / (maxDim || 1);
          obj.scale.set(scale, scale, scale);
          obj.position.set(-center.x * scale, -center.y * scale + 0.82, -center.z * scale);

          humanMeshGroup.add(obj);
          setIsLoadingModel(false);
        },
        (xhr) => {
          if (xhr.lengthComputable && xhr.total > 0) {
            const pct = Math.round((xhr.loaded / xhr.total) * 100);
            if (pct >= 100) setIsLoadingModel(false);
          }
        },
        () => {
          // Try next candidate URL
          tryLoadModel(candidateIndex + 1);
        }
      );
    };

    tryLoadModel(0);

    // 9. Render 60 FPS Animation Loop
    const animate = () => {
      requestFrameRef.current = requestAnimationFrame(animate);

      if (controlsRef.current) {
        controlsRef.current.update();
      }

      if (humanMeshGroupRef.current) {
        const yDeg = THREE.MathUtils.radToDeg(humanMeshGroupRef.current.rotation.y);
        setCurrentRotationY(Math.round(((yDeg % 360) + 360) % 360));
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };

    animate();

    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const w = container.clientWidth || 340;
      const h = container.clientHeight || 460;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (requestFrameRef.current) cancelAnimationFrame(requestFrameRef.current);
      if (rendererRef.current && rendererRef.current.domElement) {
        rendererRef.current.domElement.remove();
        rendererRef.current.dispose();
      }
    };
  }, []);

  // Update Auto-Rotation & View Angle State
  useEffect(() => {
    if (!humanMeshGroupRef.current) return;

    if (isAutoRotating) {
      const interval = setInterval(() => {
        if (humanMeshGroupRef.current) {
          humanMeshGroupRef.current.rotation.y += 0.015;
        }
      }, 16);
      return () => clearInterval(interval);
    } else {
      if (viewAngle === "front") humanMeshGroupRef.current.rotation.y = 0;
      if (viewAngle === "back") humanMeshGroupRef.current.rotation.y = Math.PI;
      if (viewAngle === "side") humanMeshGroupRef.current.rotation.y = Math.PI / 2;
    }
  }, [isAutoRotating, viewAngle]);

  // Update Smooth Camera Focus Zoom on Selected Region
  useEffect(() => {
    if (!selectedRegion || !cameraRef.current || !controlsRef.current) return;
    const zoomConfig = cameraZoomTargets[selectedRegion];
    if (!zoomConfig) return;

    cameraRef.current.position.lerp(zoomConfig.pos, 0.2);
    controlsRef.current.target.lerp(zoomConfig.target, 0.2);
    controlsRef.current.update();
  }, [selectedRegion]);

  // Update Region Selection & Hover Highlight Materials (PBR Emissive Shaders)
  useEffect(() => {
    if (!regionsGroupRef.current) return;

    regionsGroupRef.current.children.forEach((child) => {
      const mesh = child as THREE.Mesh;
      const reg = mesh.userData.region as AnatomicalRegion;
      if (!reg) return;

      const isSelected = selectedRegion === reg;
      const isHovered = hoveredRegion === reg;
      const taggedNode = taggedNodes.find((n) => n.region === reg);

      const mat = mesh.material as THREE.MeshStandardMaterial;
      if (!mat) return;

      if (isSelected) {
        mat.color.setHex(0x38bdf8);
        mat.emissive.setHex(0x0284c7);
        mat.emissiveIntensity = 0.8;
        mat.opacity = 0.85;
      } else if (isHovered) {
        mat.color.setHex(0x0ea5e9);
        mat.emissive.setHex(0x0ea5e9);
        mat.emissiveIntensity = 0.6;
        mat.opacity = 0.70;
      } else if (taggedNode) {
        const severityHex =
          taggedNode.severity === "high"
            ? 0xef4444
            : taggedNode.severity === "moderate"
              ? 0xf59e0b
              : 0x10b981;
        mat.color.setHex(severityHex);
        mat.emissive.setHex(severityHex);
        mat.emissiveIntensity = 0.7;
        mat.opacity = 0.65;
      } else {
        mat.color.setHex(0x1e293b);
        mat.emissive.setHex(0x000000);
        mat.emissiveIntensity = 0.0;
        mat.opacity = 0.35;
      }
    });
  }, [selectedRegion, hoveredRegion, taggedNodes]);

  // Update Tagged 3D Pulsing Volumetric Nodes in WebGL Scene
  useEffect(() => {
    const group = taggedGroupRef.current;
    if (!group) return;

    while (group.children.length > 0) {
      const obj = group.children[0];
      group.remove(obj);
    }

    taggedNodes.forEach((node) => {
      const pos = nodePositions[node.region];
      if (!pos) return;

      const colorHex =
        node.severity === "high"
          ? 0xef4444
          : node.severity === "moderate"
            ? 0xf59e0b
            : 0x10b981;

      // Outer Volumetric Glowing Aura Sphere
      const glowGeom = new THREE.SphereGeometry(0.10, 16, 16);
      const glowMat = new THREE.MeshBasicMaterial({
        color: colorHex,
        transparent: true,
        opacity: 0.65,
      });
      const glowMesh = new THREE.Mesh(glowGeom, glowMat);
      glowMesh.position.copy(pos);
      group.add(glowMesh);

      // Inner Core White Sphere
      const coreGeom = new THREE.SphereGeometry(0.04, 12, 12);
      const coreMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const coreMesh = new THREE.Mesh(coreGeom, coreMat);
      coreMesh.position.copy(pos);
      group.add(coreMesh);
    });
  }, [taggedNodes]);

  // Handle Precision Mesh Raycasting Pointer Movement & Clicks
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!interactive || !mountRef.current || !cameraRef.current || !regionsGroupRef.current) return;

    const rect = mountRef.current.getBoundingClientRect();
    mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
    const intersects = raycasterRef.current.intersectObjects(regionsGroupRef.current.children);

    if (intersects.length > 0) {
      const reg = intersects[0].object.userData.region as AnatomicalRegion;
      setHoveredRegion(reg);
    } else {
      setHoveredRegion(null);
    }
  };

  const handleClick = () => {
    if (!interactive || !hoveredRegion || !onSelectRegion) return;
    onSelectRegion(hoveredRegion);
  };

  return (
    <div className="relative w-full h-[540px] bg-slate-950 rounded-2xl border border-slate-800 p-4 flex flex-col items-center justify-between overflow-hidden shadow-2xl select-none font-sans">
      {/* Top 3D View Angle & Auto-Rotate Controls */}
      <div className="w-full flex items-center justify-between z-10 gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-xs font-mono font-bold text-slate-300">
            HD REALISTIC 3D ANATOMY · {currentRotationY}° Y-AXIS
          </span>
        </div>

        <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1 text-[11px] font-semibold text-slate-300 gap-1">
          <button
            type="button"
            onClick={() => {
              setIsAutoRotating(false);
              setViewAngle("front");
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

      {/* 3D WebGL Canvas Mount Container */}
      <div
        ref={mountRef}
        role="button"
        tabIndex={0}
        aria-label="3D Anatomical Interactive Canvas"
        onPointerMove={handlePointerMove}
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            handleClick();
          }
        }}
        className="relative w-full h-[430px] cursor-grab active:cursor-grabbing flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
      >
        {isLoadingModel && (
          <div className="absolute z-20 flex flex-col items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md rounded-xl border border-slate-800 shadow-xl space-y-2">
            <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-bold text-slate-200">High-Definition 3D Human Model yuklanmoqda...</span>
          </div>
        )}
      </div>

      {/* Bottom Tooltip & Region Status Bar */}
      <div className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-center text-xs z-10 flex items-center justify-between">
        <div>
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
                ? "HD 3D odam tanasi a'zosini tanlash uchun ustiga bosing"
                : "Bemorning HD 3D anomaliya sohalari ko'rsatilgan"}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-[10px] font-bold">
          <span className="flex items-center gap-1 text-red-400">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" /> High (Red)
          </span>
          <span className="flex items-center gap-1 text-amber-400">
            <span className="w-2 h-2 rounded-full bg-amber-500" /> Moderate
          </span>
          <span className="flex items-center gap-1 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> Low
          </span>
        </div>
      </div>
    </div>
  );
}

// Export HDAnatomyCanvas alias for HD WebGL Model integration
export const HDAnatomyCanvas = Anatomy3DCanvas;

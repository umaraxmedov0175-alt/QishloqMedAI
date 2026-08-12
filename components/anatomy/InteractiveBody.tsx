"use client";
/* eslint-disable react/no-unknown-property, react-hooks/immutability */

import { useMemo, useState } from "react";
import * as THREE from "three";
import { useGLTF } from "@react-three/drei";
import { GLTF } from "three-stdlib";
import { type BodyRegionId } from "@/lib/anatomy/regions";

export interface InteractiveBodyProps {
  value: BodyRegionId[];
  onChange: (regions: BodyRegionId[]) => void;
  maxSelections?: number;
  locale?: "uz" | "ru" | "en";
  isBackView?: boolean;
}

type GLTFResult = GLTF & {
  nodes: Record<string, THREE.Mesh>;
  materials: Record<string, THREE.MeshStandardMaterial>;
};

const MODEL_PATH = "/models/human-body-transformed.glb";

export function InteractiveBody({
  value = [],
  onChange,
  maxSelections = 5,
}: InteractiveBodyProps) {
  const { nodes, materials } = useGLTF(MODEL_PATH) as unknown as GLTFResult;
  const [hoveredRegion, setHoveredRegion] = useState<BodyRegionId | null>(null);

  // Main body mesh geometry node from HD ZBrush GLB model
  const bodyMesh = nodes.Group16371 || nodes.Low_Poly_Male_bodyGroup2_lambert1_0 || Object.values(nodes).find((n) => n && n.isMesh);

  // Region raycast / hit handling
  const handlePointerOver = (e: { stopPropagation: () => void; point: THREE.Vector3 }) => {
    e.stopPropagation();
    document.body.style.cursor = "pointer";

    const y = e.point.y;
    let targetRegion: BodyRegionId = "chest_left";

    if (y > 1.2) targetRegion = "head";
    else if (y > 0.9) targetRegion = "chest_left";
    else if (y > 0.6) targetRegion = "abdomen_upper";
    else if (y > 0.3) targetRegion = "abdomen_lower";
    else if (y > -0.2) targetRegion = "thigh_left";
    else if (y > -0.7) targetRegion = "knee_left";
    else targetRegion = "foot_left";

    setHoveredRegion(targetRegion);
  };

  const handlePointerOut = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    document.body.style.cursor = "default";
    setHoveredRegion(null);
  };

  const handleClick = (e: { stopPropagation: () => void; point: THREE.Vector3 }) => {
    e.stopPropagation();
    const y = e.point.y;
    let clickedRegion: BodyRegionId = "chest_left";

    if (y > 1.2) clickedRegion = "head";
    else if (y > 0.9) clickedRegion = "chest_left";
    else if (y > 0.6) clickedRegion = "abdomen_upper";
    else if (y > 0.3) clickedRegion = "abdomen_lower";
    else if (y > -0.2) clickedRegion = "thigh_left";
    else if (y > -0.7) clickedRegion = "knee_left";
    else clickedRegion = "foot_left";

    const isSelected = value.includes(clickedRegion);
    if (isSelected) {
      onChange(value.filter((r) => r !== clickedRegion));
    } else {
      if (value.length < maxSelections) {
        onChange([...value, clickedRegion]);
      }
    }
  };

  // Dynamically compute active material state cleanly in useMemo
  const activeMaterial = useMemo(() => {
    const sourceMat = materials.default || materials.lambert1 || new THREE.MeshStandardMaterial({ color: 0xcfd8dc });
    const baseMat = sourceMat.clone() as THREE.MeshStandardMaterial;
    baseMat.roughness = 0.5;
    baseMat.metalness = 0.1;

    const isAnyHovered = hoveredRegion !== null;
    if (isAnyHovered && value.includes(hoveredRegion!)) {
      baseMat.emissive = new THREE.Color(0x10b981);
      baseMat.emissiveIntensity = 0.7;
    } else if (isAnyHovered) {
      baseMat.emissive = new THREE.Color(0x38bdf8);
      baseMat.emissiveIntensity = 0.35;
    } else if (value.length > 0) {
      baseMat.emissive = new THREE.Color(0x10b981);
      baseMat.emissiveIntensity = 0.5;
    } else {
      baseMat.emissive = new THREE.Color(0x000000);
      baseMat.emissiveIntensity = 0;
    }
    return baseMat;
  }, [materials.lambert1, hoveredRegion, value]);

  if (!bodyMesh) return null;

  return (
    <group dispose={null} position={[0, -1, 0]}>
      <mesh
        geometry={bodyMesh.geometry}
        material={activeMaterial}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
        onPointerDown={handleClick}
      />
    </group>
  );
}

useGLTF.preload(MODEL_PATH);

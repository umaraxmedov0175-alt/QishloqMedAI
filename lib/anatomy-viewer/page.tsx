"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

type ViewAngle = "front" | "back" | "side";

export default function AnatomyViewerPage() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // --------------------------------
    // 1. Scene
    // --------------------------------
    const scene = new THREE.Scene();

    // --------------------------------
    // 2. Camera
    // --------------------------------
    const width = container.clientWidth || 340;
    const height = container.clientHeight || 520;

    const camera = new THREE.PerspectiveCamera(
      45,
      width / height,
      0.1,
      100,
    );

    camera.position.set(0, 1.0, 4.2);

    // --------------------------------
    // 3. Renderer
    // --------------------------------
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
    });

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);

    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    container.appendChild(renderer.domElement);

    // --------------------------------
    // 4. Controls
    // --------------------------------
    const controls = new OrbitControls(
      camera,
      renderer.domElement,
    );

    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    controls.maxPolarAngle = Math.PI / 1.8;
    controls.minDistance = 1.8;
    controls.maxDistance = 7.5;

    controls.target.set(0, 0.9, 0);

    // --------------------------------
    // 5. Lighting
    // --------------------------------
    const keyLight = new THREE.DirectionalLight(
      0xffffff,
      2.8,
    );

    keyLight.position.set(4, 8, 5);
    keyLight.castShadow = true;

    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(
      0x38bdf8,
      1.8,
    );

    fillLight.position.set(-4, -1, 4);
    scene.add(fillLight);

    const rimLight = new THREE.PointLight(
      0x7dd3fc,
      2.4,
      12,
    );

    rimLight.position.set(0, 2.5, -4);
    scene.add(rimLight);

    const ambient = new THREE.AmbientLight(
      0xffffff,
      1.8,
    );

    scene.add(ambient);

    // --------------------------------
    // 6. Human model group
    // --------------------------------
    const human = new THREE.Group();

    scene.add(human);

    // --------------------------------
    // 7. Material
    // --------------------------------
    const material = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.35,
      metalness: 0.15,
      side: THREE.DoubleSide,
    });

    // --------------------------------
    // 8. Build human model
    // --------------------------------

    // Head
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.24, 32, 32),
      material,
    );

    head.position.set(0, 1.68, 0);
    human.add(head);

    // Neck
    const neck = new THREE.Mesh(
      new THREE.CylinderGeometry(
        0.10,
        0.11,
        0.16,
        24,
      ),
      material,
    );

    neck.position.set(0, 1.48, 0);
    human.add(neck);

    // Chest
    const chest = new THREE.Mesh(
      new THREE.CylinderGeometry(
        0.32,
        0.28,
        0.44,
        32,
      ),
      material,
    );

    chest.position.set(0, 1.20, 0.05);
    human.add(chest);

    // Abdomen
    const abdomen = new THREE.Mesh(
      new THREE.CylinderGeometry(
        0.27,
        0.25,
        0.40,
        32,
      ),
      material,
    );

    abdomen.position.set(0, 0.78, 0.05);
    human.add(abdomen);

    // Spine
    const spine = new THREE.Mesh(
      new THREE.BoxGeometry(
        0.16,
        0.88,
        0.16,
      ),
      material,
    );

    spine.position.set(0, 1.05, -0.12);
    human.add(spine);

    // --------------------------------
    // Arms
    // --------------------------------

    const leftShoulder = new THREE.Mesh(
      new THREE.SphereGeometry(0.11, 24, 24),
      material,
    );

    leftShoulder.position.set(0.44, 1.38, 0);
    human.add(leftShoulder);

    const leftUpperArm = new THREE.Mesh(
      new THREE.CylinderGeometry(
        0.08,
        0.07,
        0.42,
        24,
      ),
      material,
    );

    leftUpperArm.position.set(0.48, 1.15, 0);
    human.add(leftUpperArm);

    const leftElbow = new THREE.Mesh(
      new THREE.SphereGeometry(0.075, 20, 20),
      material,
    );

    leftElbow.position.set(0.50, 0.90, 0);
    human.add(leftElbow);

    const leftForearm = new THREE.Mesh(
      new THREE.CylinderGeometry(
        0.07,
        0.06,
        0.40,
        24,
      ),
      material,
    );

    leftForearm.position.set(0.52, 0.68, 0);
    human.add(leftForearm);

    // Right arm
    const rightShoulder = new THREE.Mesh(
      new THREE.SphereGeometry(0.11, 24, 24),
      material,
    );

    rightShoulder.position.set(-0.44, 1.38, 0);
    human.add(rightShoulder);

    const rightUpperArm = new THREE.Mesh(
      new THREE.CylinderGeometry(
        0.08,
        0.07,
        0.42,
        24,
      ),
      material,
    );

    rightUpperArm.position.set(-0.48, 1.15, 0);
    human.add(rightUpperArm);

    const rightElbow = new THREE.Mesh(
      new THREE.SphereGeometry(0.075, 20, 20),
      material,
    );

    rightElbow.position.set(-0.50, 0.90, 0);
    human.add(rightElbow);

    const rightForearm = new THREE.Mesh(
      new THREE.CylinderGeometry(
        0.07,
        0.06,
        0.40,
        24,
      ),
      material,
    );

    rightForearm.position.set(-0.52, 0.68, 0);
    human.add(rightForearm);

    // --------------------------------
    // Legs
    // --------------------------------

    const pelvis = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 24, 24),
      material,
    );

    pelvis.position.set(0, 0.54, 0);
    human.add(pelvis);

    const leftThigh = new THREE.Mesh(
      new THREE.CylinderGeometry(
        0.14,
        0.11,
        0.55,
        24,
      ),
      material,
    );

    leftThigh.position.set(0.16, 0.25, 0);
    human.add(leftThigh);

    const rightThigh = new THREE.Mesh(
      new THREE.CylinderGeometry(
        0.14,
        0.11,
        0.55,
        24,
      ),
      material,
    );

    rightThigh.position.set(-0.16, 0.25, 0);
    human.add(rightThigh);

    // --------------------------------
    // 9. Initial orientation
    // --------------------------------

    const initialView: ViewAngle = "front";

    if (initialView === "front") {
      human.rotation.y = 0;
    }

    if (initialView === "back") {
      human.rotation.y = Math.PI;
    }

    if (initialView === "side") {
      human.rotation.y = Math.PI / 2;
    }

    // --------------------------------
    // 10. IMPORTANT:
    // Mirror correction
    // --------------------------------

    // Agar model chap/o'ng tomondan akslangan bo'lsa:
    //
    // human.scale.x = -1;
    //
    // Hozircha o'zgartirmaymiz:
    human.scale.set(1, 1, 1);

    // --------------------------------
    // 11. Animation
    // --------------------------------

    let animationFrame = 0;

    const animate = () => {
      animationFrame = requestAnimationFrame(animate);

      controls.update();

      renderer.render(
        scene,
        camera,
      );
    };

    animate();

    // --------------------------------
    // 12. Resize
    // --------------------------------

    const handleResize = () => {
      const width = container.clientWidth || 340;
      const height = container.clientHeight || 520;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();

      renderer.setSize(width, height);
    };

    window.addEventListener(
      "resize",
      handleResize,
    );

    // --------------------------------
    // 13. Cleanup
    // --------------------------------

    return () => {
      cancelAnimationFrame(animationFrame);

      window.removeEventListener(
        "resize",
        handleResize,
      );

      controls.dispose();

      scene.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) {
          return;
        }

        object.geometry.dispose();

        if (Array.isArray(object.material)) {
          object.material.forEach((material) => {
            material.dispose();
          });
        } else {
          object.material.dispose();
        }
      });

      renderer.dispose();

      if (renderer.domElement.parentNode === container) {
        container.removeChild(
          renderer.domElement,
        );
      }
    };
  }, []);

  return (
    <main className="w-full h-screen overflow-hidden bg-slate-950">
      <div
        ref={mountRef}
        className="w-full h-full"
      />
    </main>
  );
}
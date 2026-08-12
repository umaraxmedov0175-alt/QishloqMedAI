"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from "react";

export interface WebGLSupportStatus {
  isSupported: boolean;
  reason?: string;
  isLowEndDevice: boolean;
}

export function useWebGLSupport(): WebGLSupportStatus {
  const [status, setStatus] = useState<WebGLSupportStatus>({
    isSupported: true,
    isLowEndDevice: false,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check localStorage user preference if manually overridden
    const manualPref = localStorage.getItem("qm_anatomy_mode");
    if (manualPref === "2d") {
      setStatus({
        isSupported: false,
        reason: "User selected 2D mode",
        isLowEndDevice: false,
      });
      return;
    }

    let hasWebGL2 = false;
    try {
      const canvas = document.createElement("canvas");
      hasWebGL2 = !!(
        window.WebGL2RenderingContext &&
        (canvas.getContext("webgl2") || canvas.getContext("experimental-webgl2"))
      );
    } catch {
      hasWebGL2 = false;
    }

    // Network connection check (2g / slow-2g fallback)
    const nav = navigator as Navigator & {
      connection?: { effectiveType?: string; saveData?: boolean };
      deviceMemory?: number;
    };
    const isSlowConnection =
      nav.connection?.effectiveType === "2g" ||
      nav.connection?.effectiveType === "slow-2g" ||
      nav.connection?.saveData === true;

    // Hardware concurrency & memory check
    const lowCores = nav.hardwareConcurrency ? nav.hardwareConcurrency <= 2 : false;
    const lowRam = nav.deviceMemory ? nav.deviceMemory <= 2 : false;
    const isLowEndDevice = lowCores || lowRam;

    if (!hasWebGL2) {
      setStatus({
        isSupported: false,
        reason: "WebGL2 is not supported on this browser context",
        isLowEndDevice,
      });
    } else if (isSlowConnection) {
      setStatus({
        isSupported: false,
        reason: "Slow connection detected (2G/Data-saver) — switched to responsive 2D vector map",
        isLowEndDevice,
      });
    } else {
      setStatus({
        isSupported: true,
        isLowEndDevice,
      });
    }
  }, []);

  return status;
}

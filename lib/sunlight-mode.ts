import { useEffect, useState } from "react";

const STORAGE_KEY = "qishloqmed_sunlight_mode";

export function isSunlightModeActive(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

export function setSunlightMode(active: boolean): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, String(active));
    if (active) {
      document.documentElement.classList.add("sunlight-mode");
    } else {
      document.documentElement.classList.remove("sunlight-mode");
    }
  } catch {
    // LocalStorage or DOM unavailable
  }
}

export function useSunlightMode(): [boolean, (active: boolean) => void] {
  const [active, setActive] = useState<boolean>(() => isSunlightModeActive());

  useEffect(() => {
    if (active) {
      document.documentElement.classList.add("sunlight-mode");
    } else {
      document.documentElement.classList.remove("sunlight-mode");
    }
  }, [active]);

  const toggle = (nextActive: boolean) => {
    setActive(nextActive);
    setSunlightMode(nextActive);
  };

  return [active, toggle];
}

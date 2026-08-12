"use client";

import { useState, type MouseEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useSunlightMode } from "@/lib/sunlight-mode";

type DemoRole = "doctor" | "nurse" | "dispatcher" | "patient" | "mobile_nurse" | "specialist";

const destinations: Record<DemoRole, string> = {
  doctor: "/central",
  nurse: "/mobile",
  dispatcher: "/dispatcher",
  patient: "/patient",
  mobile_nurse: "/mobile",
  specialist: "/central",
};

export function DemoRoleLink({
  workspace,
  children,
  className,
  confirmMsg,
}: {
  workspace: DemoRole;
  children: ReactNode;
  className?: string;
  confirmMsg?: string;
}) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  async function activate(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    if (isPending) return;
    if (confirmMsg && !window.confirm(confirmMsg)) {
      return;
    }
    setIsPending(true);
    try {
      const response = await fetch("/api/auth/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: workspace }),
      });
      if (response.ok) {
        try {
          sessionStorage.setItem("qm_demo_role", workspace);
          document.cookie = `qm_demo_role=${workspace}; Path=/; SameSite=Lax; Max-Age=28800`;
        } catch {
          void 0;
        }
        router.push(destinations[workspace]);
      } else {
        setIsPending(false);
      }
    } catch {
      setIsPending(false);
    }
  }

  return (
    <a
      className={`${className || ""} ${isPending ? "opacity-60 pointer-events-none" : ""}`}
      href={`/api/auth/demo?role=${workspace}`}
      onClick={(event) => void activate(event)}
    >
      {isPending ? (
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 border-2 border-emerald-300 border-t-transparent rounded-full animate-spin"></span>
          <span>Oʻtkazilmoqda...</span>
        </span>
      ) : (
        children
      )}
    </a>
  );
}

export function SunlightToggle({ className }: { className?: string }) {
  const [sunlightActive, setSunlightActive] = useSunlightMode();

  return (
    <button
      type="button"
      className={
        className ||
        `px-2.5 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 border shrink-0 ${
          sunlightActive
            ? "bg-yellow-400 text-black border-black shadow-sm font-black"
            : "bg-emerald-950/60 text-amber-300 border-emerald-700/50 hover:bg-emerald-900/80"
        }`
      }
      onClick={() => setSunlightActive(!sunlightActive)}
      aria-label="Quyosh rejimi (High-Contrast Sunlight Mode) almashtirish"
    >
      <span className="text-sm">☀️</span>
      <span className="whitespace-nowrap">{sunlightActive ? "Quyosh Rejimi [FAOL]" : "Quyosh Rejimi"}</span>
    </button>
  );
}

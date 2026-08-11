"use client";

import type { MouseEvent, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useSunlightMode } from "@/lib/sunlight-mode";

type DemoRole = "mobile_nurse" | "specialist" | "dispatcher" | "patient";

const destinations: Record<DemoRole, string> = {
  mobile_nurse: "/mobile",
  specialist: "/central",
  dispatcher: "/operations",
  patient: "/patient",
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

  async function activate(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    if (confirmMsg && !window.confirm(confirmMsg)) {
      return;
    }
    const response = await fetch("/api/auth/demo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: workspace }),
    });
    if (response.ok) router.push(destinations[workspace]);
  }

  return (
    <a
      className={className}
      href={`/api/auth/demo?role=${workspace}`}
      onClick={(event) => void activate(event)}
    >
      {children}
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
        `px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 border ${
          sunlightActive
            ? "bg-yellow-400 text-black border-black shadow-md font-black"
            : "bg-slate-800 text-amber-300 border-amber-400/40 hover:bg-slate-700"
        }`
      }
      onClick={() => setSunlightActive(!sunlightActive)}
      aria-label="Quyosh rejimi (High-Contrast Sunlight Mode) almashtirish"
    >
      <span>☀️</span>
      <span>{sunlightActive ? "Quyosh Rejimi [FAOL]" : "Quyosh Rejimi"}</span>
    </button>
  );
}

"use client";

import type { MouseEvent, ReactNode } from "react";

type DemoRole = "mobile_nurse" | "specialist" | "dispatcher";

const destinations: Record<DemoRole, string> = {
  mobile_nurse: "/mobile",
  specialist: "/central",
  dispatcher: "/operations",
};

export function DemoRoleLink({
  workspace,
  children,
  className,
}: {
  workspace: DemoRole;
  children: ReactNode;
  className?: string;
}) {
  async function activate(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    const response = await fetch("/api/auth/demo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: workspace }),
    });
    if (response.ok) window.location.assign(destinations[workspace]);
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

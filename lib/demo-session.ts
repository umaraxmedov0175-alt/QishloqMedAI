import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export type DemoRole = "mobile_nurse" | "specialist" | "dispatcher";

export const DEMO_ROLE_COOKIE = "qm_demo_role";

export const DEMO_ROLE_DESTINATIONS: Record<DemoRole, string> = {
  mobile_nurse: "/mobile",
  specialist: "/central",
  dispatcher: "/operations",
};

export function isDemoRole(value: unknown): value is DemoRole {
  return (
    value === "mobile_nurse" || value === "specialist" || value === "dispatcher"
  );
}

export function readDemoRole(request: Request): DemoRole | null {
  const cookie = request.headers.get("cookie") ?? "";
  const value = cookie
    .split(";")
    .map((part) => part.trim().split("="))
    .find(([name]) => name === DEMO_ROLE_COOKIE)?.[1];
  return isDemoRole(value) ? value : null;
}

export function demoSessionCookie(role: DemoRole, secure: boolean) {
  return `${DEMO_ROLE_COOKIE}=${role}; Path=/; HttpOnly; SameSite=Strict; Max-Age=28800${secure ? "; Secure" : ""}`;
}

export async function requireDemoRole(expected: DemoRole) {
  const store = await cookies();
  if (store.get(DEMO_ROLE_COOKIE)?.value !== expected) {
    redirect("/?auth=required");
  }
}

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export type DemoRole = "doctor" | "nurse" | "dispatcher" | "patient" | "mobile_nurse" | "specialist";

export const DEMO_ROLE_COOKIE = "qm_demo_role";

export const DEMO_ROLE_DESTINATIONS: Record<DemoRole, string> = {
  doctor: "/central",
  nurse: "/mobile",
  dispatcher: "/dispatcher",
  patient: "/patient",
  mobile_nurse: "/mobile",
  specialist: "/central",
};

export function isDemoRole(value: unknown): value is DemoRole {
  return (
    value === "doctor" ||
    value === "nurse" ||
    value === "dispatcher" ||
    value === "patient" ||
    value === "mobile_nurse" ||
    value === "specialist"
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
  const current = store.get(DEMO_ROLE_COOKIE)?.value;
  if (!current || (current !== expected && !(expected === "nurse" && current === "mobile_nurse") && !(expected === "doctor" && current === "specialist"))) {
    redirect("/?auth=required");
  }
}

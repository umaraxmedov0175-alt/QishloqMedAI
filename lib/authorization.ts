export type Role = "doctor" | "nurse" | "patient" | "dispatcher";

export type AuthContext = { userId: string; role: Role; clinicId?: string };

export function normalizeRole(rawRole: string | null | undefined): Role | null {
  if (!rawRole) return null;
  const normalized = rawRole.toLowerCase().trim();
  if (normalized === "doctor" || normalized === "specialist" || normalized === "central_clinician") return "doctor";
  if (normalized === "nurse" || normalized === "mobile_nurse") return "nurse";
  if (normalized === "dispatcher") return "dispatcher";
  if (normalized === "patient") return "patient";
  return null;
}

export function canAccessEncounter(
  context: AuthContext,
  encounter: { clinicId: string },
  action: "read" | "write" | "review" | "logistics"
) {
  if (context.role === "nurse")
    return context.clinicId === encounter.clinicId && (action === "read" || action === "write");
  if (context.role === "doctor") return action === "read" || action === "review";
  if (context.role === "dispatcher") return action === "logistics";
  if (context.role === "patient") return action === "read";
  return action === "read";
}

export function canAccessPatientPortal(role: string): boolean {
  return normalizeRole(role) === "patient";
}

export function getDefaultRoleRoute(role: Role): string {
  switch (role) {
    case "doctor":
      return "/central";
    case "nurse":
      return "/mobile";
    case "dispatcher":
      return "/dispatcher";
    case "patient":
      return "/patient";
  }
}

export function canAccessRoute(rawRole: string | null | undefined, pathname: string): boolean {
  const role = normalizeRole(rawRole);
  if (!role) return false;

  // Universal routes allowed for all authenticated users
  if (pathname.startsWith("/api") || pathname.startsWith("/chat") || pathname === "/" || pathname.startsWith("/_next") || pathname === "/favicon.ico") return true;

  if (role === "doctor") {
    return (
      pathname.startsWith("/central") ||
      pathname.startsWith("/hospital") ||
      pathname.startsWith("/doctor") ||
      pathname.startsWith("/anatomy")
    );
  }
  if (role === "nurse") {
    return (
      pathname.startsWith("/mobile") ||
      pathname.startsWith("/offline") ||
      pathname.startsWith("/nurse") ||
      pathname.startsWith("/anatomy")
    );
  }
  if (role === "dispatcher") {
    return pathname.startsWith("/dispatcher") || pathname.startsWith("/hospital") || pathname.startsWith("/dispatch");
  }
  if (role === "patient") {
    return pathname.startsWith("/patient");
  }
  return false;
}

export function validateRoleAccess(rawRole: string | null | undefined, pathname: string): { allowed: boolean; redirectTo?: string } {
  const role = normalizeRole(rawRole);
  if (!role) {
    return { allowed: false, redirectTo: "/?auth=required" };
  }

  const allowed = canAccessRoute(role, pathname);
  if (allowed) {
    return { allowed: true };
  }

  return { allowed: false, redirectTo: getDefaultRoleRoute(role) };
}

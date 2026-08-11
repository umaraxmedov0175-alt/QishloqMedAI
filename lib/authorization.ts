export type Role = "doctor" | "nurse" | "patient" | "dispatcher";

export type AuthContext = { userId: string; role: Role; clinicId?: string };

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
  return role === "patient";
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

export function canAccessRoute(role: Role, pathname: string): boolean {
  if (pathname.startsWith("/api") || pathname.startsWith("/chat") || pathname === "/") return true;

  if (role === "doctor") {
    return pathname.startsWith("/central") || pathname.startsWith("/hospital");
  }
  if (role === "nurse") {
    return pathname.startsWith("/mobile") || pathname.startsWith("/offline");
  }
  if (role === "dispatcher") {
    return pathname.startsWith("/dispatcher") || pathname.startsWith("/hospital");
  }
  if (role === "patient") {
    return pathname.startsWith("/patient");
  }
  return false;
}

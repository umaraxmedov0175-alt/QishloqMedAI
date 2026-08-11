export type Role =
  | "mobile_nurse"
  | "central_clinician"
  | "dispatcher"
  | "admin"
  | "demo_observer"
  | "patient";

export type AuthContext = { userId: string; role: Role; clinicId?: string };

export function canAccessEncounter(
  context: AuthContext,
  encounter: { clinicId: string },
  action: "read" | "write" | "review" | "logistics"
) {
  if (context.role === "admin") return true;
  if (context.role === "mobile_nurse")
    return context.clinicId === encounter.clinicId && (action === "read" || action === "write");
  if (context.role === "central_clinician") return action === "read" || action === "review";
  if (context.role === "dispatcher") return action === "logistics";
  if (context.role === "patient") return action === "read";
  return action === "read";
}

export function canAccessPatientPortal(role: string): boolean {
  return role === "patient";
}

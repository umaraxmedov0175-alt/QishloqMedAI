import { DEMO_ROLE_COOKIE } from "@/lib/demo-session";
import { recordAuditEvent } from "@/lib/audit";

export async function POST() {
  const cookieHeader = `${DEMO_ROLE_COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`;

  await recordAuditEvent(null, {
    actorId: "authenticated_user",
    action: "logout",
    resourceType: "auth_session",
    resourceId: "session_cleared",
  });

  return Response.json(
    { success: true, message: "Logged out successfully" },
    {
      status: 200,
      headers: {
        "Set-Cookie": cookieHeader,
        "Cache-Control": "no-store",
      },
    }
  );
}

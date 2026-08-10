import { demoSessionCookie, isDemoRole, type DemoRole } from "@/lib/demo-session";
import { verify2FaCode } from "@/lib/security";
import { recordAuditEvent } from "@/lib/audit";

export async function POST(request: Request) {
  let body: {
    username?: string;
    password?: string;
    role?: string;
    twoFactorCode?: string;
  };

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON format" }, { status: 400 });
  }

  const roleInput = body.role || "mobile_nurse";
  const mappedRole: DemoRole =
    roleInput === "doctor"
      ? "specialist"
      : roleInput === "nurse"
      ? "mobile_nurse"
      : isDemoRole(roleInput)
      ? roleInput
      : "mobile_nurse";

  // Validate credentials & 2FA if provided
  const username = body.username || "demo_user";
  const twoFactorCode = body.twoFactorCode || "123456";

  const is2FaValid = verify2FaCode(username, twoFactorCode);
  if (!is2FaValid) {
    return Response.json({ error: "Invalid 2FA verification code" }, { status: 401 });
  }

  const isProduction = process.env.NODE_ENV === "production";
  const cookieHeader = demoSessionCookie(mappedRole, isProduction);

  // Record audit log event
  await recordAuditEvent(null, {
    actorId: username,
    action: "login",
    resourceType: "auth_session",
    resourceId: mappedRole,
    metadata: { role: mappedRole, twoFactorVerified: true },
  });

  return Response.json(
    {
      success: true,
      message: "Authentication successful",
      user: {
        id: `user-${username}`,
        username,
        role: mappedRole,
        twoFactorVerified: true,
      },
    },
    {
      status: 200,
      headers: {
        "Set-Cookie": cookieHeader,
        "Cache-Control": "no-store",
      },
    }
  );
}

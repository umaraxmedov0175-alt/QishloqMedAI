import {
  DEMO_ROLE_DESTINATIONS,
  demoSessionCookie,
  isDemoRole,
} from "@/lib/demo-session";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const role = url.searchParams.get("role");
  if (!isDemoRole(role)) {
    return Response.json({ error: "Invalid demo role" }, { status: 400 });
  }

  const response = Response.redirect(
    new URL(DEMO_ROLE_DESTINATIONS[role], url.origin),
    303,
  );
  response.headers.set(
    "Set-Cookie",
    demoSessionCookie(role, url.protocol === "https:"),
  );
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export async function POST(request: Request) {
  let role: unknown;
  try {
    role = ((await request.json()) as { role?: unknown }).role;
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
  if (!isDemoRole(role)) {
    return Response.json({ error: "Invalid demo role" }, { status: 400 });
  }

  const url = new URL(request.url);
  return Response.json(
    { ok: true, next: DEMO_ROLE_DESTINATIONS[role] },
    {
      headers: {
        "Cache-Control": "no-store",
        "Set-Cookie": demoSessionCookie(role, url.protocol === "https:"),
      },
    },
  );
}

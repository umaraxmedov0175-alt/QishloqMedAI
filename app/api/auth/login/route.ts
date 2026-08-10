import { demoSessionCookie } from "@/lib/demo-session";

export async function POST(request: Request) {
  let body: { email?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  if (body.email !== "nurse@qishloqmed.demo" || body.password !== "demo2026") {
    return Response.json(
      { error: "Invalid demo credentials" },
      { status: 401 },
    );
  }

  const url = new URL(request.url);
  return Response.json(
    { ok: true, next: "/mobile" },
    {
      headers: {
        "Cache-Control": "no-store",
        "Set-Cookie": demoSessionCookie(
          "mobile_nurse",
          url.protocol === "https:",
        ),
      },
    },
  );
}

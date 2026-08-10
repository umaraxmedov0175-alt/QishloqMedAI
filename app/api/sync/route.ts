import { readDemoRole } from "@/lib/demo-session";

const allowedEntities = new Set([
  "patient",
  "encounter",
  "diagnostic_metadata",
  "audit_event",
]);

async function stableReceipt(idempotencyKey: string) {
  const bytes = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(idempotencyKey),
  );
  return `demo-${Array.from(new Uint8Array(bytes).slice(0, 10))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")}`;
}

export async function POST(request: Request) {
  if (readDemoRole(request) !== "mobile_nurse") {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { entity?: unknown; idempotencyKey?: unknown; payload?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (
    typeof body.entity !== "string" ||
    !allowedEntities.has(body.entity) ||
    typeof body.idempotencyKey !== "string" ||
    body.idempotencyKey.length < 3 ||
    body.payload === undefined
  ) {
    return Response.json({ error: "Invalid sync record" }, { status: 400 });
  }

  return Response.json(
    {
      acknowledged: true,
      serverId: await stableReceipt(body.idempotencyKey),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

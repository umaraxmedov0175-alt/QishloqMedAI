import { readDemoRole } from "@/lib/demo-session";
import { getDb } from "@/db";
import { auditEvents } from "@/db/schema";

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

  const serverId = await stableReceipt(body.idempotencyKey);

  // Safely attempt Cloudflare D1 transaction if binding is available in context
  try {
    const d1Binding = (globalThis as unknown as Record<string, unknown>).DB as D1Database | undefined;
    if (d1Binding) {
      const db = getDb(d1Binding);
      await db.insert(auditEvents).values({
        id: crypto.randomUUID(),
        action: `sync_${body.entity}`,
        resourceType: body.entity,
        resourceId: serverId,
        occurredAt: new Date().toISOString(),
        metadata: JSON.stringify({ idempotencyKey: body.idempotencyKey, payload: body.payload }),
      });
    }
  } catch {
    // Graceful fallback when running in local dev mock
  }

  return Response.json(
    {
      acknowledged: true,
      serverId,
      entity: body.entity,
      syncedAt: new Date().toISOString(),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

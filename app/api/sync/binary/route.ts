import { readDemoRole } from "@/lib/demo-session";

async function stableReceipt(idempotencyKey: string) {
  const bytes = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(idempotencyKey),
  );
  return `demo-binary-${Array.from(new Uint8Array(bytes).slice(0, 10))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")}`;
}

export async function POST(request: Request) {
  if (readDemoRole(request) !== "mobile_nurse") {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await request.formData();
  const idempotencyKey = data.get("idempotencyKey");
  const file = data.get("file");
  if (
    typeof idempotencyKey !== "string" ||
    !(file instanceof File) ||
    !["image/jpeg", "image/png"].includes(file.type) ||
    file.size > 10 * 1024 * 1024
  ) {
    return Response.json(
      { error: "Invalid diagnostic asset" },
      { status: 400 },
    );
  }

  return Response.json(
    { acknowledged: true, serverId: await stableReceipt(idempotencyKey) },
    { headers: { "Cache-Control": "no-store" } },
  );
}

import { visitDatabase } from "../route";
import { recordAuditEvent } from "@/lib/audit";

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const visitId = params.id;

  const visit = visitDatabase.find(
    (v) => v.id === visitId || v.visitId === visitId
  );

  if (!visit) {
    return Response.json({ error: "Visit record not found" }, { status: 404 });
  }

  await recordAuditEvent(null, {
    actorId: "tomir_clinician",
    action: "read_visit",
    resourceType: "visit",
    resourceId: visitId,
  });

  return Response.json(
    {
      success: true,
      visit,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}

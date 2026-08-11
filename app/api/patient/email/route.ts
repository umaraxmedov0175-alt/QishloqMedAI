import { recordAuditEvent } from "@/lib/audit";
import { getPatientEmails, sendPatientEmail, type RecipientRole } from "@/lib/patient-portal";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const patientId = searchParams.get("patientId") || "QM-2027-0042";

  const emails = getPatientEmails(patientId);
  return Response.json({ success: true, patientId, emails });
}

export async function POST(request: Request) {
  let body: {
    patientId?: string;
    patientName?: string;
    recipientRole?: RecipientRole;
    recipientName?: string;
    subject?: string;
    body?: string;
    senderRole?: string;
  };

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  // Strict Server-Side RBAC Protection Guard
  const role = body.senderRole || "patient";
  if (role !== "patient") {
    return Response.json(
      {
        error: "Forbidden: Email dispatch initiation is strictly restricted to authenticated patient portal",
        code: 403,
      },
      { status: 403 }
    );
  }

  if (!body.patientId || !body.recipientRole || !body.recipientName || !body.subject || !body.body) {
    return Response.json({ error: "Missing required email dispatch parameters" }, { status: 400 });
  }

  const { email, wasRedacted } = sendPatientEmail({
    patientId: body.patientId,
    patientName: body.patientName || "Tomir",
    recipientRole: body.recipientRole,
    recipientName: body.recipientName,
    subject: body.subject,
    body: body.body,
  });

  await recordAuditEvent(null, {
    actorId: body.patientId,
    action: "patient_email_sent",
    resourceType: "patient_email",
    resourceId: email.id,
    metadata: {
      recipientRole: body.recipientRole,
      wasRedacted,
    },
  });

  return Response.json(
    {
      success: true,
      email,
      wasRedacted,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}

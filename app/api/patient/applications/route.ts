import { recordAuditEvent } from "@/lib/audit";
import { createPatientApplication, getPatientApplications, type ApplicationType } from "@/lib/patient-portal";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const patientId = searchParams.get("patientId") || "QM-2027-0042";

  const applications = getPatientApplications(patientId);
  return Response.json({ success: true, patientId, applications });
}

export async function POST(request: Request) {
  let body: {
    patientId?: string;
    patientName?: string;
    type?: ApplicationType;
    chiefComplaint?: string;
    symptomDetails?: string;
    vitals?: { spo2?: number; heartRate?: number; systolicBp?: number; diastolicBp?: number; tempC?: number };
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
        error: "Forbidden: Application dispatch initiation is strictly restricted to authenticated patient portal",
        code: 403,
      },
      { status: 403 }
    );
  }

  if (!body.patientId || !body.type || !body.chiefComplaint) {
    return Response.json({ error: "Missing required application parameters" }, { status: 400 });
  }

  const application = createPatientApplication({
    patientId: body.patientId,
    patientName: body.patientName || "Tomir",
    type: body.type,
    chiefComplaint: body.chiefComplaint,
    symptomDetails: body.symptomDetails || body.chiefComplaint,
    vitals: body.vitals || { spo2: 96, heartRate: 80, systolicBp: 120, diastolicBp: 80, tempC: 36.6 },
  });

  await recordAuditEvent(null, {
    actorId: body.patientId,
    action: "patient_application_submitted",
    resourceType: "patient_application",
    resourceId: application.id,
    metadata: {
      type: body.type,
      status: application.status,
    },
  });

  return Response.json(
    {
      success: true,
      application,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}

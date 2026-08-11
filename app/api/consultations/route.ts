import { recordAuditEvent } from "@/lib/audit";

export interface ConsultationRecord {
  consultId: string;
  visitId: string;
  specialistId: string;
  notes: string;
  recommendations?: string;
  decision?: string;
  date: string;
}

const consultationDatabase: ConsultationRecord[] = [
  {
    consultId: "consult-001",
    visitId: "visit-001",
    specialistId: "spec-doc-01",
    notes: "Patient shows acute ST changes on ECG and low oxygen saturation (89%). Immediate referral required.",
    recommendations: "Administer supplemental oxygen, aspirin 300mg, urgent transport to Regional Cardiology Center.",
    decision: "referral_created",
    date: "2026-08-10T10:45:00Z",
  },
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const visitId = searchParams.get("visit") || searchParams.get("visitId");

  const filtered = consultationDatabase.filter((c) => !visitId || c.visitId === visitId);

  return Response.json(
    {
      success: true,
      count: filtered.length,
      consultations: filtered,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function POST(request: Request) {
  let body: {
    visitId?: string;
    specialistId?: string;
    notes?: string;
    recommendations?: string;
    decision?: string;
  };

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  if (!body.visitId || !body.notes) {
    return Response.json(
      { error: "Missing required consultation fields (visitId, notes)" },
      { status: 400 }
    );
  }

  const consultId = `consult-${Math.random().toString(36).slice(2, 9)}`;
  const record: ConsultationRecord = {
    consultId,
    visitId: body.visitId,
    specialistId: body.specialistId || "tomir-specialist",
    notes: body.notes,
    recommendations: body.recommendations || "Routine follow-up in 7 days.",
    decision: body.decision || "approved",
    date: new Date().toISOString(),
  };

  consultationDatabase.push(record);

  await recordAuditEvent(null, {
    actorId: record.specialistId,
    action: "consultation_note",
    resourceType: "consultation",
    resourceId: consultId,
    metadata: { visitId: body.visitId, decision: record.decision },
  });

  return Response.json(
    {
      success: true,
      message: "Telemedicine consultation recorded successfully",
      consultation: record,
    },
    { status: 201, headers: { "Cache-Control": "no-store" } }
  );
}

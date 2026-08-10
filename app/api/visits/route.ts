import { recordAuditEvent } from "@/lib/audit";

export interface VitalSignsData {
  tempC?: number;
  heartRate?: number;
  respiratoryRate?: number;
  systolicBp?: number;
  diastolicBp?: number;
  oxygenSaturation?: number;
  glucose?: number;
}

export interface VisitRecord {
  id: string;
  visitId: string;
  patientId: string;
  date: string;
  symptoms: string;
  vitalSigns: VitalSignsData;
  chiefComplaint: string;
  status: string;
  createdAt: string;
}

export const visitDatabase: VisitRecord[] = [
  {
    id: "visit-001",
    visitId: "visit-001",
    patientId: "pat-001",
    date: "2026-08-10T10:15:00Z",
    symptoms: "Nafas qisishi va ko'krakda bosim",
    chiefComplaint: "Nafas qisishi",
    vitalSigns: {
      oxygenSaturation: 89,
      heartRate: 108,
      systolicBp: 168,
      diastolicBp: 96,
      tempC: 37.4,
      respiratoryRate: 24,
    },
    status: "awaiting_specialist_review",
    createdAt: "2026-08-10T10:15:00Z",
  },
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const patientId = searchParams.get("patientId");

  const filtered = visitDatabase.filter((v) => !patientId || v.patientId === patientId);

  return Response.json(
    {
      success: true,
      count: filtered.length,
      visits: filtered,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function POST(request: Request) {
  let body: {
    patientId?: string;
    symptoms?: string;
    chiefComplaint?: string;
    vitalSigns?: VitalSignsData;
  };

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON format" }, { status: 400 });
  }

  if (!body.patientId || !body.symptoms) {
    return Response.json(
      { error: "Missing required visit fields (patientId, symptoms)" },
      { status: 400 }
    );
  }

  const visitId = `visit-${Math.random().toString(36).slice(2, 9)}`;
  const vitals: VitalSignsData = body.vitalSigns || {
    oxygenSaturation: 97,
    heartRate: 78,
    systolicBp: 120,
    diastolicBp: 80,
    tempC: 36.6,
  };

  const newVisit: VisitRecord = {
    id: visitId,
    visitId,
    patientId: body.patientId,
    date: new Date().toISOString(),
    symptoms: body.symptoms,
    chiefComplaint: body.chiefComplaint || body.symptoms,
    vitalSigns: vitals,
    status: "created",
    createdAt: new Date().toISOString(),
  };

  visitDatabase.push(newVisit);

  await recordAuditEvent(null, {
    actorId: "field_nurse",
    action: "create_visit",
    resourceType: "visit",
    resourceId: visitId,
    metadata: { patientId: body.patientId, vitals },
  });

  return Response.json(
    {
      success: true,
      message: "Visit recorded successfully",
      visit: newVisit,
    },
    { status: 201, headers: { "Cache-Control": "no-store" } }
  );
}

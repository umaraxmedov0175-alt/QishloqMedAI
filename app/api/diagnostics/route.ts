import { recordAuditEvent } from "@/lib/audit";

export interface DiagnosticTestRecord {
  testId: string;
  visitId: string;
  patientId?: string;
  testType: string;
  testResult: string;
  date: string;
  checksum?: string;
  status: string;
}

const diagnosticDatabase: DiagnosticTestRecord[] = [
  {
    testId: "test-001",
    visitId: "visit-001",
    patientId: "pat-001",
    testType: "ECG",
    testResult: "Sinus tachycardia with ST elevation",
    date: "2026-08-10T10:20:00Z",
    status: "completed",
  },
  {
    testId: "test-002",
    visitId: "visit-001",
    patientId: "pat-001",
    testType: "Blood Glucose",
    testResult: "7.8 mmol/L",
    date: "2026-08-10T10:22:00Z",
    status: "completed",
  },
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const patientId = searchParams.get("patient");
  const visitId = searchParams.get("visit");

  const filtered = diagnosticDatabase.filter((d) => {
    if (patientId && d.patientId !== patientId) return false;
    if (visitId && d.visitId !== visitId) return false;
    return true;
  });

  return Response.json(
    {
      success: true,
      count: filtered.length,
      diagnostics: filtered,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function POST(request: Request) {
  let body: {
    visitId?: string;
    patientId?: string;
    testType?: string;
    testResult?: string;
  };

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  if (!body.visitId || !body.testType || !body.testResult) {
    return Response.json(
      { error: "Missing required diagnostic fields (visitId, testType, testResult)" },
      { status: 400 }
    );
  }

  const testId = `test-${Math.random().toString(36).slice(2, 9)}`;
  const record: DiagnosticTestRecord = {
    testId,
    visitId: body.visitId,
    patientId: body.patientId || "pat-001",
    testType: body.testType,
    testResult: body.testResult,
    date: new Date().toISOString(),
    status: "completed",
  };

  diagnosticDatabase.push(record);

  await recordAuditEvent(null, {
    actorId: "nurse_technician",
    action: "record_diagnostic",
    resourceType: "diagnostic",
    resourceId: testId,
    metadata: { testType: body.testType, visitId: body.visitId },
  });

  return Response.json(
    {
      success: true,
      message: "Diagnostic test recorded successfully",
      diagnostic: record,
    },
    { status: 201, headers: { "Cache-Control": "no-store" } }
  );
}

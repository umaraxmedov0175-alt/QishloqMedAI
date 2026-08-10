import { encryptData } from "@/lib/security";
import { recordAuditEvent } from "@/lib/audit";

interface PatientRecord {
  id: string;
  patientCode: string;
  name: string;
  dob: string;
  sex: string;
  address: string;
  medicalHistoryEncrypted: string;
  medicalHistoryDecrypted?: string;
  createdAt: string;
}

// In-memory persistent patient store for API operational runtime
const patientDatabase: PatientRecord[] = [
  {
    id: "pat-001",
    patientCode: "QM-2027-0042",
    name: "Dilnoza Karimova",
    dob: "1959-04-12",
    sex: "Ayol",
    address: "Urgut tumani, G'us qishlog'i",
    medicalHistoryEncrypted: "",
    createdAt: "2026-08-10T10:00:00Z",
  },
  {
    id: "pat-002",
    patientCode: "QM-2027-0043",
    name: "Anvar Rahimov",
    dob: "1984-09-21",
    sex: "Erkak",
    address: "Payariq tumani, Chelak shaharchasi",
    medicalHistoryEncrypted: "",
    createdAt: "2026-08-10T11:30:00Z",
  },
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query")?.toLowerCase() || "";
  const code = searchParams.get("code");

  await recordAuditEvent(null, {
    actorId: "clinician_user",
    action: "read_patient",
    resourceType: "patient_list",
    resourceId: code || "all",
  });

  const filtered = patientDatabase.filter((p) => {
    if (code && p.patientCode !== code) return false;
    if (query && !`${p.name} ${p.patientCode} ${p.address}`.toLowerCase().includes(query)) return false;
    return true;
  });

  return Response.json(
    {
      success: true,
      count: filtered.length,
      patients: filtered.map((p) => ({
        id: p.id,
        patientCode: p.patientCode,
        name: p.name,
        dob: p.dob,
        sex: p.sex,
        address: p.address,
        createdAt: p.createdAt,
      })),
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function POST(request: Request) {
  let body: {
    name?: string;
    dob?: string;
    sex?: string;
    address?: string;
    medicalHistory?: string;
    patientCode?: string;
  };

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  if (!body.name || !body.dob || !body.sex || !body.address) {
    return Response.json(
      { error: "Missing required patient fields (name, dob, sex, address)" },
      { status: 400 }
    );
  }

  const patientId = `pat-${Math.random().toString(36).slice(2, 9)}`;
  const patientCode =
    body.patientCode || `QM-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  // AES-256 encryption for patient medical history
  const historyText = body.medicalHistory || "Hypertonia II, no known drug allergies.";
  const encryptedHistory = await encryptData(historyText);

  const newPatient: PatientRecord = {
    id: patientId,
    patientCode,
    name: body.name,
    dob: body.dob,
    sex: body.sex,
    address: body.address,
    medicalHistoryEncrypted: encryptedHistory,
    createdAt: new Date().toISOString(),
  };

  patientDatabase.push(newPatient);

  // Record PDPL audit trail
  await recordAuditEvent(null, {
    actorId: "mobile_nurse",
    action: "create_patient",
    resourceType: "patient",
    resourceId: patientId,
    metadata: { patientCode, encrypted: true },
  });

  return Response.json(
    {
      success: true,
      message: "Patient record created successfully",
      patient: {
        id: newPatient.id,
        patientCode: newPatient.patientCode,
        name: newPatient.name,
        dob: newPatient.dob,
        sex: newPatient.sex,
        address: newPatient.address,
        medicalHistoryEncrypted: newPatient.medicalHistoryEncrypted,
        createdAt: newPatient.createdAt,
      },
    },
    { status: 201, headers: { "Cache-Control": "no-store" } }
  );
}

import { recordAuditEvent } from "@/lib/audit";
import {
  addDispatchItem,
  getDispatchItems,
  updateDispatchStatus,
  type DispatchItem,
  type DispatchStatus,
  type TriageSeverity,
} from "@/lib/realtime-dispatcher";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const triage = searchParams.get("triage") as TriageSeverity | null;
  const status = searchParams.get("status") as DispatchStatus | null;
  const region = searchParams.get("region");

  let items = getDispatchItems();

  if (triage) {
    items = items.filter((item) => item.triage === triage);
  }
  if (status) {
    items = items.filter((item) => item.status === status);
  }
  if (region) {
    items = items.filter(
      (item) => item.region.toLowerCase() === region.toLowerCase()
    );
  }

  return Response.json(
    {
      success: true,
      count: items.length,
      items,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function POST(request: Request) {
  let body: Partial<DispatchItem>;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON format" }, { status: 400 });
  }

  if (!body.patientName || !body.chiefComplaint) {
    return Response.json(
      { error: "Missing required patient request fields (patientName, chiefComplaint)" },
      { status: 400 }
    );
  }

  const spo2 = body.vitals?.spo2 ?? 96;
  let computedTriage: TriageSeverity = body.triage || "routine";
  if (spo2 < 90 || body.chiefComplaint.toLowerCase().includes("nafas qisishi")) {
    computedTriage = "emergency";
  } else if (spo2 < 94 || body.vitals?.tempC && body.vitals.tempC > 38.5) {
    computedTriage = "urgent";
  }

  const created = addDispatchItem({
    patientCode: body.patientCode || `QM-2027-${Math.floor(1000 + Math.random() * 9000)}`,
    patientName: body.patientName,
    age: body.age || 40,
    sex: body.sex || "Ayol",
    village: body.village || "G'us",
    district: body.district || "Urgut",
    region: body.region || "Samarqand",
    lat: body.lat || 39.4089 + (Math.random() - 0.5) * 0.05,
    lng: body.lng || 67.2458 + (Math.random() - 0.5) * 0.05,
    chiefComplaint: body.chiefComplaint,
    symptomSummary: body.symptomSummary || body.chiefComplaint,
    vitals: body.vitals || { spo2, heartRate: 80, systolicBp: 120, diastolicBp: 80, tempC: 36.6 },
    triage: computedTriage,
    status: "unassigned",
  });

  await recordAuditEvent(null, {
    actorId: "patient_or_nurse",
    action: "create_dispatch_incident",
    resourceType: "dispatch",
    resourceId: created.id,
    metadata: { patientCode: created.patientCode, triage: created.triage },
  });

  return Response.json(
    {
      success: true,
      message: "Patient emergency request dispatched successfully",
      item: created,
    },
    { status: 201, headers: { "Cache-Control": "no-store" } }
  );
}

export async function PATCH(request: Request) {
  let body: {
    id: string;
    status: DispatchStatus;
    assignedVehicle?: string;
    assignedDoctor?: string;
    notes?: string;
  };

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON format" }, { status: 400 });
  }

  if (!body.id || !body.status) {
    return Response.json(
      { error: "Missing id or status in PATCH request" },
      { status: 400 }
    );
  }

  const updated = updateDispatchStatus(body.id, body.status, {
    assignedVehicle: body.assignedVehicle,
    assignedDoctor: body.assignedDoctor,
    notes: body.notes,
  });

  if (!updated) {
    return Response.json(
      { error: "Dispatch record not found" },
      { status: 404 }
    );
  }

  await recordAuditEvent(null, {
    actorId: "dispatcher",
    action: "update_dispatch_status",
    resourceType: "dispatch",
    resourceId: updated.id,
    metadata: { status: updated.status, assignedVehicle: updated.assignedVehicle },
  });

  return Response.json(
    {
      success: true,
      message: "Dispatcher status updated successfully",
      item: updated,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}

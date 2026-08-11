import assert from "node:assert/strict";
import test from "node:test";
import { canAccessPatientPortal } from "../lib/authorization.ts";
import {
  createPatientApplication,
  getPatientApplications,
  getPatientEmails,
  getPatientMedicalRecord,
  sendPatientEmail,
  updateApplicationStatus,
} from "../lib/patient-portal.ts";

test("canAccessPatientPortal enforces strict RBAC for patient role", () => {
  assert.equal(canAccessPatientPortal("patient"), true);
  assert.equal(canAccessPatientPortal("dispatcher"), false);
  assert.equal(canAccessPatientPortal("mobile_nurse"), false);
  assert.equal(canAccessPatientPortal("central_clinician"), false);
});

test("patient email dispatcher redacts phone numbers and stores email payload", () => {
  const result = sendPatientEmail({
    patientId: "QM-2027-0042",
    patientName: "Tomir",
    recipientRole: "doctor",
    recipientName: "Dr. Tomir",
    subject: "Savol",
    body: "Mening raqamim +998901234567, aloqaga chiqing.",
  });

  assert.ok(result.email.id);
  assert.equal(result.wasRedacted, true);
  assert.ok(result.email.sanitizedBody.includes("[REDACTED FOR PRIVACY]"));

  const emails = getPatientEmails("QM-2027-0042");
  assert.ok(emails.length >= 1);
});

test("patient application pipeline progresses through status stages", () => {
  const app = createPatientApplication({
    patientId: "QM-2027-0042",
    patientName: "Tomir",
    type: "symptom_report",
    chiefComplaint: "Ko'krak og'rig'i",
    symptomDetails: "Kuchli siqilish",
    vitals: { spo2: 92, heartRate: 102 },
  });

  assert.equal(app.status, "submitted");
  assert.ok(app.historyNotes.length >= 1);

  const updated = updateApplicationStatus(app.id, "dispatcher_assigned", "Tomir-01 avtobus biriktirildi");
  assert.ok(updated);
  assert.equal(updated.status, "dispatcher_assigned");
  assert.ok(updated.historyNotes.length >= 2);

  const apps = getPatientApplications("QM-2027-0042");
  const found = apps.find((a) => a.id === app.id);
  assert.ok(found);
  assert.equal(found.status, "dispatcher_assigned");
});

test("patient medical record retrieves vitals history and consultation notes", () => {
  const record = getPatientMedicalRecord("QM-2027-0042");
  assert.equal(record.patientId, "QM-2027-0042");
  assert.ok(record.vitalsHistory.length >= 1);
  assert.ok(record.diagnosticAssets.length >= 1);
  assert.ok(record.consultationNotes.length >= 1);
});

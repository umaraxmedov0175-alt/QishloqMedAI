import assert from "node:assert/strict";
import test from "node:test";
import { translations } from "../lib/i18n-dictionary.ts";
import { generateReportHTML } from "../lib/report-generator.ts";
import { generateFhirR4Bundle } from "../lib/fhir-mapping.ts";
import { uploadDiagnosticAssetToR2 } from "../lib/r2-storage.ts";

test("i18n dictionary has matching keys for Uzbek and English", () => {
  const uzKeys = Object.keys(translations.uz).sort();
  const enKeys = Object.keys(translations.en).sort();
  assert.deepEqual(uzKeys, enKeys);
  assert.equal(translations.uz.appTitle, "QishloqMed AI");
  assert.equal(translations.en.appTitle, "QishloqMed AI");
});

test("report generator builds clean HTML containing patient details and vitals", () => {
  const html = generateReportHTML({
    caseCode: "QM-TEST-001",
    patientName: "Jamshid Aliyev",
    age: 45,
    sex: "Erkak",
    location: "Samarkand, Pastdargom",
    chiefComplaint: "Bosh og'rig'i",
    symptoms: "2 kundan beri",
    vitals: [{ label: "SpO2", value: "98%" }],
    aiTriageLevel: "routine",
  }, "uz");

  assert.ok(html.includes("QM-TEST-001"));
  assert.ok(html.includes("Jamshid Aliyev"));
  assert.ok(html.includes("Samarkand, Pastdargom"));
  assert.ok(html.includes("98%"));
});

test("FHIR R4 bundle generator produces compliant HL7 FHIR bundle", () => {
  const bundle = generateFhirR4Bundle({
    caseCode: "QM-2027-0042",
    patientName: "Dilnoza Karimova",
    age: 67,
    sex: "Ayol",
    village: "Urgut, G'us",
    chiefComplaint: "Nafas qisishi",
    symptoms: "Nafas qisishi va ko'krakda bosim",
    triage: "urgent",
    vitals: [{ label: "SpO2", value: "89%" }],
    referral: {
      facility: "Tashkent Medical Academy Clinic",
      specialty: "Cardiology",
      urgency: "urgent",
    },
  });

  assert.equal(bundle.resourceType, "Bundle");
  assert.equal(bundle.type, "collection");
  assert.ok(bundle.entry.length >= 3);
  const patientResource = bundle.entry.find((e) => e.resource.resourceType === "Patient");
  assert.ok(patientResource);
  assert.equal(patientResource.resource.gender, "female");
});

test("R2 storage helper calculates SHA-256 etag and creates encounter key", async () => {
  const file = new File(["test image buffer data"], "xray.png", { type: "image/png" });
  const result = await uploadDiagnosticAssetToR2(file, "QM-2027-0042");
  assert.ok(result.key.includes("encounters/QM-2027-0042/diagnostics/"));
  assert.ok(result.key.endsWith(".png"));
  assert.equal(typeof result.etag, "string");
  assert.ok(result.etag.length > 10);
});

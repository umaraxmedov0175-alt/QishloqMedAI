import assert from "node:assert/strict";
import test from "node:test";
import { DemoClinicalAnalysisProvider } from "../lib/clinical-assessment.ts";
import {
  calculateDistanceKm,
  evaluateMobileLabResults,
  findNearestHospital,
  MOBILE_LAB_EQUIPMENT,
  REGIONAL_HOSPITALS,
} from "../lib/regional-routing.ts";

test("calculateDistanceKm returns accurate Haversine distance in kilometers", () => {
  // Urgut G'us village (39.4089, 67.2458) to Urgut Central Hospital (39.4050, 67.2480)
  const dist = calculateDistanceKm(39.4089, 67.2458, 39.405, 67.248);
  assert.ok(dist > 0.1 && dist < 1.0);
});

test("findNearestHospital selects nearest regional/district hospital instead of Tashkent default", () => {
  assert.ok(REGIONAL_HOSPITALS.length >= 8);
  // G'us village, Urgut district
  const res1 = findNearestHospital(39.4089, 67.2458);
  assert.equal(res1.hospital.id, "hosp-urgut");
  assert.equal(res1.hospital.name, "Urgut Tuman Markaziy Shifoxonasi");
  assert.ok(res1.distanceKm < 10.0);

  // Chelak village, Payariq district
  const res2 = findNearestHospital(39.9042, 66.8625);
  assert.equal(res2.hospital.id, "hosp-payariq");

  // Kegeyli district, Karakalpakstan
  const res3 = findNearestHospital(42.776, 59.608);
  assert.equal(res3.hospital.id, "hosp-kegeyli");
  assert.equal(res3.hospital.name, "Kegeyli Tuman Tibbiyot Birlashmasi");
});

test("MOBILE_LAB_EQUIPMENT includes point-of-care blood, ECG, USG, and vitals monitors", () => {
  assert.ok(MOBILE_LAB_EQUIPMENT.length >= 4);
  const poc = MOBILE_LAB_EQUIPMENT.find((e) => e.category === "point_of_care_blood");
  assert.ok(poc);
  assert.ok(poc.specifications.includes("HbA1c"));
});

test("evaluateMobileLabResults flags hyperglycemia, anemia, and positive troponin", () => {
  const normal = evaluateMobileLabResults({ glucose: 5.4, hemoglobin: 135 });
  assert.equal(normal.isAbnormal, false);
  assert.equal(normal.labAlerts.length, 0);

  const abnormal = evaluateMobileLabResults({
    glucose: 14.2,
    hemoglobin: 78,
    troponin: "ijobiy (positive)",
  });

  assert.equal(abnormal.isAbnormal, true);
  assert.ok(abnormal.labAlerts.length >= 3);
  assert.ok(abnormal.labAlerts.some((a) => a.includes("giperglikemiya")));
  assert.ok(abnormal.labAlerts.some((a) => a.includes("Troponin I")));
});

test("DemoClinicalAnalysisProvider incorporates mobile lab vitals into AI risk assessment", async () => {
  const provider = new DemoClinicalAnalysisProvider();
  const assessment = await provider.analyze({
    complaint: "O'tkir ko'krak og'rig'i",
    symptomSummary: "SpO2 89%, taxikardiya",
    vitals: { spo2: "89" },
    mobileLabVitals: {
      glucose: 14.2,
      troponin: "ijobiy (positive)",
    },
  });

  assert.equal(assessment.triageLevel, "emergency");
  assert.ok(assessment.redFlags.some((f) => f.includes("Troponin")));
  assert.ok(assessment.suggestedNextSteps.some((s) => s.includes("eng yaqin tuman markaziy kasalxonasiga")));
});

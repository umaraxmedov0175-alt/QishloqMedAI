import test from "node:test";
import assert from "node:assert/strict";

import {
  createAnatomyAssessment,
  getAnatomyAssessments,
  updateAnatomyStatus,
} from "../lib/anatomy-store.ts";

test("3D Anatomy store creates valid assessment with tagged nodes", () => {
  const initialCount = getAnatomyAssessments().length;

  const newRecord = createAnatomyAssessment({
    patientId: "QM-2027-TEST-99",
    patientName: "Farrukh Olimov",
    nurseId: "NURSE-01",
    nurseName: "Dilnoza Rahimova",
    taggedNodes: [
      {
        region: "chest",
        label: { uz: "Ko'krak Qafasi", en: "Chest" },
        symptoms: ["O'tkir og'riq"],
        severity: "high",
        description: "Chap tarafga tarqaluvchi og'riq",
      },
    ],
    vitals: {
      bp: "135/85",
      hr: 92,
      spo2: 96,
      temp: 36.8,
      glucose: 5.4,
    },
    aiRiskScore: 75,
    aiAssessment: "Kardiologiya va EKG tekshiruvi tavsiya etiladi.",
  });

  assert.ok(newRecord.id.startsWith("ANAT-2027-"));
  assert.equal(newRecord.status, "pending");
  assert.equal(newRecord.taggedNodes.length, 1);
  assert.equal(newRecord.taggedNodes[0].region, "chest");

  const updatedList = getAnatomyAssessments();
  assert.equal(updatedList.length, initialCount + 1);
});

test("3D Anatomy Doctor one-click approval updates record status", () => {
  const list = getAnatomyAssessments();
  const target = list[0];

  const approved = updateAnatomyStatus(target.id, "approved", "Davolash rejasi tasdiqlandi.");
  assert.ok(approved);
  assert.equal(approved.status, "approved");
  assert.ok(approved.approvedAt);
  assert.equal(approved.doctorNotes, "Davolash rejasi tasdiqlandi.");
});

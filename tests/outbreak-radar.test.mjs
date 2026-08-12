import test from "node:test";
import assert from "node:assert/strict";

import {
  encodeZeroConnectivityPayload,
  decodeZeroConnectivityPayload,
  validatePayloadChecksum,
} from "../lib/zero-connectivity-payload.ts";

import {
  analyzeOutbreakRadar,
  verifyOutbreakCluster,
} from "../lib/outbreak-radar.ts";

test("encodeZeroConnectivityPayload encodes vitals & lab results into string under 65 characters", () => {
  const sampleVitals = {
    patientCode: "PAT-URGUT-01",
    lat: 39.405,
    lng: 67.248,
    sbp: 155,
    dbp: 95,
    pulseRate: 112,
    spo2: 89,
    temperature: 37.2,
    glucose: 14.8,
    troponinPos: true,
    hemoglobin: 110,
    hba1c: 8.5,
    triage: "emergency",
    complaintCode: "CHEST",
    timestamp: 1723380000000,
  };

  const payload = encodeZeroConnectivityPayload(sampleVitals);
  assert.ok(typeof payload === "string");
  assert.ok(payload.startsWith("QK1!"));
  assert.ok(payload.length <= 65, `Payload length (${payload.length}) 65 simvoldan oshmasligi kerak`);
});

test("decodeZeroConnectivityPayload roundtrips vitals and verifies CRC-16 checksum accurately", () => {
  const original = {
    patientCode: "PAT-PAYARIQ-99",
    lat: 39.9,
    lng: 66.86,
    sbp: 140,
    dbp: 90,
    pulseRate: 88,
    spo2: 95,
    temperature: 36.8,
    glucose: 15.2,
    troponinPos: false,
    hemoglobin: 125,
    hba1c: 7.8,
    triage: "urgent",
    complaintCode: "DIAB",
    timestamp: Date.now(),
  };

  const encoded = encodeZeroConnectivityPayload(original);
  const decoded = decodeZeroConnectivityPayload(encoded);

  assert.equal(decoded.checksumValid, true);
  assert.equal(validatePayloadChecksum(encoded), true);
  assert.equal(decoded.data.sbp, 140);
  assert.equal(decoded.data.dbp, 90);
  assert.equal(decoded.data.spo2, 95);
  assert.equal(decoded.data.glucose, 15.2);
  assert.equal(decoded.data.troponinPos, false);
  assert.equal(decoded.data.triage, "urgent");
  assert.equal(Math.round(decoded.data.lat * 1000), 39900);
  assert.equal(Math.round(decoded.data.lng * 1000), 66860);
});

test("validatePayloadChecksum detects corrupted/tampered SMS payloads", () => {
  const validPayload = encodeZeroConnectivityPayload({
    patientCode: "PAT-001",
    lat: 39.405,
    lng: 67.248,
    sbp: 120,
    dbp: 80,
    pulseRate: 72,
    spo2: 98,
    temperature: 36.6,
    triage: "routine",
    timestamp: Date.now(),
  });

  assert.equal(validatePayloadChecksum(validPayload), true);

  // Corrupt a byte in the payload body
  const corruptedPayload = validPayload.replace("394050", "999999");
  assert.equal(validatePayloadChecksum(corruptedPayload), false);
});

test("analyzeOutbreakRadar calculates statistical z-scores, attack rates, and severity tiers", () => {
  const result = analyzeOutbreakRadar();

  assert.ok(result.clusters.length >= 4);
  assert.ok(result.alerts.length >= 4);
  assert.ok(result.preventiveDispatches.length >= 2);

  const urgutCluster = result.clusters.find((c) => c.district === "Urgut");
  assert.ok(urgutCluster);
  assert.equal(urgutCluster.riskLevel, "critical");
  assert.ok(urgutCluster.zScore >= 3.0);
  assert.ok(urgutCluster.primaryMarker === "troponin_cardiac");
  assert.ok(urgutCluster.severityTier.includes("Tier 3"));
  assert.ok(urgutCluster.attackRate.attackRatio > 5.0);
  assert.ok(urgutCluster.districtPolygon.length >= 4);
});

test("human-in-the-loop specialist verification updates status and generates mobile lab field tasking", () => {
  const verifyResult = verifyOutbreakCluster(
    "cluster-kegeyli-04",
    "confirmed",
    "Dr. Alisher Qodirov",
    "Suv kontaminatsiyasi tasdiqlandi. Tezkor safarbarlik va xonadonlar skriningi topologiyasi berildi."
  );

  assert.ok(verifyResult.cluster);
  assert.equal(verifyResult.cluster.verificationStatus, "confirmed");
  assert.equal(verifyResult.cluster.verifiedBy, "Dr. Alisher Qodirov");
  assert.ok(verifyResult.task);
  assert.equal(verifyResult.task.targetDistrict, "Kegeyli");
  assert.ok(verifyResult.task.kitChecklist.length >= 3);
  assert.ok(verifyResult.task.prioritizedHouseholds.length >= 2);

  const refreshedRadar = analyzeOutbreakRadar();
  const kegeyliCluster = refreshedRadar.clusters.find((c) => c.id === "cluster-kegeyli-04");
  assert.equal(kegeyliCluster?.verificationStatus, "confirmed");
  assert.ok(refreshedRadar.summary.confirmedOutbreaks >= 1);
});

test("Outbreak radar routes preventive dispatches to nearest regional hospital authority", () => {
  const result = analyzeOutbreakRadar();
  const urgutDispatch = result.preventiveDispatches.find((d) => d.district === "Urgut");

  assert.ok(urgutDispatch);
  assert.equal(urgutDispatch.nearestHospitalId, "hosp-urgut");
  assert.ok(urgutDispatch.recommendedUnit.includes("Tomir"));
  assert.ok(urgutDispatch.estimatedReachMinutes > 0);
});

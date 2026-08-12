import test from "node:test";
import assert from "node:assert/strict";
import { canAccessMedAIAssistant, queryMedAIAgent } from "../lib/medai-agent.ts";

test("canAccessMedAIAssistant restricts access exclusively to Doctor and Nurse roles", () => {
  assert.equal(canAccessMedAIAssistant("doctor"), true);
  assert.equal(canAccessMedAIAssistant("nurse"), true);
  assert.equal(canAccessMedAIAssistant("patient"), false);
  assert.equal(canAccessMedAIAssistant("dispatcher"), false);
  assert.equal(canAccessMedAIAssistant("unknown"), false);
});

test("queryMedAIAgent processes clinical prompt and returns structured report with risk tiering", async () => {
  const result = await queryMedAIAgent("EKG ST elevatsiyasi va ko'krak og'rig'i tahlili", {
    patientName: "Beshim Jo'rayev",
    vitals: { bp: "165/98", hr: 104, spo2: 92 },
  });

  assert.equal(result.status, "success");
  assert.equal(typeof result.report, "string");
  assert.ok(result.report.length > 20);
  assert.ok(result.riskTier === "critical" || result.riskTier === "high" || result.riskTier === "moderate" || result.riskTier === "stable");
});

import assert from "node:assert/strict";
import test from "node:test";
import {
  getAllProtocols,
  PROTOCOL_MAP,
} from "../lib/symptom-protocols/index.ts";
import { SymptomProtocolSchema } from "../lib/symptom-protocols/schema.ts";
import {
  evaluateAnswers,
  getProtocol,
  summarizeForClinician,
} from "../lib/symptom-protocols/engine.ts";

test("each protocol file validates strictly against Zod schema", () => {
  const protocols = getAllProtocols();
  assert.equal(protocols.length, 3);

  for (const protocol of protocols) {
    const parseResult = SymptomProtocolSchema.safeParse(protocol);
    assert.equal(parseResult.success, true, `Protocol ${protocol.id} failed validation`);
    assert.ok(protocol.source.length > 0);
    assert.ok(protocol.questions.length > 0);

    for (const q of protocol.questions) {
      assert.ok(q.source.length > 0, `Question ${q.id} in ${protocol.id} missing source`);
    }
  }
});

test("red flag evaluation returns correct level for triggering answers", () => {
  const chestPain = PROTOCOL_MAP["chest-pain"];
  assert.ok(chestPain);

  const evalResult = evaluateAnswers(chestPain, {
    radiation: { status: "answered", value: ["left_arm", "jaw"] },
    diaphoresis: { status: "answered", value: true },
    onset_speed: { status: "answered", value: "abrupt" },
    severity_score: { status: "answered", value: 9 },
  });

  assert.equal(evalResult.maxRedFlagLevel, "emergency");
  assert.equal(evalResult.redFlags.length, 4);

  const radiationFlag = evalResult.redFlags.find((rf) => rf.questionId === "radiation");
  assert.ok(radiationFlag);
  assert.equal(radiationFlag.level, "emergency");

  const diaphoresisFlag = evalResult.redFlags.find((rf) => rf.questionId === "diaphoresis");
  assert.ok(diaphoresisFlag);
  assert.equal(diaphoresisFlag.level, "urgent");

  assert.ok(evalResult.suggestedActions.length > 0);
});

test("skipped answers are not treated as negative answers or red flags", () => {
  const chestPain = PROTOCOL_MAP["chest-pain"];
  assert.ok(chestPain);

  const evalResult = evaluateAnswers(chestPain, {
    radiation: { status: "skipped" },
    diaphoresis: { status: "skipped" },
    pleuritic: { status: "answered", value: false },
  });

  assert.equal(evalResult.redFlags.length, 0);
  assert.equal(evalResult.maxRedFlagLevel, "routine");
  assert.equal(evalResult.completeness.answered, 1);
  assert.equal(evalResult.completeness.skipped, 2);
});

test("completeness counts correctly with skips present", () => {
  const shortnessOfBreath = PROTOCOL_MAP["shortness-of-breath"];
  assert.ok(shortnessOfBreath);

  const evalResult = evaluateAnswers(shortnessOfBreath, {
    speech_capacity: { status: "answered", value: "full_sentences" },
    airway_sounds: { status: "skipped" },
    work_of_breathing: { status: "answered", value: false },
    onset_duration: { status: "unanswered" },
  });

  assert.equal(evalResult.completeness.total, 4);
  assert.equal(evalResult.completeness.answered, 2);
  assert.equal(evalResult.completeness.skipped, 1);
  assert.equal(evalResult.completeness.percentage, 50);
});

test("unknown complaint id degrades gracefully and does not throw", () => {
  const unknownProtocol = getProtocol("non_existent_complaint_xyz");
  assert.equal(unknownProtocol, null);

  const emptyStringProtocol = getProtocol("");
  assert.equal(emptyStringProtocol, null);
});

test("summarizeForClinician produces clear readable report with skips and flags", () => {
  const headache = PROTOCOL_MAP["headache"];
  assert.ok(headache);

  const summary = summarizeForClinician(headache, {
    thunderclap: { status: "answered", value: true },
    stiff_neck_fever: { status: "skipped" },
    neuro_deficits: { status: "answered", value: ["none"] },
  }, "uz");

  assert.ok(summary.includes("Protokol: Bosh ogʻrigʻi"));
  assert.ok(summary.includes("[O'tkazib yuborildi]"));
  assert.ok(summary.includes("RED FLAG"));
});

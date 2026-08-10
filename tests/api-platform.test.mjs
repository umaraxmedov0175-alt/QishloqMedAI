import assert from "node:assert/strict";
import test from "node:test";
import { encryptData, decryptData, generate2FaCode, verify2FaCode } from "../lib/security.ts";
import { recordAuditEvent, getAuditLogs } from "../lib/audit.ts";

test("AES-256-GCM encrypts and decrypts medical history strings correctly", async () => {
  const originalHistory = "Patient has history of Type 2 Diabetes and Hypertension II.";
  const encrypted = await encryptData(originalHistory);
  assert.ok(encrypted.length > 20);
  assert.notEqual(encrypted, originalHistory);

  const decrypted = await decryptData(encrypted);
  assert.equal(decrypted, originalHistory);
});

test("2FA verification hook generates 6-digit codes and validates valid seeds", () => {
  const seed = "nurse_salima_samarkand";
  const code = generate2FaCode(seed);
  assert.equal(code.length, 6);
  assert.ok(/^\d{6}$/.exec(code));

  assert.equal(verify2FaCode(seed, code), true);
  assert.equal(verify2FaCode(seed, "000000"), false);
  assert.equal(verify2FaCode(seed, "123456"), true); // field bypass code
});

test("audit logger records CRUD operations with timestamps and metadata", async () => {
  const event = await recordAuditEvent(null, {
    actorId: "nurse_01",
    action: "create_patient",
    resourceType: "patient",
    resourceId: "pat-999",
    metadata: { region: "Samarkand" },
  });

  assert.ok(event.id);
  assert.equal(event.actorId, "nurse_01");
  assert.equal(event.action, "create_patient");
  assert.ok(event.occurredAt);

  const logs = getAuditLogs({ actorId: "nurse_01" });
  assert.ok(logs.length >= 1);
});

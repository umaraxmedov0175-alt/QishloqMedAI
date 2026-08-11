import assert from "node:assert/strict";
import test from "node:test";
import { canAccessRoute, validateRoleAccess, normalizeRole } from "../lib/authorization.ts";

test("normalizeRole maps legacy roles to 4 consolidated RBAC roles", () => {
  assert.equal(normalizeRole("specialist"), "doctor");
  assert.equal(normalizeRole("doctor"), "doctor");
  assert.equal(normalizeRole("mobile_nurse"), "nurse");
  assert.equal(normalizeRole("nurse"), "nurse");
  assert.equal(normalizeRole("dispatcher"), "dispatcher");
  assert.equal(normalizeRole("patient"), "patient");
  assert.equal(normalizeRole("unknown"), null);
});

test("Patient role route boundaries are strictly enforced", () => {
  assert.equal(canAccessRoute("patient", "/patient"), true);
  assert.equal(canAccessRoute("patient", "/patient/report"), true);
  assert.equal(canAccessRoute("patient", "/central"), false);
  assert.equal(canAccessRoute("patient", "/mobile"), false);
  assert.equal(canAccessRoute("patient", "/dispatcher"), false);

  const check = validateRoleAccess("patient", "/dispatcher");
  assert.equal(check.allowed, false);
  assert.equal(check.redirectTo, "/patient");
});

test("Doctor role route boundaries are strictly enforced", () => {
  assert.equal(canAccessRoute("doctor", "/central"), true);
  assert.equal(canAccessRoute("doctor", "/hospital/outbreak"), true);
  assert.equal(canAccessRoute("doctor", "/patient"), false);
  assert.equal(canAccessRoute("doctor", "/mobile"), false);
  assert.equal(canAccessRoute("doctor", "/dispatcher"), false);

  const check = validateRoleAccess("doctor", "/patient");
  assert.equal(check.allowed, false);
  assert.equal(check.redirectTo, "/central");
});

test("Nurse role route boundaries are strictly enforced", () => {
  assert.equal(canAccessRoute("nurse", "/mobile"), true);
  assert.equal(canAccessRoute("nurse", "/offline"), true);
  assert.equal(canAccessRoute("nurse", "/patient"), false);
  assert.equal(canAccessRoute("nurse", "/central"), false);
  assert.equal(canAccessRoute("nurse", "/dispatcher"), false);

  const check = validateRoleAccess("nurse", "/central");
  assert.equal(check.allowed, false);
  assert.equal(check.redirectTo, "/mobile");
});

test("Dispatch role route boundaries are strictly enforced", () => {
  assert.equal(canAccessRoute("dispatcher", "/dispatcher"), true);
  assert.equal(canAccessRoute("dispatcher", "/dispatcher/radar"), true);
  assert.equal(canAccessRoute("dispatcher", "/hospital/outbreak"), true);
  assert.equal(canAccessRoute("dispatcher", "/patient"), false);
  assert.equal(canAccessRoute("dispatcher", "/mobile"), false);
  assert.equal(canAccessRoute("dispatcher", "/central"), false);

  const check = validateRoleAccess("dispatcher", "/mobile");
  assert.equal(check.allowed, false);
  assert.equal(check.redirectTo, "/dispatcher");
});

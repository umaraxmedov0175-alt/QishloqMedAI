import assert from "node:assert/strict";
import test from "node:test";
import {
  DISPATCH_LAUNCHER_SVG,
  EMERGENCY_MARKER_SVG_HTML,
  INNER_CHAT_SVG,
  MOBILE_LAB_BADGE_SVG,
  NEAREST_HOSPITAL_SVG_HTML,
} from "../lib/medical-icon-constants.ts";

test("MedicalIcons exports clean HTML and SVG constants for all 5 assets", () => {
  assert.ok(EMERGENCY_MARKER_SVG_HTML.includes("<svg"));
  assert.ok(EMERGENCY_MARKER_SVG_HTML.includes("animate-ping"));
  assert.ok(EMERGENCY_MARKER_SVG_HTML.includes("#DC2626"));

  assert.ok(NEAREST_HOSPITAL_SVG_HTML.includes("<svg"));
  assert.ok(NEAREST_HOSPITAL_SVG_HTML.includes("#10B981"));

  assert.ok(MOBILE_LAB_BADGE_SVG.includes("<svg"));
  assert.ok(MOBILE_LAB_BADGE_SVG.includes("#0EA5E9"));

  assert.ok(INNER_CHAT_SVG.includes("<svg"));
  assert.ok(INNER_CHAT_SVG.includes("#38BDF8"));

  assert.ok(DISPATCH_LAUNCHER_SVG.includes("<svg"));
  assert.ok(DISPATCH_LAUNCHER_SVG.includes("paint0_linear"));
});

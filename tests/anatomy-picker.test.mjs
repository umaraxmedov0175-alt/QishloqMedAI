import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import path from "node:path";
import { BODY_REGIONS, getRegionByMeshName } from "../lib/anatomy/regions.ts";

test("BODY_REGIONS covers all 30 BodyRegionId anatomical regions", () => {
  const regions = Object.keys(BODY_REGIONS);
  assert.equal(regions.length, 30);
  assert.ok(BODY_REGIONS.head, "head region defined");
  assert.ok(BODY_REGIONS.chest_left, "chest_left region defined");
  assert.ok(BODY_REGIONS.abdomen_upper, "abdomen_upper region defined");
  assert.ok(BODY_REGIONS.back_lower, "back_lower region defined");
  assert.ok(BODY_REGIONS.foot_right, "foot_right region defined");
});

test("getRegionByMeshName resolves valid mesh names and returns null for unknown", () => {
  const head = getRegionByMeshName("head_mesh");
  assert.ok(head, "head_mesh resolved");
  assert.equal(head.id, "head");

  const chest = getRegionByMeshName("chest_l_mesh");
  assert.ok(chest, "chest_l_mesh resolved");
  assert.equal(chest.id, "chest_left");

  const unknown = getRegionByMeshName("unknown_random_mesh_name_xyz");
  assert.equal(unknown, null, "unknown mesh returns null");
});

test("public/models/human-body.glb model file exists", () => {
  const glbPath = path.join(process.cwd(), "public", "models", "human-body.glb");
  assert.ok(fs.existsSync(glbPath), "public/models/human-body.glb file exists");
});

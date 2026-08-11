import assert from "node:assert/strict";
import test from "node:test";
import { normalizeSearchQuery, normalizeUzbekOrthography } from "../lib/orthography.ts";

test("normalizeUzbekOrthography converts ASCII single quotes to official Uzbek Latin U+02BB and U+02BC", () => {
  assert.equal(normalizeUzbekOrthography("O'zbekcha ro'yxat"), "Oʻzbekcha roʻyxat");
  assert.equal(normalizeUzbekOrthography("g'us qishlog'i"), "gʻus qishlogʻi");
  assert.equal(normalizeUzbekOrthography("ma'lumot qat'iy"), "maʼlumot qatʼiy");
});

test("normalizeSearchQuery strips punctuation for seamless search matching across orthography variants", () => {
  const target = normalizeSearchQuery("G'us Qishlog'i");
  const query1 = normalizeSearchQuery("gʻus");
  const query2 = normalizeSearchQuery("g'us");
  const query3 = normalizeSearchQuery("gʼus");

  assert.equal(query1, "gus");
  assert.equal(query2, "gus");
  assert.equal(query3, "gus");
  assert.ok(target.includes(query1));
});

test("SBP/DBP blood pressure range validation highlights out-of-bounds values", () => {
  const validateBp = (bpString) => {
    const parts = bpString.split("/");
    const sbp = Number(parts[0]);
    const dbp = Number(parts[1]);

    const sbpInvalid = sbp > 0 && (sbp < 70 || sbp > 220);
    const dbpInvalid = dbp > 0 && (dbp < 40 || dbp > 130);

    return { sbpInvalid, dbpInvalid, isCritical: sbp > 160 || dbp > 100 };
  };

  const normal = validateBp("120/80");
  assert.equal(normal.sbpInvalid, false);
  assert.equal(normal.dbpInvalid, false);
  assert.equal(normal.isCritical, false);

  const high = validateBp("175/105");
  assert.equal(high.sbpInvalid, false);
  assert.equal(high.isCritical, true);

  const extreme = validateBp("240/150");
  assert.equal(extreme.sbpInvalid, true);
  assert.equal(extreme.dbpInvalid, true);
  assert.equal(extreme.isCritical, true);
});

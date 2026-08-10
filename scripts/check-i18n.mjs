import { translations } from "../lib/i18n-dictionary.ts";

console.log("--------------------------------------------------");
console.log("🔍 Checking QishloqMed AI Uzbek Translation Completeness...");
console.log("--------------------------------------------------");

const uzKeys = Object.keys(translations.uz).sort();
const enKeys = Object.keys(translations.en).sort();

const missingInUz = enKeys.filter((k) => !(k in translations.uz));
const emptyInUz = uzKeys.filter((k) => !translations.uz[k] || translations.uz[k].trim() === "");

const allowedIdentical = new Set([
  "appTitle",
  "metaTitle",
  "step1Consent",
  "step2Demographics",
  "step3Symptoms",
  "step4Vitals",
  "step5Labs",
  "step6Diagnostics",
  "step7Review",
  "spO2",
  "systolicBp",
  "diastolicBp",
  "tempC",
  "exportFhir",
]);

const suspiciousIdentical = uzKeys.filter((k) => {
  if (allowedIdentical.has(k)) return false;
  return translations.uz[k] === translations.en[k];
});

console.log(`Total Uzbek keys: ${uzKeys.length}`);
console.log(`Total English keys: ${enKeys.length}`);

if (missingInUz.length > 0) {
  console.error("❌ FAIL: Missing Uzbek translation keys:", missingInUz);
}

if (emptyInUz.length > 0) {
  console.error("❌ FAIL: Empty Uzbek translation values:", emptyInUz);
}

if (suspiciousIdentical.length > 0) {
  console.warn("⚠️ WARNING: Identical English & Uzbek translation values:", suspiciousIdentical);
}

if (missingInUz.length === 0 && emptyInUz.length === 0) {
  console.log("✅ SUCCESS: 100% Uzbek Translation Catalog Completeness Verified!");
  process.exit(0);
} else {
  console.error("❌ Translation completeness check failed!");
  process.exit(1);
}

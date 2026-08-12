import assert from "node:assert/strict";
import test from "node:test";
import { translations } from "../lib/i18n-dictionary.ts";

test("i18n dictionary supports 3 languages: uz, en, ru", () => {
  assert.ok(translations.uz, "Uzbek dictionary exists");
  assert.ok(translations.en, "English dictionary exists");
  assert.ok(translations.ru, "Russian dictionary exists");
});

test("i18n dictionary keys are 100% complete across uz, en, and ru with 0 missing keys", () => {
  const uzKeys = Object.keys(translations.uz).sort();
  const enKeys = Object.keys(translations.en).sort();
  const ruKeys = Object.keys(translations.ru).sort();

  assert.deepEqual(uzKeys, enKeys, "Uzbek and English keys must match exactly");
  assert.deepEqual(uzKeys, ruKeys, "Uzbek and Russian keys must match exactly");
});

test("i18n dictionary contains non-empty strings for all 3 locales", () => {
  for (const lang of ["uz", "en", "ru"]) {
    const dict = translations[lang];
    for (const [key, value] of Object.entries(dict)) {
      assert.ok(typeof value === "string" && value.length > 0, `Translation key "${key}" in "${lang}" must be a non-empty string`);
    }
  }
});

test("Russian translation strings are localized in Cyrillic script", () => {
  assert.equal(translations.ru.language, "Язык");
  assert.equal(translations.ru.russian, "Русский");
  assert.equal(translations.ru.roleMobileNurse, "Медсестра мобильной клиники");
  assert.equal(translations.ru.specialistHeader, "Ташкентский центральный диагностический центр");
  assert.equal(translations.ru.patientPortalTitle, "Личный кабинет пациента");
});

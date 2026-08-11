/**
 * Uzbek Orthography Normalization Utility
 * Replaces ASCII U+0027 (') with proper Uzbek Latin characters:
 * - U+02BB (ʻ) for modifier letter turned comma in oʻ and gʻ
 * - U+02BC (ʼ) for modifier letter apostrophe in glottal stops (e.g. maʼlumot, qatʼiy)
 */

export function normalizeUzbekOrthography(text: string): string {
  if (!text) return "";

  // 1. Replace o' / O' / g' / G' with U+02BB (ʻ)
  let result = text
    .replace(/o['']/gi, (m) => (m[0] === "O" ? "Oʻ" : "oʻ"))
    .replace(/g['']/gi, (m) => (m[0] === "G" ? "Gʻ" : "gʻ"));

  // 2. Replace remaining single quotes inside words with glottal stop U+02BC (ʼ)
  result = result.replace(/(\w)[''](\w)/g, "$1ʼ$2");

  return result;
}

/**
 * Normalizes user search queries so ASCII ' and official U+02BB / U+02BC match seamlessly
 */
export function normalizeSearchQuery(query: string): string {
  if (!query) return "";
  return query
    .toLowerCase()
    .replace(/['ʻʼ`\u02BB\u02BC]/g, "")
    .trim();
}

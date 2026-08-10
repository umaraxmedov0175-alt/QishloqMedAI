import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export function getDb(binding: D1Database | undefined) {
  if (!binding) {
    throw new Error("Cloudflare D1 binding `DB` is unavailable.");
  }
  return drizzle(binding, { schema });
}

import chestPainData from "./chest-pain.json" with { type: "json" };
import shortnessOfBreathData from "./shortness-of-breath.json" with { type: "json" };
import headacheData from "./headache.json" with { type: "json" };
import { SymptomProtocolSchema, type SymptomProtocol } from "./schema.ts";

const rawProtocols: unknown[] = [
  chestPainData,
  shortnessOfBreathData,
  headacheData,
];

// Validate all protocols at build/load time using Zod
export const PROTOCOLS: SymptomProtocol[] = rawProtocols.map((data, index) => {
  const result = SymptomProtocolSchema.safeParse(data);
  if (!result.success) {
    const errMessage = `Protocol validation failed at index ${index}: ${result.error.message}`;
    if (process.env.NODE_ENV === "development") {
      throw new Error(errMessage);
    }
    console.error(errMessage);
  }
  return result.success ? result.data : (data as SymptomProtocol);
});

export const PROTOCOL_MAP: Record<string, SymptomProtocol> = Object.fromEntries(
  PROTOCOLS.map((p) => [p.id, p]),
);

export function getAllProtocols(): SymptomProtocol[] {
  return PROTOCOLS;
}

import { z } from "zod";

export const LocalizedTextSchema = z.object({
  uz: z.string().min(1),
  en: z.string().min(1),
  ru: z.string().optional(),
});

export const QuestionTypeSchema = z.enum([
  "boolean",
  "single",
  "multi",
  "number",
  "duration",
  "text",
]);

export const OptionSchema = z.object({
  value: z.string().min(1),
  uz: z.string().min(1),
  en: z.string().min(1),
  ru: z.string().optional(),
});

export const TriageLevelSchema = z.enum([
  "routine",
  "priority",
  "urgent",
  "emergency",
]);

export const RedFlagConditionSchema = z.object({
  whenValueIn: z.array(z.string()).optional(),
  whenTrue: z.boolean().optional(),
  whenEquals: z.union([z.string(), z.number()]).optional(),
  whenGreaterThan: z.number().optional(),
  level: TriageLevelSchema,
});

export const ProtocolQuestionSchema = z.object({
  id: z.string().min(1),
  text: LocalizedTextSchema,
  type: QuestionTypeSchema,
  options: z.array(OptionSchema).optional(),
  unit: z.string().optional(),
  redFlag: RedFlagConditionSchema.optional(),
  source: z.string().min(1),
});

export const SuggestedActionRuleSchema = z.object({
  when: z.object({
    anyRedFlagAtLeast: TriageLevelSchema.optional(),
    hasRedFlag: z.boolean().optional(),
  }),
  text: LocalizedTextSchema,
});

export const SymptomProtocolSchema = z.object({
  id: z.string().min(1),
  label: LocalizedTextSchema,
  source: z.string().min(1),
  questions: z.array(ProtocolQuestionSchema).min(1),
  suggestedActions: z.array(SuggestedActionRuleSchema).default([]),
});

export type LocalizedText = z.infer<typeof LocalizedTextSchema>;
export type QuestionType = z.infer<typeof QuestionTypeSchema>;
export type Option = z.infer<typeof OptionSchema>;
export type TriageLevel = z.infer<typeof TriageLevelSchema>;
export type RedFlagCondition = z.infer<typeof RedFlagConditionSchema>;
export type ProtocolQuestion = z.infer<typeof ProtocolQuestionSchema>;
export type SuggestedActionRule = z.infer<typeof SuggestedActionRuleSchema>;
export type SymptomProtocol = z.infer<typeof SymptomProtocolSchema>;

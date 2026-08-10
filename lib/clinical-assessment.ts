import { z } from "zod";

export const ClinicalAssessmentSchema = z.object({
  caseSummary: z.string().min(1),
  triageLevel: z.enum(["routine", "priority", "urgent", "emergency"]),
  redFlags: z.array(z.string()),
  abnormalObservations: z.array(z.string()),
  imagingObservations: z.array(z.string()),
  differentialConsiderations: z.array(z.string()),
  suggestedNextSteps: z.array(z.string()),
  questionsForClinician: z.array(z.string()),
  limitations: z.array(z.string()),
  requiresHumanReview: z.literal(true),
});

export type ClinicalAssessment = z.infer<typeof ClinicalAssessmentSchema>;

export type MinimalClinicalContext = {
  complaint: string;
  symptomSummary: string;
  vitals: Record<string, string>;
  labs?: Array<{ name: string; value: string; unit: string }>;
  outputLanguage?: "uz" | "en";
};

export interface ClinicalAnalysisProvider {
  readonly id: string;
  analyze(context: MinimalClinicalContext, requestId: string): Promise<ClinicalAssessment>;
}

export const CLINICAL_SYSTEM_PROMPT = `You provide preliminary clinician decision support for QishloqMed AI in Uzbekistan. Return all human-readable clinical text in clear, professional Uzbek Latin ("uz"). Structured JSON property keys must remain in internal English. Never act as a primary physician or claim diagnosis without evidence. Separate measured facts from interpretation, preserve units, highlight urgent red flags, never fabricate lab values, never claim to inspect an absent image, and state clearly that human clinician review is required.`;

export function minimizeForAi(
  input: { fullName?: string; phone?: string; nationalId?: string } & MinimalClinicalContext
): MinimalClinicalContext {
  return {
    complaint: input.complaint,
    symptomSummary: input.symptomSummary,
    vitals: input.vitals,
    labs: input.labs,
    outputLanguage: input.outputLanguage || "uz",
  };
}

export class DemoClinicalAnalysisProvider implements ClinicalAnalysisProvider {
  readonly id = "demo-clinical-v1";
  async analyze(context: MinimalClinicalContext): Promise<ClinicalAssessment> {
    const oxygen = Number.parseFloat(context.vitals.spo2 ?? "100");
    const urgent = oxygen < 92;

    return ClinicalAssessmentSchema.parse({
      caseSummary: `NAMOYISH/SINTETIK TAHLIL: ${context.complaint}`,
      triageLevel: urgent ? "urgent" : "priority",
      redFlags: urgent ? [`SpO₂ past ko'rsatkichi: ${context.vitals.spo2}%`] : [],
      abnormalObservations: urgent ? ["Patsiyentda gipoksiya belgisi aniqlandi (SpO₂ < 92%)"] : [],
      imagingObservations: ["Diagnostik rentgen tasviri taqdim etilmagan"],
      differentialConsiderations: ["Yakuniy klinik differensial tashxis vrach-mutaxassis tomonidan belgilanadi"],
      suggestedNextSteps: [
        urgent
          ? "Zudlik bilan markaziy vrach-mutaxassis ko'rigi va shoshilinch kislorod yordami"
          : "Rejalashtirilgan masofaviy vrach konsultatsiyasi",
      ],
      questionsForClinician: [
        "Qo'shimcha kasallik tarixi va laboratoriya tahlil natijalari bormi?",
      ],
      limitations: ["Deterministik namoyish provayderi; yakuniy shifokor tashxisi emas"],
      requiresHumanReview: true,
    });
  }
}

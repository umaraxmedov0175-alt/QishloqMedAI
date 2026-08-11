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
  mobileLabVitals?: {
    glucose?: number;
    hemoglobin?: number;
    hba1c?: number;
    troponin?: string;
  };
  outputLanguage?: "uz" | "en";
  protocolAnswers?: {
    protocolId: string;
    answers: Record<
      string,
      | { status: "answered"; value: boolean | string | string[] | number }
      | { status: "skipped" }
      | { status: "unanswered" }
    >;
    completeness?: { answered: number; skipped: number; total: number };
    redFlagsTriggered?: Array<{
      questionId: string;
      level: string;
      source: string;
    }>;
  };
};

export interface ClinicalAnalysisProvider {
  readonly id: string;
  analyze(context: MinimalClinicalContext, requestId: string): Promise<ClinicalAssessment>;
}

export const CLINICAL_SYSTEM_PROMPT = `You provide preliminary clinician decision support for Tomir AI in Uzbekistan. Direct emergency referrals to the nearest regional or district hospital (not Tashkent). Return all human-readable clinical text in clear, professional Uzbek Latin ("uz"). Structured JSON property keys must remain in internal English. Never act as a primary physician or claim diagnosis without evidence. Separate measured facts from interpretation, preserve units, highlight urgent red flags, never fabricate lab values, and state clearly that human clinician review is required.`;

export function minimizeForAi(
  input: { fullName?: string; phone?: string; nationalId?: string } & MinimalClinicalContext
): MinimalClinicalContext {
  return {
    complaint: input.complaint,
    symptomSummary: input.symptomSummary,
    vitals: input.vitals,
    labs: input.labs,
    mobileLabVitals: input.mobileLabVitals,
    outputLanguage: input.outputLanguage || "uz",
    protocolAnswers: input.protocolAnswers,
  };
}

export class DemoClinicalAnalysisProvider implements ClinicalAnalysisProvider {
  readonly id = "demo-clinical-v1";
  async analyze(context: MinimalClinicalContext): Promise<ClinicalAssessment> {
    const oxygen = Number.parseFloat(context.vitals.spo2 ?? "100");
    const labGlucose = context.mobileLabVitals?.glucose;
    const labTroponin = context.mobileLabVitals?.troponin;

    const isHypoxia = oxygen < 92;
    const isHyperglycemia = labGlucose !== undefined && labGlucose > 11.1;
    const isTroponinPositive = Boolean(labTroponin && labTroponin.toLowerCase().includes("ijobiy"));

    const urgent = isHypoxia || isHyperglycemia || isTroponinPositive;
    const isEmergency = oxygen < 90 || isTroponinPositive;

    const redFlags: string[] = [];
    if (isHypoxia) redFlags.push(`SpO₂ past ko'rsatkichi: ${context.vitals.spo2}%`);
    if (isHyperglycemia) redFlags.push(`🩸 Mobil Laboratoriya: Qonda shakar miqdori o'ta yuqori (${labGlucose} mmol/L)`);
    if (isTroponinPositive) redFlags.push(`💔 Mobil Laboratoriya: Troponin I ekspress testi IJOBIY (Miokard infarkti xavfi)`);

    const abnormalObs: string[] = [];
    if (isHypoxia) abnormalObs.push("Patsiyentda gipoksiya belgisi aniqlandi (SpO₂ < 92%)");
    if (isHyperglycemia) abnormalObs.push(`Mobil lab tahlilida giperglikemiya tasdiqlandi (${labGlucose} mmol/L)`);
    if (isTroponinPositive) abnormalObs.push("Mobil diagnostik laboratoriyada troponin marjini aniqlandi");

    return ClinicalAssessmentSchema.parse({
      caseSummary: `MOBIL LABORATORIYA VA REGIONAL KLINIK TAHLIL: ${context.complaint}`,
      triageLevel: isEmergency ? "emergency" : urgent ? "urgent" : "priority",
      redFlags,
      abnormalObservations: abnormalObs.length > 0 ? abnormalObs : ["Hayotiy ko'rsatkichlar nisbatan barqaror"],
      imagingObservations: ["Diagnostik rentgen / UZI tasviri taqdim etilmagan"],
      differentialConsiderations: ["Yakuniy klinik differensial tashxis eng yaqin tuman/viloyat shifoxonasi vrachi tomonidan belgilanadi"],
      suggestedNextSteps: [
        isEmergency
          ? "Zudlik bilan eng yaqin tuman markaziy kasalxonasiga o'tkazish va shoshilinch kislorod yordami"
          : urgent
            ? "Eng yaqin tuman tibbiyot birlashmasi kardiologik ko'rigiga yo'naltirish"
            : "Rejalashtirilgan masofaviy vrach konsultatsiyasi",
      ],
      questionsForClinician: [
        "Eng yaqin tuman shifoxonasida bo'sh reanimatsiya o'rni va EKG mutaxassisi mavjudmi?",
      ],
      limitations: ["Deterministik mobil lab provayderi; yakuniy shifokor tashxisi emas"],
      requiresHumanReview: true,
    });
  }
}

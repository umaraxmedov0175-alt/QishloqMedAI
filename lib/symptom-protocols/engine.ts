import { PROTOCOL_MAP, PROTOCOLS } from "./index.ts";
import {
  type SymptomProtocol,
  type TriageLevel,
} from "./schema.ts";

export type RawAnswerValue = boolean | string | string[] | number;

export type QuestionAnswer =
  | { status: "answered"; value: RawAnswerValue }
  | { status: "skipped" }
  | { status: "unanswered" };

export type AnswerMap = Record<string, QuestionAnswer>;

export type TriggeredRedFlag = {
  questionId: string;
  questionText: string;
  level: TriageLevel;
  source: string;
  detail: string;
};

export type CompletenessResult = {
  answered: number;
  skipped: number;
  total: number;
  percentage: number;
};

export type EvaluationResult = {
  redFlags: TriggeredRedFlag[];
  suggestedActions: string[];
  completeness: CompletenessResult;
  maxRedFlagLevel: TriageLevel;
};

const TRIAGE_PRIORITY: Record<TriageLevel, number> = {
  routine: 0,
  priority: 1,
  urgent: 2,
  emergency: 3,
};

export function getProtocol(complaintIdOrText: string): SymptomProtocol | null {
  if (!complaintIdOrText) return null;
  const target = complaintIdOrText.trim().toLowerCase();

  // 1. Direct ID match
  if (PROTOCOL_MAP[target]) {
    return PROTOCOL_MAP[target];
  }

  // 2. Exact or fuzzy label match
  for (const protocol of PROTOCOLS) {
    if (
      protocol.id.toLowerCase() === target ||
      protocol.label.uz.toLowerCase() === target ||
      protocol.label.en.toLowerCase() === target
    ) {
      return protocol;
    }
  }

  // 3. Keyword heuristic matching for common chief complaint phrases
  if (target.includes("chest") || target.includes("ko'krak") || target.includes("koʻkrak") || target.includes("yurak")) {
    return PROTOCOL_MAP["chest-pain"] ?? null;
  }
  if (
    target.includes("breath") ||
    target.includes("nafas") ||
    target.includes("dyspnoea") ||
    target.includes("dyspnea")
  ) {
    return PROTOCOL_MAP["shortness-of-breath"] ?? null;
  }
  if (target.includes("headache") || target.includes("bosh og") || target.includes("bosh")) {
    return PROTOCOL_MAP["headache"] ?? null;
  }

  return null;
}

export function evaluateAnswers(
  protocol: SymptomProtocol,
  answers: AnswerMap,
  lang: "uz" | "en" = "uz"
): EvaluationResult {
  const redFlags: TriggeredRedFlag[] = [];
  let maxRedFlagLevel: TriageLevel = "routine";

  let answeredCount = 0;
  let skippedCount = 0;

  for (const question of protocol.questions) {
    const entry = answers[question.id];
    if (!entry || entry.status === "unanswered") {
      continue;
    }

    if (entry.status === "skipped") {
      skippedCount++;
      continue;
    }

    if (entry.status === "answered") {
      answeredCount++;
      const val = entry.value;

      if (question.redFlag) {
        const rf = question.redFlag;
        let triggered = false;
        let detail = "";

        if (rf.whenTrue !== undefined && typeof val === "boolean" && val === rf.whenTrue) {
          triggered = true;
          detail = lang === "uz" ? "Ha (Tasdiqlandi)" : "Yes (Confirmed)";
        } else if (rf.whenEquals !== undefined && val === rf.whenEquals) {
          triggered = true;
          detail = String(val);
        } else if (rf.whenGreaterThan !== undefined && typeof val === "number" && val > rf.whenGreaterThan) {
          triggered = true;
          detail = `${val} > ${rf.whenGreaterThan}`;
        } else if (rf.whenValueIn !== undefined) {
          if (Array.isArray(val)) {
            const matches = val.filter((v) => rf.whenValueIn?.includes(v));
            if (matches.length > 0) {
              triggered = true;
              detail = matches.join(", ");
            }
          } else if (typeof val === "string" && rf.whenValueIn.includes(val)) {
            triggered = true;
            detail = val;
          }
        }

        if (triggered) {
          redFlags.push({
            questionId: question.id,
            questionText: question.text[lang],
            level: rf.level,
            source: question.source,
            detail,
          });

          if (TRIAGE_PRIORITY[rf.level] > TRIAGE_PRIORITY[maxRedFlagLevel]) {
            maxRedFlagLevel = rf.level;
          }
        }
      }
    }
  }

  const total = protocol.questions.length;
  const completeness: CompletenessResult = {
    answered: answeredCount,
    skipped: skippedCount,
    total,
    percentage: total > 0 ? Math.round((answeredCount / total) * 100) : 0,
  };

  const suggestedActions: string[] = [];
  for (const rule of protocol.suggestedActions) {
    let matches = false;

    if (rule.when.hasRedFlag && redFlags.length > 0) {
      matches = true;
    }

    if (rule.when.anyRedFlagAtLeast) {
      const minPriority = TRIAGE_PRIORITY[rule.when.anyRedFlagAtLeast];
      if (TRIAGE_PRIORITY[maxRedFlagLevel] >= minPriority) {
        matches = true;
      }
    }

    if (matches) {
      suggestedActions.push(rule.text[lang]);
    }
  }

  return {
    redFlags,
    suggestedActions,
    completeness,
    maxRedFlagLevel,
  };
}

export function summarizeForClinician(
  protocol: SymptomProtocol,
  answers: AnswerMap,
  lang: "uz" | "en" = "uz"
): string {
  const evalResult = evaluateAnswers(protocol, answers, lang);
  const lines: string[] = [];

  lines.push(`Protokol: ${protocol.label[lang]} (Manba: ${protocol.source})`);
  lines.push(
    `To'ldirish holati: ${evalResult.completeness.answered}/${evalResult.completeness.total} javob berildi (${evalResult.completeness.skipped} o'tkazib yuborildi)`
  );

  lines.push("\nJavoblar:");
  for (const question of protocol.questions) {
    const qText = question.text[lang];
    const entry = answers[question.id];

    if (!entry || entry.status === "unanswered") {
      lines.push(`- ${qText}: [Javob berilmadi]`);
    } else if (entry.status === "skipped") {
      lines.push(`- ${qText}: [O'tkazib yuborildi]`);
    } else {
      let formattedVal = "";
      const val = entry.value;
      if (typeof val === "boolean") {
        formattedVal = val ? (lang === "uz" ? "Ha" : "Yes") : (lang === "uz" ? "Yo'q" : "No");
      } else if (Array.isArray(val)) {
        formattedVal = val.map((optVal) => {
          const matchedOpt = question.options?.find((o) => o.value === optVal);
          return matchedOpt ? matchedOpt[lang] : optVal;
        }).join(", ");
      } else if (question.options) {
        const matchedOpt = question.options.find((o) => o.value === String(val));
        formattedVal = matchedOpt ? matchedOpt[lang] : String(val);
      } else {
        formattedVal = question.unit ? `${val} ${question.unit}` : String(val);
      }

      const isRedFlag = evalResult.redFlags.some((rf) => rf.questionId === question.id);
      const flagNotice = isRedFlag ? ` ⚠️ [XAVFLI BELGI / RED FLAG - ${question.source}]` : "";
      lines.push(`- ${qText}: ${formattedVal}${flagNotice}`);
    }
  }

  if (evalResult.suggestedActions.length > 0) {
    lines.push("\nTavsiya etilgan harakatlar (Protokol bo'yicha):");
    for (const action of evalResult.suggestedActions) {
      lines.push(`* ${action}`);
    }
  }

  return lines.join("\n");
}

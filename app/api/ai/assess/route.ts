import { recordAuditEvent } from "@/lib/audit";

export interface VitalSignsInput {
  spo2?: number | string;
  oxygenSaturation?: number | string;
  heartRate?: number | string;
  systolicBp?: number | string;
  diastolicBp?: number | string;
  tempC?: number | string;
  temperature?: number | string;
  glucose?: number | string;
  respiratoryRate?: number | string;
}

export interface RiskAssessmentOutput {
  requestId: string;
  riskRating: "routine" | "priority" | "urgent" | "emergency";
  riskScore: number;
  redFlags: string[];
  anomalies: string[];
  recommendedAction: string;
  assessmentSummary: string;
  requiresHumanReview: true;
  assessedAt: string;
}

export async function POST(request: Request) {
  let body: {
    symptoms?: string;
    chiefComplaint?: string;
    vitals?: VitalSignsInput;
    vitalSigns?: VitalSignsInput;
  };

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON format" }, { status: 400 });
  }

  const vitalsInput = body.vitalSigns || body.vitals || {};
  const symptoms = body.symptoms || body.chiefComplaint || "General checkup";

  const spo2 = Number.parseFloat(
    String(vitalsInput.spo2 ?? vitalsInput.oxygenSaturation ?? "98")
  );
  const heartRate = Number.parseFloat(String(vitalsInput.heartRate ?? "75"));
  const systolicBp = Number.parseFloat(
    String(vitalsInput.systolicBp ?? "120")
  );
  const diastolicBp = Number.parseFloat(
    String(vitalsInput.diastolicBp ?? "80")
  );
  const tempC = Number.parseFloat(
    String(vitalsInput.tempC ?? vitalsInput.temperature ?? "36.6")
  );
  const glucose = Number.parseFloat(String(vitalsInput.glucose ?? "5.5"));

  const redFlags: string[] = [];
  const anomalies: string[] = [];
  let numericRiskScore = 15; // baseline

  // Evaluate Hypoxia (SpO2)
  if (spo2 < 90) {
    redFlags.push(`Critical Hypoxia: SpO₂ ${spo2}% (<90%)`);
    anomalies.push("Severe arterial oxygen desaturation");
    numericRiskScore += 45;
  } else if (spo2 < 94) {
    redFlags.push(`Moderate Hypoxia: SpO₂ ${spo2}%`);
    anomalies.push("Sub-optimal oxygen saturation");
    numericRiskScore += 25;
  }

  // Evaluate Cardiovascular (BP & HR)
  if (systolicBp >= 180 || diastolicBp >= 110) {
    redFlags.push(`Hypertensive Crisis: BP ${systolicBp}/${diastolicBp} mmHg`);
    anomalies.push("Severe systolic/diastolic elevation");
    numericRiskScore += 35;
  } else if (systolicBp >= 160 || diastolicBp >= 100) {
    redFlags.push(`Stage 2 Hypertension: BP ${systolicBp}/${diastolicBp} mmHg`);
    anomalies.push("Elevated blood pressure");
    numericRiskScore += 20;
  }

  if (heartRate > 110) {
    anomalies.push(`Tachycardia: ${heartRate} bpm (>110 bpm)`);
    numericRiskScore += 15;
  } else if (heartRate < 50) {
    anomalies.push(`Bradycardia: ${heartRate} bpm (<50 bpm)`);
    numericRiskScore += 15;
  }

  // Evaluate Fever & Hyperglycemia
  if (tempC >= 38.5) {
    anomalies.push(`High Fever: ${tempC} °C`);
    numericRiskScore += 15;
  }
  if (glucose >= 11.1) {
    redFlags.push(`Hyperglycemia: Blood Glucose ${glucose} mmol/L`);
    anomalies.push("Elevated fasting/random blood sugar");
    numericRiskScore += 20;
  }

  // Determine Risk Tier
  let riskRating: "routine" | "priority" | "urgent" | "emergency" = "routine";
  if (numericRiskScore >= 70 || spo2 < 90 || systolicBp >= 180) {
    riskRating = "emergency";
  } else if (numericRiskScore >= 45 || spo2 < 94 || systolicBp >= 160) {
    riskRating = "urgent";
  } else if (numericRiskScore >= 25) {
    riskRating = "priority";
  }

  const requestId = `ai-req-${Math.random().toString(36).slice(2, 9)}`;

  const output: RiskAssessmentOutput = {
    requestId,
    riskRating,
    riskScore: Math.min(100, numericRiskScore),
    redFlags,
    anomalies,
    recommendedAction:
      riskRating === "emergency"
        ? "Immediate central clinician review and emergency hospital referral required."
        : riskRating === "urgent"
        ? "Prioritized specialist consultation recommended within 30 minutes."
        : "Standard clinical evaluation.",
    assessmentSummary: `AI Risk Score: ${Math.min(100, numericRiskScore)}/100 (${riskRating.toUpperCase()}). Symptoms: ${symptoms}`,
    requiresHumanReview: true,
    assessedAt: new Date().toISOString(),
  };

  await recordAuditEvent(null, {
    actorId: "ai_risk_engine",
    action: "ai_risk_assessment",
    resourceType: "risk_assessment",
    resourceId: requestId,
    metadata: { riskRating, riskScore: output.riskScore, redFlagsCount: redFlags.length },
  });

  return Response.json(
    {
      success: true,
      assessment: output,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}

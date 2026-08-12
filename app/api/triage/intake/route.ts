import { NextResponse } from "next/server";
import { z } from "zod";

const BodyRegionIdEnum = z.enum([
  "head",
  "face",
  "neck",
  "shoulder_left",
  "shoulder_right",
  "chest_left",
  "chest_right",
  "abdomen_upper",
  "abdomen_lower",
  "back_upper",
  "back_lower",
  "arm_upper_left",
  "arm_upper_right",
  "elbow_left",
  "elbow_right",
  "forearm_left",
  "forearm_right",
  "hand_left",
  "hand_right",
  "hip_left",
  "hip_right",
  "groin",
  "thigh_left",
  "thigh_right",
  "knee_left",
  "knee_right",
  "shin_left",
  "shin_right",
  "foot_left",
  "foot_right",
]);

const TriageIntakeSchema = z.object({
  patientCode: z.string().optional(),
  fullName: z.string().optional(),
  chiefComplaint: z.string().min(1, "Chief complaint is required"),
  affectedRegions: z.array(BodyRegionIdEnum).optional(),
  vitals: z
    .object({
      bp: z.string().optional(),
      pulse: z.union([z.number(), z.string()]).optional(),
      spo2: z.union([z.number(), z.string()]).optional(),
      temp: z.union([z.number(), z.string()]).optional(),
    })
    .optional(),
});

export async function POST(req: Request) {
  try {
    const raw = await req.json();
    const result = TriageIntakeSchema.safeParse(raw);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid intake payload", details: result.error.format() },
        { status: 400 }
      );
    }
    const data = result.data;
    return NextResponse.json({
      status: "success",
      message: "Triage intake recorded successfully",
      intakeId: `TR-2027-${Math.floor(1000 + Math.random() * 9000)}`,
      affectedRegions: data.affectedRegions || [],
      receivedAt: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({ error: "Malformed request payload" }, { status: 400 });
  }
}

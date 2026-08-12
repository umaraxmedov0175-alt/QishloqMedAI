import { NextResponse } from "next/server";
import { canAccessMedAIAssistant, queryMedAIAgent } from "@/lib/medai-agent";
import { normalizeRole } from "@/lib/authorization";

export async function POST(req: Request) {
  try {
    // 1. Extract Role & Cookies for Strict RBAC Guard
    const cookieHeader = req.headers.get("cookie") || "";
    const cookies = Object.fromEntries(
      cookieHeader.split(";").map((c) => {
        const [k, ...v] = c.trim().split("=");
        return [k, v.join("=")];
      })
    );

    const userRole = normalizeRole(cookies["qm_demo_role"] || req.headers.get("x-user-role") || "nurse");

    // 2. Strict Role Protection: Block non-clinical staff (Patients & Dispatchers)
    if (!canAccessMedAIAssistant(userRole)) {
      return NextResponse.json(
        {
          status: "error",
          error: "Forbidden: MedAI Assistant is restricted to authenticated Nurse and Doctor clinical staff only.",
        },
        { status: 403 }
      );
    }

    // 3. Parse Request Payload
    const body = (await req.json()) as Record<string, unknown>;
    const prompt =
      typeof body?.prompt === "string"
        ? body.prompt
        : typeof body?.message === "string"
        ? body.message
        : "Klinik baholash va dori vositalari o'zaro ta'siri";
    const context = (body?.patientContext || body?.context) as Record<string, unknown> | undefined;

    // 4. Query MedAI Local & Cloud RPC Agent
    const result = await queryMedAIAgent(prompt, context);

    return NextResponse.json(result);
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Failed to process MedAI Agent query";
    return NextResponse.json(
      {
        status: "error",
        error: errorMsg,
      },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import {
  analyzeOutbreakRadar,
  verifyOutbreakCluster,
  type ClusterVerificationStatus,
} from "@/lib/outbreak-radar";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      clusterId?: string;
      status?: ClusterVerificationStatus;
      specialistName?: string;
      notes?: string;
    };

    const { clusterId, status, specialistName, notes } = body;

    if (!clusterId || !status) {
      return NextResponse.json(
        { success: false, error: "clusterId va status parametrlarini kiritish majburiy" },
        { status: 400 }
      );
    }

    if (!["pending", "confirmed", "false_positive", "retest_requested"].includes(status)) {
      return NextResponse.json(
        { success: false, error: "Noto'g'ri verifikatsiya statusi kiritildi" },
        { status: 400 }
      );
    }

    const specialist = specialistName || "Dr. Alisher Qodirov (Bosh Epidemiolog)";
    const verificationResult = verifyOutbreakCluster(clusterId, status, specialist, notes);

    if (!verificationResult.cluster) {
      return NextResponse.json(
        { success: false, error: "Ko'rsatilgan klaster topilmadi" },
        { status: 404 }
      );
    }

    const updatedRadar = analyzeOutbreakRadar();

    return NextResponse.json({
      success: true,
      message: `Klaster (${clusterId}) statusi '${status}' ga o'zgartirildi`,
      timestamp: new Date().toISOString(),
      cluster: verificationResult.cluster,
      fieldTask: verificationResult.task,
      ...updatedRadar,
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Klaster verifikatsiyasida xatolik yuz berdi";
    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 500 }
    );
  }
}

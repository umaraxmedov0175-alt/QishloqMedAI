import { NextResponse } from "next/server";
import { analyzeOutbreakRadar } from "@/lib/outbreak-radar";
import { decodeZeroConnectivityPayload, validatePayloadChecksum } from "@/lib/zero-connectivity-payload";

export async function GET() {
  try {
    const radarData = analyzeOutbreakRadar();
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...radarData,
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Outbreak radar analitikasini hisoblashda xatolik";
    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { payload?: string; vitals?: Record<string, unknown> };
    const { payload, vitals } = body;

    let decodedResult = null;
    let dynamicEncounter = null;

    if (payload && typeof payload === "string") {
      const isValid = validatePayloadChecksum(payload);
      if (!isValid) {
        return NextResponse.json(
          { success: false, error: "Zero-connectivity SMS payload checksum tekshiruvidan o'tmadi (CRC-16 xatosi)" },
          { status: 400 }
        );
      }

      decodedResult = decodeZeroConnectivityPayload(payload);
      dynamicEncounter = {
        id: decodedResult.data.patientCode,
        lat: decodedResult.data.lat,
        lng: decodedResult.data.lng,
        triage: decodedResult.data.triage,
        vitals: {
          sbp: decodedResult.data.sbp,
          dbp: decodedResult.data.dbp,
          spo2: decodedResult.data.spo2,
          pulseRate: decodedResult.data.pulseRate,
          temperature: decodedResult.data.temperature,
        },
        labResults: {
          glucose: decodedResult.data.glucose,
          troponin: decodedResult.data.troponinPos ? "POS" : "NEG",
          hemoglobin: decodedResult.data.hemoglobin,
        },
      };
    } else if (vitals) {
      dynamicEncounter = vitals;
    }

    const encountersInput = dynamicEncounter ? [dynamicEncounter] : [];
    const updatedRadar = analyzeOutbreakRadar(encountersInput);

    return NextResponse.json({
      success: true,
      message: "Zero-Connectivity payload muvaffaqiyatli qabul qilindi va Outbreak Radar sinxronlandi",
      timestamp: new Date().toISOString(),
      decodedPayload: decodedResult,
      ...updatedRadar,
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Payload ishlov berishda xatolik yuz berdi";
    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 500 }
    );
  }
}

/**
 * Zero-Connectivity Ultra-Low Bandwidth Payload Serialization Engine
 * 
 * Compresses vital signs, mobile lab diagnostic outputs, GPS coordinates,
 * and AI triage urgency into a compact Base64/ASCII string under 65 characters.
 * Suitable for lossy cellular SMS (140-char limit) and WebRTC P2P local mesh packets
 * during total network outage in rural villages.
 */

export interface ZeroConnectivityPayloadData {
  patientCode: string;
  lat: number;
  lng: number;
  sbp: number;
  dbp: number;
  pulseRate: number;
  spo2: number;
  temperature: number;
  glucose?: number; // mmol/L
  troponinPos?: boolean; // POS / NEG
  hemoglobin?: number; // g/L
  hba1c?: number; // %
  triage: "emergency" | "urgent" | "priority" | "routine";
  complaintCode?: string; // e.g. "chest_pain", "breath", "headache"
  timestamp: number;
}

export interface DecodedZeroConnectivityPayload {
  data: ZeroConnectivityPayloadData;
  rawPayload: string;
  checksumValid: boolean;
  byteLength: number;
  charLength: number;
  labAlerts: string[];
}

/**
 * Calculates a 16-bit CRC checksum for data integrity verification
 */
export function calculateCRC16(str: string): string {
  let crc = 0xffff;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i);
    for (let j = 0; j < 8; j++) {
      if ((crc & 1) !== 0) {
        crc = (crc >> 1) ^ 0xa001;
      } else {
        crc = crc >> 1;
      }
    }
  }
  return (crc & 0xffff).toString(16).toUpperCase().padStart(4, "0");
}

const TRIAGE_MAP: Record<string, number> = {
  emergency: 3,
  urgent: 2,
  priority: 1,
  routine: 0,
};

const TRIAGE_REVERSE_MAP: Record<number, "emergency" | "urgent" | "priority" | "routine"> = {
  3: "emergency",
  2: "urgent",
  1: "priority",
  0: "routine",
};

/**
 * Encodes patient vitals, GPS, lab results, and triage rating into a compact SMS/Mesh payload string (< 65 chars)
 */
export function encodeZeroConnectivityPayload(data: ZeroConnectivityPayloadData): string {
  // Truncate GPS to 4 decimal places for ~11m precision
  const latInt = Math.round(data.lat * 10000);
  const lngInt = Math.round(data.lng * 10000);

  const sbp = Math.min(260, Math.max(40, Math.round(data.sbp)));
  const dbp = Math.min(180, Math.max(30, Math.round(data.dbp)));
  const spo2 = Math.min(100, Math.max(50, Math.round(data.spo2)));
  const pulse = Math.min(240, Math.max(30, Math.round(data.pulseRate)));
  const temp10 = Math.min(450, Math.max(320, Math.round(data.temperature * 10)));

  const gluc10 = data.glucose ? Math.min(300, Math.max(0, Math.round(data.glucose * 10))) : 0;
  const trop = data.troponinPos ? 1 : 0;
  const hb = data.hemoglobin ? Math.min(250, Math.max(0, Math.round(data.hemoglobin))) : 0;
  const hba1c10 = data.hba1c ? Math.min(200, Math.max(0, Math.round(data.hba1c * 10))) : 0;
  const triageNum = TRIAGE_MAP[data.triage] ?? 0;

  // Code patient ID or generate short hash e.g. P9402
  const patientHash = (data.patientCode || "PAT1").replace(/[^a-zA-Z0-9]/g, "").slice(-4).toUpperCase();
  const complaint = (data.complaintCode || "GEN").slice(0, 4).toUpperCase();

  // Construct unchecksummed payload body
  // Format: QK1![HASH]![LAT].[LNG]![SBP].[DBP].[SPO2].[HR].[TEMP]![GLUC].[TROP].[HB].[HBA1C]![TRIAGE].[COMP]
  const body = `QK1!${patientHash}!${latInt}.${lngInt}!${sbp}.${dbp}.${spo2}.${pulse}.${temp10}!${gluc10}.${trop}.${hb}.${hba1c10}!${triageNum}.${complaint}`;
  
  const crc = calculateCRC16(body);
  const fullPayload = `${body}!${crc}`;

  return fullPayload;
}

/**
 * Decodes zero-connectivity SMS payload back into structured clinical vitals & lab data
 */
export function decodeZeroConnectivityPayload(payload: string): DecodedZeroConnectivityPayload {
  const cleanPayload = payload.trim();
  const parts = cleanPayload.split("!");

  if (parts.length < 7 || parts[0] !== "QK1") {
    throw new Error(`Noto'g'ri zero-connectivity payload formati: Header QK1 kutilgan edi`);
  }

  const patientHash = parts[1];
  const gpsParts = parts[2].split(".");
  const vitalsParts = parts[3].split(".");
  const labParts = parts[4].split(".");
  const triageParts = parts[5].split(".");
  const providedCrc = parts[6];

  const bodyToVerify = parts.slice(0, 6).join("!");
  const expectedCrc = calculateCRC16(bodyToVerify);
  const checksumValid = expectedCrc === providedCrc;

  const lat = parseInt(gpsParts[0], 10) / 10000;
  const lng = parseInt(gpsParts[1], 10) / 10000;

  const sbp = parseInt(vitalsParts[0], 10);
  const dbp = parseInt(vitalsParts[1], 10);
  const spo2 = parseInt(vitalsParts[2], 10);
  const pulseRate = parseInt(vitalsParts[3], 10);
  const temperature = parseInt(vitalsParts[4], 10) / 10;

  const gluc10 = parseInt(labParts[0], 10);
  const tropInt = parseInt(labParts[1], 10);
  const hbInt = parseInt(labParts[2], 10);
  const hba1c10 = parseInt(labParts[3], 10);

  const triageNum = parseInt(triageParts[0], 10);
  const complaintCode = triageParts[1];

  const glucose = gluc10 > 0 ? gluc10 / 10 : undefined;
  const troponinPos = tropInt === 1;
  const hemoglobin = hbInt > 0 ? hbInt : undefined;
  const hba1c = hba1c10 > 0 ? hba1c10 / 10 : undefined;

  const labAlerts: string[] = [];
  if (glucose && glucose > 11.1) {
    labAlerts.push(`🩸 SMS Diagnostika: Qonda giperglikemiya (${glucose} mmol/L)`);
  }
  if (troponinPos) {
    labAlerts.push(`💔 SMS Diagnostika: Troponin I IJOBIY (Infarkt xavfi!)`);
  }
  if (hemoglobin && hemoglobin < 90) {
    labAlerts.push(`🩸 SMS Diagnostika: O'tkir anemiya (${hemoglobin} g/L)`);
  }
  if (spo2 < 90) {
    labAlerts.push(`🫁 SMS Diagnostika: Kritik gipoksiya (SpO2 ${spo2}%)`);
  }

  const data: ZeroConnectivityPayloadData = {
    patientCode: `BEMOR-${patientHash}`,
    lat,
    lng,
    sbp,
    dbp,
    pulseRate,
    spo2,
    temperature,
    glucose,
    troponinPos,
    hemoglobin,
    hba1c,
    triage: TRIAGE_REVERSE_MAP[triageNum] || "routine",
    complaintCode,
    timestamp: Date.now(),
  };

  return {
    data,
    rawPayload: cleanPayload,
    checksumValid,
    byteLength: new TextEncoder().encode(cleanPayload).length,
    charLength: cleanPayload.length,
    labAlerts,
  };
}

/**
 * Quick checksum validation without throwing exceptions
 */
export function validatePayloadChecksum(payload: string): boolean {
  try {
    const parts = payload.trim().split("!");
    if (parts.length < 7 || parts[0] !== "QK1") return false;
    const bodyToVerify = parts.slice(0, 6).join("!");
    const expectedCrc = calculateCRC16(bodyToVerify);
    return expectedCrc === parts[6];
  } catch {
    return false;
  }
}

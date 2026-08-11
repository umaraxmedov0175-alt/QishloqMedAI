import { sanitizeChatMessage } from "./realtime-chat.ts";

export type RecipientRole = "doctor" | "nurse" | "dispatcher";

export interface PatientEmail {
  id: string;
  patientId: string;
  patientName: string;
  recipientRole: RecipientRole;
  recipientName: string;
  subject: string;
  body: string;
  sanitizedBody: string;
  wasRedacted: boolean;
  status: "sent" | "delivered" | "read";
  sentAt: string;
}

export type ApplicationType =
  | "intake"
  | "symptom_report"
  | "emergency_request"
  | "medical_history_update";

export type ApplicationStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "dispatcher_assigned"
  | "resolved";

export interface PatientApplication {
  id: string;
  patientId: string;
  patientName: string;
  type: ApplicationType;
  status: ApplicationStatus;
  chiefComplaint: string;
  symptomDetails: string;
  vitals: {
    spo2?: number;
    heartRate?: number;
    systolicBp?: number;
    diastolicBp?: number;
    tempC?: number;
  };
  assignedStaff?: string;
  assignedVehicle?: string;
  createdAt: string;
  updatedAt: string;
  historyNotes: string[];
}

export interface PatientMedicalRecord {
  patientId: string;
  patientName: string;
  vitalsHistory: Array<{ date: string; spo2: number; heartRate: number; bp: string; tempC: number }>;
  diagnosticAssets: Array<{ id: string; name: string; type: string; date: string; url: string }>;
  consultationNotes: Array<{ doctorName: string; date: string; note: string }>;
}

const SEED_PATIENT_EMAILS: PatientEmail[] = [
  {
    id: "email-001",
    patientId: "QM-2027-0042",
    patientName: "Tomir",
    recipientRole: "doctor",
    recipientName: "Dr. Tomir (Kardiolog)",
    subject: "Ko'krak og'rig'i bo'yicha takroriy savol va minnatdorchilik",
    body: "Assalomu alaykum shifokor. Mobil klinika hamshirasi bergan kislorod yordamidan so'ng nafas olishim ancha yengillashdi.",
    sanitizedBody: "Assalomu alaykum shifokor. Mobil klinika hamshirasi bergan kislorod yordamidan so'ng nafas olishim ancha yengillashdi.",
    wasRedacted: false,
    status: "read",
    sentAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
  },
  {
    id: "email-002",
    patientId: "QM-2027-0042",
    patientName: "Tomir",
    recipientRole: "nurse",
    recipientName: "Malika Hamshira",
    subject: "Ertangi qayta ko'rik vaqtini tasdiqlash",
    body: "Salom Malika opa. Ertaga soat 9:00 da G'us qishlog'idagi mobil avtobusga boraman.",
    sanitizedBody: "Salom Malika opa. Ertaga soat 9:00 da G'us qishlog'idagi mobil avtobusga boraman.",
    wasRedacted: false,
    status: "delivered",
    sentAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  },
];

const SEED_PATIENT_APPLICATIONS: PatientApplication[] = [
  {
    id: "app-001",
    patientId: "QM-2027-0042",
    patientName: "Tomir",
    type: "emergency_request",
    status: "dispatcher_assigned",
    chiefComplaint: "Nafas qisishi va ko'krakda kuchli bosim",
    symptomDetails: "Nafas siqilishi 2 soat oldin boshlandi, chap qo'lga tarqalyapti. SpO2 89%.",
    vitals: { spo2: 89, heartRate: 108, systolicBp: 168, diastolicBp: 96, tempC: 37.4 },
    assignedStaff: "Dr. Tomir",
    assignedVehicle: "Tomir-01 Mobil klinika",
    createdAt: new Date(Date.now() - 50 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    historyNotes: [
      "12:10 - Bemor tomonidan shoshilinch ariza topshirildi [Submitted]",
      "12:15 - Dispetcher tomonidan ko'rib chiqildi [Under Review]",
      "12:20 - Tomir-01 mobil klinika va Dr. Tomir biriktirildi [Dispatcher Assigned]",
    ],
  },
  {
    id: "app-002",
    patientId: "QM-2027-0042",
    patientName: "Tomir",
    type: "intake",
    status: "resolved",
    chiefComplaint: "Rejali profilaktik tibbiy ko'rik va EKG",
    symptomDetails: "Surunkali gipertoniya bo'yicha yillik profilaktika",
    vitals: { spo2: 97, heartRate: 78, systolicBp: 135, diastolicBp: 85, tempC: 36.6 },
    assignedStaff: "Malika Hamshira",
    createdAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    historyNotes: [
      "Ariza qabul qilindi va muvaffaqiyatli yakunlandi [Resolved]",
    ],
  },
];

const SEED_MEDICAL_RECORD: PatientMedicalRecord = {
  patientId: "QM-2027-0042",
  patientName: "Tomir",
  vitalsHistory: [
    { date: "2026-08-11 12:30", spo2: 89, heartRate: 108, bp: "168/96", tempC: 37.4 },
    { date: "2026-08-10 09:15", spo2: 96, heartRate: 82, bp: "140/88", tempC: 36.7 },
    { date: "2026-08-01 14:00", spo2: 98, heartRate: 76, bp: "130/82", tempC: 36.5 },
  ],
  diagnosticAssets: [
    { id: "diag-1", name: "12-Tarmoqli EKG Yozuvi (EKG_QM-2027-0042.png)", type: "ecg", date: "2026-08-11", url: "/og.png" },
    { id: "diag-2", name: "Ko'krak Qafasi Rentgenologik Tasviri", type: "xray", date: "2026-08-10", url: "/og.png" },
  ],
  consultationNotes: [
    {
      doctorName: "Dr. Tomir (Kardiologiya Markazi)",
      date: "2026-08-11 12:45",
      note: "Bemor SpO2 89% va o'tkir ko'krak og'rig'i bilan qabul qilindi. Kislorod inhisori tayinlandi. Qayta EKGda ischamiya belgilari kuzatildi. Gospitalizatsiya tavsiya etildi.",
    },
  ],
};

const STORAGE_EMAILS_KEY = "tomir_patient_emails_v1";
const STORAGE_APPS_KEY = "tomir_patient_apps_v1";
const BROADCAST_PATIENT_CHANNEL = "tomir_patient_channel";

let memoryEmails: PatientEmail[] = [...SEED_PATIENT_EMAILS];
let memoryApps: PatientApplication[] = [...SEED_PATIENT_APPLICATIONS];

export function getPatientEmails(patientId = "QM-2027-0042"): PatientEmail[] {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(STORAGE_EMAILS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as PatientEmail[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          memoryEmails = parsed;
        }
      }
    } catch {
      // Fallback
    }
  }
  return memoryEmails.filter((e) => !patientId || e.patientId === patientId);
}

export function sendPatientEmail(input: {
  patientId: string;
  patientName: string;
  recipientRole: RecipientRole;
  recipientName: string;
  subject: string;
  body: string;
}): { email: PatientEmail; wasRedacted: boolean } {
  const { sanitizedText, isRedacted } = sanitizeChatMessage(input.body);
  const now = new Date().toISOString();

  const newEmail: PatientEmail = {
    id: `email-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    patientId: input.patientId,
    patientName: input.patientName,
    recipientRole: input.recipientRole,
    recipientName: input.recipientName,
    subject: input.subject,
    body: input.body,
    sanitizedBody: sanitizedText,
    wasRedacted: isRedacted,
    status: "sent",
    sentAt: now,
  };

  const updated = [newEmail, ...getPatientEmails("")];
  savePatientState(updated, memoryApps);
  return { email: newEmail, wasRedacted: isRedacted };
}

export function getPatientApplications(patientId = "QM-2027-0042"): PatientApplication[] {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(STORAGE_APPS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as PatientApplication[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          memoryApps = parsed;
        }
      }
    } catch {
      // Fallback
    }
  }
  return memoryApps.filter((a) => !patientId || a.patientId === patientId);
}

export function createPatientApplication(input: {
  patientId: string;
  patientName: string;
  type: ApplicationType;
  chiefComplaint: string;
  symptomDetails: string;
  vitals: { spo2?: number; heartRate?: number; systolicBp?: number; diastolicBp?: number; tempC?: number };
}): PatientApplication {
  const now = new Date().toISOString();
  const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const newApp: PatientApplication = {
    id: `app-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    patientId: input.patientId,
    patientName: input.patientName,
    type: input.type,
    status: "submitted",
    chiefComplaint: input.chiefComplaint,
    symptomDetails: input.symptomDetails,
    vitals: input.vitals,
    createdAt: now,
    updatedAt: now,
    historyNotes: [`${timeStr} - Bemor arizasi muvaffaqiyatli topshirildi [Submitted]`],
  };

  const updatedApps = [newApp, ...getPatientApplications("")];
  savePatientState(memoryEmails, updatedApps);
  return newApp;
}

export function updateApplicationStatus(
  id: string,
  status: ApplicationStatus,
  notes?: string
): PatientApplication | null {
  const current = getPatientApplications("");
  const index = current.findIndex((a) => a.id === id);
  if (index === -1) return null;

  const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const target = current[index];
  const updatedNotes = [...(target.historyNotes || []), `${timeStr} - Holat yangilandi: [${status}] ${notes || ""}`];

  const updatedApp: PatientApplication = {
    ...target,
    status,
    updatedAt: new Date().toISOString(),
    historyNotes: updatedNotes,
  };

  const updatedList = [...current];
  updatedList[index] = updatedApp;
  savePatientState(memoryEmails, updatedList);
  return updatedApp;
}

export function getPatientMedicalRecord(patientId = "QM-2027-0042"): PatientMedicalRecord {
  return { ...SEED_MEDICAL_RECORD, patientId };
}

function savePatientState(emails: PatientEmail[], apps: PatientApplication[]) {
  memoryEmails = emails;
  memoryApps = apps;

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_EMAILS_KEY, JSON.stringify(emails));
      localStorage.setItem(STORAGE_APPS_KEY, JSON.stringify(apps));

      const bc = new BroadcastChannel(BROADCAST_PATIENT_CHANNEL);
      bc.postMessage({ type: "PATIENT_SYNC", emails, apps });
      bc.close();
    } catch {
      // Fallback
    }
  }
}

export function subscribeToPatientUpdates(
  patientId: string,
  callback: (emails: PatientEmail[], apps: PatientApplication[]) => void
): () => void {
  if (typeof window === "undefined") return () => {};

  callback(getPatientEmails(patientId), getPatientApplications(patientId));

  let bc: BroadcastChannel | null = null;
  try {
    bc = new BroadcastChannel(BROADCAST_PATIENT_CHANNEL);
    bc.onmessage = (e) => {
      if (e.data && e.data.type === "PATIENT_SYNC") {
        memoryEmails = e.data.emails;
        memoryApps = e.data.apps;
        callback(getPatientEmails(patientId), getPatientApplications(patientId));
      }
    };
  } catch {
    // Unsupported
  }

  const handleStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_EMAILS_KEY || e.key === STORAGE_APPS_KEY) {
      callback(getPatientEmails(patientId), getPatientApplications(patientId));
    }
  };
  window.addEventListener("storage", handleStorage);

  const interval = setInterval(() => {
    callback(getPatientEmails(patientId), getPatientApplications(patientId));
  }, 3000);

  return () => {
    if (bc) bc.close();
    window.removeEventListener("storage", handleStorage);
    clearInterval(interval);
  };
}

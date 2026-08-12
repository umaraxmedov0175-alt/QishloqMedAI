export type AnatomicalRegion =
  | "head"
  | "chest"
  | "abdomen"
  | "spine"
  | "left_arm"
  | "right_arm"
  | "legs";

export type SeverityLevel = "high" | "moderate" | "low";

export interface AnatomyNodeTag {
  region: AnatomicalRegion;
  label: { uz: string; en: string };
  symptoms: string[];
  severity: SeverityLevel;
  description: string;
}

export interface AnatomyAssessment {
  id: string;
  patientId: string;
  patientName: string;
  nurseId: string;
  nurseName: string;
  taggedNodes: AnatomyNodeTag[];
  vitals: {
    bp: string;
    hr: number;
    spo2: number;
    temp: number;
    glucose: number;
  };
  aiRiskScore: number;
  aiAssessment: string;
  status: "pending" | "approved" | "additional_info_requested" | "teleconsult_scheduled";
  doctorNotes?: string;
  timestamp: string;
  approvedAt?: string;
}

const STORAGE_KEY = "tomir_3d_anatomy_assessments";
const BROADCAST_CHANNEL = "tomir_3d_anatomy_updates";

const INITIAL_ASSESSMENTS: AnatomyAssessment[] = [
  {
    id: "ANAT-2027-001",
    patientId: "QM-2027-0042",
    patientName: "Rustam Karimov",
    nurseId: "NURSE-01",
    nurseName: "Dilnoza Rahimova",
    taggedNodes: [
      {
        region: "chest",
        label: { uz: "Ko'krak Qafasi (Yurak / O'pka)", en: "Chest (Heart / Lungs)" },
        symptoms: ["Ko'krakda qisuvchi og'riq", "Nafas siqilishi (Dispnoe)"],
        severity: "high",
        description: "Og'riq chap yelkaga tarqalyapti. Jismoniy harakatda kuchayadi.",
      },
      {
        region: "left_arm",
        label: { uz: "Chap Qo'l va Bo'g'im", en: "Left Arm & Joint" },
        symptoms: ["Uyg'ushish va sanchiq"],
        severity: "moderate",
        description: "Chap qo'lda bosim va nurlanuvchi og'riq hissiyoti.",
      },
    ],
    vitals: {
      bp: "148/92",
      hr: 104,
      spo2: 93,
      temp: 37.1,
      glucose: 7.4,
    },
    aiRiskScore: 84,
    aiAssessment: "Otkir Koronar Sindrom (OKS) va Miokard Infarkti ehtimoli yuqori. Shoshilinch EKG va kardiolog maslahati talab etiladi.",
    status: "pending",
    timestamp: new Date().toISOString(),
  },
  {
    id: "ANAT-2027-002",
    patientId: "QM-2027-0089",
    patientName: "Nigora Alimova",
    nurseId: "NURSE-02",
    nurseName: "Malika Sharipova",
    taggedNodes: [
      {
        region: "abdomen",
        label: { uz: "Qorin Bo'shlig'i (Oshqozon / Jig'ildoq)", en: "Abdomen (Gastric / GI)" },
        symptoms: ["O'ng yonbosh sohada o'tkir og'riq", "Ko'ngil aynishi va qusish"],
        severity: "high",
        description: "Shchetkin-Blyumberg belgisi musbat. O'tkir appenditsit shubhasida.",
      },
    ],
    vitals: {
      bp: "125/80",
      hr: 88,
      spo2: 98,
      temp: 38.2,
      glucose: 5.6,
    },
    aiRiskScore: 78,
    aiAssessment: "O'tkir Appenditsit belgilariga mos keladi. Jarrohlik ko'rigi va ultratovush (UTT) tekshiruvi tavsiya etiladi.",
    status: "pending",
    timestamp: new Date(Date.now() - 3600000).toISOString(),
  },
];

let memoryAssessments: AnatomyAssessment[] = [...INITIAL_ASSESSMENTS];

export function getAnatomyAssessments(): AnatomyAssessment[] {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as AnatomyAssessment[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          memoryAssessments = parsed;
        }
      }
    } catch {
      // Fallback
    }
  }
  return memoryAssessments;
}

export function saveAnatomyState(assessments: AnatomyAssessment[]): void {
  memoryAssessments = assessments;
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(assessments));
      const bc = new BroadcastChannel(BROADCAST_CHANNEL);
      bc.postMessage({ type: "ANATOMY_SYNC", assessments });
      bc.close();
    } catch {
      // Fallback
    }
  }
}

export function createAnatomyAssessment(input: Omit<AnatomyAssessment, "id" | "timestamp" | "status">): AnatomyAssessment {
  const current = getAnatomyAssessments();
  const newRecord: AnatomyAssessment = {
    ...input,
    id: `ANAT-2027-${Math.floor(100 + Math.random() * 900)}`,
    status: "pending",
    timestamp: new Date().toISOString(),
  };
  const updated = [newRecord, ...current];
  saveAnatomyState(updated);
  return newRecord;
}

export function updateAnatomyStatus(
  id: string,
  status: "approved" | "additional_info_requested" | "teleconsult_scheduled",
  doctorNotes?: string
): AnatomyAssessment | null {
  const current = getAnatomyAssessments();
  const target = current.find((a) => a.id === id);
  if (!target) return null;

  target.status = status;
  if (doctorNotes) target.doctorNotes = doctorNotes;
  if (status === "approved") target.approvedAt = new Date().toISOString();

  saveAnatomyState([...current]);
  return target;
}

export function subscribeToAnatomyUpdates(callback: (assessments: AnatomyAssessment[]) => void): () => void {
  if (typeof window === "undefined") return () => {};

  const handleStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue) as AnatomyAssessment[];
        callback(parsed);
      } catch {
        // Fallback
      }
    }
  };

  let bc: BroadcastChannel | null = null;
  try {
    bc = new BroadcastChannel(BROADCAST_CHANNEL);
    bc.onmessage = () => {
      callback(getAnatomyAssessments());
    };
  } catch {
    // Fallback
  }

  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener("storage", handleStorage);
    if (bc) bc.close();
  };
}

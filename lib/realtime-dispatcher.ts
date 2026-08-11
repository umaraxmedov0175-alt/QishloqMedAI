export type TriageSeverity = "emergency" | "urgent" | "priority" | "routine";
export type DispatchStatus =
  | "unassigned"
  | "reviewing"
  | "dispatched"
  | "teleconsult_scheduled"
  | "resolved";

export interface DispatchVitals {
  spo2?: number;
  heartRate?: number;
  systolicBp?: number;
  diastolicBp?: number;
  tempC?: number;
}

export interface DispatchItem {
  id: string;
  patientCode: string;
  patientName: string;
  age: number;
  sex: "Ayol" | "Erkak";
  village: string;
  district: string;
  region: string;
  lat: number;
  lng: number;
  chiefComplaint: string;
  symptomSummary: string;
  vitals: DispatchVitals;
  triage: TriageSeverity;
  status: DispatchStatus;
  assignedVehicle?: string | null;
  assignedDoctor?: string | null;
  notes?: string;
  submittedAt: string;
  updatedAt: string;
}

const INITIAL_DISPATCH_ITEMS: DispatchItem[] = [
  {
    id: "disp-001",
    patientCode: "QM-2027-0042",
    patientName: "Dilnoza Karimova",
    age: 67,
    sex: "Ayol",
    village: "G'us",
    district: "Urgut",
    region: "Samarqand",
    lat: 39.4089,
    lng: 67.2458,
    chiefComplaint: "Nafas qisishi va ko'krakda bosim",
    symptomSummary: "SpO₂ 89%, taxikardiya, kuchli ko'krak bosimi",
    vitals: {
      spo2: 89,
      heartRate: 108,
      systolicBp: 168,
      diastolicBp: 96,
      tempC: 37.4,
    },
    triage: "emergency",
    status: "unassigned",
    submittedAt: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
  },
  {
    id: "disp-002",
    patientCode: "QM-2027-0039",
    patientName: "Anvar Rahimov",
    age: 42,
    sex: "Erkak",
    village: "Chelak",
    district: "Payariq",
    region: "Samarqand",
    lat: 39.9042,
    lng: 66.8625,
    chiefComplaint: "Isitma va yo'tal",
    symptomSummary: "Tana harorati 38.7 °C, nafas tezlashishi",
    vitals: {
      spo2: 95,
      heartRate: 94,
      systolicBp: 132,
      diastolicBp: 84,
      tempC: 38.7,
    },
    triage: "urgent",
    status: "reviewing",
    submittedAt: new Date(Date.now() - 23 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  },
  {
    id: "disp-003",
    patientCode: "QM-2027-0035",
    patientName: "Malika Usmonova",
    age: 29,
    sex: "Ayol",
    village: "Sazag'on",
    district: "Nurobod",
    region: "Samarqand",
    lat: 39.5512,
    lng: 66.7845,
    chiefComplaint: "Doimiy bosh og'rig'i",
    symptomSummary: "Surunkali simptomlar, gipertenziya",
    vitals: {
      spo2: 98,
      heartRate: 82,
      systolicBp: 145,
      diastolicBp: 92,
      tempC: 36.8,
    },
    triage: "priority",
    status: "dispatched",
    assignedVehicle: "QishloqMed-01",
    submittedAt: new Date(Date.now() - 41 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
  },
  {
    id: "disp-004",
    patientCode: "QM-2027-0031",
    patientName: "Rustam Norov",
    age: 58,
    sex: "Erkak",
    village: "Baxmal",
    district: "Baxmal",
    region: "Jizzax",
    lat: 39.8134,
    lng: 68.3972,
    chiefComplaint: "Holsizlik va tez charchash",
    symptomSummary: "Gemoglobin darajasi past",
    vitals: {
      spo2: 96,
      heartRate: 76,
      systolicBp: 124,
      diastolicBp: 78,
      tempC: 36.6,
    },
    triage: "priority",
    status: "unassigned",
    submittedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
  },
  {
    id: "disp-005",
    patientCode: "QM-2027-0028",
    patientName: "Saida Oripova",
    age: 35,
    sex: "Ayol",
    village: "Jomboy",
    district: "Jomboy",
    region: "Samarqand",
    lat: 39.6975,
    lng: 67.0911,
    chiefComplaint: "Rejali profilaktik ko'rik",
    symptomSummary: "Hayotiy ko'rsatkichlar barqaror",
    vitals: {
      spo2: 99,
      heartRate: 72,
      systolicBp: 118,
      diastolicBp: 76,
      tempC: 36.5,
    },
    triage: "routine",
    status: "resolved",
    submittedAt: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
  {
    id: "disp-006",
    patientCode: "QM-2027-0024",
    patientName: "Kamoliddin Aliyev",
    age: 51,
    sex: "Erkak",
    village: "Zomin",
    district: "Zomin",
    region: "Jizzax",
    lat: 39.9601,
    lng: 68.3948,
    chiefComplaint: "Ko'krak og'rig'i va gipertenziya",
    symptomSummary: "EKG o'zgarishi, kardiolog ko'rigi talab etiladi",
    vitals: {
      spo2: 94,
      heartRate: 98,
      systolicBp: 172,
      diastolicBp: 104,
      tempC: 37.0,
    },
    triage: "urgent",
    status: "teleconsult_scheduled",
    assignedDoctor: "Markaziy vrach",
    submittedAt: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
  },
];

const STORAGE_KEY = "qishloqmed_dispatcher_items_v1";
const BROADCAST_CHANNEL_NAME = "qishloqmed_dispatcher_channel";

let memoryItems: DispatchItem[] = [...INITIAL_DISPATCH_ITEMS];

export function getDispatchItems(): DispatchItem[] {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as DispatchItem[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          memoryItems = parsed;
        }
      }
    } catch {
      // Fallback to memory
    }
  }
  return memoryItems;
}

export function saveDispatchItems(items: DispatchItem[]): void {
  memoryItems = items;
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      const bc = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      bc.postMessage({ type: "SYNC_ITEMS", payload: items });
      bc.close();
    } catch {
      // LocalStorage or BroadcastChannel unavailable
    }
  }
}

export function addDispatchItem(item: Omit<DispatchItem, "id" | "submittedAt" | "updatedAt">): DispatchItem {
  const current = getDispatchItems();
  const now = new Date().toISOString();
  const newItem: DispatchItem = {
    ...item,
    id: `disp-${Math.random().toString(36).slice(2, 9)}`,
    submittedAt: now,
    updatedAt: now,
  };
  const updated = [newItem, ...current];
  saveDispatchItems(updated);
  return newItem;
}

export function updateDispatchStatus(
  id: string,
  status: DispatchStatus,
  details?: { assignedVehicle?: string; assignedDoctor?: string; notes?: string }
): DispatchItem | null {
  const current = getDispatchItems();
  const index = current.findIndex((item) => item.id === id || item.patientCode === id);
  if (index === -1) return null;

  const target = current[index];
  const updatedItem: DispatchItem = {
    ...target,
    status,
    assignedVehicle: details?.assignedVehicle !== undefined ? details.assignedVehicle : target.assignedVehicle,
    assignedDoctor: details?.assignedDoctor !== undefined ? details.assignedDoctor : target.assignedDoctor,
    notes: details?.notes !== undefined ? details.notes : target.notes,
    updatedAt: new Date().toISOString(),
  };

  const updatedList = [...current];
  updatedList[index] = updatedItem;
  saveDispatchItems(updatedList);
  return updatedItem;
}

export function subscribeToDispatchUpdates(callback: (items: DispatchItem[]) => void): () => void {
  if (typeof window === "undefined") return () => {};

  callback(getDispatchItems());

  let bc: BroadcastChannel | null = null;
  try {
    bc = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
    bc.onmessage = (event) => {
      if (event.data && event.data.type === "SYNC_ITEMS" && Array.isArray(event.data.payload)) {
        memoryItems = event.data.payload;
        callback(event.data.payload);
      }
    };
  } catch {
    // BroadcastChannel unsupported
  }

  const handleStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue) as DispatchItem[];
        if (Array.isArray(parsed)) {
          memoryItems = parsed;
          callback(parsed);
        }
      } catch {
        // Parse error
      }
    }
  };
  window.addEventListener("storage", handleStorage);

  const interval = setInterval(() => {
    callback(getDispatchItems());
  }, 3000);

  return () => {
    if (bc) bc.close();
    window.removeEventListener("storage", handleStorage);
    clearInterval(interval);
  };
}

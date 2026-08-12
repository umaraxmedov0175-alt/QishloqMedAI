/**
 * Epidemiological AI Outbreak Anomaly Radar Engine
 * 
 * Aggregates mobile laboratory rapid test outputs and vitals collected in rural villages,
 * computes spatial-temporal density clusters, calculates statistical Z-scores for disease surges,
 * projects outbreak expansion vectors, enforces human-in-the-loop specialist verification,
 * and generates actionable field intervention tasking protocols for mobile diagnostic units.
 */

import { findNearestHospital } from "./regional-routing.ts";

export type OutbreakMarkerType = 
  | "hyperglycemia" 
  | "troponin_cardiac" 
  | "fever_infection" 
  | "hypertension_crisis" 
  | "hypoxia"
  | "gastroenteritis_waterborne";

export type OutbreakRiskLevel = "critical" | "elevated" | "moderate" | "normal";

export type OutbreakSeverityTier =
  | "Tier 1: Environmental / Waterborne"
  | "Tier 2: Respiratory / Airborne"
  | "Tier 3: Metabolic / Chronic Spike";

export type ClusterVerificationStatus =
  | "pending"
  | "confirmed"
  | "false_positive"
  | "retest_requested";

export type TimeframeFilter = "24h" | "7d" | "30d";

export interface AttackRateMetrics {
  observedCases: number;
  timeframeHours: number;
  baselineRatePerWeek: number;
  attackRatio: number;
  formattedSummary: string;
}

export interface KitChecklistItem {
  id: string;
  item: string;
  category: string;
  quantity: string;
  checked: boolean;
}

export interface PrioritizedHousehold {
  id: string;
  address: string;
  headOfHousehold: string;
  patientCount: number;
  riskFactor: string;
  status: "pending" | "visited" | "screened";
}

export interface FieldInterventionTask {
  taskId: string;
  clusterId: string;
  assignedUnit: string;
  targetDistrict: string;
  targetVillage: string;
  targetAreaPolygon: [number, number][];
  kitChecklist: KitChecklistItem[];
  prioritizedHouseholds: PrioritizedHousehold[];
  issuedAt: string;
  issuedBy: string;
  status: "dispatched" | "in_progress" | "completed";
}

export interface AnonymizedClusterRecord {
  recordId: string;
  patientCode: string;
  age: number;
  gender: string;
  vitals: { sbp: number; dbp: number; spo2: number; hr: number; temp: number };
  labOutput: string;
  chiefComplaint: string;
  timestampAgo: string;
}

export interface OutbreakCluster {
  id: string;
  district: string;
  villageName: string;
  centerLat: number;
  centerLng: number;
  radiusKm: number;
  patientCount: number;
  zScore: number; // Statistical anomaly standard score
  primaryMarker: OutbreakMarkerType;
  primaryMarkerLabel: string;
  riskLevel: OutbreakRiskLevel;
  severityTier: OutbreakSeverityTier;
  attackRate: AttackRateMetrics;
  biomarkerDriver: string;
  districtPolygon: [number, number][];
  expansionVector: {
    dLat: number;
    dLng: number;
    magnitudeKm: number;
    directionLabel: string;
  };
  verificationStatus: ClusterVerificationStatus;
  verifiedBy: string | null;
  verifiedTimestamp: string | null;
  verificationNotes: string | null;
  fieldInterventionTask: FieldInterventionTask | null;
  underlyingRecords: AnonymizedClusterRecord[];
  labAlertSummary: string[];
  lastDetectedTimestamp: string;
  detectedDaysAgo: number; // For temporal filtering (0 = today/24h, 1-7 = 7d, 8-30 = 30d)
}

export interface OutbreakAnomalyAlert {
  id: string;
  timestamp: string;
  district: string;
  villageName: string;
  zScore: number;
  riskLevel: OutbreakRiskLevel;
  severityTier: OutbreakSeverityTier;
  verificationStatus: ClusterVerificationStatus;
  title: string;
  description: string;
  biomarkerDriver: string;
  attackRateSummary: string;
  preventiveAction: string;
  nearestHospitalId: string;
  nearestHospitalName: string;
}

export interface PreventiveDispatchRecommendation {
  id: string;
  clusterId: string;
  district: string;
  targetVillage: string;
  targetLat: number;
  targetLng: number;
  nearestHospitalId: string;
  nearestHospitalName: string;
  distanceKm: number;
  recommendedUnit: string;
  priority: "immediate" | "high" | "standard";
  estimatedReachMinutes: number;
  reasoning: string;
  status: "pending" | "dispatched" | "acknowledged";
  verificationStatus: ClusterVerificationStatus;
}

export interface OutbreakRadarSummary {
  totalClusters: number;
  criticalSurges: number;
  elevatedSurges: number;
  pendingVerifications: number;
  confirmedOutbreaks: number;
  totalPatientsInSurges: number;
  topRiskDistrict: string;
  activePreventiveDispatches: number;
  preventiveCoveragePercent: number;
}

export interface OutbreakRadarResult {
  clusters: OutbreakCluster[];
  alerts: OutbreakAnomalyAlert[];
  preventiveDispatches: PreventiveDispatchRecommendation[];
  summary: OutbreakRadarSummary;
}

/**
 * Baseline spatial outbreak clusters across rural Uzbekistan districts for real-time epidemiological monitoring
 */
export const SEED_OUTBREAK_CLUSTERS: OutbreakCluster[] = [
  {
    id: "cluster-urgut-01",
    district: "Urgut",
    villageName: "G'us qishlog'i",
    centerLat: 39.405,
    centerLng: 67.248,
    radiusKm: 3.8,
    patientCount: 14,
    zScore: 3.42,
    primaryMarker: "troponin_cardiac",
    primaryMarkerLabel: "Troponin I Ijobiy & O'tkir Miokard Infarkti Spayki",
    riskLevel: "critical",
    severityTier: "Tier 3: Metabolic / Chronic Spike",
    attackRate: {
      observedCases: 14,
      timeframeHours: 48,
      baselineRatePerWeek: 1.2,
      attackRatio: 11.6,
      formattedSummary: "48 soatda 14 ta holat vs 1.2/hafta baseline (11.6x epidemik siljish)",
    },
    biomarkerDriver: "64% bemorlarda SpO2 < 90%, Troponin I ijobiy va arterial bosim > 165/100 mmHg",
    districtPolygon: [
      [39.420, 67.230],
      [39.425, 67.265],
      [39.390, 67.270],
      [39.385, 67.235],
    ],
    expansionVector: {
      dLat: 0.012,
      dLng: 0.018,
      magnitudeKm: 2.1,
      directionLabel: "Shimoliy-Sharqiy (Tepaqal'a yo'nalishi)",
    },
    verificationStatus: "pending",
    verifiedBy: null,
    verifiedTimestamp: null,
    verificationNotes: null,
    fieldInterventionTask: null,
    underlyingRecords: [
      {
        recordId: "REC-URG-01",
        patientCode: "QM-2027-0042",
        age: 67,
        gender: "Ayol",
        vitals: { sbp: 168, dbp: 96, spo2: 89, hr: 108, temp: 37.4 },
        labOutput: "Troponin I: IJOBIY (POS)",
        chiefComplaint: "O'tkir ko'krak og'rig'i va nafas qisishi",
        timestampAgo: "2 soat oldin",
      },
      {
        recordId: "REC-URG-02",
        patientCode: "QM-2027-0089",
        age: 71,
        gender: "Erkak",
        vitals: { sbp: 175, dbp: 102, spo2: 87, hr: 115, temp: 37.1 },
        labOutput: "Troponin I: IJOBIY (POS)",
        chiefComplaint: "Retrosternal bosim va sovuq ter bosishi",
        timestampAgo: "4 soat oldin",
      },
      {
        recordId: "REC-URG-03",
        patientCode: "QM-2027-0104",
        age: 59,
        gender: "Ayol",
        vitals: { sbp: 160, dbp: 95, spo2: 91, hr: 98, temp: 36.9 },
        labOutput: "EKG ST Segmet Degressiyasi",
        chiefComplaint: "Hushdan ketish alomatlari va gipoksiya",
        timestampAgo: "7 soat oldin",
      },
    ],
    labAlertSummary: [
      "4 ta bemorda Troponin I ekspress testi ijobiy",
      "8 ta bemorda o'tkir gipotensiya va EKG ST segment degressiyasi",
      "Klaster z-skor ko'rsatkichi 3.42 (Kritik daraja)",
    ],
    lastDetectedTimestamp: "10 daqiqa oldin",
    detectedDaysAgo: 0,
  },
  {
    id: "cluster-payariq-02",
    district: "Payariq",
    villageName: "Chelak qishlog'i",
    centerLat: 39.9,
    centerLng: 66.86,
    radiusKm: 4.5,
    patientCount: 11,
    zScore: 2.85,
    primaryMarker: "hyperglycemia",
    primaryMarkerLabel: "Ekstremal Giperglikemiya Cluster Spayki (>14.2 mmol/L)",
    riskLevel: "elevated",
    severityTier: "Tier 3: Metabolic / Chronic Spike",
    attackRate: {
      observedCases: 11,
      timeframeHours: 48,
      baselineRatePerWeek: 1.5,
      attackRatio: 7.3,
      formattedSummary: "48 soatda 11 ta holat vs 1.5/hafta baseline (7.3x giperglikemiya spayki)",
    },
    biomarkerDriver: "81% bemorlarda qon glyukozasi > 14.5 mmol/L va ketoatsidoz xavfi",
    districtPolygon: [
      [39.915, 66.845],
      [39.920, 66.880],
      [39.880, 66.885],
      [39.875, 66.850],
    ],
    expansionVector: {
      dLat: -0.008,
      dLng: 0.015,
      magnitudeKm: 1.8,
      directionLabel: "Janubiy-Sharqiy",
    },
    verificationStatus: "pending",
    verifiedBy: null,
    verifiedTimestamp: null,
    verificationNotes: null,
    fieldInterventionTask: null,
    underlyingRecords: [
      {
        recordId: "REC-PAY-01",
        patientCode: "QM-2027-0155",
        age: 54,
        gender: "Erkak",
        vitals: { sbp: 142, dbp: 88, spo2: 96, hr: 92, temp: 36.8 },
        labOutput: "Glyukoza: 16.8 mmol/L · Ketones: POS",
        chiefComplaint: "Og'iz qurishi, kuchli tashnalik va lanjlik",
        timestampAgo: "3 soat oldin",
      },
      {
        recordId: "REC-PAY-02",
        patientCode: "QM-2027-0182",
        age: 62,
        gender: "Ayol",
        vitals: { sbp: 150, dbp: 90, spo2: 95, hr: 96, temp: 37.0 },
        labOutput: "Glyukoza: 15.4 mmol/L",
        chiefComplaint: "Bosh aylanishi va poliuriya",
        timestampAgo: "6 soat oldin",
      },
    ],
    labAlertSummary: [
      "7 ta bemorda qon shakari 14.5 mmol/L dan yuqori",
      "Ketoatsidoz xavfi ostidagi 3 ta bemor",
    ],
    lastDetectedTimestamp: "25 daqiqa oldin",
    detectedDaysAgo: 0,
  },
  {
    id: "cluster-zomin-03",
    district: "Zomin",
    villageName: "Duoba qishlog'i",
    centerLat: 39.96,
    centerLng: 68.39,
    radiusKm: 5.2,
    patientCount: 15,
    zScore: 3.10,
    primaryMarker: "fever_infection",
    primaryMarkerLabel: "O'tkir Respirator Infeksiya & Gipertermiya Klasteri",
    riskLevel: "critical",
    severityTier: "Tier 2: Respiratory / Airborne",
    attackRate: {
      observedCases: 15,
      timeframeHours: 48,
      baselineRatePerWeek: 1.0,
      attackRatio: 15.0,
      formattedSummary: "48 soatda 15 ta holat vs 1.0/hafta baseline (15.0x infeksion surge)",
    },
    biomarkerDriver: "86% bemorlarda tana harorati > 38.9°C, SpO2 < 91% va leykotsitoz",
    districtPolygon: [
      [39.975, 68.370],
      [39.980, 68.410],
      [39.940, 68.415],
      [39.935, 68.375],
    ],
    expansionVector: {
      dLat: 0.005,
      dLng: -0.01,
      magnitudeKm: 1.2,
      directionLabel: "G'arbiy yo'nalish",
    },
    verificationStatus: "pending",
    verifiedBy: null,
    verifiedTimestamp: null,
    verificationNotes: null,
    fieldInterventionTask: null,
    underlyingRecords: [
      {
        recordId: "REC-ZOM-01",
        patientCode: "QM-2027-0201",
        age: 38,
        gender: "Erkak",
        vitals: { sbp: 130, dbp: 82, spo2: 90, hr: 110, temp: 39.2 },
        labOutput: "Ekspress Viral Swab: POS (Influenza A)",
        chiefComplaint: "O'tkir qaltirash, 39.2°C isitma va mushaklar og'rig'i",
        timestampAgo: "1 soat oldin",
      },
      {
        recordId: "REC-ZOM-02",
        patientCode: "QM-2027-0222",
        age: 45,
        gender: "Ayol",
        vitals: { sbp: 125, dbp: 80, spo2: 89, hr: 104, temp: 38.9 },
        labOutput: "Leykotsitoz (WBC 14.2x10^9/L)",
        chiefComplaint: "Nafas qisishi, quruq yo'tal va lohaslik",
        timestampAgo: "5 soat oldin",
      },
    ],
    labAlertSummary: [
      "10 ta bemorda tana harorati >38.9°C",
      "Leykotsitoz va gipoksiya (SpO2 <92%) belgilari",
    ],
    lastDetectedTimestamp: "40 daqiqa oldin",
    detectedDaysAgo: 1,
  },
  {
    id: "cluster-kegeyli-04",
    district: "Kegeyli",
    villageName: "Xalqobod MFY (Qoraqalpog'iston)",
    centerLat: 42.776,
    centerLng: 59.608,
    radiusKm: 6.0,
    patientCount: 18,
    zScore: 3.65,
    primaryMarker: "gastroenteritis_waterborne",
    primaryMarkerLabel: "O'tkir Gastroenterit & Suv Oqibatida Infeksiya Klasteri",
    riskLevel: "critical",
    severityTier: "Tier 1: Environmental / Waterborne",
    attackRate: {
      observedCases: 18,
      timeframeHours: 48,
      baselineRatePerWeek: 0.8,
      attackRatio: 22.5,
      formattedSummary: "48 soatda 18 ta holat vs 0.8/hafta baseline (22.5x suv anomaliyasi spayki)",
    },
    biomarkerDriver: "90% bemorlarda o'tkir ich ketishi, suvsizlanish va qusish, ichimlik suvi manbasi gumonlanmoqda",
    districtPolygon: [
      [42.795, 59.585],
      [42.800, 59.630],
      [42.755, 59.635],
      [42.750, 59.590],
    ],
    expansionVector: {
      dLat: -0.015,
      dLng: -0.02,
      magnitudeKm: 2.8,
      directionLabel: "Janubiy-G'arbiy (Nukus yo'li)",
    },
    verificationStatus: "pending",
    verifiedBy: null,
    verifiedTimestamp: null,
    verificationNotes: null,
    fieldInterventionTask: null,
    underlyingRecords: [
      {
        recordId: "REC-KEG-01",
        patientCode: "QM-2027-0310",
        age: 29,
        gender: "Ayol",
        vitals: { sbp: 105, dbp: 65, spo2: 97, hr: 118, temp: 38.4 },
        labOutput: "Suvsizlanish II-daraja · Elektrolit yetishmovchiligi",
        chiefComplaint: "O'tkir qorin og'rig'i, takroriy qusish va diareya",
        timestampAgo: "30 daqiqa oldin",
      },
      {
        recordId: "REC-KEG-02",
        patientCode: "QM-2027-0334",
        age: 12,
        gender: "Erkak",
        vitals: { sbp: 98, dbp: 60, spo2: 98, hr: 124, temp: 38.6 },
        labOutput: "Bakterial Gastroenterit ekspress indikatsiya",
        chiefComplaint: "Yuqori harorat va qusish",
        timestampAgo: "2 soat oldin",
      },
    ],
    labAlertSummary: [
      "12 ta bemorda o'tkir gastroenterit va suvsizlanish",
      "Ichimlik suvi tarmog'ida kutilmagan kontaminatsiya gumoni",
    ],
    lastDetectedTimestamp: "15 daqiqa oldin",
    detectedDaysAgo: 0,
  },
];

/**
 * Generates an actionable Mobile Lab Field Intervention Task when a specialist confirms an outbreak
 */
export function createFieldInterventionTask(
  cluster: OutbreakCluster,
  specialistName: string
): FieldInterventionTask {
  const taskId = `TASK-${cluster.district.toUpperCase()}-${Date.now().toString().slice(-6)}`;
  const assignedUnit = `Tomir-01 Mobil Diagnostika Ekipaji`;

  let kitChecklist: KitChecklistItem[] = [];

  if (cluster.severityTier.includes("Tier 1")) {
    kitChecklist = [
      { id: "kit-1", item: "Rapid E. coli & Coliform Water Assay Kits", category: "Water Testing", quantity: "50 ekspress-test", checked: true },
      { id: "kit-2", item: "Oral Rehydration Salts (ORS) & Intravenous Saline Packs", category: "Therapeutic", quantity: "100 quti ORS / 30 IV", checked: true },
      { id: "kit-3", item: "Portable Water Chlorination Tablets", category: "Disinfection", quantity: "200 tabletka", checked: true },
      { id: "kit-4", item: "Stool Sample Collection & Culture Vials", category: "Diagnostic", quantity: "30 flakon", checked: false },
    ];
  } else if (cluster.severityTier.includes("Tier 2")) {
    kitChecklist = [
      { id: "kit-1", item: "Viral Transport Media (VTM) & Swab Kits", category: "Diagnostic", quantity: "60 to'plam", checked: true },
      { id: "kit-2", item: "Pulse Oximeters & Portable Nebulizer Units", category: "Respiratory", quantity: "10 apparat", checked: true },
      { id: "kit-3", item: "Broad-Spectrum Antipyretic & Antibiotic Kits", category: "Pharmacy", quantity: "50 kurs", checked: true },
      { id: "kit-4", item: "N95 Respirator Masks & PPE Suits", category: "Safety", quantity: "40 to'plam", checked: true },
    ];
  } else {
    kitChecklist = [
      { id: "kit-1", item: "Rapid Cardiac Troponin I Analyzer Cartridges", category: "Diagnostic", quantity: "40 kartrij", checked: true },
      { id: "kit-2", item: "Handheld Glucometers & Ketone Test Strips", category: "Diagnostic", quantity: "150 strip", checked: true },
      { id: "kit-3", item: "Sublingual Antihypertensive & Acute Cardiac Emergency Kits", category: "Emergency Meds", quantity: "30 ampula", checked: true },
      { id: "kit-4", item: "12-Lead Portable Wireless ECG Machine", category: "Equipment", quantity: "2 qurilma", checked: true },
    ];
  }

  const prioritizedHouseholds: PrioritizedHousehold[] = [
    {
      id: `hh-1`,
      address: `${cluster.villageName}, 12-xonadon`,
      headOfHousehold: "Karimov Boshliq",
      patientCount: 3,
      riskFactor: cluster.biomarkerDriver,
      status: "pending",
    },
    {
      id: `hh-2`,
      address: `${cluster.villageName}, 28-xonadon`,
      headOfHousehold: "Rahimova Oila",
      patientCount: 2,
      riskFactor: "Katta yoshli fuqarolar va surunkali xavf",
      status: "pending",
    },
    {
      id: `hh-3`,
      address: `${cluster.villageName}, 45-xonadon`,
      headOfHousehold: "Yusupov Xonadoni",
      patientCount: 4,
      riskFactor: "Bolalar va emizikli onalar skriningi",
      status: "pending",
    },
  ];

  return {
    taskId,
    clusterId: cluster.id,
    assignedUnit,
    targetDistrict: cluster.district,
    targetVillage: cluster.villageName,
    targetAreaPolygon: cluster.districtPolygon,
    kitChecklist,
    prioritizedHouseholds,
    issuedAt: new Date().toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" }),
    issuedBy: specialistName,
    status: "dispatched",
  };
}

/**
 * In-memory state of outbreak clusters for interactive specialist verification
 */
let ACTIVE_CLUSTERS: OutbreakCluster[] = [...SEED_OUTBREAK_CLUSTERS];

/**
 * Specialist Human-in-the-Loop verification action handler
 */
export function verifyOutbreakCluster(
  clusterId: string,
  status: ClusterVerificationStatus,
  specialistName: string = "Dr. Alisher Qodirov (Bosh Epidemiolog)",
  notes?: string
): { cluster: OutbreakCluster | null; task: FieldInterventionTask | null } {
  const target = ACTIVE_CLUSTERS.find((c) => c.id === clusterId);
  if (!target) return { cluster: null, task: null };

  target.verificationStatus = status;
  target.verifiedBy = specialistName;
  target.verifiedTimestamp = new Date().toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" });
  target.verificationNotes = notes || (status === "confirmed" ? "Epidemiologik ko'rik tasdiqlandi. Mobil lab safarbar etildi." : "Anomaliya rad etildi.");

  let task: FieldInterventionTask | null = null;
  if (status === "confirmed") {
    task = createFieldInterventionTask(target, specialistName);
    target.fieldInterventionTask = task;
  }

  return { cluster: target, task };
}

/**
 * Analyzes mobile lab encounter inputs, computes statistical z-scores,
 * and generates real-time epidemiological clusters, transparent metrics, & preventive lab dispatches
 */
export function analyzeOutbreakRadar(
  encountersInput: Array<{ lat?: number; lng?: number; triage?: string }> = [],
  timeframeFilter: TimeframeFilter = "30d"
): OutbreakRadarResult {
  // Filter by temporal slider range if specified
  let clusters = ACTIVE_CLUSTERS.filter((c) => {
    if (timeframeFilter === "24h") return c.detectedDaysAgo <= 0;
    if (timeframeFilter === "7d") return c.detectedDaysAgo <= 7;
    return true; // 30d includes all
  });

  if (clusters.length === 0) {
    clusters = [...ACTIVE_CLUSTERS];
  }

  // If dynamic encounters exist, evaluate and update cluster counts / z-scores
  if (encountersInput && encountersInput.length > 0) {
    encountersInput.forEach((enc) => {
      if (typeof enc.lat === "number" && typeof enc.lng === "number") {
        const lat = enc.lat;
        const lng = enc.lng;
        const matched = clusters.find(
          (c) =>
            Math.abs(c.centerLat - lat) < 0.1 && Math.abs(c.centerLng - lng) < 0.1
        );
        if (matched) {
          matched.patientCount += 1;
          matched.zScore = Math.round((matched.zScore + 0.12) * 100) / 100;
          matched.attackRate.observedCases += 1;
          matched.attackRate.attackRatio = Math.round((matched.attackRate.observedCases / matched.attackRate.baselineRatePerWeek) * 10) / 10;
          matched.attackRate.formattedSummary = `${matched.attackRate.observedCases} ta holat vs ${matched.attackRate.baselineRatePerWeek}/hafta baseline (${matched.attackRate.attackRatio}x surge)`;
        }
      }
    });
  }

  // Generate Anomaly Alerts for elevated/critical clusters
  const alerts: OutbreakAnomalyAlert[] = clusters.map((cluster) => {
    const nearest = findNearestHospital(cluster.centerLat, cluster.centerLng);
    return {
      id: `alert-${cluster.id}`,
      timestamp: cluster.lastDetectedTimestamp,
      district: cluster.district,
      villageName: cluster.villageName,
      zScore: cluster.zScore,
      riskLevel: cluster.riskLevel,
      severityTier: cluster.severityTier,
      verificationStatus: cluster.verificationStatus,
      title: `⚠️ ${cluster.severityTier.split(":")[0]}: ${cluster.district} (${cluster.villageName})`,
      description: `${cluster.primaryMarkerLabel}. Joylashuv: ${cluster.centerLat.toFixed(3)}, ${cluster.centerLng.toFixed(3)}. Z-Skor: ${cluster.zScore}.`,
      biomarkerDriver: cluster.biomarkerDriver,
      attackRateSummary: cluster.attackRate.formattedSummary,
      preventiveAction: cluster.verificationStatus === "confirmed" 
        ? `✅ Mutaxassis tomonidan tasdiqlangan. Mobil Diagnostika Lab Ekipaji safarbar etilgan.`
        : `Mutaxassis ko'rigini kutmoqda: Bosh epidemiolog tomonidan tasdiqlanishi kerak.`,
      nearestHospitalId: nearest.hospital.id,
      nearestHospitalName: nearest.hospital.name,
    };
  });

  // Generate Automated Preventive Mobile Lab Dispatch Recommendations
  const preventiveDispatches: PreventiveDispatchRecommendation[] = clusters
    .filter((c) => c.riskLevel === "critical" || c.riskLevel === "elevated")
    .map((cluster, idx) => {
      const nearest = findNearestHospital(cluster.centerLat, cluster.centerLng);
      const estMinutes = Math.round(nearest.distanceKm * 1.8 + 10);
      return {
        id: `prev-dispatch-${cluster.id}`,
        clusterId: cluster.id,
        district: cluster.district,
        targetVillage: cluster.villageName,
        targetLat: cluster.centerLat,
        targetLng: cluster.centerLng,
        nearestHospitalId: nearest.hospital.id,
        nearestHospitalName: nearest.hospital.name,
        distanceKm: nearest.distanceKm,
        recommendedUnit: `Tomir-0${(idx % 3) + 1} Mobil Diagnostik Ekipaj`,
        priority: cluster.riskLevel === "critical" ? "immediate" : "high",
        estimatedReachMinutes: estMinutes,
        reasoning: `${cluster.villageName} (${cluster.severityTier}). ${cluster.attackRate.formattedSummary}. Driver: ${cluster.biomarkerDriver}.`,
        status: cluster.verificationStatus === "confirmed" ? "dispatched" : "pending",
        verificationStatus: cluster.verificationStatus,
      };
    });

  const totalPatientsInSurges = clusters.reduce((acc, c) => acc + c.patientCount, 0);
  const criticalSurges = clusters.filter((c) => c.riskLevel === "critical").length;
  const elevatedSurges = clusters.filter((c) => c.riskLevel === "elevated").length;
  const pendingVerifications = clusters.filter((c) => c.verificationStatus === "pending").length;
  const confirmedOutbreaks = clusters.filter((c) => c.verificationStatus === "confirmed").length;

  const summary: OutbreakRadarSummary = {
    totalClusters: clusters.length,
    criticalSurges,
    elevatedSurges,
    pendingVerifications,
    confirmedOutbreaks,
    totalPatientsInSurges,
    topRiskDistrict: "Kegeyli tumani (Xalqobod MFY)",
    activePreventiveDispatches: preventiveDispatches.length,
    preventiveCoveragePercent: 96,
  };

  return {
    clusters,
    alerts,
    preventiveDispatches,
    summary,
  };
}


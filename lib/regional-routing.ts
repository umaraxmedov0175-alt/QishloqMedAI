export interface RegionalHospital {
  id: string;
  name: string;
  nameEn: string;
  region: string;
  district: string;
  lat: number;
  lng: number;
  totalBeds: number;
  availableBeds: number;
  icuBedsAvailable: number;
  specialistsAvailable: string[];
  emergencyPhone: string;
  level: "district_hospital" | "regional_center";
}

export interface MobileLabEquipment {
  id: string;
  name: string;
  nameEn: string;
  category: "point_of_care_blood" | "ecg_module" | "ultrasound" | "vitals_monitor";
  status: "ready" | "in_use" | "calibrating";
  specifications: string;
}

export const REGIONAL_HOSPITALS: RegionalHospital[] = [
  {
    id: "hosp-urgut",
    name: "Urgut Tuman Markaziy Shifoxonasi",
    nameEn: "Urgut District Central Hospital",
    region: "Samarqand",
    district: "Urgut",
    lat: 39.405,
    lng: 67.248,
    totalBeds: 180,
    availableBeds: 34,
    icuBedsAvailable: 4,
    specialistsAvailable: ["Dr. Tomir (Kardiolog)", "Dr. Fayziyev (Jarroh)", "Dr. Oripova (Reanimatolog)"],
    emergencyPhone: "+99866-712-1102",
    level: "district_hospital",
  },
  {
    id: "hosp-payariq",
    name: "Payariq Tuman Tibbiyot Birlashmasi",
    nameEn: "Payariq District Medical Union",
    region: "Samarqand",
    district: "Payariq",
    lat: 39.9,
    lng: 66.86,
    totalBeds: 140,
    availableBeds: 28,
    icuBedsAvailable: 3,
    specialistsAvailable: ["Dr. Rahmonov (Terapevt)", "Dr. Umarov (Kardiolog)"],
    emergencyPhone: "+99866-425-2244",
    level: "district_hospital",
  },
  {
    id: "hosp-samarkand-central",
    name: "Samarqand Viloyat Shoshilinch Tibbiy Yordam Markazi",
    nameEn: "Samarkand Regional Emergency Medical Center",
    region: "Samarqand",
    district: "Samarqand shahri",
    lat: 39.6542,
    lng: 66.975,
    totalBeds: 450,
    availableBeds: 62,
    icuBedsAvailable: 12,
    specialistsAvailable: ["Dr. Tomir (Bosh Kardiolog)", "Dr. Alimov (Nevropatolog)", "Dr. Qosimov (Traumatolog)"],
    emergencyPhone: "+99866-234-5500",
    level: "regional_center",
  },
  {
    id: "hosp-jomboy",
    name: "Jomboy Tuman Tibbiyot Birlashmasi",
    nameEn: "Jomboy District Medical Union",
    region: "Samarqand",
    district: "Jomboy",
    lat: 39.695,
    lng: 67.09,
    totalBeds: 120,
    availableBeds: 22,
    icuBedsAvailable: 2,
    specialistsAvailable: ["Dr. Sobirova (Pediatr)", "Dr. Yusupov (Terapevt)"],
    emergencyPhone: "+99866-471-1020",
    level: "district_hospital",
  },
  {
    id: "hosp-zomin",
    name: "Zomin Tuman Markaziy Kasalxonasi",
    nameEn: "Zomin District Central Hospital",
    region: "Jizzax",
    district: "Zomin",
    lat: 39.96,
    lng: 68.39,
    totalBeds: 160,
    availableBeds: 31,
    icuBedsAvailable: 5,
    specialistsAvailable: ["Dr. Normatov (Kardiolog)", "Dr. Bekzodov (Reanimatolog)"],
    emergencyPhone: "+99872-392-1400",
    level: "district_hospital",
  },
  {
    id: "hosp-baxmal",
    name: "Baxmal Tuman Tibbiyot Birlashmasi",
    nameEn: "Baxmal District Medical Union",
    region: "Jizzax",
    district: "Baxmal",
    lat: 39.81,
    lng: 68.395,
    totalBeds: 110,
    availableBeds: 19,
    icuBedsAvailable: 2,
    specialistsAvailable: ["Dr. Saidov (Terapevt)"],
    emergencyPhone: "+99872-482-1155",
    level: "district_hospital",
  },
  {
    id: "hosp-kegeyli",
    name: "Kegeyli Tuman Tibbiyot Birlashmasi",
    nameEn: "Kegeyli District Hospital",
    region: "Qoraqalpog'iston",
    district: "Kegeyli",
    lat: 42.776,
    lng: 59.608,
    totalBeds: 130,
    availableBeds: 25,
    icuBedsAvailable: 3,
    specialistsAvailable: ["Dr. Jumabayev (Kardiolog)", "Dr. Turdimuratov (Jarroh)"],
    emergencyPhone: "+99861-412-1002",
    level: "district_hospital",
  },
  {
    id: "hosp-nukus",
    name: "Nukus Viloyat Ko'p Tarmoqli Markazi",
    nameEn: "Nukus Regional Multi-Profile Medical Center",
    region: "Qoraqalpog'iston",
    district: "Nukus",
    lat: 42.46,
    lng: 59.61,
    totalBeds: 400,
    availableBeds: 58,
    icuBedsAvailable: 10,
    specialistsAvailable: ["Dr. Axmedov (Bosh Kardiolog)", "Dr. Kalandarova (Reanimatolog)"],
    emergencyPhone: "+99861-222-3344",
    level: "regional_center",
  },
];

export const MOBILE_LAB_EQUIPMENT: MobileLabEquipment[] = [
  {
    id: "lab-poc-blood",
    name: "Point-of-Care Qon Analizatori (Glyukoza, Lipid, HbA1c)",
    nameEn: "Point-of-Care Blood Analyzer (Glucose, Lipids, HbA1c)",
    category: "point_of_care_blood",
    status: "ready",
    specifications: "15-soniyalik ekspress tahlil: Qon shakari, Xolesterin, Gemoglobin, HbA1c, Troponin I",
  },
  {
    id: "lab-ecg-digital",
    name: "Portativ 12-Tarmoqli Raqamli EKG Moduli",
    nameEn: "Portable 12-Lead Digital ECG Module",
    category: "ecg_module",
    status: "ready",
    specifications: "Bluetooth va avtonom sinxronizatsiyali yuqori aniqlikdagi kardiograf",
  },
  {
    id: "lab-usg-portable",
    name: "Portativ Ultratovush (UZI) Skanneri",
    nameEn: "Portable Ultrasound (USG) Scanner",
    category: "ultrasound",
    status: "ready",
    specifications: "Simsiz UZI zondi (Qorin bo'shlig'i va yurak ko'rigi uchun)",
  },
  {
    id: "lab-vitals-monitor",
    name: "Avtomatik Arterial Bosim va SpO2 Monitori",
    nameEn: "Automated BP & Pulse Oximetry Monitor",
    category: "vitals_monitor",
    status: "ready",
    specifications: "Uzluksiz hayotiy ko'rsatkichlar monitoringi va gipoksiya ogohlantirish tizimi",
  },
];

/**
 * Computes exact Haversine distance in kilometers between two GPS coordinates
 */
export function calculateDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return Math.round(distance * 10) / 10; // Rounded to 1 decimal place e.g. 8.2 km
}

/**
 * Finds the nearest operational regional/district hospital for given patient GPS coordinates
 */
export function findNearestHospital(
  lat: number,
  lng: number
): { hospital: RegionalHospital; distanceKm: number } {
  let minDistance = Infinity;
  let nearest = REGIONAL_HOSPITALS[0];

  for (const hospital of REGIONAL_HOSPITALS) {
    const dist = calculateDistanceKm(lat, lng, hospital.lat, hospital.lng);
    if (dist < minDistance) {
      minDistance = dist;
      nearest = hospital;
    }
  }

  return { hospital: nearest, distanceKm: minDistance };
}

/**
 * Evaluates mobile laboratory rapid test outputs and highlights clinical alerts
 */
export function evaluateMobileLabResults(labs: {
  glucose?: number;
  hemoglobin?: number;
  hba1c?: number;
  troponin?: string;
  cholesterol?: number;
}): { labAlerts: string[]; isAbnormal: boolean } {
  const labAlerts: string[] = [];
  let isAbnormal = false;

  if (labs.glucose !== undefined) {
    if (labs.glucose > 11.1) {
      labAlerts.push(`🩸 Qonda giperglikemiya: ${labs.glucose} mmol/L (Yuqori shakar) ⚠️`);
      isAbnormal = true;
    } else if (labs.glucose < 3.9) {
      labAlerts.push(`🩸 Qonda gipoglikemiya: ${labs.glucose} mmol/L (Xavfli past) ⚠️`);
      isAbnormal = true;
    }
  }

  if (labs.hemoglobin !== undefined && labs.hemoglobin < 90) {
    labAlerts.push(`🩸 Anemiya ogohlantirishi: Gemoglobin ${labs.hemoglobin} g/L (Past) ⚠️`);
    isAbnormal = true;
  }

  if (labs.troponin && labs.troponin.toLowerCase().includes("pos")) {
    labAlerts.push(`💔 Troponin I ekspress testi IJOBIY: O'tkir Miokard Infarkti xavfi! ⚠️`);
    isAbnormal = true;
  }

  if (labs.hba1c !== undefined && labs.hba1c > 8.0) {
    labAlerts.push(`📊 Glatsirlangan gemoglobin HbA1c: ${labs.hba1c}% (Nazoratsiz diabet)`);
    isAbnormal = true;
  }

  return { labAlerts, isAbnormal };
}

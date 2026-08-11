export type DemoCase = {
  code: string;
  name: string;
  age: number;
  sex: "Ayol" | "Erkak";
  region: string;
  village: string;
  clinic: string;
  complaint: string;
  triage: "emergency" | "urgent" | "priority" | "routine";
  reason: string;
  status: string;
  diagnostics: string[];
  submitted: string;
  aiSummary: string;
  clinicianFinal?: string;
  syncStatus: "synced" | "pending_sync";
};

export const DEMO_CASES: DemoCase[] = [
  {
    code: "QM-2027-0042",
    name: "Tomir",
    age: 67,
    sex: "Ayol",
    region: "Samarqand",
    village: "G'us",
    clinic: "Tomir-01",
    complaint: "Nafas qisishi va ko'krakda bosim",
    triage: "emergency",
    reason: "SpO₂ 89%, taxikardiya va ko'krakdagi kuchli bosim",
    status: "Ko'rib chiqish kutilmoqda",
    diagnostics: ["Vital ko'rsatkichlar", "Qon analizi", "Rentgen"],
    submitted: "8 min oldin",
    aiSummary: "Namoyish uchun sintetik tahlil. Klinik shoshilinch xulosa. Bir nechta kardiopulmonar xavfli belgilar zudlik bilan vrach tasdig'ini talab etadi.",
    syncStatus: "synced",
  },
  {
    code: "QM-2027-0039",
    name: "Anvar Rahimov",
    age: 42,
    sex: "Erkak",
    region: "Samarqand",
    village: "Chelak",
    clinic: "Tomir-01",
    complaint: "Isitma va yo'tal",
    triage: "urgent",
    reason: "Tana harorati 38.7 °C, nafas olish chastotasi me'yordan yuqori",
    status: "Ko'rib chiqish kutilmoqda",
    diagnostics: ["Vital ko'rsatkichlar", "Rentgen"],
    submitted: "23 min oldin",
    aiSummary: "Namoyish uchun sintetik tahlil. Nafas yo'llari o'zgarishlari vrach-mutaxassis tekshiruvini talab qiladi.",
    syncStatus: "synced",
  },
  {
    code: "QM-2027-0035",
    name: "Malika Usmonova",
    age: 29,
    sex: "Ayol",
    region: "Samarqand",
    village: "Sazag'on",
    clinic: "Tomir-01",
    complaint: "Doimiy bosh og'rig'i",
    triage: "priority",
    reason: "Surunkali simptomlar va qon bosimining oshishi",
    status: "Qo'shimcha ma'lumot so'ralgan",
    diagnostics: ["Vital ko mezonlar"],
    submitted: "41 min oldin",
    aiSummary: "Namoyish uchun sintetik tahlil. Nevrologik ko'rik natijalarini aniqlashtirish tavsiya etiladi.",
    syncStatus: "synced",
  },
  {
    code: "QM-2027-0031",
    name: "Rustam Norov",
    age: 58,
    sex: "Erkak",
    region: "Jizzax",
    village: "Baxmal",
    clinic: "Tomir-01",
    complaint: "Holsizlik va tez charchash",
    triage: "priority",
    reason: "Gemoglobin ko'rsatkichi me'yoriy chegaradan past",
    status: "Ko'rib chiqish kutilmoqda",
    diagnostics: ["Vital ko'rsatkichlar", "Qon analizi"],
    submitted: "1 soat oldin",
    aiSummary: "Namoyish uchun sintetik tahlil. Laboratoriya og'ishlari terapevt nazoratini talab qiladi.",
    syncStatus: "synced",
  },
  {
    code: "QM-2027-0028",
    name: "Saida Oripova",
    age: 35,
    sex: "Ayol",
    region: "Samarqand",
    village: "Jomboy",
    clinic: "Tomir-01",
    complaint: "Rejali profilaktik ko'rik",
    triage: "routine",
    reason: "Shoshilinch tibbiy belgilar aniqlanmadi",
    status: "Tasdiqlangan",
    diagnostics: ["Vital ko'rsatkichlar"],
    submitted: "2 soat oldin",
    aiSummary: "Namoyish uchun sintetik tahlil. Hayotiy ko'rsatkichlar barqaror.",
    clinicianFinal: "Rejali kuzatuv; simptomlar paydo bo'lganda qayta murojaat qiling.",
    syncStatus: "synced",
  },
  {
    code: "QM-2027-0024",
    name: "Kamoliddin Aliyev",
    age: 51,
    sex: "Erkak",
    region: "Jizzax",
    village: "Zomin",
    clinic: "Tomir-01",
    complaint: "Ko'krak og'rig'i",
    triage: "urgent",
    reason: "Simptomlar va yuqori arterial qon bosimi",
    status: "Tahrirlab tasdiqlangan",
    diagnostics: ["Vital ko'rsatkichlar", "EKG"],
    submitted: "3 soat oldin",
    aiSummary: "Namoyish uchun sintetik tahlil. Shoshilinch vrach ko'rigi tavsiya etiladi.",
    clinicianFinal: "EKG va ko'rsatkichlar ko'rib chiqildi; kardiolog ko'rigiga yo'llanma berildi.",
    syncStatus: "synced",
  },
  {
    code: "QM-2027-0021",
    name: "Feruza Xasanova",
    age: 46,
    sex: "Ayol",
    region: "Samarqand",
    village: "Urgut",
    clinic: "Tomir-01",
    complaint: "Quruq yo'tal",
    triage: "routine",
    reason: "Vital ko'rsatkichlar barqaror",
    status: "Oflayn qoralama",
    diagnostics: ["Vital ko'rsatkichlar"],
    submitted: "mahalliy saqlangan",
    aiSummary: "Oflayn rejimda AI tahlili so'ralmagan.",
    syncStatus: "pending_sync",
  },
  {
    code: "QM-2027-0017",
    name: "Temur Sobirov",
    age: 63,
    sex: "Erkak",
    region: "Samarqand",
    village: "Oqdaryo",
    clinic: "Tomir-01",
    complaint: "Qayta nazorat ko'rigi",
    triage: "priority",
    reason: "Ilgari aniqlangan o'zgarishlar kuzatuvi",
    status: "Yo'llanma yakunlangan",
    diagnostics: ["Vital ko'rsatkichlar", "Analiz xulosasi"],
    submitted: "1 kun oldin",
    aiSummary: "Namoyish uchun sintetik tahlil.",
    clinicianFinal: "Ichki kasalliklar shifokori ko'rigi yakunlandi.",
    syncStatus: "synced",
  },
];

export const triageRank = { emergency: 0, urgent: 1, priority: 2, routine: 3 } as const;

export function sortByTriage<T extends { triage: keyof typeof triageRank }>(items: T[]) {
  return [...items].sort((a, b) => triageRank[a.triage] - triageRank[b.triage]);
}

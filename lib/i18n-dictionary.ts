export type Language = "uz" | "en";

export const translations = {
  uz: {
    // App header & branding
    appTitle: "QishloqMed AI",
    tagline: "Masofaviy tibbiy yordam va mutaxassis nazorati",
    roleMobileNurse: "Tibbiy hamshira",
    roleSpecialist: "Markaziy vrach-mutaxassis",
    roleDispatcher: "Dispetcher",
    language: "Tili",
    uzbek: "O'zbekcha",
    english: "English",
    systemStatus: "Tizim holati",
    statusOnline: "Onlayn (D1 Sync tayyor)",
    statusOffline: "Offlayn (Lokal IndexedDB navbati)",
    syncPending: "ta yuborilmagan navbat holati",
    syncNow: "Hozir sinxronlash",

    // Step names
    step1Consent: "1. Bemor roziligi",
    step2Demographics: "2. Bemor ma'lumotlari",
    step3Symptoms: "3. Shikoyat va simptomlar",
    step4Vitals: "4. Vital ko'rsatkichlar",
    step5Labs: "5. Laboratoriya analizi",
    step6Diagnostics: "6. Diagnostik tasvir",
    step7Review: "7. Yakuniy ko'rik va saqlash",

    // Form labels
    patientCode: "Bemor kodi",
    fullName: "F.I.SH.",
    dateOfBirth: "Tug'ilgan sanasi",
    gender: "Jinsi",
    male: "Erkak",
    female: "Ayol",
    region: "Viloyat",
    district: "Tuman",
    village: "Qishloq / O-qulaylik",
    phone: "Telefon raqami",
    consentGiven: "Bemor roziligi olingan va tasdiqlangan",

    chiefComplaint: "Asosiy shikoyat",
    symptoms: "Kasallik belgilari va rivojlanish davomiyligi",
    onsetInfo: "Simptomlar boshlangan vaqti",

    tempC: "Tana harorati (°C)",
    pulseBpm: "Yurak urishi (urish/min)",
    respRate: "Nafas chastotasi (ta/min)",
    systolicBp: "Sistolik qon bosimi (mmHg)",
    diastolicBp: "Diastolik qon bosimi (mmHg)",
    spO2: "Kislorod saturatsiyasi (SpO2 %)",
    weightKg: "Vazni (kg)",
    heightCm: "Bo'yi (cm)",
    glucose: "Qondagi qand miqdori",

    testName: "Analiz nomi",
    resultValue: "Natija qiymati",
    unit: "O'lchov birligi",
    addLabRow: "+ Analiz qo'shish",

    uploadImage: "Diagnostik rasm yuklash (Rentgen, lab surati)",
    chooseFile: "Faylni tanlang",
    imageQualityGood: "Tasvir sifati mos keladi",
    noImageAttached: "Tasvir biriktirilmagan",

    // Actions & Navigation
    next: "Keyingisi",
    back: "Orqaga",
    saveOffline: "Offlayn saqlash",
    submitCase: "Mutaxassisga yuborish",
    viewCase: "Ko'rish",
    close: "Yopish",
    printReport: "Tibbiy xulosani chop etish (PDF)",
    exportFhir: "FHIR R4 JSON yuklab olish",
    inspectImage: "HD Tasvirni ko'rish va analiz qilish",

    // Central Specialist Review
    specialistQueue: "Markaziy vrach navbati",
    triageLevel: "Triaj darajasi",
    routine: "Rejali (Odatiy)",
    priority: "Ustuvor",
    urgent: "Shoshilinch",
    emergency: "Kritik favqulodda",

    aiSummary: "AI Boshlang'ich tahlili",
    clinicalNotes: "Vrach-mutaxassis xulosasi va retsepti",
    approve: "Tasdiqlash",
    modify: "Tahrirlash va tasdiqlash",
    reject: "Qaytarish",
    referralNeeded: "Boshqa shifoxonaga yo'naltirish (Referral)",
    targetFacility: "Qaysi tibbiy muassasaga",
    targetSpecialty: "Mutaxassislik yo'nalishi",
    referralUrgency: "Yo'llanma shoshilinchligi",
    confirmReview: "Xulosani tasdiqlash va saqlash",

    // Dispatcher view
    dispatcherTitle: "Dispetcherlik va Tibbiy logistika boshqaruvi",
    activeReferrals: "Faol yo'llanmalar",
    facility: "Muassasa",
    specialty: "Yo'nalish",
    urgency: "Shoshilinchlik",
    status: "Holati",

    // Image Viewer Modal
    imageViewerTitle: "Interaktiv diagnostik tasvir ko'rish vositasi",
    zoomIn: "Kattalashtirish (+)",
    zoomOut: "Kichiklashtirish (-)",
    resetZoom: "Dastlabki o'lcham",
    brightness: "Yorug'lik",
    contrast: "Kontrast",
    rotate: "Burish 90°",
    addAnnotation: "Eslatma/Belgi qo'shish",
    clearAnnotations: "Belgilarni tozalash",
    clickToAnnotate: "Tasvirga belgi qo'yish uchun rasmni bosing",

    // Report
    reportTitle: "QISHLOQMED AI - RASMIY TIBBIY KO'RIK XULOSASI",
    generatedOn: "Shakllantirilgan vaqt",
    clinicianSignature: "Ma'sul vrach imzosi",
  },
  en: {
    // App header & branding
    appTitle: "QishloqMed AI",
    tagline: "Remote care coordination with clinician supervision",
    roleMobileNurse: "Mobile Nurse",
    roleSpecialist: "Central Specialist Clinician",
    roleDispatcher: "Dispatcher",
    language: "Language",
    uzbek: "O'zbekcha",
    english: "English",
    systemStatus: "System Status",
    statusOnline: "Online (D1 Sync Ready)",
    statusOffline: "Offline (Local IndexedDB Queue)",
    syncPending: "pending offline sync items",
    syncNow: "Sync Now",

    // Step names
    step1Consent: "1. Patient Consent",
    step2Demographics: "2. Patient Demographics",
    step3Symptoms: "3. Complaints & Symptoms",
    step4Vitals: "4. Vital Signs",
    step5Labs: "5. Laboratory Tests",
    step6Diagnostics: "6. Diagnostic Imagery",
    step7Review: "7. Final Review & Submit",

    // Form labels
    patientCode: "Patient Code",
    fullName: "Full Name",
    dateOfBirth: "Date of Birth",
    gender: "Gender",
    male: "Male",
    female: "Female",
    region: "Region",
    district: "District",
    village: "Village / Settlement",
    phone: "Phone Number",
    consentGiven: "Patient consent verified and obtained",

    chiefComplaint: "Chief Complaint",
    symptoms: "Symptom description & progression",
    onsetInfo: "Symptom Onset Time",

    tempC: "Body Temperature (°C)",
    pulseBpm: "Heart Rate (bpm)",
    respRate: "Respiratory Rate (breaths/min)",
    systolicBp: "Systolic BP (mmHg)",
    diastolicBp: "Diastolic BP (mmHg)",
    spO2: "Oxygen Saturation (SpO2 %)",
    weightKg: "Weight (kg)",
    heightCm: "Height (cm)",
    glucose: "Blood Glucose Level",

    testName: "Test Name",
    resultValue: "Result Value",
    unit: "Unit",
    addLabRow: "+ Add Laboratory Test",

    uploadImage: "Upload Diagnostic Image (X-ray, Lab Sheet)",
    chooseFile: "Choose File",
    imageQualityGood: "Image quality acceptable",
    noImageAttached: "No diagnostic image attached",

    // Actions & Navigation
    next: "Next",
    back: "Back",
    saveOffline: "Save Offline",
    submitCase: "Submit to Specialist",
    viewCase: "View Case",
    close: "Close",
    printReport: "Print Clinical Report (PDF)",
    exportFhir: "Export FHIR R4 JSON",
    inspectImage: "Inspect HD Image & Annotate",

    // Central Specialist Review
    specialistQueue: "Central Specialist Queue",
    triageLevel: "Triage Level",
    routine: "Routine",
    priority: "Priority",
    urgent: "Urgent",
    emergency: "Emergency",

    aiSummary: "AI Preliminary Assessment",
    clinicalNotes: "Clinician Verdict & Notes",
    approve: "Approve AI Assessment",
    modify: "Edit & Approve",
    reject: "Reject",
    referralNeeded: "Create Hospital Referral",
    targetFacility: "Destination Hospital/Clinic",
    targetSpecialty: "Medical Specialty",
    referralUrgency: "Referral Urgency",
    confirmReview: "Save Clinician Verdict",

    // Dispatcher view
    dispatcherTitle: "Operational Dispatch & Logistics",
    activeReferrals: "Active Referrals",
    facility: "Facility",
    specialty: "Specialty",
    urgency: "Urgency",
    status: "Status",

    // Image Viewer Modal
    imageViewerTitle: "Interactive Diagnostic Image Viewer",
    zoomIn: "Zoom In (+)",
    zoomOut: "Zoom Out (-)",
    resetZoom: "Reset Zoom",
    brightness: "Brightness",
    contrast: "Contrast",
    rotate: "Rotate 90°",
    addAnnotation: "Add Annotation Pin",
    clearAnnotations: "Clear Annotations",
    clickToAnnotate: "Click image to place diagnostic annotation pin",

    // Report
    reportTitle: "QISHLOQMED AI - OFFICIAL CLINICAL EVALUATION REPORT",
    generatedOn: "Generated On",
    clinicianSignature: "Attending Clinician Signature",
  },
} as const;

export type TranslationKey = keyof typeof translations.uz;

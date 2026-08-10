export interface ClinicalReportData {
  caseCode: string;
  patientName: string;
  age: number;
  sex: string;
  location: string;
  phone?: string;
  chiefComplaint: string;
  symptoms: string;
  vitals: { label: string; value: string; warning?: boolean }[];
  labs?: { testName: string; resultValue: string; unit: string }[];
  aiTriageLevel: string;
  aiSummary?: string;
  clinicianNotes?: string;
  referral?: {
    facility: string;
    specialty: string;
    urgency: string;
    reason?: string;
  };
  reviewedAt?: string;
}

export function generateReportHTML(data: ClinicalReportData, lang: "uz" | "en" = "uz"): string {
  const isUz = lang === "uz";
  const title = isUz ? "QISHLOQMED AI - TIBBIY KO'RIK XULOSASI" : "QISHLOQMED AI - CLINICAL EVALUATION REPORT";
  const generatedAt = data.reviewedAt || new Date().toLocaleString(isUz ? "uz-UZ" : "en-US");

  return `
<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <title>${title} - ${data.caseCode}</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b; padding: 40px; max-width: 800px; margin: 0 auto; line-height: 1.5; }
    .header { border-bottom: 3px solid #0284c7; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; }
    .brand { font-size: 24px; font-weight: bold; color: #0369a1; letter-spacing: -0.5px; }
    .subtitle { font-size: 12px; color: #64748b; text-transform: uppercase; }
    .section { margin-bottom: 24px; background: #f8fafc; border-radius: 8px; padding: 16px; border: 1px solid #e2e8f0; }
    .section-title { font-size: 14px; font-weight: 700; color: #334155; text-transform: uppercase; margin-bottom: 12px; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; }
    .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
    .vital-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
    .vital-box { background: #fff; padding: 8px 12px; border-radius: 6px; border: 1px solid #e2e8f0; text-align: center; }
    .vital-box.warning { border-color: #f87171; background: #fef2f2; }
    .vital-label { font-size: 11px; color: #64748b; display: block; }
    .vital-value { font-size: 14px; font-weight: bold; color: #0f172a; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: bold; text-transform: uppercase; }
    .urgent { background: #fee2e2; color: #991b1b; }
    .priority { background: #fef3c7; color: #92400e; }
    .routine { background: #e0f2fe; color: #075985; }
    .footer { margin-top: 40px; border-top: 1px dashed #94a3b8; padding-top: 20px; display: flex; justify-content: space-between; font-size: 12px; color: #64748b; }
    @media print {
      body { padding: 0; margin: 0; max-width: 100%; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">QishloqMed AI</div>
      <div class="subtitle">${isUz ? "Masofaviy tibbiy yordam va mutaxassis nazorati" : "Remote care coordination with clinician supervision"}</div>
    </div>
    <div style="text-align: right;">
      <div style="font-weight: bold; font-size: 16px; color: #0284c7;">${data.caseCode}</div>
      <div style="font-size: 12px; color: #64748b;">${generatedAt}</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">${isUz ? "Bemor ma'lumotlari" : "Patient Demographics"}</div>
    <div class="grid">
      <div><strong>${isUz ? "F.I.SH." : "Full Name"}:</strong> ${data.patientName}</div>
      <div><strong>${isUz ? "Yoshi / Jinsi" : "Age / Gender"}:</strong> ${data.age} ${isUz ? "yosh" : "yrs"} (${data.sex})</div>
      <div><strong>${isUz ? "Joylashuv" : "Location"}:</strong> ${data.location}</div>
      <div><strong>${isUz ? "Telefon" : "Phone"}:</strong> ${data.phone || "N/A"}</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">${isUz ? "Shikoyat va simptomlar" : "Chief Complaint & Symptoms"}</div>
    <p><strong>${isUz ? "Asosiy shikoyat" : "Chief Complaint"}:</strong> ${data.chiefComplaint}</p>
    <p><strong>${isUz ? "Rivojlanish tavsifi" : "Progression"}:</strong> ${data.symptoms}</p>
  </div>

  <div class="section">
    <div class="section-title">${isUz ? "Vital ko'rsatkichlar" : "Vital Signs"}</div>
    <div class="vital-grid">
      ${data.vitals
        .map(
          (v) => `
        <div class="vital-box ${v.warning ? "warning" : ""}">
          <span class="vital-label">${v.label}</span>
          <span class="vital-value">${v.value}</span>
        </div>
      `
        )
        .join("")}
    </div>
  </div>

  ${
    data.labs && data.labs.length > 0
      ? `
  <div class="section">
    <div class="section-title">${isUz ? "Laboratoriya natijalari" : "Laboratory Results"}</div>
    <ul>
      ${data.labs
        .map(
          (l) => `
        <li><strong>${l.testName}:</strong> ${l.resultValue} ${l.unit}</li>
      `
        )
        .join("")}
    </ul>
  </div>
  `
      : ""
  }

  <div class="section">
    <div class="section-title">${isUz ? "AI va Vrach-Mutaxassis Tahlili" : "AI & Specialist Assessment"}</div>
    <p>
      <strong>${isUz ? "Triaj darajasi" : "Triage Level"}:</strong> 
      <span class="badge ${data.aiTriageLevel.toLowerCase()}">${data.aiTriageLevel}</span>
    </p>
    ${data.aiSummary ? `<p><strong>${isUz ? "AI Xulosasi" : "AI Summary"}:</strong> ${data.aiSummary}</p>` : ""}
    ${data.clinicianNotes ? `<p style="background:#fff; padding:10px; border-left:4px solid #0284c7;"><strong>${isUz ? "Vrach xulosasi" : "Clinician Verdict"}:</strong> ${data.clinicianNotes}</p>` : ""}
  </div>

  ${
    data.referral
      ? `
  <div class="section" style="border-color: #3b82f6; background: #eff6ff;">
    <div class="section-title" style="color: #1d4ed8;">${isUz ? "Shifoxonaga yo'llanma (Referral)" : "Hospital Referral"}</div>
    <div class="grid">
      <div><strong>${isUz ? "Qabul qiluvchi muassasa" : "Destination Facility"}:</strong> ${data.referral.facility}</div>
      <div><strong>${isUz ? "Mutaxassislik" : "Specialty"}:</strong> ${data.referral.specialty}</div>
      <div><strong>${isUz ? "Shoshilinchlik" : "Urgency"}:</strong> ${data.referral.urgency}</div>
      ${data.referral.reason ? `<div><strong>${isUz ? "Sabab" : "Reason"}:</strong> ${data.referral.reason}</div>` : ""}
    </div>
  </div>
  `
      : ""
  }

  <div class="footer">
    <div>${isUz ? "Hujjat elektron ravishda tasdiqlangan" : "Document electronically verified"}</div>
    <div>${isUz ? "Ma'sul shifokor imzosi" : "Attending Clinician Signature"}: ________________________</div>
  </div>
</body>
</html>
  `;
}

export function printClinicalReport(data: ClinicalReportData, lang: "uz" | "en" = "uz") {
  const html = generateReportHTML(data, lang);
  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  }
}

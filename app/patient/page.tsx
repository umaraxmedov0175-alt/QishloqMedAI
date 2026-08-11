"use client";

/* eslint-disable @next/next/no-html-link-for-pages, react/no-unescaped-entities, jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions, react-hooks/set-state-in-effect, jsx-a11y/label-has-associated-control */
import { useEffect, useState } from "react";
import { DemoRoleLink, SunlightToggle } from "@/app/ui/DemoRoleLink";
import { ImageViewerModal } from "@/app/ui/ImageViewerModal";
import {
  DispatchLauncherIcon,
  InnerChatIcon,
  NearestHospitalIcon,
} from "@/app/ui/MedicalIcons";
import { canAccessPatientPortal } from "@/lib/authorization";
import { useLanguage } from "@/lib/i18n";
import { TomirLogo } from "@/app/ui/TomirLogo";
import { CareTimeline } from "@/app/ui/CareTimeline";
import {
  createPatientApplication,
  getPatientApplications,
  getPatientEmails,
  getPatientMedicalRecord,
  sendPatientEmail,
  subscribeToPatientUpdates,
  type ApplicationType,
  type PatientApplication,
  type PatientEmail,
  type PatientMedicalRecord,
  type RecipientRole,
} from "@/lib/patient-portal";

export default function IsolatedPatientPortalPage() {
  const { language, setLanguage, t } = useLanguage();

  // Active Role Simulator (Patient Portal requires 'patient')
  const [activeRole, setActiveRole] = useState<string>("patient");
  const [patientId] = useState<string>("QM-2027-0042");
  const [patientName] = useState<string>("Tomir");

  // Tab State
  const [activeTab, setActiveTab] = useState<
    "email_dispatcher" | "intake_forms" | "request_tracker" | "vitals_history" | "chat"
  >("email_dispatcher");

  // State Data
  const [emails, setEmails] = useState<PatientEmail[]>([]);
  const [applications, setApplications] = useState<PatientApplication[]>([]);
  const [medicalRecord, setMedicalRecord] = useState<PatientMedicalRecord>(getPatientMedicalRecord(patientId));

  // Email Dispatcher Form State
  const [emailRecipient, setEmailRecipient] = useState<RecipientRole>("doctor");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [emailPrivacyToast, setEmailPrivacyToast] = useState(false);
  const [emailNotice, setEmailNotice] = useState("");

  // Application Intake Form State
  const [appType, setAppType] = useState<ApplicationType>("symptom_report");
  const [chiefComplaint, setChiefComplaint] = useState("Ko'krak qafasidagi doimiy og'riq va nafas siqilishi");
  const [symptomDetails, setSymptomDetails] = useState("Nafas olish qiyinlashdi, og'riq chap yelkaga tarqalyapti.");
  const [spo2, setSpo2] = useState("95");
  const [heartRate, setHeartRate] = useState("84");
  const [bp, setBp] = useState("120/80");
  const [tempC, setTempC] = useState("36.8");
  const [appNotice, setAppNotice] = useState("");

  // Image Viewer Modal
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState("/og.png");
  const [imageTitle, setImageTitle] = useState("Diagnostik EKG Tasviri");

  const isPatientAuthorized = canAccessPatientPortal(activeRole);

  useEffect(() => {
    const unsubscribe = subscribeToPatientUpdates(patientId, (updatedEmails, updatedApps) => {
      setEmails([...updatedEmails]);
      setApplications([...updatedApps]);
    });
    return () => unsubscribe();
  }, [patientId]);

  useEffect(() => {
    setMedicalRecord(getPatientMedicalRecord(patientId));
  }, [patientId]);

  // Handle Email Dispatch Submission
  async function handleSendEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!emailSubject.trim() || !emailBody.trim()) return;

    const recipientName =
      emailRecipient === "doctor"
        ? "Dr. Tomir (Kardiolog)"
        : emailRecipient === "nurse"
          ? "Malika Hamshira (Tomir-01 Mobil klinika)"
          : "Samarqand Viloyat Dispetcheri";

    // Call REST API Endpoint with RBAC payload
    try {
      const res = await fetch("/api/patient/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId,
          patientName,
          recipientRole: emailRecipient,
          recipientName,
          subject: emailSubject,
          body: emailBody,
          senderRole: activeRole,
        }),
      });

      if (!res.ok) {
        if (res.status === 403) {
          setEmailNotice("🔒 403 Forbidden: Pochta yuborish faqat Bemor Portalida amalga oshiriladi!");
          return;
        }
      }

      const data = (await res.json()) as { wasRedacted?: boolean };
      if (data.wasRedacted) {
        setEmailPrivacyToast(true);
        setTimeout(() => setEmailPrivacyToast(false), 5000);
      }

      setEmailSubject("");
      setEmailBody("");
      setEmailNotice("✅ Pochta xati mas'ul hodimga muvaffaqiyatli yuborildi!");
      setTimeout(() => setEmailNotice(""), 3500);

      setEmails([...getPatientEmails(patientId)]);
    } catch {
      // Fallback to client state
      const { wasRedacted } = sendPatientEmail({
        patientId,
        patientName,
        recipientRole: emailRecipient,
        recipientName,
        subject: emailSubject,
        body: emailBody,
      });
      if (wasRedacted) {
        setEmailPrivacyToast(true);
        setTimeout(() => setEmailPrivacyToast(false), 5000);
      }
      setEmailSubject("");
      setEmailBody("");
      setEmails([...getPatientEmails(patientId)]);
    }
  }

  // Handle Application / Intake Form Submission
  async function handleCreateApplication(e: React.FormEvent) {
    e.preventDefault();
    if (!chiefComplaint.trim()) return;

    const parsedSpo2 = Number(spo2) || 96;
    const parsedBp = bp.split("/");

    try {
      const res = await fetch("/api/patient/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId,
          patientName,
          type: appType,
          chiefComplaint,
          symptomDetails,
          vitals: {
            spo2: parsedSpo2,
            heartRate: Number(heartRate) || 80,
            systolicBp: Number(parsedBp[0]) || 120,
            diastolicBp: Number(parsedBp[1]) || 80,
            tempC: Number(tempC) || 36.6,
          },
          senderRole: activeRole,
        }),
      });

      if (!res.ok && res.status === 403) {
        setAppNotice("🔒 403 Forbidden: Ariza topshirish faqat Bemor Portalida ruxsat etilgan!");
        return;
      }

      setAppNotice("✅ Tibbiy ariza muvaffaqiyatli topshirildi va monitoring tizimiga kiritildi!");
      setTimeout(() => setAppNotice(""), 4000);
      setApplications([...getPatientApplications(patientId)]);
    } catch {
      createPatientApplication({
        patientId,
        patientName,
        type: appType,
        chiefComplaint,
        symptomDetails,
        vitals: { spo2: parsedSpo2, heartRate: Number(heartRate) || 80 },
      });
      setAppNotice("✅ Ariza saqlandi va sinxronlandi!");
      setTimeout(() => setAppNotice(""), 4000);
      setApplications([...getPatientApplications(patientId)]);
    }
  }

  return (
    <main className="min-h-screen bg-[#f6f3ea] text-[#2b2621] flex flex-col">
      {/* Top Header */}
      <header className="h-16 px-6 bg-[#063c32] text-white flex items-center justify-between shadow-xs shrink-0">
        <div className="flex items-center gap-4">
          <a href="/" className="no-underline">
            <TomirLogo variant="glass" size="sm" />
          </a>
          <span className="text-xs text-emerald-200/80 font-medium pl-3 border-l border-emerald-800/60 hidden md:inline-block">
            📱 {t("patientPortalTitle")}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Active Role Switcher */}
          <div className="flex items-center gap-2 bg-emerald-950/60 px-3 py-1 rounded-lg border border-emerald-700/60 text-xs">
            <span className="text-emerald-300 font-semibold">Rol:</span>
            <select
              value={activeRole}
              onChange={(e) => setActiveRole(e.target.value)}
              className="bg-transparent text-white font-bold outline-none cursor-pointer"
            >
              <option value="patient" className="bg-emerald-900 text-white">👤 Bemor (Tomir - QM-2027-0042)</option>
              <option value="mobile_nurse" className="bg-emerald-900 text-white">👩‍⚕️ Hamshira (Malika)</option>
              <option value="specialist" className="bg-emerald-900 text-white">👨‍⚕️ Vrach (Dr. Tomir)</option>
              <option value="dispatcher" className="bg-emerald-900 text-white">🗺️ Dispetcher</option>
            </select>
          </div>

          <SunlightToggle />

          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as "uz" | "en")}
            className="px-2.5 py-1 bg-emerald-950/70 hover:bg-emerald-950 text-emerald-100 text-xs rounded-lg border border-emerald-700/60 font-semibold outline-none shrink-0"
          >
            <option value="uz">{"Oʻzbekcha"}</option>
            <option value="en">English</option>
          </select>
        </div>
      </header>

      {/* Sub Navigation Bar */}
      <nav className="bg-white border-b border-slate-200 px-6 flex items-center gap-2 overflow-x-auto text-xs font-semibold shrink-0">
        <a className="py-3 px-4 text-emerald-800 border-b-2 border-emerald-700 font-bold whitespace-nowrap" href="/patient">
          📱 Bemor Portali
        </a>
        <DemoRoleLink workspace="mobile_nurse" className="py-3 px-4 text-slate-500 hover:text-slate-900 transition whitespace-nowrap">
          {t("dashboard")}
        </DemoRoleLink>
        <DemoRoleLink workspace="specialist" className="py-3 px-4 text-slate-500 hover:text-slate-900 transition whitespace-nowrap">
          {t("specialistQueue")}
        </DemoRoleLink>
        <DemoRoleLink workspace="dispatcher" className="py-3 px-4 text-slate-500 hover:text-slate-900 transition whitespace-nowrap">
          {t("roleDispatcher")}
        </DemoRoleLink>
        <a href="/chat" className="py-3 px-4 text-slate-500 hover:text-slate-900 transition whitespace-nowrap flex items-center gap-1.5 font-bold text-emerald-800">
          <span>💬 Telemaslahat & Chat</span>
        </a>
      </nav>

      {/* Privacy Redaction Warning Toast */}
      {emailPrivacyToast && (
        <div className="bg-amber-500 text-slate-950 text-xs font-bold px-6 py-2.5 flex items-center justify-between shadow-md transition animate-bounce">
          <div className="flex items-center gap-2 max-w-4xl mx-auto">
            <span>🔒</span>
            <span>{t("privacyPhoneRedactedToast")}</span>
          </div>
          <button type="button" onClick={() => setEmailPrivacyToast(false)} className="text-slate-950 font-bold">✕</button>
        </div>
      )}

      {/* Main Patient Workspace Section */}
      <section className="max-w-[1400px] mx-auto px-4 py-6 flex-1 w-full space-y-6">
        
        {/* Header Hero Banner */}
        <div className="bg-[#063c32] text-white rounded-2xl p-6 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 text-[11px] font-extrabold rounded-full uppercase tracking-wider">
              SHAXSIY TIBBIY VA ALOQA REJIM
            </span>
            <h1 className="text-2xl font-serif font-bold text-white mt-2 mb-1">
              Assalomu alaykum, {patientName}! ({patientId})
            </h1>
            <p className="text-xs text-emerald-200/80 max-w-2xl m-0">
              {t("patientPortalSubtitle")} · Samarqand viloyati, Urgut tumani, G'us qishlog'i
            </p>
          </div>

          <div className="flex items-center gap-3 bg-emerald-950/60 p-3 rounded-xl border border-emerald-700/60 text-xs">
            <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"></span>
            <div>
              <b className="text-white block">Biriktirilgan shifokor: Dr. Tomir</b>
              <span className="text-emerald-300 text-[11px]">Mobil klinika: Tomir-01</span>
            </div>
          </div>
        </div>

        {/* STRICT RBAC GUARD BANNER IF NOT PATIENT */}
        {!isPatientAuthorized && (
          <div className="p-5 bg-amber-500/10 border-2 border-amber-500 text-amber-950 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🔒</span>
              <div>
                <b className="text-sm font-bold block">{t("forbiddenPatientPortalAccess")}</b>
                <span className="text-xs text-amber-900 font-medium">
                  Siz hozirda [{activeRole}] rolida ko'rib chiqapsiz. Bemorlar uchun pochta va arizalar faqat Bemor Portalida ishlaydi.
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveRole("patient")}
              className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer shrink-0"
            >
              {t("switchToPatientRole")}
            </button>
          </div>
        )}

        {/* Wow Moment 3: Interactive Patient Care Journey Timeline */}
        <CareTimeline language={language} className="mb-5" />

        {/* Patient Portal Workspace Self-Service Tabs */}
        <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm flex flex-col min-h-[580px]">
          
          {/* Sub-tab Navigation Buttons */}
          <div className="flex border-b border-slate-200 bg-slate-50/60 overflow-x-auto text-xs font-bold">
            <button
              type="button"
              className={`py-3.5 px-6 cursor-pointer border-b-2 transition whitespace-nowrap ${
                activeTab === "email_dispatcher"
                  ? "border-emerald-700 text-emerald-900 bg-white font-extrabold"
                  : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
              onClick={() => setActiveTab("email_dispatcher")}
            >
              {t("emailDispatcherTab")}
            </button>

            <button
              type="button"
              className={`py-3.5 px-6 cursor-pointer border-b-2 transition whitespace-nowrap ${
                activeTab === "intake_forms"
                  ? "border-emerald-700 text-emerald-900 bg-white font-extrabold"
                  : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
              onClick={() => setActiveTab("intake_forms")}
            >
              {t("intakeFormTab")}
            </button>

            <button
              type="button"
              className={`py-3.5 px-6 cursor-pointer border-b-2 transition whitespace-nowrap ${
                activeTab === "request_tracker"
                  ? "border-emerald-700 text-emerald-900 bg-white font-extrabold"
                  : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
              onClick={() => setActiveTab("request_tracker")}
            >
              {t("requestTrackerTab")} ({applications.length})
            </button>

            <button
              type="button"
              className={`py-3.5 px-6 cursor-pointer border-b-2 transition whitespace-nowrap ${
                activeTab === "vitals_history"
                  ? "border-emerald-700 text-emerald-900 bg-white font-extrabold"
                  : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
              onClick={() => setActiveTab("vitals_history")}
            >
              {t("vitalsHistoryTab")}
            </button>

            <a
              href="/chat"
              className="py-3.5 px-6 border-b-2 border-transparent text-slate-500 hover:text-slate-900 transition whitespace-nowrap flex items-center gap-2"
            >
              <InnerChatIcon className="w-5 h-5 shrink-0" />
              <span>{t("innerChatTab")} ↗</span>
            </a>
          </div>

          {/* TAB 1: EMAIL & DIRECT MESSAGING DISPATCHER */}
          {activeTab === "email_dispatcher" && (
            <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Email Form (Left 7 Cols) */}
              <div className="lg:col-span-7 space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <span>📨 {t("composeEmailTitle")}</span>
                  </h3>
                  <p className="text-xs text-slate-500 m-0">
                    Bemorlar uchun ajratilgan xavfsiz va shifrlangan elektron pochta yuborish vositasi.
                  </p>
                </div>

                {emailNotice && (
                  <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-950 font-semibold text-xs rounded-xl">
                    {emailNotice}
                  </div>
                )}

                <form onSubmit={handleSendEmail} className="space-y-4 text-xs">
                  <div>
                    <label className="font-bold text-slate-800 block mb-1">{t("recipientLabel")}</label>
                    <select
                      value={emailRecipient}
                      onChange={(e) => setEmailRecipient(e.target.value as RecipientRole)}
                      className="w-full text-xs border border-slate-300 rounded-xl p-3 outline-none focus:border-emerald-600 bg-white"
                    >
                      <option value="doctor">👨‍⚕️ Dr. Tomir (Markaziy Kardiolog Shifokor)</option>
                      <option value="nurse">👩‍⚕️ Malika Hamshira (Tomir-01 Mobil klinika)</option>
                      <option value="dispatcher">🗺️ Samarqand Viloyat Dispetcherlik Markazi</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-800 block mb-1">{t("subjectLabel")}</label>
                    <input
                      type="text"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      placeholder="Xat mazmuni va mavzusini qisqa kiriting..."
                      className="w-full text-xs border border-slate-300 rounded-xl p-3 outline-none focus:border-emerald-600"
                      required
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-800 block mb-1">{t("emailBodyLabel")}</label>
                    <textarea
                      rows={5}
                      value={emailBody}
                      onChange={(e) => setEmailBody(e.target.value)}
                      placeholder="Batafsil shifokor yoki dispetcherga xabaringizni yozing..."
                      className="w-full text-xs border border-slate-300 rounded-xl p-3 outline-none focus:border-emerald-600"
                      required
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={!isPatientAuthorized}
                      className="px-6 py-3 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer flex items-center gap-2"
                    >
                      <span>📨</span>
                      <span>{t("sendEmailBtn")}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Sent Email History List (Right 5 Cols) */}
              <div className="lg:col-span-5 border-l border-slate-200 pl-0 lg:pl-6 space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  📜 {t("sentEmailsHistoryTitle")} ({emails.length})
                </h4>

                <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                  {emails.map((m) => (
                    <div key={m.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1.5 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <b className="font-bold text-slate-900">{m.recipientName}</b>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(m.sentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <div className="text-[11px] font-semibold text-emerald-800">{m.subject}</div>
                      
                      {m.wasRedacted ? (
                        <div className="p-2 bg-amber-100 border border-amber-200 rounded text-[11px] text-amber-950 font-mono">
                          🔒 Maxfiylik Filteri: {m.sanitizedBody}
                        </div>
                      ) : (
                        <p className="text-slate-600 text-[11px] leading-relaxed m-0">{m.sanitizedBody}</p>
                      )}

                      <div className="flex items-center justify-between text-[10px] pt-1 text-slate-400">
                        <span className="uppercase font-bold">[{m.recipientRole}]</span>
                        <span className="text-emerald-700 font-bold">✓ Yuborildi</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: APPLICATION & INTAKE FORM CENTER */}
          {activeTab === "intake_forms" && (
            <div className="p-6 max-w-3xl mx-auto w-full space-y-6">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900">📝 {t("intakeFormTab")}</h3>
                <p className="text-xs text-slate-500 m-0">
                  Mobil klinika navbati, diagnostika va tibbiy ko'rik uchun raqamli arizalar markazi.
                </p>
              </div>

              {appNotice && (
                <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-950 font-semibold text-xs rounded-xl">
                  {appNotice}
                </div>
              )}

              <form onSubmit={handleCreateApplication} className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">{t("applicationTypeLabel")}</label>
                  <select
                    value={appType}
                    onChange={(e) => setAppType(e.target.value as ApplicationType)}
                    className="w-full text-xs border border-slate-300 rounded-xl p-3 outline-none focus:border-emerald-600 bg-white"
                  >
                    <option value="symptom_report">{t("symptomReport")}</option>
                    <option value="emergency_request">{t("emergencyRequest")}</option>
                    <option value="medical_history_update">{t("medicalHistoryUpdate")}</option>
                    <option value="intake">{t("intakeApplication")}</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">Asosiy Shikoyat (Chief Complaint) *</label>
                  <input
                    type="text"
                    value={chiefComplaint}
                    onChange={(e) => setChiefComplaint(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-xl p-3 outline-none focus:border-emerald-600"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">Simptomlar va Kasallik Belgilari (Tafsilotlar)</label>
                  <textarea
                    rows={3}
                    value={symptomDetails}
                    onChange={(e) => setSymptomDetails(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-xl p-3 outline-none focus:border-emerald-600"
                  />
                </div>

                {/* Vitals inputs grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block">SpO₂ (%)</label>
                    <input
                      value={spo2}
                      onChange={(e) => setSpo2(e.target.value)}
                      className="w-full text-xs border border-slate-300 rounded-lg p-2 mt-1 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block">Puls (bpm)</label>
                    <input
                      value={heartRate}
                      onChange={(e) => setHeartRate(e.target.value)}
                      className="w-full text-xs border border-slate-300 rounded-lg p-2 mt-1 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block">Qon bosimi (mmHg)</label>
                    <input
                      value={bp}
                      onChange={(e) => setBp(e.target.value)}
                      className="w-full text-xs border border-slate-300 rounded-lg p-2 mt-1 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block">Harorat (°C)</label>
                    <input
                      value={tempC}
                      onChange={(e) => setTempC(e.target.value)}
                      className="w-full text-xs border border-slate-300 rounded-lg p-2 mt-1 bg-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={!isPatientAuthorized}
                    className="w-full md:w-auto py-3.5 px-8 bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-md transition cursor-pointer flex items-center justify-center gap-2.5"
                  >
                    <DispatchLauncherIcon className="w-7 h-7 shrink-0" />
                    <span>{t("submitApplicationBtn")}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: REQUEST TRACKER PIPELINE */}
          {activeTab === "request_tracker" && (
            <div className="p-6 space-y-6">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900">📊 {t("requestTrackerTab")}</h3>
                <p className="text-xs text-slate-500 m-0">
                  Bemor arizalarining real vaqtdagi bosqichma-bosqich bajarilish holati.
                </p>
              </div>

              <div className="space-y-6">
                {applications.map((app) => (
                  <div key={app.id} className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div>
                        <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                          ARIZA ID: {app.id}
                        </span>
                        <b className="text-sm font-bold text-slate-900">{app.chiefComplaint}</b>
                      </div>
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-900 text-xs font-bold rounded-full w-fit">
                        Status: [{app.status.toUpperCase()}]
                      </span>
                    </div>

                    {/* 5-Stage Visual Status Pipeline */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-center text-xs font-bold">
                      <div className={`p-2.5 rounded-xl border ${app.status === "draft" ? "bg-amber-100 border-amber-300 text-amber-900" : "bg-emerald-700 text-white border-emerald-700"}`}>
                        1. {t("statusDraft")}
                      </div>
                      <div className={`p-2.5 rounded-xl border ${app.status !== "draft" ? "bg-emerald-700 text-white border-emerald-700" : "bg-slate-100 text-slate-400 border-slate-200"}`}>
                        2. {t("statusSubmitted")}
                      </div>
                      <div className={`p-2.5 rounded-xl border ${app.status === "under_review" || app.status === "dispatcher_assigned" || app.status === "resolved" ? "bg-emerald-700 text-white border-emerald-700" : "bg-slate-100 text-slate-400 border-slate-200"}`}>
                        3. {t("statusUnderReview")}
                      </div>
                      <div className={`p-2.5 rounded-xl border ${app.status === "dispatcher_assigned" || app.status === "resolved" ? "bg-emerald-700 text-white border-emerald-700" : "bg-slate-100 text-slate-400 border-slate-200"}`}>
                        4. {t("statusDispatcherAssigned")}
                      </div>
                      <div className={`p-2.5 rounded-xl border ${app.status === "resolved" ? "bg-emerald-700 text-white border-emerald-700" : "bg-slate-100 text-slate-400 border-slate-200"}`}>
                        5. {t("statusResolved")}
                      </div>
                    </div>

                    {/* Timeline Log Notes */}
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs">
                      <b className="text-slate-800 flex items-center gap-1.5 text-[11px] uppercase tracking-wider mb-1">
                        <NearestHospitalIcon className="w-4 h-4 shrink-0" />
                        <span>Bajarilish xronologiyasi va Hospital Yoʻnalishi:</span>
                      </b>
                      {app.historyNotes?.map((note, idx) => (
                        <div key={idx} className="text-slate-600 font-mono text-[11px]">
                          • {note}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: VITALS & DIAGNOSTIC HISTORY VIEWER */}
          {activeTab === "vitals_history" && (
            <div className="p-6 space-y-6">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900">🩺 {t("vitalsHistoryTitle")}</h3>
                <p className="text-xs text-slate-500 m-0">
                  Bemorning o'tmishdagi vital ko'rsatkichlari, diagnostika tasvirlari va vrach xulosalari.
                </p>
              </div>

              {/* Vitals History Table */}
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Vaqt</th>
                      <th className="p-3">SpO₂ (%)</th>
                      <th className="p-3">Puls (bpm)</th>
                      <th className="p-3">Qon Bosimi</th>
                      <th className="p-3">Harorat (°C)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {medicalRecord.vitalsHistory.map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="p-3 font-mono text-slate-600">{row.date}</td>
                        <td className="p-3 font-bold text-emerald-800">{row.spo2}%</td>
                        <td className="p-3 font-semibold">{row.heartRate} bpm</td>
                        <td className="p-3 font-semibold">{row.bp} mmHg</td>
                        <td className="p-3 font-semibold">{row.tempC} °C</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Diagnostic Files List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  🖼️ Diagnostik Hujjatlar va EKG Sheets
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {medicalRecord.diagnosticAssets.map((asset) => (
                    <div
                      key={asset.id}
                      className="p-3.5 bg-slate-900 text-white rounded-xl border border-slate-700 flex items-center justify-between cursor-pointer hover:border-emerald-500 transition"
                      onClick={() => {
                        setImageSrc(asset.url);
                        setImageTitle(asset.name);
                        setImageViewerOpen(true);
                      }}
                    >
                      <div>
                        <b className="text-xs font-bold text-emerald-400 block">{asset.name}</b>
                        <span className="text-[10px] text-slate-400">{asset.date}</span>
                      </div>
                      <span className="text-xs font-bold bg-emerald-950 text-emerald-300 px-2 py-1 rounded">
                        🔎 Ko'rish
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Doctor Consultation Notes */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  👨‍⚕️ {t("consultationNotesTitle")}
                </h4>
                {medicalRecord.consultationNotes.map((note, idx) => (
                  <div key={idx} className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <b className="font-bold text-emerald-950">{note.doctorName}</b>
                      <span className="text-[10px] text-slate-500 font-mono">{note.date}</span>
                    </div>
                    <p className="text-slate-800 leading-relaxed m-0 font-medium">{note.note}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* HD Diagnostic Image Viewer Modal */}
      <ImageViewerModal
        isOpen={imageViewerOpen}
        onClose={() => setImageViewerOpen(false)}
        imageSrc={imageSrc}
        imageTitle={imageTitle}
      />
    </main>
  );
}

"use client";
/* eslint-disable react/no-unescaped-entities, jsx-a11y/label-has-associated-control */

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DemoRoleLink } from "./DemoRoleLink";
import { TomirLogo } from "./TomirLogo";
import { UzbekPatternSvg } from "./UzbekPatternSvg";
import { CinematicUzbekistanMap } from "./CinematicUzbekistanMap";

type Triage = "routine" | "priority" | "urgent" | "emergency";
type Case = {
  id: string;
  code: string;
  name: string;
  age: number;
  sex: string;
  village: string;
  complaint: string;
  onset: string;
  status: string;
  triage: Triage;
  vitals: { label: string; value: string; warning?: boolean }[];
  assessment?: string;
  redFlags: string[];
  reviewed?: boolean;
  referred?: boolean;
};

const seedCases: Case[] = [
  {
    id: "1",
    code: "QM-2608-014",
    name: "Tomir",
    age: 67,
    sex: "Ayol",
    village: "Urgut tumani, G'us",
    complaint: "Nafas qisishi va ko'krakda bosim",
    onset: "Bugun ertalab, jismoniy harakatdan keyin",
    status: "AI ko'rib chiqish kutilmoqda",
    triage: "urgent",
    redFlags: ["SpO₂ 91%", "Ko'krakda bosim"],
    vitals: [
      { label: "Qon bosimi", value: "168/96 mmHg", warning: true },
      { label: "SpO₂", value: "91%", warning: true },
      { label: "Yurak urishi", value: "104 bpm", warning: true },
      { label: "Harorat", value: "37.4 °C" },
    ],
  },
  {
    id: "2",
    code: "QM-2608-013",
    name: "Anvar Rahimov",
    age: 42,
    sex: "Erkak",
    village: "Payariq, Chelak",
    complaint: "Uch kundan beri isitma va yo'tal",
    onset: "3 kun oldin",
    status: "Markaziy ko'rib chiqishda",
    triage: "priority",
    redFlags: [],
    vitals: [
      { label: "Qon bosimi", value: "128/82 mmHg" },
      { label: "SpO₂", value: "95%" },
      { label: "Yurak urishi", value: "92 bpm" },
      { label: "Harorat", value: "38.2 °C", warning: true },
    ],
  },
  {
    id: "3",
    code: "QM-2608-011",
    name: "Malika Usmonova",
    age: 29,
    sex: "Ayol",
    village: "Nurobod, Sazag'on",
    complaint: "Doimiy bosh og'rig'i",
    onset: "2 hafta oldin",
    status: "Klinik qaror tasdiqlangan",
    triage: "routine",
    redFlags: [],
    reviewed: true,
    vitals: [
      { label: "Qon bosimi", value: "118/76 mmHg" },
      { label: "SpO₂", value: "98%" },
      { label: "Yurak urishi", value: "74 bpm" },
      { label: "Harorat", value: "36.7 °C" },
    ],
  },
];

import { useLanguage } from "@/lib/i18n";

export function ClinicDashboard() {
  const router = useRouter();
  const { language, setLanguage, t } = useLanguage();
  const enableDemoPrefill =
    process.env.NEXT_PUBLIC_ENABLE_DEMO_PREFILL === "true" ||
    process.env.NODE_ENV !== "production";
  const [cases, setCases] = useState(seedCases);
  const [selected, setSelected] = useState("1");
  const [modal, setModal] = useState(false);
  const [toast, setToast] = useState("");
  const [processing, setProcessing] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [authError, setAuthError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const active = cases.find((item) => item.id === selected) ?? cases[0];
  const urgent = useMemo(
    () =>
      cases.filter(
        (item) => item.triage === "urgent" || item.triage === "emergency",
      ).length,
    [cases],
  );
  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
  }
  function createCase(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const newCase: Case = {
      id: crypto.randomUUID(),
      code: `QM-2608-${String(cases.length + 15).padStart(3, "0")}`,
      name: String(data.get("name")),
      age: Number(data.get("age")),
      sex: String(data.get("sex")),
      village: String(data.get("village")),
      complaint: String(data.get("complaint")),
      onset: String(data.get("onset")),
      status: "AI baholashga tayyor",
      triage: "routine",
      redFlags: [],
      vitals: [
        { label: "Qon bosimi", value: `${data.get("bp")} mmHg` },
        { label: "SpO₂", value: `${data.get("spo2")}%` },
        { label: "Yurak urishi", value: `${data.get("pulse")} bpm` },
        { label: "Harorat", value: `${data.get("temp")} °C` },
      ],
    };
    setCases([newCase, ...cases]);
    setSelected(newCase.id);
    setModal(false);
    notify("Sintetik demo bemor tashrifi yaratildi");
  }
  function generate() {
    setProcessing(true);
    window.setTimeout(() => {
      setCases((all) =>
        all.map((item) =>
          item.id === active.id
            ? {
                ...item,
                assessment:
                  "O'lchangan SpO₂ pastligi, taxikardiya va ko'krakdagi bosim yurak-o'pka sabablari bo'yicha shoshilinch klinik baholashni talab qiladi. Kislorod holatini qayta tekshiring, 12-kanalli EKG oling va hududiy shifokor bilan darhol bog'laning.",
                status: "Klinik ko'rib chiqish talab qilinadi",
                triage: item.redFlags.length ? "urgent" : "priority",
              }
            : item,
        ),
      );
      setProcessing(false);
      notify("Dastlabki AI baholash yaratildi — klinisyen tasdig'i shart");
    }, 900);
  }
  function review() {
    setCases((all) =>
      all.map((item) =>
        item.id === active.id
          ? {
              ...item,
              reviewed: true,
              status: "Klinisyen tomonidan tasdiqlangan",
            }
          : item,
      ),
    );
    notify("Klinik qaror qayd etildi");
  }
  function refer() {
    setCases((all) =>
      all.map((item) =>
        item.id === active.id
          ? { ...item, referred: true, status: "Yo'llanma kutilmoqda" }
          : item,
      ),
    );
    notify("Toshkent markaziga yo'llanma yaratildi");
  }
  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: data.get("email"),
        password: data.get("password"),
      }),
    });
    if (response.ok) {
      setAuthError("");
      router.push("/mobile");
      return;
    }
    setAuthError(language === "uz" ? "Demo email yoki parol noto'g'ri" : "Invalid demo login credentials");
  }

  if (!signedIn) {
    return (
      <main className="min-h-screen bg-navy-950 text-white flex flex-col relative overflow-hidden font-sans">
        {/* Background Uzbek Islimi Geometry Ornament */}
        <UzbekPatternSvg className="absolute inset-0 w-full h-full text-emerald-400 opacity-5" />

        {/* Top Header Bar */}
        <header className="relative z-20 px-6 py-4 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md flex items-center justify-between">
          <TomirLogo variant="glass" size="md" />

          <div className="flex items-center gap-3">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as "uz" | "en" | "ru")}
              className="px-3 py-1.5 bg-slate-800 text-white text-xs rounded-lg border border-slate-700 font-medium shadow-xs cursor-pointer"
            >
              <option value="uz">O'zbekcha</option>
              <option value="en">English</option>
              <option value="ru">Русский</option>
            </select>
          </div>
        </header>

        {/* Hero Grid Container */}
        <div className="relative z-10 max-w-7xl mx-auto w-full p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 my-auto">
          {/* Left Narrative Hero & Interactive Canvas Map */}
          <section className="lg:col-span-7 flex flex-col justify-between space-y-6">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 mb-3">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                {t("landingKicker")}
              </span>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif font-extrabold text-white leading-tight mb-3">
                {t("landingTitle")}
              </h1>
              <p className="text-slate-300 text-sm md:text-base leading-relaxed max-w-xl">
                {t("landingSubtitle")}
              </p>
            </div>

            {/* Interactive 3D/Canvas Uzbekistan Map */}
            <div className="w-full h-80 lg:h-96">
              <CinematicUzbekistanMap language={language} />
            </div>
          </section>

          {/* Right Role Authorization Portal */}
          <section className="lg:col-span-5 flex flex-col space-y-6">
            <div className="auth-card bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl backdrop-blur-md">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
                  🔒 AUTHENTICATED WORKSPACES (4 ROLES)
                </span>
                <span className="text-[11px] text-slate-400 font-mono">Tomir RBAC v2.5</span>
              </div>

              <h2 className="text-xl font-bold text-white mb-1">
                {t("chooseWorkspace")}
              </h2>
              <p className="text-slate-400 text-xs mb-5">
                {language === "uz"
                  ? "Tizimga kirish uchun oʻzingizga ajratilgan tibbiy rolni tanlang:"
                  : "Select your assigned clinical workspace role to enter:"}
              </p>

              <div className="space-y-2.5 mb-6">
                <DemoRoleLink workspace="specialist" className="role-shortcut-card">
                  <div className="role-icon-circle">🛡️</div>
                  <div>
                    <b>{language === "uz" ? "Shifokor Ish Maydoni (Doctor)" : "Doctor Workspace"}</b>
                    <span>{language === "uz" ? "Regional vrachlik ko'rigi va klinik qarorlar" : "Regional clinician review & decision support"}</span>
                  </div>
                </DemoRoleLink>

                <DemoRoleLink workspace="mobile_nurse" className="role-shortcut-card">
                  <div className="role-icon-circle">🩺</div>
                  <div>
                    <b>{language === "uz" ? "Hamshira Ish Maydoni (Nurse)" : "Nurse Workspace"}</b>
                    <span>{language === "uz" ? "Mobil klinika oflayn ko'riklari va ekspress tahlillar" : "Mobile clinic offline intake & point-of-care labs"}</span>
                  </div>
                </DemoRoleLink>

                <DemoRoleLink workspace="dispatcher" className="role-shortcut-card">
                  <div className="role-icon-circle">🏢</div>
                  <div>
                    <b>{language === "uz" ? "Dispetcher Ish Maydoni (Dispatch)" : "Dispatch Workspace"}</b>
                    <span>{language === "uz" ? "Tez tibbiy yordam marshrutlari va logistika" : "Emergency vehicle logistics & spatial radar"}</span>
                  </div>
                </DemoRoleLink>

                <DemoRoleLink workspace="patient" className="role-shortcut-card">
                  <div className="role-icon-circle">📱</div>
                  <div>
                    <b>{language === "uz" ? "Bemor Portali (Patient)" : "Patient Portal"}</b>
                    <span>{language === "uz" ? "Tibbiy karta tarixi va masofaviy arizalar" : "Medical records history & remote applications"}</span>
                  </div>
                </DemoRoleLink>
              </div>
            </div>

            <form onSubmit={signIn} className="demo-credentials-box">
              <div className="flex items-center justify-between text-xs mb-3">
                <span className="font-bold text-emerald-900">{t("conventionalLogin")}</span>
                {enableDemoPrefill ? (
                  <span className="text-emerald-700 font-mono text-[11px]">tomir@tomir.demo · demo2026</span>
                ) : (
                  <span className="text-amber-800 font-mono text-[10px] bg-amber-100 px-2 py-0.5 rounded">
                    {language === "uz" ? "SANOAT MUHITI · PREFILL OʻCHIRILGAN" : "PROD MODE · PREFILL DISABLED"}
                  </span>
                )}
              </div>

              <div className="field mt-0">
                <label htmlFor="email">{t("emailAddress")}</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  defaultValue={enableDemoPrefill ? "tomir@tomir.demo" : ""}
                />
              </div>

              <div className="field">
                <label htmlFor="password">{t("password")}</label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    defaultValue={enableDemoPrefill ? "demo2026" : ""}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-slate-800 border-0 bg-transparent text-sm cursor-pointer min-h-0"
                    aria-label={showPassword ? (language === "uz" ? "Parolni berkitish" : "Hide password") : (language === "uz" ? "Parolni ko'rsatish" : "Show password")}
                  >
                    {showPassword ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              {authError && (
                <div className="auth-error mt-3 text-xs" role="alert">
                  {authError}
                </div>
              )}

              <button type="submit" className="btn-primary-dark cursor-pointer mt-4">
                {t("signIn")}
              </button>
              <p className="text-[11px] text-center text-slate-500 mt-3 mb-0">
                {t("demoSessionFoot")}
              </p>
            </form>
          </section>
        </div>
      </main>
    );
  }
  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">+</div>
          <span>Tomir AI</span>
        </div>
        <div className="clinic-info">
          <div className="clinic-label">Faol klinika</div>
          <div className="clinic-name">
            Mobile Clinic 01
            <br />
            Samarqand viloyati
          </div>
        </div>
        <nav className="nav" aria-label="Asosiy">
          <button className="active">
            ▦ <span>Bemorlar navbati</span>
          </button>
          <button
            onClick={() =>
              notify("Yo'llanmalar moduli demo navbatidan ochiladi")
            }
          >
            ↗ <span>Yo'llanmalar</span>
          </button>
          <button
            onClick={() =>
              notify("Sinxronizatsiya holati: barcha yozuvlar yuborilgan")
            }
          >
            ⇄ <span>Sinxronizatsiya</span>
          </button>
          <button onClick={() => notify("Hisobotlar keyingi bosqichda mavjud")}>
            ▥ <span>Hisobotlar · mavjud emas</span>
          </button>
        </nav>
        <button
          className="user-card user-button"
          onClick={() => setSignedIn(false)}
          aria-label="Tizimdan chiqish"
        >
          <div className="avatar">NM</div>
          <div>
            <strong>Nodira M.</strong>
            <div className="meta" style={{ color: "#a9c9c2" }}>
              Chiqish
            </div>
          </div>
        </button>
      </aside>
      <main className="main">
        <header className="topbar">
          <h1>Klinik ish maydoni</h1>
          <div className="status">
            <i className="dot" />
            <span>Demo rejimi · sinxronlangan</span>
          </div>
        </header>
        <div className="content">
          <section className="hero">
            <div>
              <div className="eyebrow">Bugungi navbat · 10 avgust 2026</div>
              <h2>Assalomu alaykum, Nodira</h2>
              <p>
                Masofaviy klinik ko'rib chiqish uchun bemor holatlarini
                tayyorlang.
              </p>
            </div>
            <button className="btn primary" onClick={() => setModal(true)}>
              + Yangi bemor tashrifi
            </button>
          </section>
          <div className="grid">
            <section className="card">
              <div className="card-head">
                <h3>Faol bemorlar</h3>
                <span className="meta">{cases.length} ta holat</span>
              </div>
              <div className="case-list">
                {cases.map((item) => (
                  <button
                    key={item.id}
                    className={`case ${selected === item.id ? "selected" : ""}`}
                    onClick={() => setSelected(item.id)}
                  >
                    <div className="patient">
                      <div className="avatar">
                        {item.name
                          .split(" ")
                          .map((x) => x[0])
                          .join("")}
                      </div>
                      <div>
                        <strong>{item.name}</strong>
                        <div className="meta">
                          {item.code} · {item.village}
                        </div>
                        <div className="meta">{item.complaint}</div>
                      </div>
                    </div>
                    <span className={`badge ${item.triage}`}>
                      {item.triage}
                    </span>
                  </button>
                ))}
              </div>
            </section>
            <aside className="card">
              <div className="card-head">
                <h3>Bugungi ko'rsatkichlar</h3>
                <span className="synthetic">DEMO</span>
              </div>
              <div className="metrics">
                <div className="metric">
                  <b>{cases.length}</b>
                  <span>Bemor tashrifi</span>
                </div>
                <div className="metric">
                  <b>{urgent}</b>
                  <span>Shoshilinch</span>
                </div>
                <div className="metric">
                  <b>{cases.filter((x) => x.reviewed).length}</b>
                  <span>Ko'rib chiqilgan</span>
                </div>
                <div className="metric">
                  <b>{cases.filter((x) => x.referred).length}</b>
                  <span>Yo'llanma</span>
                </div>
              </div>
              <div className="queue">
                <h4>Markaz bilan aloqa</h4>
                <div className="queue-item">
                  <span>Tashkent Central Review Center</span>
                  <b style={{ color: "#268267" }}>Onlayn</b>
                </div>
                <div className="queue-item">
                  <span>Oxirgi sinxronizatsiya</span>
                  <b>Hozirgina</b>
                </div>
              </div>
            </aside>
          </div>
          <section className="card" style={{ marginTop: 20 }}>
            <div className="card-head">
              <div>
                <h3>{active.name}</h3>
                <div className="meta">
                  {active.code} · {active.age} yosh · {active.sex}
                </div>
              </div>
              <span className="synthetic">SINTETIK BEMOR</span>
            </div>
            <div className="detail">
              <div className="facts">
                <div className="fact">
                  <span>Asosiy shikoyat</span>
                  <strong>{active.complaint}</strong>
                </div>
                <div className="fact">
                  <span>Boshlanishi</span>
                  <strong>{active.onset}</strong>
                </div>
                <div className="fact">
                  <span>Holat</span>
                  <strong>{active.status}</strong>
                </div>
              </div>
              <div className="section-title">Hayotiy ko'rsatkichlar</div>
              <div className="vitals">
                {active.vitals.map((v) => (
                  <div
                    className={`vital ${v.warning ? "warn" : ""}`}
                    key={v.label}
                  >
                    <small>{v.label}</small>
                    <b>{v.value}</b>
                  </div>
                ))}
              </div>
              {active.redFlags.length > 0 && (
                <div className="assessment">
                  <h4>⚠ Qizil bayroqlar</h4>
                  <p>{active.redFlags.join(" · ")}</p>
                </div>
              )}
              {active.assessment && (
                <div className="assessment">
                  <h4>Dastlabki AI klinik xulosasi</h4>
                  <p>{active.assessment}</p>
                  <div className="warning">
                    AI shifokor emas. Har bir natija klinisyen tomonidan ko'rib
                    chiqilishi va tasdiqlanishi shart.
                  </div>
                </div>
              )}
              <div className="actions">
                <button
                  className="btn primary"
                  disabled={processing || Boolean(active.assessment)}
                  onClick={generate}
                >
                  {processing
                    ? "Tahlil qilinmoqda…"
                    : "✦ Dastlabki AI baholashni yaratish"}
                </button>
                <button
                  className="btn"
                  disabled={!active.assessment || active.reviewed}
                  onClick={review}
                >
                  ✓ Klinisyen sifatida tasdiqlash
                </button>
                <button
                  className="btn"
                  disabled={!active.reviewed || active.referred}
                  onClick={refer}
                >
                  ↗ Yo'llanma yaratish
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>
      {modal && (
        <div
          className="modal"
          role="dialog"
          aria-modal="true"
          aria-label="Yangi tashrif"
        >
          <form className="modal-panel" onSubmit={createCase}>
            <h3>Yangi bemor tashrifi</h3>
            <p>
              Faqat sintetik demo ma'lumotlaridan foydalaning. Diagnostik
              yuborishdan oldin rozilik talab qilinadi.
            </p>
            <div className="form-grid">
              <div className="field">
                <label>To'liq ism</label>
                <input name="name" required defaultValue="Shahnoza Aliyeva" />
              </div>
              <div className="field">
                <label>Yosh</label>
                <input
                  name="age"
                  type="number"
                  min="0"
                  max="120"
                  required
                  defaultValue="54"
                />
              </div>
              <div className="field">
                <label>Jinsi</label>
                <select name="sex">
                  <option>Ayol</option>
                  <option>Erkak</option>
                </select>
              </div>
              <div className="field">
                <label>Qishloq / tuman</label>
                <input
                  name="village"
                  required
                  defaultValue="Jomboy, Dehqonobod"
                />
              </div>
              <div className="field full">
                <label>Asosiy shikoyat</label>
                <textarea
                  name="complaint"
                  required
                  defaultValue="Bosh aylanishi va holsizlik"
                />
              </div>
              <div className="field">
                <label>Boshlanishi</label>
                <input name="onset" required defaultValue="Kecha kechqurun" />
              </div>
              <div className="field">
                <label>Qon bosimi (mmHg)</label>
                <input name="bp" required defaultValue="146/88" />
              </div>
              <div className="field">
                <label>SpO₂ (%)</label>
                <input name="spo2" type="number" required defaultValue="97" />
              </div>
              <div className="field">
                <label>Yurak urishi (bpm)</label>
                <input name="pulse" type="number" required defaultValue="88" />
              </div>
              <div className="field">
                <label>Harorat (°C)</label>
                <input
                  name="temp"
                  type="number"
                  step="0.1"
                  required
                  defaultValue="36.8"
                />
              </div>
              <label className="consent field full">
                <input type="checkbox" required />{" "}
                <span>
                  Bu sintetik, klinik bo'lmagan demo muhit ekanini tushunaman va
                  ma'lumotlarni dastlabki qaror yordami uchun yuborishga
                  roziman.
                </span>
              </label>
            </div>
            <div className="actions" style={{ justifyContent: "flex-end" }}>
              <button
                type="button"
                className="btn"
                onClick={() => setModal(false)}
              >
                Bekor qilish
              </button>
              <button className="btn primary">Tashrifni yaratish</button>
            </div>
          </form>
        </div>
      )}
      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </div>
  );
}

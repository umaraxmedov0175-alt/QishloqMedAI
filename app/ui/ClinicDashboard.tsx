"use client";
/* eslint-disable react/no-unescaped-entities, jsx-a11y/label-has-associated-control */

import { FormEvent, useMemo, useState } from "react";
import { DemoRoleLink } from "./DemoRoleLink";

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
    name: "Dilnoza Karimova",
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

export function ClinicDashboard() {
  const [cases, setCases] = useState(seedCases);
  const [selected, setSelected] = useState("1");
  const [modal, setModal] = useState(false);
  const [toast, setToast] = useState("");
  const [processing, setProcessing] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [authError, setAuthError] = useState("");
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
      window.location.assign("/mobile");
      return;
    }
    setAuthError("Demo email yoki parol noto'g'ri");
  }
  if (!signedIn) {
    return (
      <main className="auth-shell">
        <section className="auth-story">
          <div className="brand">
            <div className="brand-mark">+</div>
            <span>QishloqMed AI</span>
          </div>
          <div>
            <span className="auth-kicker">Mobile diagnostic network</span>
            <h1>Specialist diagnostics, wherever the patient lives.</h1>
            <p>
              Offline-first mobile clinics connect to AI-assisted triage and
              specialist verification in Tashkent.
            </p>
            <div className="architecture-steps">
              <span>1 · Mobile examines</span>
              <span>2 · Diagnostics sync</span>
              <span>3 · AI prioritizes</span>
              <span>4 · Specialist verifies</span>
            </div>
          </div>
          <div className="auth-note">
            AI provides preliminary decision support only. A clinician always
            makes the final decision.
          </div>
        </section>
        <section className="auth-panel">
          <form className="auth-card" onSubmit={signIn}>
            <span className="synthetic">SYNTHETIC DEMO DATA</span>
            <h2>Choose a workspace</h2>
            <p>
              Explore the complete workflow by role, or use conventional staff
              sign-in.
            </p>
            <div className="role-shortcuts">
              <DemoRoleLink workspace="mobile_nurse">
                <b>Enter as Mobile Nurse</b>
                <span>Offline intake and synchronization</span>
              </DemoRoleLink>
              <DemoRoleLink workspace="specialist">
                <b>Enter as Tashkent Specialist</b>
                <span>Evidence-first clinical review</span>
              </DemoRoleLink>
              <DemoRoleLink workspace="dispatcher">
                <b>Enter as Dispatcher</b>
                <span>Referrals, routes, and fleet</span>
              </DemoRoleLink>
            </div>
            <div className="demo-credentials">
              <b>Conventional demo login</b>
              <span>nurse@qishloqmed.demo · demo2026</span>
            </div>
            <div className="field">
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                defaultValue="nurse@qishloqmed.demo"
              />
            </div>
            <div className="field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                defaultValue="demo2026"
              />
            </div>
            {authError && (
              <div className="auth-error" role="alert">
                {authError}
              </div>
            )}
            <button className="btn primary auth-submit">Sign in</button>
            <p className="auth-foot">
              Demo sessions use HttpOnly role cookies and server route guards.
              Production still requires configured Supabase Auth and RLS.
            </p>
          </form>
        </section>
      </main>
    );
  }
  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">+</div>
          <span>QishloqMed AI</span>
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

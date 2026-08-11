"use client";
/* eslint-disable @next/next/no-html-link-for-pages, react/no-unescaped-entities */
import { FormEvent, useEffect, useState } from "react";
import { DEMO_CASES } from "@/lib/demo-data";
import { DemoRoleLink } from "@/app/ui/DemoRoleLink";
import {
  enqueueOfflineAction,
  listQueueItems,
  pendingQueueCount,
  resetOfflineQueue,
  synchronizeQueue,
  type OfflineQueueItem,
} from "@/lib/offline-queue";

import { useLanguage } from "@/lib/i18n";

type NetState =
  | "online"
  | "weak"
  | "offline"
  | "synchronizing"
  | "complete"
  | "error";

const goldenDraft = {
  patientCode: "QM-2027-0042",
  fullName: "Dilnoza Karimova",
  age: "67",
  sex: "Ayol",
  consent: "recorded",
  complaint: "Nafas qisishi va ko'krakda bosim",
  history: "Simptomlar bugun ertalab, jismoniy harakatdan keyin boshlangan.",
  spo2: "89",
  pulse: "108",
  bp: "168/96",
  temp: "37.4",
};

export function MobileWorkspace() {
  const { language, setLanguage, t } = useLanguage();
  const [network, setNetwork] = useState<NetState>("offline");
  const [pending, setPending] = useState(0);
  const [queue, setQueue] = useState<OfflineQueueItem[]>([]);
  const [showQueue, setShowQueue] = useState(false);
  const [step, setStep] = useState(0);
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState({ ...goldenDraft });
  const [labs, setLabs] = useState([
    { name: "Hemoglobin", value: "", unit: "g/dL" },
  ]);
  const [file, setFile] = useState<{
    name: string;
    size: string;
    status: string;
    valid: boolean;
  } | null>(null);
  const [rawFile, setRawFile] = useState<File | null>(null);

  const steps = [
    t("step1Consent"),
    t("step2Demographics"),
    t("step3Symptoms"),
    t("step4Vitals"),
    t("step5Labs"),
    t("step6Diagnostics"),
    t("step7Review"),
  ];

  async function refresh() {
    setPending(await pendingQueueCount());
    setQueue(await listQueueItems());
  }

  useEffect(() => {
    queueMicrotask(() => {
      setNetwork(navigator.onLine ? "online" : "offline");
      void refresh();
    });
    const on = () => setNetwork("online"),
      off = () => setNetwork("offline");
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    const data = { ...draft };
    if (!data.patientCode.trim() || !data.fullName.trim() || !data.age.trim()) {
      setNotice(t("valPatientRequired"));
      setStep(0);
      return;
    }
    if (data.consent !== "recorded") {
      setNotice(t("valConsentRequired"));
      setStep(1);
      return;
    }
    if (!data.complaint.trim()) {
      setNotice(t("valComplaintRequired"));
      setStep(2);
      return;
    }
    if (
      [data.spo2, data.pulse, data.bp, data.temp].some((value) => !value.trim())
    ) {
      setNotice(t("valVitalsRequired"));
      setStep(3);
      return;
    }
    if (labs.some((lab) => !lab.name.trim() || !lab.unit.trim())) {
      setNotice(t("valLabsRequired"));
      setStep(4);
      return;
    }
    if (file && !file.valid) {
      setNotice(t("valInvalidFile"));
      setStep(4);
      return;
    }

    setSaving(true);
    const encounterKey = `encounter:${data.patientCode}:${Date.now()}`;
    try {
      await enqueueOfflineAction(
        "patient",
        { code: data.patientCode, name: data.fullName },
        `patient:${data.patientCode}`,
      );
      await enqueueOfflineAction(
        "encounter",
        { ...data, labs, file },
        encounterKey,
      );
      if (file)
        await enqueueOfflineAction(
          "diagnostic_metadata",
          { encounterKey, ...file },
          `asset-meta:${encounterKey}`,
        );
      if (file && rawFile)
        await enqueueOfflineAction(
          "diagnostic_binary",
          {
            encounterKey,
            file: rawFile,
            filename: file.name,
            mimeType: rawFile.type,
          },
          `asset-binary:${encounterKey}`,
        );
      setNotice(t("caseSavedOffline"));
      setStep(6);
      await refresh();
    } catch {
      setNotice(t("localSaveFailed"));
    } finally {
      setSaving(false);
    }
  }

  async function sync() {
    if (network === "offline")
      return setNotice(t("noConnectionQueued"));
    setNetwork("synchronizing");
    await synchronizeQueue(async (item) => {
      let response: Response;
      if (item.entity === "diagnostic_binary") {
        const payload = item.payload as { file: File };
        const form = new FormData();
        form.set("idempotencyKey", item.idempotencyKey);
        form.set("file", payload.file);
        response = await fetch("/api/sync/binary", {
          method: "POST",
          body: form,
        });
      } else {
        response = await fetch("/api/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            entity: item.entity,
            idempotencyKey: item.idempotencyKey,
            payload: item.payload,
          }),
        });
      }
      if (!response.ok) {
        throw new Error(`Server rejected sync (${response.status})`);
      }
      const result = (await response.json()) as { serverId: string };
      return { serverId: result.serverId };
    });
    const after = await listQueueItems();
    await refresh();
    if (after.some((item) => item.status === "failed")) {
      setNetwork("error");
      setNotice(t("syncFailedRetry"));
      return;
    }
    setNetwork("complete");
    setNotice(t("syncAcknowledged"));
    window.setTimeout(() => setNetwork("online"), 1800);
  }

  function chooseFile(input: HTMLInputElement) {
    const selected = input.files?.[0];
    if (!selected) return;
    const supported = ["image/jpeg", "image/png"].includes(selected.type);
    const tooLarge = selected.size > 10 * 1024 * 1024;
    const quality = !supported
      ? t("unsupportedFileType")
      : tooLarge
        ? t("fileTooLarge")
        : selected.size < 20_000
          ? t("smallImageWarning")
          : t("basicChecksPassed");
    setFile({
      name: selected.name.replace(/[^a-zA-Z0-9._-]/g, "_"),
      size: `${(selected.size / 1024 / 1024).toFixed(2)} MB`,
      status: quality,
      valid: supported && !tooLarge,
    });
    setRawFile(supported && !tooLarge ? selected : null);
  }

  return (
    <main className="min-h-screen bg-[#f6f3ea] text-[#2b2621]">
      <header className="h-16 px-6 bg-[#063c32] text-white flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-4">
          <a className="flex items-center gap-2 font-bold text-lg text-white no-underline" href="/">
            <span className="w-7 h-7 rounded-md bg-emerald-500/20 flex items-center justify-center text-sm">+</span>
            <span>QishloqMed AI</span>
          </a>
        </div>

        <div className="flex items-center gap-4">
          <div className={`status-pill ${network === "offline" || network === "error" ? "offline" : "online"}`}>
            <span className="w-2 h-2 rounded-full bg-current"></span>
            <span>
              {network === "offline"
                ? "🟡 Oflayn — Lokal saqlanmoqda"
                : network === "synchronizing"
                  ? "🔄 Sinxronlashtirilmoqda..."
                  : "🟢 Onlayn — Server bog'langan"}
            </span>
          </div>

          <button
            className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white text-xs font-medium rounded-full border border-white/20 transition cursor-pointer"
            onClick={() => setShowQueue(!showQueue)}
          >
            {t("pendingSyncPill")}: {pending}
          </button>

          <select
            aria-label="Language"
            value={language}
            onChange={(event) => setLanguage(event.target.value as "uz" | "en")}
            className="px-2.5 py-1 bg-emerald-950/60 text-emerald-100 text-xs rounded border border-emerald-700/50 font-medium"
          >
            <option value="uz">{"O'zbekcha"}</option>
            <option value="en">English</option>
          </select>
        </div>
      </header>

      <nav className="bg-white border-b border-slate-200 px-6 flex items-center gap-2 overflow-x-auto text-xs font-semibold">
        <a className="py-3 px-4 text-emerald-800 border-b-2 border-emerald-700 font-bold" href="/mobile">
          {t("dashboard")}
        </a>
        <a href="#patients" className="py-3 px-4 text-slate-500 hover:text-slate-900 transition">{t("patients")}</a>
        <button onClick={() => setShowQueue(true)} className="py-3 px-4 text-slate-500 hover:text-slate-900 cursor-pointer">{t("pendingSyncPill")}</button>
        <a href="#responses" className="py-3 px-4 text-slate-500 hover:text-slate-900 transition">{t("responses")}</a>
        <DemoRoleLink workspace="specialist" className="py-3 px-4 text-slate-500 hover:text-slate-900 transition">{t("specialistView")}</DemoRoleLink>
      </nav>

      <section className="max-w-[1520px] mx-auto px-6 py-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <span className="text-[11px] font-bold text-emerald-800 tracking-wider uppercase">MOBIL KLINIKA REJIMI · QISHLOQMED-01</span>
            <h1 className="text-3xl font-serif font-bold text-slate-900 mt-1 mb-1">Urgut tumani · G'us qishlog'i</h1>
            <p className="text-slate-500 text-xs">{t("todayVisits")} · 10 avgust 2026</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-semibold rounded-lg shadow-2xs transition cursor-pointer"
              onClick={() =>
                setNetwork(network === "offline" ? "online" : "offline")
              }
            >
              {network === "offline"
                ? t("restoreConnection")
                : t("simulateOffline")}
            </button>
            <button
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg shadow-2xs transition cursor-pointer disabled:opacity-50"
              onClick={sync}
              disabled={!pending || network === "offline"}
            >
              {t("syncNow")}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          {[
            ["7", t("patientsExamined")],
            [String(pending), t("pendingSyncCount")],
            ["2", t("waitingForAi")],
            ["3", t("waitingForSpecialist")],
            ["1", t("urgentResponse")],
          ].map(([n, l]) => (
            <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs" key={l}>
              <b className="text-2xl font-bold text-slate-900 block leading-tight">{n}</b>
              <span className="text-[11px] text-slate-500 font-medium">{l}</span>
            </div>
          ))}
        </div>

        {notice && (
          <div className="mb-4 p-3 bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-medium rounded-lg" role="status">
            ✓ {notice}
          </div>
        )}

        {showQueue && (
          <section className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-2xs mb-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">{t("offlineSyncQueue")}</h2>
                <p className="text-xs text-slate-500">{t("localRecordsRemain")}</p>
              </div>
              <div className="flex gap-2">
                <button
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-medium rounded-md transition cursor-pointer"
                  onClick={async () => {
                    await resetOfflineQueue();
                    setDraft({ ...goldenDraft });
                    setLabs([{ name: "Hemoglobin", value: "", unit: "g/dL" }]);
                    setFile(null);
                    setRawFile(null);
                    setStep(0);
                    setNotice(language === "uz" ? "Sintetik demo navbati xavfsiz nollandi." : "Synthetic demo queue reset safely.");
                    await refresh();
                  }}
                >
                  {t("resetDemo")}
                </button>
                <button className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-medium rounded-md transition cursor-pointer" onClick={() => setShowQueue(false)}>
                  {t("close")}
                </button>
              </div>
            </div>
            {queue.length ? (
              <div className="divide-y divide-slate-100 text-xs">
                {queue.map((item) => (
                  <div className="py-2.5 flex items-center justify-between" key={item.localId}>
                    <div>
                      <b className="font-bold text-slate-900">{item.entity.replace("_", " ")}</b>
                      <small className="block text-slate-400">
                        {item.localId.slice(0, 12)} · {item.attempts}-urinish
                      </small>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${item.status === "synced" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                      {item.status === "synced" ? t("statusCompleteText") : t("syncPending")}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-slate-400">
                {language === "uz" ? "Sinxronlashni kutayotgan yozuvlar yo'q." : "No records are waiting to synchronize."}
              </div>
            )}
          </section>
        )}

        <section className="space-y-6">
          <form className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-2xs" onSubmit={submit}>
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <span className="synthetic mb-1">{t("syntheticDemoData")}</span>
                <h2 className="text-xl font-serif font-bold text-slate-900">{t("newPatientEncounter")}</h2>
              </div>
              <button
                type="button"
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition cursor-pointer"
                onClick={() => {
                  setDraft({ ...goldenDraft });
                  setStep(3);
                  setNotice(
                    language === "uz"
                      ? "Demo bemor ma'lumotlari tezkor ko'rik uchun yuklandi."
                      : "Golden case loaded for a fast walkthrough.",
                  );
                }}
              >
                Demo namuna bemorni yuklash
              </button>
            </div>

            {/* Stepper horizontal line */}
            <div className="px-5 py-4 border-b border-slate-100 overflow-x-auto bg-slate-50/40">
              <ol className="flex items-center gap-4 min-w-[700px]">
                {steps.map((name, i) => (
                  <li
                    key={name}
                    className="flex-1 flex items-center gap-2"
                  >
                    <button
                      type="button"
                      onClick={() => setStep(i)}
                      className={`flex items-center gap-2 text-xs font-semibold cursor-pointer border-0 bg-transparent ${i === step ? "text-emerald-800 font-bold" : i < step ? "text-emerald-700" : "text-slate-400"}`}
                    >
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs border ${i === step ? "bg-emerald-700 text-white border-emerald-700" : i < step ? "bg-emerald-100 text-emerald-800 border-emerald-300" : "bg-white text-slate-400 border-slate-300"}`}>
                        {i < step ? "✓" : i + 1}
                      </span>
                      <span className="whitespace-nowrap">{i + 1}. {name}</span>
                    </button>
                    {i < steps.length - 1 && <span className="flex-1 h-[1px] bg-slate-200"></span>}
                  </li>
                ))}
              </ol>
            </div>

            <div className="p-6">
              {step === 0 && (
                <>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">{t("patientIdentity")}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="field mt-0">
                      <label htmlFor="patientCode">{t("safePatientCode")}</label>
                      <input
                        id="patientCode"
                        name="patientCode"
                        value={draft.patientCode}
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            patientCode: event.target.value,
                          }))
                        }
                        required
                      />
                    </div>
                    <div className="field mt-0">
                      <label htmlFor="fullName">{t("fullName")}</label>
                      <input
                        id="fullName"
                        name="fullName"
                        value={draft.fullName}
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            fullName: event.target.value,
                          }))
                        }
                        required
                      />
                    </div>
                    <div className="field mt-0">
                      <label htmlFor="age">{t("age")}</label>
                      <input
                        id="age"
                        name="age"
                        type="number"
                        value={draft.age}
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            age: event.target.value,
                          }))
                        }
                        required
                      />
                    </div>
                    <div className="field mt-0">
                      <label htmlFor="sex">{t("gender")}</label>
                      <select
                        id="sex"
                        name="sex"
                        value={draft.sex}
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            sex: event.target.value,
                          }))
                        }
                      >
                        <option value="Ayol">{t("female")}</option>
                        <option value="Erkak">{t("male")}</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              {step === 1 && (
                <>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">{t("step1Consent")}</h3>
                  <label className="flex items-start gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
                    <input
                      name="consent"
                      type="checkbox"
                      className="mt-1"
                      required
                      checked={draft.consent === "recorded"}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          consent: event.target.checked
                            ? "recorded"
                            : "not_recorded",
                        }))
                      }
                    />
                    <span className="text-xs text-slate-700 leading-relaxed">{t("consentDesc")}</span>
                  </label>
                </>
              )}

              {step === 2 && (
                <>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">{t("symptomsAndHistory")}</h3>
                  <div className="field mt-0">
                    <label htmlFor="complaint">{t("chiefComplaint")}</label>
                    <textarea
                      id="complaint"
                      name="complaint"
                      rows={3}
                      value={draft.complaint}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          complaint: event.target.value,
                        }))
                      }
                      required
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="history">{t("nurseNotes")}</label>
                    <textarea
                      id="history"
                      name="history"
                      rows={3}
                      value={draft.history}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          history: event.target.value,
                        }))
                      }
                    />
                  </div>
                </>
              )}

              {step === 3 && (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-serif font-bold text-slate-900 m-0">4. Vital ko'rsatkichlar</h3>
                    <span className="text-xs text-slate-500 font-medium">Barcha o'lchov birliklari ISO standartlariga mos</span>
                  </div>

                  {Number(draft.spo2) > 0 && Number(draft.spo2) < 90 && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-900 font-semibold flex items-center gap-2">
                      <span>⚠️</span>
                      <span>SpO₂ ko'rsatkichi 90% dan past ({draft.spo2}%). Kardiopulmonar shoshilinch baholash talab etiladi!</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="field mt-0">
                      <label htmlFor="spo2" className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5">🫁 Kislorod saturatsiyasi</span>
                        <span className="unit-badge">%</span>
                      </label>
                      <input
                        id="spo2"
                        name="spo2"
                        value={draft.spo2}
                        onChange={(event) =>
                          setDraft((current) => ({ ...current, spo2: event.target.value }))
                        }
                        className={Number(draft.spo2) > 0 && Number(draft.spo2) < 90 ? "border-red-400 bg-red-50/50" : ""}
                        required
                      />
                    </div>
                    <div className="field mt-0">
                      <label htmlFor="pulse" className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5">💓 Yurak urishi</span>
                        <span className="unit-badge">bpm</span>
                      </label>
                      <input
                        id="pulse"
                        name="pulse"
                        value={draft.pulse}
                        onChange={(event) =>
                          setDraft((current) => ({ ...current, pulse: event.target.value }))
                        }
                        required
                      />
                    </div>
                    <div className="field mt-0">
                      <label htmlFor="bp" className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5">⏱ Sistolik qon bosimi</span>
                        <span className="unit-badge">mmHg</span>
                      </label>
                      <input
                        id="bp"
                        name="bp"
                        value={draft.bp}
                        onChange={(event) =>
                          setDraft((current) => ({ ...current, bp: event.target.value }))
                        }
                        required
                      />
                    </div>
                    <div className="field mt-0">
                      <label htmlFor="temp" className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5">🌡️ Tana harorati</span>
                        <span className="unit-badge">°C</span>
                      </label>
                      <input
                        id="temp"
                        name="temp"
                        value={draft.temp}
                        onChange={(event) =>
                          setDraft((current) => ({ ...current, temp: event.target.value }))
                        }
                        required
                      />
                    </div>
                  </div>
                </>
              )}

              {step === 4 && (
                <>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">{t("step5Labs")}</h3>
                  <p className="text-xs text-amber-800 bg-amber-50 p-2.5 rounded border border-amber-200 mb-4">{t("referenceNote")}</p>
                  {labs.map((lab, i) => (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-3" key={i}>
                      <input
                        aria-label={t("testName")}
                        value={lab.name}
                        placeholder={t("testName")}
                        className="text-xs border border-slate-200 rounded-lg p-2.5"
                        onChange={(e) =>
                          setLabs(
                            labs.map((x, n) =>
                              n === i ? { ...x, name: e.target.value } : x,
                            ),
                          )
                        }
                      />
                      <input
                        aria-label={t("resultValue")}
                        type="number"
                        placeholder={t("resultValue")}
                        value={lab.value}
                        className="text-xs border border-slate-200 rounded-lg p-2.5"
                        onChange={(e) =>
                          setLabs(
                            labs.map((x, n) =>
                              n === i ? { ...x, value: e.target.value } : x,
                            ),
                          )
                        }
                      />
                      <input
                        aria-label={t("unit")}
                        placeholder={t("unit")}
                        value={lab.unit}
                        className="text-xs border border-slate-200 rounded-lg p-2.5"
                        onChange={(e) =>
                          setLabs(
                            labs.map((x, n) =>
                              n === i ? { ...x, unit: e.target.value } : x,
                            ),
                          )
                        }
                      />
                      <button
                        type="button"
                        className="px-3 py-2 bg-red-50 text-red-700 text-xs font-bold rounded-lg border border-red-200 hover:bg-red-100 transition cursor-pointer"
                        onClick={() => setLabs(labs.filter((_, n) => n !== i))}
                      >
                        {t("removeBeforeSubmit")}
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="px-3.5 py-1.5 bg-slate-100 text-slate-800 text-xs font-bold rounded-lg border border-slate-200 hover:bg-slate-200 transition cursor-pointer mb-4"
                    onClick={() =>
                      setLabs([...labs, { name: "", value: "", unit: "" }])
                    }
                  >
                    {t("addLabRow")}
                  </button>
                </>
              )}

              {step === 5 && (
                <>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">6. Diagnostik tasvir</h3>
                  <div className="p-6 border-2 border-dashed border-slate-300 rounded-xl text-center bg-slate-50/50">
                    <label htmlFor="xray" className="block text-xs font-bold text-slate-800 mb-2 cursor-pointer">{t("uploadImage")}</label>
                    <input
                      id="xray"
                      type="file"
                      accept="image/jpeg,image/png"
                      className="text-xs text-slate-500"
                      onChange={(e) => chooseFile(e.currentTarget)}
                    />
                    {file && (
                      <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900">
                        <b>{file.name}</b> · <span>{file.size}</span>
                      </div>
                    )}
                  </div>
                </>
              )}

              {step === 6 && (
                <>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">7. Yakuniy ko'rik va saqlash</h3>
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 space-y-3">
                    <b>{t("readyForOfflineSubmit")}</b>
                    <p className="m-0 text-emerald-800 leading-relaxed">{t("idempotencyNotice")}</p>
                    <button type="submit" className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg shadow-md transition cursor-pointer" disabled={saving}>
                      {saving ? t("savingSafely") : t("saveToDurableQueue")}
                    </button>
                  </div>
                </>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between">
              <button
                type="button"
                className="px-5 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 text-xs font-bold rounded-lg transition cursor-pointer disabled:opacity-50"
                disabled={step === 0}
                onClick={() => setStep(step - 1)}
              >
                Orqaga
              </button>
              {step < 6 && (
                <button
                  type="button"
                  className="px-6 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg shadow-xs transition cursor-pointer"
                  onClick={() => setStep(step + 1)}
                >
                  Davom etish
                </button>
              )}
            </div>
          </form>

          {/* Bottom Section Card: Recent Patients */}
          <aside className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-2xs" id="patients">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h2 className="text-lg font-serif font-bold text-slate-900">{t("recentPatients")}</h2>
                <p className="text-xs text-slate-500">{t("compactTabletView")}</p>
              </div>
            </div>
            <input
              className="w-full text-xs border border-slate-200 rounded-lg p-2.5 mb-4 outline-none focus:border-emerald-600"
              aria-label={t("searchPatients")}
              placeholder="Kodni yoki ismni qidiring"
            />
            <div className="divide-y divide-slate-100">
              {DEMO_CASES.slice(0, 5).map((c) => (
                <article key={c.code} className="py-3 flex items-center justify-between">
                  <div>
                    <b className="text-xs font-bold text-slate-900 block">{c.code}</b>
                    <span className="text-[11px] text-slate-500">
                      {c.name} · {c.village}
                    </span>
                  </div>
                  <span className={`triage-badge ${c.triage}`}>
                    {c.triage === "emergency"
                      ? "▲ FAVQULODDA (KRITIK)"
                      : c.triage === "urgent"
                        ? "■ SHOSHILINCH"
                        : c.triage === "priority"
                          ? "◆ USTUVOR"
                          : "● REJALI (ODATIY)"}
                  </span>
                </article>
              ))}
            </div>
          </aside>
        </section>
      </section>
    </main>
  );
}

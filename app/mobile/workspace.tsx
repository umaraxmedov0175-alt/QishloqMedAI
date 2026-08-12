"use client";
/* eslint-disable @next/next/no-html-link-for-pages, react/no-unescaped-entities, jsx-a11y/aria-role */
import { FormEvent, useEffect, useState } from "react";
import { DEMO_CASES } from "@/lib/demo-data";
import { RoleGuard } from "@/app/ui/RoleGuard";
import { SidebarNav } from "@/app/ui/SidebarNav";
import { MovableChatWidget } from "@/app/ui/MovableChatWidget";
import { MedAIAssistantDrawer } from "@/app/ui/MedAIAssistantDrawer";
import {
  enqueueOfflineAction,
  listQueueItems,
  pendingQueueCount,
  resetOfflineQueue,
  synchronizeQueue,
  type OfflineQueueItem,
} from "@/lib/offline-queue";

import { useLanguage } from "@/lib/i18n";
import {
  evaluateAnswers,
  getProtocol,
  type AnswerMap,
} from "@/lib/symptom-protocols/engine";
import { getAllProtocols } from "@/lib/symptom-protocols/index";
import { MobileLabBadgeIcon } from "@/app/ui/MedicalIcons";
import { CarePulse } from "@/app/ui/CarePulse";
import { analyzeOutbreakRadar } from "@/lib/outbreak-radar";

type NetState =
  | "online"
  | "weak"
  | "offline"
  | "synchronizing"
  | "complete"
  | "error";

const goldenDraft = {
  patientCode: "QM-2027-0042",
  fullName: "Tomir",
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
  const { language, t } = useLanguage();
  const [collapsed, setCollapsed] = useState(false);
  const [network, setNetwork] = useState<NetState>("offline");
  const [pending, setPending] = useState(0);
  const [queue, setQueue] = useState<OfflineQueueItem[]>([]);
  const [showQueue, setShowQueue] = useState(false);
  const [step, setStep] = useState(0);
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState({ ...goldenDraft });
  const [protocolAnswers, setProtocolAnswers] = useState<AnswerMap>({});
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

  const activeProtocol = getProtocol(draft.complaint);
  const protocolEval = activeProtocol
    ? evaluateAnswers(activeProtocol, protocolAnswers, language)
    : null;

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
    const encounterKey = `encounter:${data.patientCode}:${crypto.randomUUID()}`;
    const formattedProtocolAnswers = activeProtocol
      ? {
          protocolId: activeProtocol.id,
          answers: protocolAnswers,
          completeness: protocolEval?.completeness,
          redFlagsTriggered: protocolEval?.redFlags.map((rf) => ({
            questionId: rf.questionId,
            level: rf.level,
            source: rf.source,
          })),
        }
      : undefined;

    try {
      await enqueueOfflineAction(
        "patient",
        { code: data.patientCode, name: data.fullName },
        `patient:${data.patientCode}`,
      );
      await enqueueOfflineAction(
        "encounter",
        { ...data, labs, file, protocolAnswers: formattedProtocolAnswers },
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
    <RoleGuard requiredRole="nurse">
      <div className="min-h-screen bg-[#f6f3ea] text-[#2b2621]">
        <SidebarNav role="nurse" activePath="/mobile" onToggleCollapse={setCollapsed} />
        <main className={`transition-[margin] duration-300 ${collapsed ? "ml-16" : "ml-64"} min-h-screen overflow-y-auto`}>

      <section className="max-w-[1520px] mx-auto px-6 py-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <span className="text-[11px] font-bold text-emerald-800 tracking-wider uppercase">MOBIL KLINIKA REJIMI · TOMIR-01</span>
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

        {/* Community Nurse Field Alerts & Outbreak Intervention Section */}
        {(() => {
          const radar = analyzeOutbreakRadar();
          const confirmedTasks = radar.clusters
            .filter((c) => c.fieldInterventionTask)
            .map((c) => c.fieldInterventionTask!);
          
          if (confirmedTasks.length === 0) return null;
          
          return (
            <div className="mb-6 p-5 bg-emerald-950 text-white rounded-xl border border-emerald-700 shadow-md space-y-3">
              <div className="flex items-center justify-between border-b border-emerald-800 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🚑</span>
                  <b className="text-sm font-bold">FAOL EPIDEMIK FIELD INTERVENTION TASKING (MUTAXASSIS TASDIQLAGAN)</b>
                </div>
                <span className="px-2.5 py-0.5 rounded bg-emerald-700 text-white font-mono text-[10px] uppercase font-bold">
                  {confirmedTasks.length} ta TOPSHIRIQ
                </span>
              </div>

              {confirmedTasks.map((t) => (
                <div key={t.taskId} className="p-3.5 bg-slate-900 rounded-lg border border-emerald-800/80 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <b className="text-emerald-400 font-bold">{t.targetDistrict} · {t.targetVillage} (Task: {t.taskId})</b>
                    <span className="text-slate-400 text-[11px] font-mono">Bosh Vrach: {t.issuedBy} ({t.issuedAt})</span>
                  </div>

                  {/* Diagnostic Kit Checklist */}
                  <div className="p-2.5 bg-slate-950 rounded border border-slate-800 space-y-1">
                    <span className="text-[11px] font-bold text-amber-300 block">🧰 Mobil Diagnostik Kit Tayyorgarligi:</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px]">
                      {t.kitChecklist.map((k) => (
                        <label key={k.id} className="flex items-center gap-2 text-slate-200">
                          <input type="checkbox" defaultChecked={k.checked} className="accent-emerald-500 rounded" />
                          <span>{k.item} ({k.quantity})</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Prioritized Household Screening Tasks */}
                  <div className="text-[11px]">
                    <span className="font-bold text-sky-300 block mb-1">🏠 Birinchi Galdagi Skrining Xonadonlari:</span>
                    <div className="space-y-1">
                      {t.prioritizedHouseholds.map((hh) => (
                        <div key={hh.id} className="flex items-center justify-between p-1.5 bg-slate-950 rounded text-slate-300">
                          <span>📍 <b>{hh.address}</b> ({hh.headOfHousehold}) — {hh.patientCount} nafar bemor</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-900 text-emerald-200 font-semibold">{hh.riskFactor}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          );
        })()}

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
                {t("loadDemoPatient")}
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
                      <span className="whitespace-nowrap">{name}</span>
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
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">{t("step1Consent")}</h3>

                  {/* 1. Rozilik Gate */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">1. ROZILIK BOʻLIMI</span>
                    <p className="text-lg font-bold text-slate-900 leading-snug">
                      {t("consentDesc")}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                      <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition control-h-mobile ${draft.consent === "recorded" ? "bg-emerald-50 border-emerald-600 font-extrabold text-emerald-950" : "bg-white border-slate-300 text-slate-800"}`}>
                        <div className="w-12 h-12 flex items-center justify-center bg-white rounded-lg border border-slate-300">
                          <input
                            name="consent"
                            type="radio"
                            className="w-6 h-6 accent-emerald-700 cursor-pointer"
                            checked={draft.consent === "recorded"}
                            onChange={() => setDraft((c) => ({ ...c, consent: "recorded" }))}
                          />
                        </div>
                        <span className="text-sm font-bold">✓ Rozilik Olingan (Consent Confirmed)</span>
                      </label>

                      <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition control-h-mobile ${draft.consent === "refused" ? "bg-red-50 border-red-600 font-extrabold text-red-950" : "bg-white border-slate-300 text-slate-800"}`}>
                        <div className="w-12 h-12 flex items-center justify-center bg-white rounded-lg border border-slate-300">
                          <input
                            name="consent"
                            type="radio"
                            className="w-6 h-6 accent-red-700 cursor-pointer"
                            checked={draft.consent === "refused"}
                            onChange={() => setDraft((c) => ({ ...c, consent: "refused" }))}
                          />
                        </div>
                        <span className="text-sm font-bold">🛑 Rad Etildi (Consent Refused)</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">{t("symptomsAndHistory")}</h3>
                    <span className="text-xs text-slate-500 font-medium">Offlayn klinik protokollar mavjud</span>
                  </div>

                  {/* Quick complaint selector chips */}
                  <div className="mb-4">
                    <label className="text-xs font-semibold text-slate-700 block mb-2">{t("selectComplaint")}:</label>
                    <div className="flex flex-wrap gap-2">
                      {getAllProtocols().map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${activeProtocol?.id === p.id ? "bg-emerald-700 text-white border-emerald-700 shadow-2xs" : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"}`}
                          onClick={() => {
                            setDraft((curr) => ({ ...curr, complaint: p.label[language] }));
                          }}
                        >
                          + {p.label[language]}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="field mt-0">
                    <label htmlFor="complaint">{t("chiefComplaint")}</label>
                    <textarea
                      id="complaint"
                      name="complaint"
                      rows={2}
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

                  {/* Adaptive Clinical Protocol Section */}
                  {activeProtocol && protocolEval && (
                    <div className="mt-5 p-5 bg-emerald-50/40 border border-emerald-200/80 rounded-xl space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-200/60 pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                            <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">{t("adaptiveProtocol")}:</span>
                            <strong className="text-sm font-bold text-emerald-950">{activeProtocol.label[language]}</strong>
                          </div>
                          <span className="text-[11px] text-emerald-700 font-medium block mt-0.5">
                            {t("protocolSource")}: {activeProtocol.source}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold px-2.5 py-1 bg-white border border-emerald-300 text-emerald-900 rounded-full shadow-2xs">
                            {t("completeness")}: {protocolEval.completeness.answered}/{protocolEval.completeness.total} ({protocolEval.completeness.percentage}%)
                            {protocolEval.completeness.skipped > 0 && ` · ${protocolEval.completeness.skipped} ${t("skipped").toLowerCase()}`}
                          </span>
                        </div>
                      </div>

                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider m-0">{t("protocolQuestions")}</h4>

                      <div className="space-y-4">
                        {activeProtocol.questions.map((q) => {
                          const answerState = protocolAnswers[q.id];
                          const isSkipped = answerState?.status === "skipped";
                          const isAnswered = answerState?.status === "answered";
                          const isRedFlag = isAnswered && protocolEval.redFlags.some((rf) => rf.questionId === q.id);

                          return (
                            <div
                              key={q.id}
                              className={`p-4 rounded-xl border transition ${
                                isRedFlag
                                  ? "bg-red-50/90 border-red-300 text-red-950 shadow-2xs"
                                  : isSkipped
                                    ? "bg-slate-100/70 border-slate-300 text-slate-600"
                                    : "bg-white border-slate-200"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3 mb-2">
                                <div>
                                  <label className="text-xs font-bold text-slate-900 block leading-snug">
                                    {q.text[language]}
                                  </label>
                                  <span className="text-[10px] text-slate-500 font-mono">
                                    Manba: {q.source}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  className={`px-2.5 py-1 text-[11px] font-semibold rounded transition cursor-pointer ${
                                    isSkipped
                                      ? "bg-slate-700 text-white"
                                      : "bg-slate-200 hover:bg-slate-300 text-slate-700"
                                  }`}
                                  onClick={() => {
                                    setProtocolAnswers((prev) => ({
                                      ...prev,
                                      [q.id]: isSkipped
                                        ? { status: "unanswered" }
                                        : { status: "skipped" },
                                    }));
                                  }}
                                >
                                  {isSkipped ? `✓ ${t("skipped")}` : `↪ ${t("skipQuestion")}`}
                                </button>
                              </div>

                              {isSkipped ? (
                                <div className="text-xs font-semibold text-slate-500 italic py-1">
                                  [{t("skipped")} — klinik tahlil uchun javob kiritilmadi]
                                </div>
                              ) : (
                                <div className="mt-2">
                                  {q.type === "boolean" && (
                                    <div className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        className={`px-4 py-1.5 text-xs font-bold rounded-lg border transition cursor-pointer ${
                                          isAnswered && answerState.value === true
                                            ? "bg-emerald-700 text-white border-emerald-700"
                                            : "bg-white text-slate-800 border-slate-300 hover:bg-slate-50"
                                        }`}
                                        onClick={() => {
                                          setProtocolAnswers((prev) => ({
                                            ...prev,
                                            [q.id]: { status: "answered", value: true },
                                          }));
                                        }}
                                      >
                                        Ha / Yes
                                      </button>
                                      <button
                                        type="button"
                                        className={`px-4 py-1.5 text-xs font-bold rounded-lg border transition cursor-pointer ${
                                          isAnswered && answerState.value === false
                                            ? "bg-emerald-700 text-white border-emerald-700"
                                            : "bg-white text-slate-800 border-slate-300 hover:bg-slate-50"
                                        }`}
                                        onClick={() => {
                                          setProtocolAnswers((prev) => ({
                                            ...prev,
                                            [q.id]: { status: "answered", value: false },
                                          }));
                                        }}
                                      >
                                        Yo'q / No
                                      </button>
                                    </div>
                                  )}

                                  {q.type === "single" && q.options && (
                                    <div className="flex flex-wrap gap-2">
                                      {q.options.map((opt) => (
                                        <button
                                          key={opt.value}
                                          type="button"
                                          className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition cursor-pointer ${
                                            isAnswered && answerState.value === opt.value
                                              ? "bg-emerald-700 text-white border-emerald-700"
                                              : "bg-white text-slate-800 border-slate-300 hover:bg-slate-50"
                                          }`}
                                          onClick={() => {
                                            setProtocolAnswers((prev) => ({
                                              ...prev,
                                              [q.id]: { status: "answered", value: opt.value },
                                            }));
                                          }}
                                        >
                                          {opt[language]}
                                        </button>
                                      ))}
                                    </div>
                                  )}

                                  {q.type === "multi" && q.options && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                      {q.options.map((opt) => {
                                        const currentVals = (isAnswered && Array.isArray(answerState.value)
                                          ? answerState.value
                                          : []) as string[];
                                        const isSelected = currentVals.includes(opt.value);

                                        return (
                                          <label
                                            key={opt.value}
                                            className={`flex items-center gap-2.5 p-2 rounded-lg border text-xs font-semibold cursor-pointer transition ${
                                              isSelected
                                                ? "bg-emerald-50 border-emerald-500 text-emerald-950 font-bold"
                                                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                                            }`}
                                          >
                                            <input
                                              type="checkbox"
                                              checked={isSelected}
                                              onChange={(e) => {
                                                let updated: string[];
                                                if (e.target.checked) {
                                                  updated = opt.value === "none" ? ["none"] : [...currentVals.filter((v) => v !== "none"), opt.value];
                                                } else {
                                                  updated = currentVals.filter((v) => v !== opt.value);
                                                }
                                                setProtocolAnswers((prev) => ({
                                                  ...prev,
                                                  [q.id]: {
                                                    status: "answered",
                                                    value: updated,
                                                  },
                                                }));
                                              }}
                                            />
                                            <span>{opt[language]}</span>
                                          </label>
                                        );
                                      })}
                                    </div>
                                  )}

                                  {(q.type === "number" || q.type === "duration" || q.type === "text") && (
                                    <div className="flex items-center gap-2 max-w-xs">
                                      <input
                                        type={q.type === "number" ? "number" : "text"}
                                        value={isAnswered ? String(answerState.value) : ""}
                                        placeholder={q.text[language]}
                                        className="text-xs border border-slate-300 rounded-lg p-2 flex-1"
                                        onChange={(e) => {
                                          const rawVal = e.target.value;
                                          const val = q.type === "number" ? Number(rawVal) : rawVal;
                                          setProtocolAnswers((prev) => ({
                                            ...prev,
                                            [q.id]: { status: "answered", value: val },
                                          }));
                                        }}
                                      />
                                      {q.unit && <span className="unit-badge">{q.unit}</span>}
                                    </div>
                                  )}
                                </div>
                              )}

                              {isRedFlag && (
                                <div className="mt-2.5 p-2 bg-red-100/80 border border-red-300 rounded-lg text-xs font-bold text-red-900 flex items-center gap-1.5">
                                  <span>⚠️</span>
                                  <span>{t("redFlagDetected")}: {q.source}</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Suggested Clinical Actions Banner */}
                      {protocolEval.suggestedActions.length > 0 && (
                        <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-950 font-medium space-y-1">
                          <strong className="block font-bold text-amber-900 uppercase tracking-wide">
                            💡 {t("suggestedActions")}:
                          </strong>
                          <ul className="list-disc list-inside m-0 pl-1 space-y-0.5">
                            {protocolEval.suggestedActions.map((action, idx) => (
                              <li key={idx} className="font-semibold">{action}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="field mt-4">
                    <label htmlFor="history">{t("nurseNotes")}</label>
                    <textarea
                      id="history"
                      name="history"
                      rows={2}
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

                  {/* Wow Moment 1: Care Pulse Live Animated ECG Waveform */}
                  {(() => {
                    const [sys, dia] = (draft.bp || "120/80").split("/").map((v) => Number(v.trim()));
                    return (
                      <CarePulse
                        spo2={Number(draft.spo2) || 95}
                        heartRate={Number(draft.pulse) || 75}
                        systolicBp={sys || 120}
                        diastolicBp={dia || 80}
                        label={language === "uz" ? "Mobil Klinika Live Telemetriya Pulsi" : "Mobile Clinic Live Telemetry Pulse"}
                        className="mb-4"
                      />
                    );
                  })()}

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
                      <label htmlFor="sbp" className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5">⏱ Sistolik qon bosimi (SBP)</span>
                        <span className="unit-badge">mmHg</span>
                      </label>
                      <input
                        id="sbp"
                        name="sbp"
                        type="number"
                        placeholder="Masalan: 120"
                        value={draft.bp.split("/")[0] || ""}
                        onChange={(event) => {
                          const dbp = draft.bp.split("/")[1] || "80";
                          setDraft((current) => ({ ...current, bp: `${event.target.value}/${dbp}` }));
                        }}
                        className={
                          Number(draft.bp.split("/")[0]) > 0 &&
                          (Number(draft.bp.split("/")[0]) < 70 || Number(draft.bp.split("/")[0]) > 220)
                            ? "border-red-500 bg-red-50 focus:ring-2 focus:ring-red-500 font-bold"
                            : ""
                        }
                        required
                      />
                      {Number(draft.bp.split("/")[0]) > 0 &&
                        (Number(draft.bp.split("/")[0]) < 70 || Number(draft.bp.split("/")[0]) > 220) && (
                          <small className="text-red-700 font-bold text-[10px] block mt-1">
                            ⚠️ SBP me'yordan tashqarida (70-220 mmHg)
                          </small>
                        )}
                    </div>
                    <div className="field mt-0">
                      <label htmlFor="dbp" className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5">⏱ Diastolik qon bosimi (DBP)</span>
                        <span className="unit-badge">mmHg</span>
                      </label>
                      <input
                        id="dbp"
                        name="dbp"
                        type="number"
                        placeholder="Masalan: 80"
                        value={draft.bp.split("/")[1] || ""}
                        onChange={(event) => {
                          const sbp = draft.bp.split("/")[0] || "120";
                          setDraft((current) => ({ ...current, bp: `${sbp}/${event.target.value}` }));
                        }}
                        className={
                          Number(draft.bp.split("/")[1]) > 0 &&
                          (Number(draft.bp.split("/")[1]) < 40 || Number(draft.bp.split("/")[1]) > 130)
                            ? "border-red-500 bg-red-50 focus:ring-2 focus:ring-red-500 font-bold"
                            : ""
                        }
                        required
                      />
                      {Number(draft.bp.split("/")[1]) > 0 &&
                        (Number(draft.bp.split("/")[1]) < 40 || Number(draft.bp.split("/")[1]) > 130) && (
                          <small className="text-red-700 font-bold text-[10px] block mt-1">
                            ⚠️ DBP me'yordan tashqarida (40-130 mmHg)
                          </small>
                        )}
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
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">{t("step5Labs")}</h3>
                    <span className="px-2.5 py-1 bg-sky-50 text-sky-950 text-[10px] font-extrabold rounded-lg border border-sky-300 flex items-center gap-1.5 shadow-2xs">
                      <MobileLabBadgeIcon className="w-5 h-5 shrink-0" />
                      <span>Mobil Diagnostik Laboratoriya Tarmogʻi (On-Board POC)</span>
                    </span>
                  </div>
                  <p className="text-xs text-amber-800 bg-amber-50 p-2.5 rounded border border-amber-200 mb-4">{t("referenceNote")}</p>
                  {labs.map((lab, i) => (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-3 bg-slate-50 p-3 rounded-lg border border-slate-200" key={i}>
                      <div>
                        <label htmlFor={`lab-name-${i}`} className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                          {t("testName")} *
                        </label>
                        <input
                          id={`lab-name-${i}`}
                          value={lab.name}
                          placeholder={t("testName")}
                          className="w-full text-xs border border-slate-300 bg-white rounded-lg p-2"
                          onChange={(e) =>
                            setLabs(
                              labs.map((x, n) =>
                                n === i ? { ...x, name: e.target.value } : x,
                              ),
                            )
                          }
                        />
                      </div>
                      <div>
                        <label htmlFor={`lab-val-${i}`} className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                          {t("resultValue")} *
                        </label>
                        <input
                          id={`lab-val-${i}`}
                          type="number"
                          placeholder={t("resultValue")}
                          value={lab.value}
                          className="w-full text-xs border border-slate-300 bg-white rounded-lg p-2"
                          onChange={(e) =>
                            setLabs(
                              labs.map((x, n) =>
                                n === i ? { ...x, value: e.target.value } : x,
                              ),
                            )
                          }
                        />
                      </div>
                      <div>
                        <label htmlFor={`lab-unit-${i}`} className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                          {t("unit")} *
                        </label>
                        <input
                          id={`lab-unit-${i}`}
                          placeholder={t("unit")}
                          value={lab.unit}
                          className="w-full text-xs border border-slate-300 bg-white rounded-lg p-2"
                          onChange={(e) =>
                            setLabs(
                              labs.map((x, n) =>
                                n === i ? { ...x, unit: e.target.value } : x,
                              ),
                            )
                          }
                        />
                      </div>
                      <div className="flex items-end">
                        <button
                          type="button"
                          className="w-full py-2 bg-red-50 text-red-700 text-xs font-bold rounded-lg border border-red-200 hover:bg-red-100 transition cursor-pointer"
                          onClick={() => setLabs(labs.filter((_, n) => n !== i))}
                        >
                          {t("removeBeforeSubmit")}
                        </button>
                      </div>
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
                    <label htmlFor="xray" className="flex flex-col items-center justify-center h-24 p-4 bg-emerald-50 hover:bg-emerald-100 border-2 border-emerald-500 rounded-xl cursor-pointer transition shadow-xs">
                      <span className="text-2xl mb-1">📷</span>
                      <span className="text-xs font-extrabold text-emerald-950">Rentgen / Hujjat suratini olish</span>
                      <span className="text-[10px] text-emerald-700 font-medium">JPEG / PNG kameralar uchun 96px bosish maydoni</span>
                    </label>
                    <input
                      id="xray"
                      type="file"
                      accept="image/jpeg,image/png"
                      className="hidden"
                      onChange={(e) => chooseFile(e.currentTarget)}
                    />
                    {file && (
                      <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900 font-bold">
                        ✓ {file.name} · {file.size}
                      </div>
                    )}
                  </div>
                </>
              )}

              {step === 6 && (
                <>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">7. Yakuniy koʻrik va saqlash</h3>

                  {/* Accordion Read-Back Summary of Steps 1-6 */}
                  <div className="space-y-2 mb-4">
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                      <b className="text-slate-900 block font-bold mb-1">👤 1. Rozilik & Bemor Shaxsi:</b>
                      <div className="text-slate-700">
                        Ism: <b>{draft.fullName || "Kiritilmagan"}</b> · Yoshi: <b>{draft.age}</b> · Jinsi: <b>{draft.sex}</b> · Rozilik: <b className={draft.consent === "recorded" ? "text-emerald-700" : "text-red-700"}>{draft.consent === "recorded" ? "✓ Olingan" : "⚠️ Olinmagan"}</b>
                      </div>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                      <b className="text-slate-900 block font-bold mb-1">🩺 2-3. Shikoyat & Protokol:</b>
                      <div className="text-slate-700">
                        Asosiy shikoyat: <b>{draft.complaint || "Kiritilmagan"}</b>
                      </div>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                      <b className="text-slate-900 block font-bold mb-1">⏱ 4. Vital koʻrsatkichlar:</b>
                      <div className="text-slate-700">
                        SpO₂: <b>{draft.spo2}%</b> · Puls: <b>{draft.pulse} bpm</b> · Qon bosimi: <b>{draft.bp} mmHg</b> · Harorat: <b>{draft.temp} °C</b>
                      </div>
                    </div>
                  </div>

                  {/* Out of Range Critical Values Panel with Required Confirmation */}
                  {(Number(draft.spo2) < 90 || Number(draft.bp.split("/")[0]) > 160 || Number(draft.temp) > 38.5) && (
                    <div className="mb-4 p-3.5 bg-red-50 border-2 border-red-300 rounded-xl text-xs text-red-950 font-bold space-y-2">
                      <div className="text-sm font-black text-red-900 uppercase tracking-wide">
                        🚨 KRITIK QIYMATLAR ANIQLANDI!
                      </div>
                      {Number(draft.spo2) < 90 && <div>• SpO₂ kardiogipoksiya darajasida: {draft.spo2}% (&lt;90%)</div>}
                      {Number(draft.bp.split("/")[0]) > 160 && <div>• Arterial gipertenziya: SBP {draft.bp.split("/")[0]} mmHg (&gt;160)</div>}
                      {Number(draft.temp) > 38.5 && <div>• Yuqori isitma harorati: {draft.temp} °C (&gt;38.5)</div>}

                      <label className="flex items-center gap-2 pt-2 border-t border-red-200 cursor-pointer text-xs font-extrabold text-red-900">
                        <input
                          type="checkbox"
                          required
                          className="w-5 h-5 accent-red-700"
                        />
                        <span>Tasdiqlayman: qiymat toʻgʻri oʻlchandi</span>
                      </label>
                    </div>
                  )}

                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 space-y-3">
                    <b>{t("readyForOfflineSubmit")}</b>
                    <p className="m-0 text-emerald-800 leading-relaxed">{t("idempotencyNotice")}</p>

                    {draft.consent !== "recorded" && (
                      <div className="p-2.5 bg-red-100 border border-red-300 rounded text-red-900 font-bold text-xs">
                        ⚠️ Bemor roziligi olmaguncha saqlash taqiqlanadi!
                      </div>
                    )}

                    <button
                      type="submit"
                      className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg shadow-md transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      disabled={saving || draft.consent !== "recorded" || !draft.fullName || !draft.complaint}
                    >
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

          {/* Clinician Responses Inbox Section */}
          <aside className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-2xs" id="responses">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h2 className="text-lg font-serif font-bold text-slate-900">📑 Klinik Xulosalar va Vrach Javoblari Inbox</h2>
                <p className="text-xs text-slate-500">Markaziy vrach-mutaxassislar tomonidan tasdiqlangan tashxislar va davolash rejalari</p>
              </div>
              <span className="px-3 py-1 bg-emerald-100 text-emerald-900 font-bold text-xs rounded-full">
                3 ta yangi xulosa
              </span>
            </div>

            <div className="space-y-3">
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs space-y-1">
                <div className="flex items-center justify-between font-bold text-emerald-950">
                  <span>QM-2027-0042 (Tomir)</span>
                  <span className="px-2 py-0.5 bg-emerald-700 text-white rounded text-[10px]">✓ TASDIQLANDI</span>
                </div>
                <p className="text-slate-800 m-0"><b>Vrach xulosasi:</b> Zudlik bilan kislorod bering va Urgut Tuman Kasalxonasiga o'tkazing.</p>
                <div className="text-[10px] text-slate-500 font-mono pt-1">Shifokor: Dr. Tomir (Kardiolog) · 10:42 AM</div>
              </div>

              <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl text-xs space-y-1">
                <div className="flex items-center justify-between font-bold text-amber-950">
                  <span>QM-2027-0039 (Anvar Rahimov)</span>
                  <span className="px-2 py-0.5 bg-amber-600 text-white rounded text-[10px]">❓ MA'LUMOT SO'RALDI</span>
                </div>
                <p className="text-slate-800 m-0"><b>Vrach xulosasi:</b> Qayta tana haroratini o'lchang va o'pka auskultatsiya natijasini yuboring.</p>
                <div className="text-[10px] text-slate-500 font-mono pt-1">Shifokor: Dr. Rahmonov · 09:15 AM</div>
              </div>
            </div>
          </aside>
        </section>
      </section>
    </main>
        <MovableChatWidget />
        <MedAIAssistantDrawer currentRole="nurse" />
      </div>
    </RoleGuard>
  );
}

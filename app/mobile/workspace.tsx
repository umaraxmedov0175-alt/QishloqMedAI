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
  retryQueueItem,
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
    <main className="field-app">
      <header className="field-header">
        <a className="field-brand" href="/">
          + QishloqMed AI
        </a>
        <div className={`network ${network}`}>
          <span />
          {
            (
              {
                online: t("statusOnlineText"),
                weak: t("statusWeakText"),
                offline: t("statusOfflineText"),
                synchronizing: t("statusSyncingText"),
                complete: t("statusCompleteText"),
                error: t("statusErrorText"),
              } as const
            )[network]
          }
        </div>
        <button
          className="pending-pill"
          onClick={() => setShowQueue(!showQueue)}
        >
          {t("pendingSyncPill")}: {pending}
        </button>
        <select
          aria-label="Language"
          value={language}
          onChange={(event) => setLanguage(event.target.value as "uz" | "en")}
        >
          <option value="uz">O'zbekcha</option>
          <option value="en">English</option>
        </select>
      </header>

      <nav className="field-nav">
        <a className="active" href="/mobile">
          {t("dashboard")}
        </a>
        <a href="#patients">{t("patients")}</a>
        <button onClick={() => setShowQueue(true)}>{t("pendingSyncPill")}</button>
        <a href="#responses">{t("responses")}</a>
        <DemoRoleLink workspace="specialist">{t("specialistView")}</DemoRoleLink>
      </nav>

      <section className="field-content">
        <div className="field-hero">
          <div>
            <span className="eyebrow">{t("mobileWorkspaceTitle")}</span>
            <h1>Urgut tumani · G'us qishlog'i</h1>
            <p>{t("todayVisits")} · 10 avgust 2026</p>
          </div>
          <div className="network-tools">
            <button
              className="btn"
              onClick={() =>
                setNetwork(network === "offline" ? "online" : "offline")
              }
            >
              {network === "offline"
                ? t("restoreConnection")
                : t("simulateOffline")}
            </button>
            <button
              className="btn primary"
              onClick={sync}
              disabled={!pending || network === "offline"}
            >
              {t("syncNow")}
            </button>
          </div>
        </div>

        <div className="mobile-metrics">
          {[
            ["7", t("patientsExamined")],
            [String(pending), t("pendingSyncCount")],
            ["2", t("waitingForAi")],
            ["3", t("waitingForSpecialist")],
            ["1", t("urgentResponse")],
          ].map(([n, l]) => (
            <div className="mobile-metric" key={l}>
              <b>{n}</b>
              <span>{l}</span>
            </div>
          ))}
        </div>

        {notice && (
          <div className="field-notice" role="status">
            ✓ {notice}
          </div>
        )}

        {showQueue && (
          <section className="work-card">
            <div className="work-head">
              <div>
                <h2>{t("offlineSyncQueue")}</h2>
                <p>{t("localRecordsRemain")}</p>
              </div>
              <div className="actions">
                <button
                  className="btn"
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
                <button className="btn" onClick={() => setShowQueue(false)}>
                  {t("close")}
                </button>
              </div>
            </div>
            {queue.length ? (
              <div className="queue-table">
                {queue.map((item) => (
                  <div className="queue-row" key={item.localId}>
                    <div>
                      <b>{item.entity.replace("_", " ")}</b>
                      <small>
                        {item.localId.slice(0, 12)} · {item.attempts}-urinish
                      </small>
                    </div>
                    <span className={`sync-tag ${item.status}`}>
                      {item.status === "synced" ? t("statusCompleteText") : t("syncPending")}
                    </span>
                    {(item.status === "failed" ||
                      item.status === "conflict") && (
                      <button
                        className="btn"
                        onClick={async () => {
                          await retryQueueItem(item.localId);
                          refresh();
                        }}
                      >
                        {t("tryAgain")}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty">
                {language === "uz" ? "Sinxronlashni kutayotgan yozuvlar yo'q." : "No records are waiting to synchronize."}
              </div>
            )}
          </section>
        )}

        <section className="work-grid">
          <form className="work-card intake" onSubmit={submit}>
            <div className="work-head">
              <div>
                <span className="synthetic">{t("syntheticDemoData")}</span>
                <h2>{t("newPatientEncounter")}</h2>
              </div>
              <button
                type="button"
                className="btn"
                onClick={() => {
                  setDraft({ ...goldenDraft });
                  setStep(0);
                  setNotice(
                    language === "uz"
                      ? "Demo bemor ma'lumotlari tezkor ko'rik uchun yuklandi."
                      : "Golden case loaded for a fast walkthrough.",
                  );
                }}
              >
                {t("loadGoldenCase")}
              </button>
            </div>

            <ol className="stepper">
              {steps.map((name, i) => (
                <li
                  key={name}
                  className={i === step ? "active" : i < step ? "done" : ""}
                >
                  <button type="button" onClick={() => setStep(i)}>
                    <span>{i < step ? "✓" : i + 1}</span>
                    {name}
                  </button>
                </li>
              ))}
            </ol>

            <div className="step-body">
              {step === 0 && (
                <>
                  <h3>{t("patientIdentity")}</h3>
                  <div className="form-grid">
                    <div className="field">
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
                    <div className="field">
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
                    <div className="field">
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
                    <div className="field">
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
                  <h3>{t("step1Consent")}</h3>
                  <label className="consent">
                    <input
                      name="consent"
                      type="checkbox"
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
                    <span>{t("consentDesc")}</span>
                  </label>
                </>
              )}

              {step === 2 && (
                <>
                  <h3>{t("symptomsAndHistory")}</h3>
                  <div className="field">
                    <label htmlFor="complaint">{t("chiefComplaint")}</label>
                    <textarea
                      id="complaint"
                      name="complaint"
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
                  <h3>{t("step4Vitals")}</h3>
                  <div className="form-grid">
                    {[
                      ["spo2", t("spO2"), "%"],
                      ["pulse", t("pulseBpm"), "bpm"],
                      ["bp", t("systolicBp"), "mmHg"],
                      ["temp", t("tempC"), "°C"],
                    ].map(([id, label, unit]) => (
                      <div className="field" key={id}>
                        <label htmlFor={id}>
                          {label} ({unit})
                        </label>
                        <input
                          id={id}
                          name={id}
                          value={draft[id as "spo2" | "pulse" | "bp" | "temp"]}
                          onChange={(event) => {
                            const key = id as "spo2" | "pulse" | "bp" | "temp";
                            setDraft((current) => ({
                              ...current,
                              [key]: event.target.value,
                            }));
                          }}
                          required
                        />
                      </div>
                    ))}
                  </div>
                </>
              )}

              {step === 4 && (
                <>
                  <h3>{t("step5Labs")}</h3>
                  <p className="reference-note">{t("referenceNote")}</p>
                  {labs.map((lab, i) => (
                    <div className="lab-row" key={i}>
                      <input
                        aria-label={t("testName")}
                        value={lab.name}
                        placeholder={t("testName")}
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
                        onClick={() => setLabs(labs.filter((_, n) => n !== i))}
                      >
                        {t("removeBeforeSubmit")}
                      </button>
                      {!lab.unit && (
                        <small className="error">{t("unitRequired")}</small>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    className="btn"
                    onClick={() =>
                      setLabs([...labs, { name: "", value: "", unit: "" }])
                    }
                  >
                    {t("addLabRow")}
                  </button>
                  <div className="upload-box">
                    <label htmlFor="xray">{t("uploadImage")}</label>
                    <input
                      id="xray"
                      type="file"
                      accept="image/jpeg,image/png"
                      onChange={(e) => chooseFile(e.currentTarget)}
                    />
                    {file && (
                      <div className="file-result">
                        <b>{file.name}</b>
                        <span>{file.size}</span>
                        <small>{file.status}</small>
                        <button
                          type="button"
                          onClick={() => {
                            setFile(null);
                            setRawFile(null);
                          }}
                        >
                          {t("removeBeforeSubmit")}
                        </button>
                      </div>
                    )}
                    <small>{t("uploadCheckNotice")}</small>
                  </div>
                </>
              )}

              {step === 5 && (
                <>
                  <h3>{t("reviewCase")}</h3>
                  <div className="review-banner">
                    <b>
                      {draft.patientCode} · {draft.fullName}
                    </b>
                    <span>{t("reviewReadyNotice")}</span>
                    <span>
                      {language === "uz"
                        ? "Oflayn rejimda holat lokal saqlanadi va rasmlar keyinroq yuboriladi."
                        : "If offline, the encounter will complete locally and image upload will remain pending."}
                    </span>
                  </div>
                </>
              )}

              {step === 6 && (
                <>
                  <h3>{t("submitAndSync")}</h3>
                  <div className="success-panel">
                    <b>{t("readyForOfflineSubmit")}</b>
                    <span>{t("idempotencyNotice")}</span>
                    <button className="btn primary" disabled={saving}>
                      {saving ? t("savingSafely") : t("saveToDurableQueue")}
                    </button>
                  </div>
                </>
              )}
            </div>

            <div className="step-actions">
              <button
                type="button"
                className="btn"
                disabled={step === 0}
                onClick={() => setStep(step - 1)}
              >
                {t("back")}
              </button>
              {step < 6 && (
                <button
                  type="button"
                  className="btn primary"
                  onClick={() => setStep(step + 1)}
                >
                  {t("continue")}
                </button>
              )}
            </div>
          </form>

          <aside className="work-card recent" id="patients">
            <div className="work-head">
              <div>
                <h2>{t("recentPatients")}</h2>
                <p>{t("compactTabletView")}</p>
              </div>
            </div>
            <input
              className="patient-search"
              aria-label={t("searchPatients")}
              placeholder={t("searchPatients")}
            />
            {DEMO_CASES.slice(0, 5).map((c) => (
              <article key={c.code} className="recent-case">
                <div>
                  <b>{c.code}</b>
                  <span>
                    {c.name} · {c.village}
                  </span>
                </div>
                <span className={`triage-label ${c.triage}`}>
                  {c.triage === "emergency"
                    ? t("emergency")
                    : c.triage === "urgent"
                      ? t("urgent")
                      : c.triage === "priority"
                        ? t("priority")
                        : t("routine")}
                </span>
              </article>
            ))}
          </aside>
        </section>
      </section>
    </main>
  );
}

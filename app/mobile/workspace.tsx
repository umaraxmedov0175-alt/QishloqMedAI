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
  "online" | "weak" | "offline" | "synchronizing" | "complete" | "error";
const steps = [
  "Identity",
  "Consent",
  "Symptoms",
  "Vital signs",
  "Diagnostics",
  "Review",
  "Submit",
];
const netLabel: Record<NetState, string> = {
  online: "Online",
  weak: "Weak / reconnecting",
  offline: "Offline",
  synchronizing: "Synchronizing",
  complete: "Sync complete",
  error: "Sync error",
};
const goldenDraft = {
  patientCode: "QM-2027-0042",
  fullName: "Dilnoza Karimova",
  age: "67",
  sex: "Ayol",
  consent: "recorded",
  complaint: "Nafas qisishi va ko'krakda bosim",
  history: "Symptoms began this morning after walking.",
  spo2: "89",
  pulse: "108",
  bp: "168/96",
  temp: "37.4",
};
export function MobileWorkspace() {
  const { language, setLanguage } = useLanguage();
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
      setNotice("Patient identity fields are required before submission.");
      setStep(0);
      return;
    }
    if (data.consent !== "recorded") {
      setNotice("Recorded patient consent is required before submission.");
      setStep(1);
      return;
    }
    if (!data.complaint.trim()) {
      setNotice("A chief complaint is required before submission.");
      setStep(2);
      return;
    }
    if (
      [data.spo2, data.pulse, data.bp, data.temp].some((value) => !value.trim())
    ) {
      setNotice("All vital signs require a value and displayed unit.");
      setStep(3);
      return;
    }
    if (labs.some((lab) => !lab.name.trim() || !lab.unit.trim())) {
      setNotice("Each laboratory result requires a test name and unit.");
      setStep(4);
      return;
    }
    if (file && !file.valid) {
      setNotice("Remove the invalid diagnostic file before submission.");
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
      setNotice(
        "Case saved durably on this device. It is safe to continue offline.",
      );
      setStep(6);
      await refresh();
    } catch {
      setNotice("Local save failed. The encounter was not marked complete.");
    } finally {
      setSaving(false);
    }
  }
  async function sync() {
    if (network === "offline")
      return setNotice("No connection. Records remain safely queued.");
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
      setNotice("Some records failed to synchronize. Retry remains available.");
      return;
    }
    setNetwork("complete");
    setNotice("Demo server acknowledged every record without duplication.");
    window.setTimeout(() => setNetwork("online"), 1800);
  }
  function chooseFile(input: HTMLInputElement) {
    const selected = input.files?.[0];
    if (!selected) return;
    const supported = ["image/jpeg", "image/png"].includes(selected.type);
    const tooLarge = selected.size > 10 * 1024 * 1024;
    const quality = !supported
      ? "Unsupported type"
      : tooLarge
        ? "File exceeds the 10 MB demonstration limit"
        : selected.size < 20_000
          ? "Warning: unusually small image"
          : "Basic checks passed — not a radiology quality validation";
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
          {language === "uz"
            ? (
                {
                  online: "Onlayn",
                  weak: "Aloqa sust",
                  offline: "Oflayn",
                  synchronizing: "Sinxronlanmoqda",
                  complete: "Sinxronlash tugadi",
                  error: "Sinxronlash xatosi",
                } as const
              )[network]
            : netLabel[network]}
        </div>
        <button
          className="pending-pill"
          onClick={() => setShowQueue(!showQueue)}
        >
          Pending sync: {pending}
        </button>
        <select
          aria-label="Language"
          value={language}
          onChange={(event) => setLanguage(event.target.value as "uz" | "en")}
        >
          <option value="uz">O'zbek</option>
          <option value="en">English</option>
        </select>
      </header>
      <nav className="field-nav">
        <a className="active" href="/mobile">
          Dashboard
        </a>
        <a href="#patients">Patients</a>
        <button onClick={() => setShowQueue(true)}>Pending Sync</button>
        <a href="#responses">Responses</a>
        <DemoRoleLink workspace="specialist">Specialist view</DemoRoleLink>
      </nav>
      <section className="field-content">
        <div className="field-hero">
          <div>
            <span className="eyebrow">Mobile Clinic Mode · QishloqMed-01</span>
            <h1>Urgut tumani · G'us qishlog'i</h1>
            <p>Bugungi tashriflar · 10 avgust 2026</p>
          </div>
          <div className="network-tools">
            <button
              className="btn"
              onClick={() =>
                setNetwork(network === "offline" ? "online" : "offline")
              }
            >
              {network === "offline"
                ? "Restore connection"
                : "Simulate offline"}
            </button>
            <button
              className="btn primary"
              onClick={sync}
              disabled={!pending || network === "offline"}
            >
              Synchronize now
            </button>
          </div>
        </div>
        <div className="mobile-metrics">
          {[
            ["7", "Patients examined"],
            [String(pending), "Pending synchronization"],
            ["2", "Waiting for AI"],
            ["3", "Waiting for specialist"],
            ["1", "Urgent response"],
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
                <h2>Offline synchronization queue</h2>
                <p>Local records remain until server acknowledgment.</p>
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
                    setNotice("Synthetic demo queue reset safely.");
                    await refresh();
                  }}
                >
                  Reset demo
                </button>
                <button className="btn" onClick={() => setShowQueue(false)}>
                  Close
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
                        {item.localId.slice(0, 12)} · attempt {item.attempts}
                      </small>
                    </div>
                    <span className={`sync-tag ${item.status}`}>
                      {item.status.replace("_", " ")}
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
                        Retry
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty">
                No records are waiting to synchronize.
              </div>
            )}
          </section>
        )}
        <section className="work-grid">
          <form className="work-card intake" onSubmit={submit}>
            <div className="work-head">
              <div>
                <span className="synthetic">SYNTHETIC DEMO DATA</span>
                <h2>New patient encounter</h2>
              </div>
              <button
                type="button"
                className="btn"
                onClick={() => {
                  setDraft({ ...goldenDraft });
                  setStep(0);
                  setNotice(
                    "Golden case loaded for a fast 2–4 minute walkthrough.",
                  );
                }}
              >
                Load golden case
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
                  <h3>Patient identity</h3>
                  <div className="form-grid">
                    <div className="field">
                      <label htmlFor="patientCode">Safe patient code</label>
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
                      <label htmlFor="fullName">Full name</label>
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
                      <label htmlFor="age">Age</label>
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
                      <label htmlFor="sex">Sex</label>
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
                        <option>Ayol</option>
                        <option>Erkak</option>
                      </select>
                    </div>
                  </div>
                </>
              )}
              {step === 1 && (
                <>
                  <h3>Consent</h3>
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
                    <span>
                      Patient consent was recorded for clinical data capture and
                      specialist review. This environment contains synthetic
                      demonstration data.
                    </span>
                  </label>
                </>
              )}
              {step === 2 && (
                <>
                  <h3>Symptoms and history</h3>
                  <div className="field">
                    <label htmlFor="complaint">Chief complaint</label>
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
                    <label htmlFor="history">
                      Symptom history and nurse notes
                    </label>
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
                  <h3>Vital signs</h3>
                  <div className="form-grid">
                    {[
                      ["spo2", "SpO₂", "%"],
                      ["pulse", "Heart rate", "bpm"],
                      ["bp", "Blood pressure", "mmHg"],
                      ["temp", "Temperature", "°C"],
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
                  <h3>Diagnostics</h3>
                  <p className="reference-note">
                    Reference ranges are demonstration configuration and are not
                    universally authoritative.
                  </p>
                  {labs.map((lab, i) => (
                    <div className="lab-row" key={i}>
                      <input
                        aria-label="Test name"
                        value={lab.name}
                        onChange={(e) =>
                          setLabs(
                            labs.map((x, n) =>
                              n === i ? { ...x, name: e.target.value } : x,
                            ),
                          )
                        }
                      />
                      <input
                        aria-label="Result value"
                        type="number"
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
                        aria-label="Result unit"
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
                        Remove
                      </button>
                      {!lab.unit && (
                        <small className="error">Unit required</small>
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
                    + Add laboratory result
                  </button>
                  <div className="upload-box">
                    <label htmlFor="xray">
                      Select X-ray (JPEG/PNG, max 10 MB)
                    </label>
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
                          Remove before submit
                        </button>
                      </div>
                    )}
                    <small>
                      Basic checks cannot validate radiological quality. Image
                      upload is synchronized separately from encounter metadata.
                    </small>
                  </div>
                </>
              )}
              {step === 5 && (
                <>
                  <h3>Review case</h3>
                  <div className="review-banner">
                    <b>
                      {draft.patientCode} · {draft.fullName}
                    </b>
                    <span>
                      Symptoms, vitals, labs, notes, and image metadata are
                      ready.
                    </span>
                    <span>
                      If offline, the encounter will complete locally and image
                      upload will remain clearly pending.
                    </span>
                  </div>
                </>
              )}
              {step === 6 && (
                <>
                  <h3>Submit and synchronize</h3>
                  <div className="success-panel">
                    <b>Ready for offline-safe submission</b>
                    <span>
                      Every action receives a local identifier and idempotency
                      key.
                    </span>
                    <button className="btn primary" disabled={saving}>
                      {saving
                        ? "Saving safely…"
                        : "Save encounter to durable queue"}
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
                Back
              </button>
              {step < 6 && (
                <button
                  type="button"
                  className="btn primary"
                  onClick={() => setStep(step + 1)}
                >
                  Continue
                </button>
              )}
            </div>
          </form>
          <aside className="work-card recent" id="patients">
            <div className="work-head">
              <div>
                <h2>Recent patients</h2>
                <p>Compact tablet view</p>
              </div>
            </div>
            <input
              className="patient-search"
              aria-label="Search patients"
              placeholder="Search code or name"
            />
            {DEMO_CASES.slice(0, 5).map((c) => (
              <article key={c.code} className="recent-case">
                <div>
                  <b>{c.code}</b>
                  <span>
                    {c.name} · {c.village}
                  </span>
                </div>
                <span className={`triage-label ${c.triage}`}>{c.triage}</span>
              </article>
            ))}
          </aside>
        </section>
      </section>
    </main>
  );
}

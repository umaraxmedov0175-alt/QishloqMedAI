export type ClinicalAction = {
  caseCode: string;
  finalSummary: string;
  decision: string;
  clinician: string;
  createdAt: string;
  updatedAt: string;
};

const DB_NAME = "qishloqmed-clinical-v1";
const STORE = "clinical_actions";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) {
        request.result.createObjectStore(STORE, { keyPath: "caseCode" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveClinicalAction(
  input: Omit<ClinicalAction, "createdAt" | "updatedAt">,
) {
  const db = await openDb();
  const store = db.transaction(STORE, "readwrite").objectStore(STORE);
  const existing = (await requestResult(store.get(input.caseCode))) as
    ClinicalAction | undefined;
  const now = new Date().toISOString();
  const action: ClinicalAction = {
    ...input,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  await requestResult(store.put(action));
  db.close();
  return action;
}

export async function getClinicalAction(caseCode: string) {
  const db = await openDb();
  const action = (await requestResult(
    db.transaction(STORE).objectStore(STORE).get(caseCode),
  )) as ClinicalAction | undefined;
  db.close();
  return action;
}

export async function listClinicalActions() {
  const db = await openDb();
  const actions = (await requestResult(
    db.transaction(STORE).objectStore(STORE).getAll(),
  )) as ClinicalAction[];
  db.close();
  return actions.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

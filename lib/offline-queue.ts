export type SyncStatus =
  | "locally_created"
  | "pending_sync"
  | "syncing"
  | "synced"
  | "conflict"
  | "failed";
export type QueueEntity =
  | "patient"
  | "encounter"
  | "diagnostic_metadata"
  | "diagnostic_binary"
  | "audit_event";
export type OfflineQueueItem<T = unknown> = {
  localId: string;
  idempotencyKey: string;
  entity: QueueEntity;
  payload: T;
  status: SyncStatus;
  attempts: number;
  createdAt: string;
  updatedAt: string;
  lastError?: string;
  serverId?: string;
};
export type SyncEvent =
  "QUEUE" | "START" | "ACK" | "CONFLICT" | "FAIL" | "RETRY";
const transitions: Record<
  SyncStatus,
  Partial<Record<SyncEvent, SyncStatus>>
> = {
  locally_created: { QUEUE: "pending_sync" },
  pending_sync: { START: "syncing" },
  syncing: { ACK: "synced", CONFLICT: "conflict", FAIL: "failed" },
  synced: {},
  conflict: { RETRY: "pending_sync" },
  failed: { RETRY: "pending_sync" },
};
export function transitionSyncStatus(
  current: SyncStatus,
  event: SyncEvent,
): SyncStatus {
  const next = transitions[current][event];
  if (!next) throw new Error(`Invalid sync transition: ${current} -> ${event}`);
  return next;
}
export function createQueueItem<T>(
  entity: QueueEntity,
  payload: T,
  idempotencyKey = crypto.randomUUID(),
): OfflineQueueItem<T> {
  const now = new Date().toISOString();
  return {
    localId: crypto.randomUUID(),
    idempotencyKey,
    entity,
    payload,
    status: "locally_created",
    attempts: 0,
    createdAt: now,
    updatedAt: now,
  };
}

const DB_NAME = "qishloqmed-field-v1",
  STORE = "sync_queue";
function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: "localId" });
        store.createIndex("status", "status");
        store.createIndex("idempotencyKey", "idempotencyKey", { unique: true });
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
export async function putQueueItem(item: OfflineQueueItem) {
  const db = await openDb();
  await requestResult(
    db.transaction(STORE, "readwrite").objectStore(STORE).put(item),
  );
  db.close();
}
export async function findQueueItemByIdempotencyKey(idempotencyKey: string) {
  const db = await openDb();
  const item = (await requestResult(
    db
      .transaction(STORE)
      .objectStore(STORE)
      .index("idempotencyKey")
      .get(idempotencyKey),
  )) as OfflineQueueItem | undefined;
  db.close();
  return item;
}
export async function enqueueOfflineAction<T>(
  entity: QueueEntity,
  payload: T,
  idempotencyKey?: string,
) {
  const existing = idempotencyKey
    ? await findQueueItemByIdempotencyKey(idempotencyKey)
    : undefined;
  if (existing) return existing as OfflineQueueItem<T>;
  const created = createQueueItem(entity, payload, idempotencyKey);
  const queued = {
    ...created,
    status: transitionSyncStatus(created.status, "QUEUE"),
    updatedAt: new Date().toISOString(),
  } as OfflineQueueItem<T>;
  await putQueueItem(queued);
  return queued;
}
export async function listQueueItems() {
  const db = await openDb();
  const items = (await requestResult(
    db.transaction(STORE).objectStore(STORE).getAll(),
  )) as OfflineQueueItem[];
  db.close();
  return items.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}
export async function pendingQueueCount() {
  return (await listQueueItems()).filter((item) => item.status !== "synced")
    .length;
}
export async function retryQueueItem(localId: string) {
  const items = await listQueueItems();
  const item = items.find((entry) => entry.localId === localId);
  if (!item || !(item.status === "failed" || item.status === "conflict"))
    return;
  await putQueueItem({
    ...item,
    status: transitionSyncStatus(item.status, "RETRY"),
    lastError: undefined,
    updatedAt: new Date().toISOString(),
  });
}
export async function synchronizeQueue(
  send: (item: OfflineQueueItem) => Promise<{ serverId: string }>,
) {
  const items = await listQueueItems();
  for (const item of items) {
    if (item.status !== "pending_sync") continue;
    const syncing = {
      ...item,
      status: transitionSyncStatus(item.status, "START"),
      attempts: item.attempts + 1,
      updatedAt: new Date().toISOString(),
    } as OfflineQueueItem;
    await putQueueItem(syncing);
    try {
      const response = await send(syncing);
      await putQueueItem({
        ...syncing,
        status: transitionSyncStatus("syncing", "ACK"),
        serverId: response.serverId,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      await putQueueItem({
        ...syncing,
        status: transitionSyncStatus("syncing", "FAIL"),
        lastError:
          error instanceof Error ? error.message : "Synchronization failed",
        updatedAt: new Date().toISOString(),
      });
    }
  }
}
export async function resetOfflineQueue() {
  const db = await openDb();
  await requestResult(
    db.transaction(STORE, "readwrite").objectStore(STORE).clear(),
  );
  db.close();
}

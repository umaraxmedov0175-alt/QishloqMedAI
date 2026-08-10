/**
 * Audit Logging Engine for Healthcare Data CRUD Operations
 * Records timestamps, user IDs, actions, and resource metadata.
 */

export interface AuditRecord {
  id: string;
  actorId: string;
  action:
    | "login"
    | "logout"
    | "read_patient"
    | "create_patient"
    | "create_visit"
    | "update_vitals"
    | "record_diagnostic"
    | "consultation_note"
    | "ai_risk_assessment"
    | string;
  resourceType: string;
  resourceId: string;
  occurredAt: string;
  metadata?: Record<string, unknown>;
}

// In-memory store for audit events when running in local development / demo environment
const auditLogStore: AuditRecord[] = [];

export type AuditWriter = (event: AuditRecord) => Promise<void>;

/**
 * Record an audit logging event for CRUD operations and authentication actions.
 */
export async function recordAuditEvent(
  writer?: AuditWriter | null,
  input?: {
    actorId: string;
    action: string;
    resourceType: string;
    resourceId: string;
    metadata?: Record<string, unknown>;
  }
): Promise<AuditRecord> {
  const record: AuditRecord = {
    id: crypto.randomUUID(),
    actorId: input?.actorId || "system",
    action: input?.action || "unknown_action",
    resourceType: input?.resourceType || "system",
    resourceId: input?.resourceId || "global",
    occurredAt: new Date().toISOString(),
    metadata: input?.metadata,
  };

  auditLogStore.push(record);

  if (writer) {
    try {
      await writer(record);
    } catch (error) {
      console.warn("Primary database audit writer warning:", error);
    }
  }

  return record;
}

/**
 * Retrieve recent audit records filtered by actor or resource.
 */
export function getAuditLogs(filter?: {
  actorId?: string;
  resourceId?: string;
  action?: string;
}): AuditRecord[] {
  return auditLogStore.filter((log) => {
    if (filter?.actorId && log.actorId !== filter.actorId) return false;
    if (filter?.resourceId && log.resourceId !== filter.resourceId) return false;
    if (filter?.action && log.action !== filter.action) return false;
    return true;
  });
}

import "server-only";
import { db, type Tx } from "@/db";
import { auditLogs } from "@/db/schema";
import { getClientInfo } from "@/lib/request";

type AuditEntry = {
  actorUserId: number | null;
  action: string;
  entityType: string;
  entityId?: string | number | null;
  before?: unknown;
  after?: unknown;
  result?: "success" | "failure";
  reason?: string | null;
};

/**
 * Records who did what to which record. Pass `tx` to write the audit row in the
 * same transaction as the change, so the change and its audit record are saved together.
 */
export async function audit(entry: AuditEntry, tx?: Tx) {
  const { ip } = await getClientInfo();
  await (tx ?? db).insert(auditLogs).values({
    actorUserId: entry.actorUserId,
    action: entry.action,
    entityType: entry.entityType,
    entityId: entry.entityId == null ? null : String(entry.entityId),
    before: entry.before ?? null,
    after: entry.after ?? null,
    result: entry.result ?? "success",
    reason: entry.reason?.slice(0, 255) ?? null,
    ip,
  });
}

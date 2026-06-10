import { db } from "@/lib/db/client";
import { auditLog } from "@/lib/db/schema";

/**
 * Journalise une action sensible dans audit_log (traçabilité RGPD).
 * Ne lève jamais : un échec de journalisation ne doit pas bloquer l'action.
 */
export async function audit(
  action: string,
  entity?: string,
  entityId?: string,
  meta?: Record<string, unknown>,
): Promise<void> {
  try {
    await db.insert(auditLog).values({
      action,
      entity: entity ?? null,
      entityId: entityId ?? null,
      meta: meta ?? null,
    });
  } catch (err) {
    console.error("audit log failed:", (err as Error).message);
  }
}

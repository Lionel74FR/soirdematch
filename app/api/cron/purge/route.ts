import { NextRequest, NextResponse } from "next/server";
import { and, inArray, isNotNull, lt, or } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { registrations, questionnaireAnswers, matches } from "@/lib/db/schema";
import { audit } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * ÉTAPE 3 RGPD — purge automatique.
 * Appelée quotidiennement par le cron Vercel (voir vercel.json).
 * Supprime définitivement toute inscription dont delete_after est dépassé,
 * ainsi que ses réponses au questionnaire et ses appariements, puis journalise
 * l'action dans audit_log.
 */
export async function GET(req: NextRequest) {
  // Sécurise l'endpoint : Vercel ajoute « Authorization: Bearer <CRON_SECRET> »
  // aux invocations cron lorsque CRON_SECRET est défini.
  const secret = process.env.CRON_SECRET;
  if (secret) {
    if (req.headers.get("authorization") !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
    }
  }

  const now = new Date();

  const expired = await db
    .select({ id: registrations.id })
    .from(registrations)
    .where(
      and(
        isNotNull(registrations.deleteAfter),
        lt(registrations.deleteAfter, now),
      ),
    );

  const ids = expired.map((r) => r.id);

  if (ids.length === 0) {
    await audit("purge_expired_data", "registration", undefined, {
      deleted: 0,
      ranAt: now.toISOString(),
    });
    return NextResponse.json({ ok: true, deleted: 0 });
  }

  // Ordre imposé par les clés étrangères : matches → réponses → inscriptions.
  await db
    .delete(matches)
    .where(
      or(
        inArray(matches.registrationA, ids),
        inArray(matches.registrationB, ids),
      ),
    );
  await db
    .delete(questionnaireAnswers)
    .where(inArray(questionnaireAnswers.registrationId, ids));
  await db.delete(registrations).where(inArray(registrations.id, ids));

  await audit("purge_expired_data", "registration", undefined, {
    deleted: ids.length,
    ranAt: now.toISOString(),
  });

  return NextResponse.json({ ok: true, deleted: ids.length });
}

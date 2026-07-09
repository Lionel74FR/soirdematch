import { NextResponse } from "next/server";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { events, registrations } from "@/lib/db/schema";
import { isAuthenticated } from "@/lib/admin-auth";
import { audit } from "@/lib/audit";

export const runtime = "nodejs";

/** ÉTAPE 4 — attribution des numéros de badge aux inscrits confirmés
 *  (paiement validé). */
export async function POST() {
  if (!isAuthenticated()) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const [event] = await db
    .select()
    .from(events)
    .where(eq(events.status, "open"))
    .orderBy(asc(events.eventDate))
    .limit(1);

  if (!event) {
    return NextResponse.json(
      { error: "Aucune soirée ouverte." },
      { status: 409 },
    );
  }

  // Le badge de chaque participant = son numéro de groupe de match (1..5).
  const confirmed = await db
    .select({
      id: registrations.id,
      groupNumber: registrations.groupNumber,
    })
    .from(registrations)
    .where(
      and(eq(registrations.eventId, event.id), eq(registrations.paid, true)),
    )
    .orderBy(asc(registrations.groupNumber), asc(registrations.createdAt));

  const ungrouped = confirmed.filter((r) => r.groupNumber == null).length;
  if (ungrouped > 0) {
    return NextResponse.json(
      {
        error:
          "Lance d'abord le matching pour former les groupes : certains inscrits n'ont pas encore de groupe.",
      },
      { status: 409 },
    );
  }

  let count = 0;
  for (const r of confirmed) {
    await db
      .update(registrations)
      .set({ badgeNumber: r.groupNumber })
      .where(eq(registrations.id, r.id));
    count += 1;
  }

  await audit("assign_badges", "event", event.id, { count });
  return NextResponse.json({ ok: true, count });
}

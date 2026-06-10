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

  // Badges groupés par genre puis ordre d'inscription, pour la logistique.
  const confirmed = await db
    .select({ id: registrations.id })
    .from(registrations)
    .where(
      and(eq(registrations.eventId, event.id), eq(registrations.paid, true)),
    )
    .orderBy(asc(registrations.gender), asc(registrations.createdAt));

  let badge = 0;
  for (const r of confirmed) {
    badge += 1;
    await db
      .update(registrations)
      .set({ badgeNumber: badge })
      .where(eq(registrations.id, r.id));
  }

  await audit("assign_badges", "event", event.id, { count: badge });
  return NextResponse.json({ ok: true, count: badge });
}

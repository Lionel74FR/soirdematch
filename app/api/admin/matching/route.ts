import { NextResponse } from "next/server";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  events,
  registrations,
  questionnaireAnswers,
  matches,
} from "@/lib/db/schema";
import { isAuthenticated } from "@/lib/admin-auth";
import { audit } from "@/lib/audit";
import {
  computeGroups,
  DEFAULT_STRATEGY,
  type MatchParticipant,
  type MatchingStrategy,
} from "@/lib/matching";
import type { Answers } from "@/lib/questionnaire";

export const runtime = "nodejs";

/** Nombre de groupes de match formés par l'algorithme. */
const NUM_GROUPS = 5;

/** ÉTAPE 3 — déclenchement MANUEL du matching (jamais automatique).
 *  Ne matche que les inscrits confirmés (paiement validé). */
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

  // Tous les inscrits confirmés (paiement validé), avec leurs réponses si
  // disponibles — chacun doit recevoir un groupe (donc un numéro de badge).
  const rows = await db
    .select({
      id: registrations.id,
      gender: registrations.gender,
      birthYear: registrations.birthYear,
      answers: questionnaireAnswers.answers,
    })
    .from(registrations)
    .leftJoin(
      questionnaireAnswers,
      eq(questionnaireAnswers.registrationId, registrations.id),
    )
    .where(
      and(eq(registrations.eventId, event.id), eq(registrations.paid, true)),
    );

  const participants: MatchParticipant[] = rows.map((r) => ({
    id: r.id,
    gender: r.gender,
    birthYear: r.birthYear,
    answers: (r.answers ?? {}) as Answers,
  }));

  const strategy =
    (event.matchingStrategy as MatchingStrategy | null) ?? DEFAULT_STRATEGY;
  const groups = computeGroups(participants, strategy, NUM_GROUPS);

  // Idempotent : on repart d'une ardoise vierge pour cette soirée.
  await db.delete(matches).where(eq(matches.eventId, event.id));
  await db
    .update(registrations)
    .set({ groupNumber: null })
    .where(eq(registrations.eventId, event.id));

  // Affecte le numéro de groupe à chaque participant et stocke les paires
  // intra-groupe (pour l'affichage des affinités).
  const allPairs = groups.flatMap((g) => g.pairs);
  for (const g of groups) {
    for (const id of g.memberIds) {
      await db
        .update(registrations)
        .set({ groupNumber: g.index })
        .where(eq(registrations.id, id));
    }
  }
  if (allPairs.length > 0) {
    await db.insert(matches).values(
      allPairs.map((p) => ({
        eventId: event.id,
        registrationA: p.a,
        registrationB: p.b,
        score: String(p.score),
      })),
    );
  }

  const groupScores = groups.map((g) => g.avgScore);
  const summary = {
    participants: participants.length,
    groups: groups.length,
    topScore: groupScores.length ? Math.max(...groupScores) : 0,
    avgScore: groupScores.length
      ? Math.round(
          (groupScores.reduce((s, v) => s + v, 0) / groupScores.length) * 10,
        ) / 10
      : 0,
  };

  await audit("run_matching", "event", event.id, summary);
  return NextResponse.json({ ok: true, ...summary });
}

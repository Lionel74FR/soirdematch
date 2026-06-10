import { NextResponse } from "next/server";
import { and, asc, eq, inArray } from "drizzle-orm";
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
  computeMatches,
  DEFAULT_STRATEGY,
  type MatchParticipant,
  type MatchingStrategy,
} from "@/lib/matching";
import type { Answers } from "@/lib/questionnaire";

export const runtime = "nodejs";

const ACTIVE_STATUS = ["pending", "paid"];

/** ÉTAPE 3 — déclenchement MANUEL du matching (jamais automatique). */
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

  const rows = await db
    .select({
      id: registrations.id,
      gender: registrations.gender,
      birthYear: registrations.birthYear,
      answers: questionnaireAnswers.answers,
    })
    .from(registrations)
    .innerJoin(
      questionnaireAnswers,
      eq(questionnaireAnswers.registrationId, registrations.id),
    )
    .where(
      and(
        eq(registrations.eventId, event.id),
        inArray(registrations.status, ACTIVE_STATUS),
      ),
    );

  const participants: MatchParticipant[] = rows.map((r) => ({
    id: r.id,
    gender: r.gender,
    birthYear: r.birthYear,
    answers: (r.answers ?? {}) as Answers,
  }));

  const strategy =
    (event.matchingStrategy as MatchingStrategy | null) ?? DEFAULT_STRATEGY;
  const pairs = computeMatches(participants, strategy);

  // Idempotent : on remplace les paires existantes pour cette soirée.
  await db.delete(matches).where(eq(matches.eventId, event.id));
  if (pairs.length > 0) {
    await db.insert(matches).values(
      pairs.map((p) => ({
        eventId: event.id,
        registrationA: p.a,
        registrationB: p.b,
        score: String(p.score),
      })),
    );
  }

  const scores = pairs.map((p) => p.score);
  const summary = {
    participants: participants.length,
    pairs: pairs.length,
    topScore: scores.length ? Math.max(...scores) : 0,
    avgScore: scores.length
      ? Math.round((scores.reduce((s, v) => s + v, 0) / scores.length) * 10) / 10
      : 0,
  };

  await audit("run_matching", "event", event.id, summary);
  return NextResponse.json({ ok: true, ...summary });
}

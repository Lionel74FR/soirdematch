import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { surveyResponses } from "@/lib/db/schema";

export const runtime = "nodejs";

// Valeurs admises pour la question « rencontre ».
const RENCONTRE_VALUES = ["oui", "peut_etre", "non"] as const;

type Body = {
  noteGlobale?: unknown;
  nps?: unknown;
  qualiteMatch?: unknown;
  rencontre?: unknown;
  noteFormat?: unknown;
  commentaire?: unknown;
  consentAvis?: unknown;
  consentMarketing?: unknown;
};

function intInRange(value: unknown, min: number, max: number): number | null {
  if (typeof value !== "number" || !Number.isInteger(value)) return null;
  if (value < min || value > max) return null;
  return value;
}

/**
 * Enregistre un avis post-soirée. Route PUBLIQUE et ANONYME :
 * on ne stocke ni email, ni identifiant d'inscription, ni adresse IP
 * (minimisation RGPD).
 */
export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const noteGlobale = intInRange(body.noteGlobale, 1, 5);
  const nps = intInRange(body.nps, 0, 10);
  const qualiteMatch = intInRange(body.qualiteMatch, 1, 5);
  const noteFormat = intInRange(body.noteFormat, 1, 5);
  const rencontre =
    typeof body.rencontre === "string" &&
    (RENCONTRE_VALUES as readonly string[]).includes(body.rencontre)
      ? body.rencontre
      : null;

  if (
    noteGlobale === null ||
    nps === null ||
    qualiteMatch === null ||
    noteFormat === null ||
    rencontre === null
  ) {
    return NextResponse.json(
      { error: "Merci de répondre à toutes les questions notées." },
      { status: 400 },
    );
  }

  let commentaire: string | null = null;
  if (typeof body.commentaire === "string") {
    commentaire = body.commentaire.trim().slice(0, 2000) || null;
  }

  await db.insert(surveyResponses).values({
    noteGlobale,
    nps,
    qualiteMatch,
    noteFormat,
    rencontre,
    commentaire,
    consentAvis: body.consentAvis === true,
    consentMarketing: body.consentMarketing === true,
  });

  return NextResponse.json({ ok: true });
}

import { NextRequest, NextResponse } from "next/server";
import { asc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  events,
  registrations,
  questionnaireAnswers,
} from "@/lib/db/schema";
import { getStripe } from "@/lib/stripe";
import { sendMetaEvent } from "@/lib/meta-capi";
import { validateAll, type Answers } from "@/lib/questionnaire";

export const runtime = "nodejs";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const QUOTA_GENDERS = ["homme", "femme"];

type Body = {
  answers?: Answers;
  consent?: boolean;
  joinWaitlist?: boolean;
};

function metaUserData(req: NextRequest, email?: string, phone?: string) {
  return {
    email,
    phone,
    clientIpAddress:
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || undefined,
    clientUserAgent: req.headers.get("user-agent") || undefined,
    fbp: req.cookies.get("_fbp")?.value,
    fbc: req.cookies.get("_fbc")?.value,
  };
}

/** Trusted base URL for Stripe redirects — never derived from a client header. */
function baseUrl(req: NextRequest): string {
  if (process.env.APP_BASE_URL) return process.env.APP_BASE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return new URL(req.url).origin;
}

export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const { answers, consent, joinWaitlist } = body;

  // ÉTAPE 4 — le consentement RGPD est obligatoire.
  if (consent !== true) {
    return NextResponse.json(
      { error: "Le consentement RGPD est obligatoire." },
      { status: 400 },
    );
  }

  if (!answers || typeof answers !== "object") {
    return NextResponse.json({ error: "Réponses manquantes." }, { status: 400 });
  }

  const validationErrors = validateAll(answers);
  if (validationErrors.length > 0) {
    return NextResponse.json(
      { error: "Certaines réponses sont invalides.", details: validationErrors },
      { status: 400 },
    );
  }

  const firstName = String(answers.firstName).trim();
  const email = String(answers.email).trim().toLowerCase();
  const phone = String(answers.phone).trim();
  const gender = String(answers.gender);
  const birthYear = Number(answers.birthYear);

  // L'événement ouvert le plus proche.
  const [event] = await db
    .select()
    .from(events)
    .where(eq(events.status, "open"))
    .orderBy(asc(events.eventDate))
    .limit(1);

  if (!event) {
    return NextResponse.json(
      { error: "Aucune soirée n'est ouverte à l'inscription pour le moment." },
      { status: 409 },
    );
  }

  const consentAt = new Date();
  const deleteAfter = new Date(event.eventDate.getTime() + THIRTY_DAYS_MS);

  // ----- Confirmation de la liste d'attente (2e appel) -----
  if (joinWaitlist) {
    const [reg] = await db
      .insert(registrations)
      .values({
        eventId: event.id,
        firstName,
        email,
        phone,
        gender,
        birthYear,
        status: "waitlist",
        consentAt,
        deleteAfter,
      })
      .returning({ id: registrations.id });

    await db
      .insert(questionnaireAnswers)
      .values({ registrationId: reg.id, answers });

    return NextResponse.json({ result: "waitlisted" });
  }

  // ÉTAPE 2 — CompleteRegistration à la soumission finale (jamais bloquant).
  try {
    await sendMetaEvent({
      eventName: "CompleteRegistration",
      eventSourceUrl: req.headers.get("referer") || undefined,
      userData: metaUserData(req, email, phone),
      customData: {
        currency: "EUR",
        value: (event.priceCents ?? 0) / 100,
        content_name: event.title,
      },
    });
  } catch (err) {
    console.warn(
      "Meta CAPI CompleteRegistration skipped:",
      (err as Error).message,
    );
  }

  // ÉTAPE 3 — création de l'inscription avec contrôle de quota de parité.
  // Le contrôle de quota et l'insertion sont effectués dans une seule
  // instruction SQL atomique pour éviter le décalage lecture-puis-écriture.
  // (V1 : un seul lieu, faible concurrence.)
  const quotaApplies =
    QUOTA_GENDERS.includes(gender) && event.genderQuota != null;

  let registrationId: string | null = null;

  if (quotaApplies) {
    const inserted = (await db.execute(sql`
      INSERT INTO registrations
        (event_id, first_name, email, phone, gender, birth_year, status, consent_at, delete_after)
      SELECT
        ${event.id}::uuid, ${firstName}, ${email}, ${phone}, ${gender},
        ${birthYear}, 'pending', ${consentAt.toISOString()}::timestamp, ${deleteAfter.toISOString()}::timestamp
      WHERE (
        SELECT count(*) FROM registrations
        WHERE event_id = ${event.id}::uuid
          AND gender = ${gender}
          AND status IN ('pending', 'paid')
      ) < ${event.genderQuota}
      RETURNING id
    `)) as unknown as { rows: Array<{ id: string }> };
    registrationId = inserted.rows[0]?.id ?? null;

    // Quota atteint : on propose la liste d'attente au lieu du paiement.
    if (!registrationId) {
      return NextResponse.json({ result: "waitlist" });
    }
  } else {
    const [reg] = await db
      .insert(registrations)
      .values({
        eventId: event.id,
        firstName,
        email,
        phone,
        gender,
        birthYear,
        status: "pending",
        consentAt,
        deleteAfter,
      })
      .returning({ id: registrations.id });
    registrationId = reg.id;
  }

  // ÉTAPE 3 — création de la session Stripe Checkout.
  const url = `${baseUrl(req)}`;
  let checkoutUrl: string | null = null;
  try {
    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      customer_email: email,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "eur",
            unit_amount: event.priceCents ?? 0,
            product_data: {
              name: `Soir de Match — ${event.title}`,
              description:
                "Billet incluant l'accès, le buffet et l'afterparty.",
            },
          },
        },
      ],
      metadata: { registrationId, eventId: event.id },
      success_url: `${url}/inscription?status=success`,
      cancel_url: `${url}/inscription?status=cancelled`,
    });
    checkoutUrl = session.url;
    await db
      .update(registrations)
      .set({ stripeSessionId: session.id })
      .where(eq(registrations.id, registrationId));
  } catch (err) {
    // Échec du paiement : on supprime l'inscription orpheline.
    await db
      .delete(registrations)
      .where(eq(registrations.id, registrationId))
      .catch(() => {});
    console.error("Stripe checkout failed:", (err as Error).message);
    return NextResponse.json(
      {
        error:
          "Le paiement est momentanément indisponible. Réessaie dans un instant.",
      },
      { status: 503 },
    );
  }

  // Réponses stockées une fois la session de paiement créée avec succès.
  await db.insert(questionnaireAnswers).values({ registrationId, answers });

  return NextResponse.json({ url: checkoutUrl });
}

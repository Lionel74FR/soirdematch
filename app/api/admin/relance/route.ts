import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { events, registrations } from "@/lib/db/schema";
import { isAuthenticated } from "@/lib/admin-auth";
import { getStripe } from "@/lib/stripe";
import { sendPaymentReminderEmail } from "@/lib/email";
import { audit } from "@/lib/audit";

export const runtime = "nodejs";

/** Base URL de confiance pour les redirections Stripe (jamais un header client). */
function baseUrl(req: NextRequest): string {
  if (process.env.APP_BASE_URL) return process.env.APP_BASE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return new URL(req.url).origin;
}

/**
 * Relance une personne dont le paiement n'a pas été finalisé (statut « pending ») :
 * crée une nouvelle session Stripe Checkout, met à jour le stripeSessionId, puis
 * envoie l'email de relance avec le lien de paiement. Le statut reste « pending » ;
 * la personne passera « paid » via le webhook après règlement.
 */
export async function POST(req: NextRequest) {
  if (!isAuthenticated()) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  let body: { registrationId?: string };
  try {
    body = (await req.json()) as { registrationId?: string };
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const registrationId = body.registrationId;
  if (!registrationId) {
    return NextResponse.json(
      { error: "Inscription manquante." },
      { status: 400 },
    );
  }

  const [reg] = await db
    .select()
    .from(registrations)
    .where(eq(registrations.id, registrationId))
    .limit(1);

  if (!reg) {
    return NextResponse.json(
      { error: "Inscription introuvable." },
      { status: 404 },
    );
  }

  if (reg.status !== "pending") {
    return NextResponse.json(
      { error: "Seules les personnes en attente de paiement peuvent être relancées." },
      { status: 409 },
    );
  }

  const [event] = await db
    .select()
    .from(events)
    .where(eq(events.id, reg.eventId))
    .limit(1);

  if (!event) {
    return NextResponse.json({ error: "Soirée introuvable." }, { status: 409 });
  }

  const url = baseUrl(req);

  let checkoutUrl: string | null = null;
  let sessionId: string | null = null;
  try {
    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      customer_email: reg.email,
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
      metadata: { registrationId: reg.id, eventId: event.id },
      success_url: `${url}/inscription?status=success`,
      cancel_url: `${url}/inscription?status=cancelled`,
    });
    checkoutUrl = session.url;
    sessionId = session.id;
  } catch (err) {
    console.error("Stripe checkout (relance) failed:", (err as Error).message);
    return NextResponse.json(
      { error: "Le paiement est momentanément indisponible. Réessaie." },
      { status: 503 },
    );
  }

  if (!checkoutUrl) {
    return NextResponse.json(
      { error: "Lien de paiement indisponible." },
      { status: 503 },
    );
  }

  // On enregistre la dernière session utilisée — uniquement si toujours
  // « pending ». Ainsi, si le paiement s'est finalisé (webhook) ou si le statut
  // a changé entre-temps, on n'envoie pas de relance à quelqu'un déjà payé.
  const updated = await db
    .update(registrations)
    .set({ stripeSessionId: sessionId })
    .where(
      and(eq(registrations.id, reg.id), eq(registrations.status, "pending")),
    )
    .returning({ id: registrations.id });

  if (updated.length === 0) {
    return NextResponse.json(
      {
        error:
          "Cette personne n'est plus en attente de paiement (déjà payée ou statut modifié).",
      },
      { status: 409 },
    );
  }

  // Si l'email échoue, le statut reste « pending » : l'admin peut simplement
  // recliquer sur « Relancer » (le lien de paiement reste valable).
  let emailSent = false;
  try {
    emailSent = await sendPaymentReminderEmail({
      to: reg.email,
      firstName: reg.firstName,
      eventTitle: event.title,
      eventDate: event.eventDate,
      checkoutUrl,
    });
  } catch (err) {
    console.error("Envoi de l'email de relance échoué :", err);
    return NextResponse.json(
      { error: "L'email n'a pas pu être envoyé. Réessaie dans un instant." },
      { status: 502 },
    );
  }

  if (!emailSent) {
    return NextResponse.json(
      {
        error:
          "Service d'email non configuré : impossible d'envoyer le lien de paiement.",
      },
      { status: 503 },
    );
  }

  await audit("relance_payment", "registration", reg.id, {
    email: reg.email,
    stripeSessionId: sessionId,
  });

  return NextResponse.json({ ok: true });
}

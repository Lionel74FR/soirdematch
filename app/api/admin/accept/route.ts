import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { events, registrations } from "@/lib/db/schema";
import { isAuthenticated } from "@/lib/admin-auth";
import { getStripe } from "@/lib/stripe";
import { sendWaitlistAcceptedEmail } from "@/lib/email";
import { audit } from "@/lib/audit";

export const runtime = "nodejs";

/** Base URL de confiance pour les redirections Stripe (jamais un header client). */
function baseUrl(req: NextRequest): string {
  if (process.env.APP_BASE_URL) return process.env.APP_BASE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return new URL(req.url).origin;
}

/**
 * Accepte une personne en liste d'attente : crée une session Stripe Checkout
 * pour son inscription, la fait passer en « pending », puis lui envoie un email
 * avec le lien de paiement. Elle deviendra « paid » via le webhook après règlement.
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

  if (reg.status !== "waitlist") {
    return NextResponse.json(
      { error: "Cette personne n'est pas en liste d'attente." },
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
    console.error("Stripe checkout (accept) failed:", (err as Error).message);
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

  // Passage en « pending » — uniquement si toujours en liste d'attente
  // (évite un double traitement si deux clics simultanés).
  const updated = await db
    .update(registrations)
    .set({ status: "pending", stripeSessionId: sessionId })
    .where(
      and(eq(registrations.id, reg.id), eq(registrations.status, "waitlist")),
    )
    .returning({ id: registrations.id });

  if (updated.length === 0) {
    return NextResponse.json(
      { error: "Cette personne a déjà été acceptée." },
      { status: 409 },
    );
  }

  // Si l'email échoue, on remet l'inscription en « liste d'attente » pour que
  // l'admin puisse relancer l'acceptation (sinon elle resterait bloquée en
  // « pending » sans lien de paiement envoyé).
  async function revertToWaitlist() {
    await db
      .update(registrations)
      .set({ status: "waitlist", stripeSessionId: reg.stripeSessionId })
      .where(eq(registrations.id, reg.id));
  }

  let emailSent = false;
  try {
    emailSent = await sendWaitlistAcceptedEmail({
      to: reg.email,
      firstName: reg.firstName,
      eventTitle: event.title,
      eventDate: event.eventDate,
      checkoutUrl,
    });
  } catch (err) {
    console.error("Envoi de l'email d'acceptation échoué :", err);
    await revertToWaitlist();
    return NextResponse.json(
      {
        error:
          "L'email n'a pas pu être envoyé. Réessaie dans un instant.",
      },
      { status: 502 },
    );
  }

  if (!emailSent) {
    await revertToWaitlist();
    return NextResponse.json(
      {
        error:
          "Service d'email non configuré : impossible d'envoyer le lien de paiement.",
      },
      { status: 503 },
    );
  }

  await audit("accept_waitlist", "registration", reg.id, {
    email: reg.email,
    stripeSessionId: sessionId,
  });

  return NextResponse.json({ ok: true });
}

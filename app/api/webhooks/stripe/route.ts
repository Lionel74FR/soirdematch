import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { events, registrations } from "@/lib/db/schema";
import { getStripe } from "@/lib/stripe";
import { audit } from "@/lib/audit";
import { sendRegistrationConfirmation } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Webhook Stripe — confirme les paiements.
 * Stripe appelle cette route après un paiement ; on vérifie la signature
 * (STRIPE_WEBHOOK_SECRET) puis on passe l'inscription correspondante à
 * paid = true / status = 'paid'. C'est le SEUL endroit où une inscription
 * devient « confirmée ». L'opération est idempotente (Stripe peut réessayer).
 */
export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("STRIPE_WEBHOOK_SECRET n'est pas défini.");
    return NextResponse.json(
      { error: "Webhook non configuré." },
      { status: 500 },
    );
  }

  // Erreur de configuration serveur (clé Stripe absente) → 500, distinct d'une
  // signature invalide (400), pour que Stripe réessaie au bon moment.
  let stripe: Stripe;
  try {
    stripe = getStripe();
  } catch (err) {
    console.error("Stripe mal configuré :", (err as Error).message);
    return NextResponse.json(
      { error: "Webhook non configuré." },
      { status: 500 },
    );
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json(
      { error: "Signature manquante." },
      { status: 400 },
    );
  }

  // La vérification de signature exige le corps brut, non parsé.
  const rawBody = await req.text();

  let evt: Stripe.Event;
  try {
    evt = stripe.webhooks.constructEvent(rawBody, signature, secret);
  } catch (err) {
    console.error("Signature Stripe invalide :", (err as Error).message);
    return NextResponse.json({ error: "Signature invalide." }, { status: 400 });
  }

  if (
    evt.type === "checkout.session.completed" ||
    evt.type === "checkout.session.async_payment_succeeded"
  ) {
    const session = evt.data.object as Stripe.Checkout.Session;

    if (session.payment_status === "paid") {
      const registrationId = session.metadata?.registrationId ?? null;
      const idMatch = registrationId
        ? eq(registrations.id, registrationId)
        : eq(registrations.stripeSessionId, session.id);

      // Ne met à jour que les inscriptions pas encore payées : si Stripe
      // renvoie le même événement, aucune ligne n'est touchée et l'audit
      // n'est pas dupliqué.
      const updated = await db
        .update(registrations)
        .set({ paid: true, status: "paid" })
        .where(and(idMatch, eq(registrations.paid, false)))
        .returning({ id: registrations.id });

      if (updated.length > 0) {
        await audit("payment_confirmed", "registration", updated[0].id, {
          stripeSessionId: session.id,
          amountTotal: session.amount_total,
          currency: session.currency,
        });

        // Email de confirmation — envoyé une seule fois (au passage à paid),
        // donc jamais dupliqué sur une nouvelle tentative Stripe. Non bloquant :
        // un échec d'email ne doit pas faire échouer le webhook.
        try {
          const [reg] = await db
            .select({
              firstName: registrations.firstName,
              email: registrations.email,
              eventId: registrations.eventId,
            })
            .from(registrations)
            .where(eq(registrations.id, updated[0].id))
            .limit(1);

          if (reg) {
            const [ev] = await db
              .select({
                title: events.title,
                eventDate: events.eventDate,
              })
              .from(events)
              .where(eq(events.id, reg.eventId))
              .limit(1);

            await sendRegistrationConfirmation({
              to: reg.email,
              firstName: reg.firstName,
              eventTitle: ev?.title ?? "Soir de Match",
              eventDate: ev?.eventDate ?? new Date(),
            });
          }
        } catch (err) {
          console.error(
            "Envoi de l'email de confirmation échoué :",
            (err as Error).message,
          );
        }
      }
    }
  }

  return NextResponse.json({ received: true });
}

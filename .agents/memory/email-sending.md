---
name: Email sending (Resend)
description: How/where confirmation emails are sent and the non-obvious config gotcha
---

# Confirmation emails (Resend)

Confirmation emails for paid registrations are sent from the **Stripe webhook**
(`checkout.session.completed` / `async_payment_succeeded`), at the moment the
registration row flips `paid=false -> paid=true`. This makes the send idempotent
(no duplicate on Stripe retries) and decoupled from the success-redirect page
(which is unreliable — user may never return). Sending is **non-blocking**: an
email failure is logged but the webhook still returns 200.

**Why webhook, not the success page:** the webhook is the only reliable "paid"
signal; the success_url redirect can be missed.

## The non-obvious gotcha
Having `RESEND_API_KEY` set is **not enough**. The FROM address must be on a
**domain verified in Resend** (SPF/DKIM DNS records). If the domain isn't
verified, sends are rejected/dropped even with a valid key — and because sending
is best-effort (no retry/outbox), the email is just lost (logged only).

- FROM is configurable via env `RESEND_FROM` (default
  `Soir de Match <noreply@soir-de-match.app>`).
- Delivery is best-effort: no outbox/retry queue. If guaranteed delivery is
  needed later, add an outbox table + cron retry.

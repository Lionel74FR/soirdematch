---
name: Inscription quota & neon-http transaction limits
description: Why per-gender quota enforcement is best-effort single-statement, and the neon-http driver constraint behind it.
---

# Quota parity enforcement (registration flow)

The `/api/inscription` submit checks a per-gender quota (`events.gender_quota`,
applies to `homme`/`femme`; counts registrations with status `pending`+`paid`).
It is implemented as a SINGLE atomic SQL statement:
`INSERT INTO registrations (...) SELECT ... WHERE (SELECT count(*) ...) < quota RETURNING id`.
Zero rows returned ⇒ quota reached ⇒ propose waitlist; one row ⇒ proceed to Stripe.

**Why not fully race-proof:** under Postgres READ COMMITTED, two concurrent
inserts can both read the same pre-insert count and both succeed, oversubscribing
by 1–2. Accepted for V1 — single venue, ~50 seats, registrations trickle over
weeks, and a 1-off overflow is organizer-recoverable. The architect flags this as
critical in the abstract; the trade-off is deliberate, not an oversight.

**Why not the "correct" fix:** a truly race-free fix needs either (a) an
interactive transaction with `SELECT ... FOR UPDATE` on the event row, or
(b) a dedicated quota-counter row updated via `UPDATE ... WHERE used < quota
RETURNING` (row lock serializes it). neon-http (drizzle `neon-http`) has **no
interactive transactions and no session-persistent locks** — each call is a
stateless autocommit HTTP request, so (a) is impossible without switching this
route to the WebSocket `Pool` driver (needs the `ws` package + `neonConfig`).
(b) works on neon-http but duplicates the source of truth and risks counter
drift once admin/webhook/cancellation paths mutate registrations.

**How to apply:** if event volume or number of venues grows, harden by adding a
quota-counter table with `UPDATE ... WHERE used < quota RETURNING`, or move the
route to the neon `Pool` driver and lock the event row in a transaction. Until
then, keep the single-statement form.

## Related notes in this flow
- Stripe checkout creation is wrapped in try/catch; on failure the just-created
  registration row is deleted and a 503 is returned. `questionnaire_answers` is
  inserted only AFTER the checkout session succeeds (no orphan answer rows).
- Stripe redirect base URL = `APP_BASE_URL || https://$VERCEL_URL || req.url origin`.
  Never the client `Origin` header. On Vercel `VERCEL_URL` is always set, so the
  `req.url` fallback only matters in local dev.
- Meta CAPI: `StartQuestionnaire` fires once on real form open (skipped on the
  `?status=success` terminal view); `CompleteRegistration` fires on final submit.

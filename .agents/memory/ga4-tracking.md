---
name: GA4 tracking timing
description: Why GA4 gtag bootstrap must load beforeInteractive in this Next.js app
---

# GA4 gtag bootstrap must be `beforeInteractive`

Funnel events are fired from a `useEffect` on mount (e.g. `start_questionnaire`,
`complete_registration` on the Stripe `?status=success` return). If the gtag
bootstrap (dataLayer + gtag stub + `config`) loads `afterInteractive`, those
first-render events fire before `window.gtag` exists and are silently dropped.

**Rule:** load the inline init script (`dataLayer`, `gtag` stub, `gtag('config', id)`)
with `strategy="beforeInteractive"` so config is queued before any React effect;
keep the gtag.js library loader `afterInteractive`. Also keep `trackEvent` queue-safe
(install the official `gtag` stub pushing `arguments` to `dataLayer` if missing).

**Why:** guarantees the most important conversion events are never lost on direct
loads / hard refresh / payment-success redirect.

**How to apply:** any new GA event fired during initial render/mount relies on this
ordering; don't downgrade the init script to afterInteractive.

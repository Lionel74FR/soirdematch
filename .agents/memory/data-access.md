---
name: Data access (Neon vs Replit DB)
description: Where the app's real data lives and how to query it from the Replit dev env
---

# Querying app data

The app's real registrations/events/matches data lives in **Neon**, reached via
the `NEON_DATABASE_URL` secret (see `lib/db/client.ts`, which prefers
`NEON_DATABASE_URL` over `DATABASE_URL`). This is the same data the deployed
Vercel app uses.

**Do NOT use the `executeSql` code-execution callback** to inspect app data — it
targets the Replit-managed Postgres (`DATABASE_URL`, a "helium" instance), which
is **empty / not the app's data**. A query there returns 0 rows and looks like
data loss when it is just the wrong database.

**How to query the real data:** run a short node script from the **project root**
(so `@neondatabase/serverless` resolves) using `neon(process.env.NEON_DATABASE_URL)`.
Scripts placed in `/tmp` fail with ERR_MODULE_NOT_FOUND — copy them into the repo
root, run, then delete.

**Why:** In dev, `DATABASE_URL` points to a helium Postgres incompatible with the
neon-http driver, so the app uses `NEON_DATABASE_URL`; the two are different
databases. Treat Neon as production data — destructive edits there are real and
irreversible (confirm with the user first).

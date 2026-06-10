---
name: Neon DATABASE_URL vs Replit reserved DATABASE_URL
description: This Vercel-targeted project uses Neon, but Replit reserves DATABASE_URL for its built-in Postgres; how dev migrations are run here.
---

This project deploys to **Vercel** (not Replit hosting) and uses **Neon** Postgres.

**Constraint:** Replit reserves `DATABASE_URL` for its own built-in Postgres and
auto-populates it from the user's account. `requestEnvVar` refuses `DATABASE_URL`
("directly populated by Replit"), and the skill says not to modify it.

**Decision:** The Neon connection string is stored in this repl as the secret
`NEON_DATABASE_URL` (not `DATABASE_URL`). App code (`lib/db/client.ts`,
`drizzle.config.ts`) reads `DATABASE_URL` only — correct for Vercel, where Vercel
Storage injects `DATABASE_URL=<Neon>` automatically.

**How to apply (running Drizzle against Neon from the Replit shell):** secrets are
exposed as env vars in the bash tool, so override per-command without ever printing
the value:
`DATABASE_URL="$NEON_DATABASE_URL" npm run db:push` (or `db:generate`/`db:studio`).

**Git push:** origin is `github.com/Lionel74FR/soirdematch`. Authenticated push to
GitHub must go through Replit's Git pane (Push/Sync) — a raw CLI `git push` from the
shell lacks the user's GitHub auth. Checkpoints commit locally on `main` automatically.

**delete_after (registrations):** kept as a plain nullable timestamp per spec; the
`event_date + 30 days` GDPR-purge rule is applied in app logic at registration time,
not via a DB trigger (intentional — don't add a trigger unless asked).

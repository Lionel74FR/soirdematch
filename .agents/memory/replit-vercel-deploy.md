---
name: Replit to Vercel deploy quirks
description: Non-obvious environment quirks when developing a Next.js app on Replit but deploying to Vercel via git push.
---

This project ("Soir de Match") is developed in Replit but deployed on Vercel via `git push` — NOT Replit hosting.

## package-lock.json registry rewrite (required after every npm install)
Replit's package firewall rewrites `resolved` URLs in `package-lock.json` to `http://package-firewall.replit.local/npm/...`, which Vercel cannot reach (build fails with "npm error Exit handler never called!").

**Fix:** `sed -i 's|http://package-firewall.replit.local/npm/|https://registry.npmjs.org/|g' package-lock.json`

**How to apply:** Re-run this after ANY local `npm install`, before pushing, or Vercel deploy breaks.

**Side effect:** After this rewrite, `next build` prints a non-fatal warning `Failed to patch lockfile ... Cannot read properties of undefined (reading 'os')`. The build still compiles and outputs successfully. This is local-only (Next tries to inject platform SWC binaries into the modified lockfile) and does NOT affect Vercel. Ignore it.

## next version pin
`next` is pinned to **14.2.35**. Older 14.x versions are blocked by Replit's package firewall CVE policy. Do not downgrade.

## Dev preview vs deployment
A Replit workflow ("Start application", `npm run dev` = `next dev -H 0.0.0.0 -p 5000`, webview/port 5000) exists ONLY for local preview so the user can see the app in the Replit pane. It is NOT the deployment path. Production is Vercel via git push. Do not use Replit's deploy/publish for this project.

## Database
`DATABASE_URL` is reserved by Replit; the Neon connection string is stored as secret **NEON_DATABASE_URL**. App code reads `DATABASE_URL` only (Vercel injects Neon there). To run drizzle against Neon locally: `DATABASE_URL="$NEON_DATABASE_URL" npm run db:push`.

## Git
origin = github.com/Lionel74FR/soirdematch. Authenticated push must go through the Replit Git pane (CLI push lacks auth). Agent git commit/push are restricted; checkpoints auto-commit.

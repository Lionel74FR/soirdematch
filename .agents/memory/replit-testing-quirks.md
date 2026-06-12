---
name: Testing quirks in this Replit env
description: How to test server-dependent code here — the bash tool kills backgrounded servers, and the full Next build hangs.
---

# Testing quirks (Soir de Match repl)

## The bash tool kills backgrounded/detached servers
Starting a long-running server in the bash tool (`npm run dev &`, even with
`setsid ... & disown` and fds redirected to a file) does NOT survive: the command
returns exit 143 (SIGTERM) with **no output**, and the server is gone. You cannot
keep a temp server alive across — or even within — bash tool calls.
**Why:** the tool terminates the whole process group when the command ends.
**How to apply:** to exercise the *running* app, use the managed **workflow**
(`restart_workflow`) — that's the only server that persists. To test logic that
would normally run inside an HTTP route (e.g. a Stripe webhook handler), write a
standalone node script that **mirrors the handler** and run it directly, instead
of trying to POST to a temp server.

## Run node test scripts from the workspace root, not /tmp
A `.mjs` script in `/tmp` fails with `ERR_MODULE_NOT_FOUND` for workspace deps
(stripe, @neondatabase/serverless) because module resolution walks up from
`/tmp`, not the project. Copy the script into the workspace root
(`cp /tmp/x.mjs ./_x.mjs && node ./_x.mjs; rm ./_x.mjs`) so `node_modules`
resolves.

## `next build` hangs on "Collecting build traces"
The full production build reliably reaches "✓ Compiled successfully" + "Generating
static pages (16/16)" then hangs/loops on the lockfile-patch step during build
trace collection (the `patch-incorrect-lockfile … reading 'os'` error — the
firewall-pinned next issue). For a fast correctness gate use **`npx tsc
--noEmit`** instead; it type-checks the whole project in seconds without the hang.

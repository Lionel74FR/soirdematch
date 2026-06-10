---
name: Admin space (Soir de Match)
description: Durable decisions for the /admin space — who counts as "confirmé", the smoking filter proxy, and how to test cookie-auth endpoints.
---

# Admin space decisions

## "Confirmé" = paid, not pending
Matching (`/api/admin/matching`) and badge assignment (`/api/admin/badges`)
operate **only on `registrations.paid = true`**, never on `pending`.
**Why:** spec says "inscrits confirmés"; product-wise you only matchmake and
badge people who actually paid. Dashboard still shows pending vs paid separately.
**How to apply:** if you ever broaden these to include pending, you are
diverging from the agreed semantics — flag it.

## Smoking dealbreaker is a divergence proxy
The questionnaire has NO "do you smoke?" field — only `smokingDealbreaker`
(oui = veut un non-fumeur / non = ça ne me dérange pas). The hard filter treats
`oui × non` as incompatible. It cannot truly filter smokers.
**Why:** there is no smoker attribute to filter on.
**How to apply:** to get real smoking filtering, add a "fumeur ?" question first.

## Branding constraint: "proIA Conseil" appears in exactly one place
The dev-credit "Site développé par proIA Conseil" must appear ONLY on
`/mentions-legales`. Everywhere else (footer, etc.) the brand is **Matalon
Events**. **Why:** explicit client requirement.
**How to apply:** before adding any "developed by"/credit text elsewhere, don't —
and if editing footers/about pages, keep proIA off them.

## Testing cookie-authed admin endpoints without a browser login
The screenshot/preview tool cannot submit the login form, so it always lands on
`/admin/login`. To test auth-gated routes from the shell, mint a valid session
cookie in node using the same scheme as `lib/admin-auth.ts`:
`token = `${exp}.${createHmac("sha256", ADMIN_PASSWORD).update(exp).digest("hex")}``
then `curl -H "Cookie: sdm_admin=$token" ...`. `ADMIN_PASSWORD` is in the shell
env once set, so this works for true E2E checks of matching/badges/dashboard SSR.

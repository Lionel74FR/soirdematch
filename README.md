# Next.js 14 — Vercel Deployment

Application Next.js 14 (App Router, TypeScript, Tailwind CSS) conçue pour être
**déployée sur Vercel via `git push`**, et non sur l'hébergement Replit.

## Stack

- **Next.js 14** — App Router, TypeScript
- **Tailwind CSS** — thème custom (couleurs + fonts Google via `next/font`)
- **Drizzle ORM** + **@neondatabase/serverless** — base PostgreSQL Neon
- **Stripe** — paiements
- **Resend** — emails transactionnels
- **Meta Conversions API** — tracking server-side
- **@vercel/blob** — stockage de fichiers
- **GSAP** — animations

## Développement local

```bash
npm install
cp .env.example .env.local   # puis renseigne les valeurs
npm run dev
```

L'application démarre sur http://localhost:3000.

## Base de données (Neon)

La base **Neon** doit être provisionnée via **Vercel Storage**, en **région UE**.

1. Dans le dashboard Vercel → onglet **Storage** → **Create Database** → **Neon**.
2. Sélectionne une région **Europe (EU)**.
3. Vercel injecte automatiquement `DATABASE_URL` dans les variables du projet.

Schéma & migrations Drizzle :

```bash
npm run db:generate   # génère les migrations SQL
npm run db:push       # applique le schéma à la base
npm run db:studio     # interface Drizzle Studio
```

## Variables d'environnement

Toutes les variables sont listées dans [`.env.example`](./.env.example).
En production, configure-les dans le **dashboard Vercel** :

**Project Settings → Environment Variables**

| Variable | Description |
| --- | --- |
| `DATABASE_URL` | Connexion Neon (injectée par Vercel Storage) |
| `STRIPE_SECRET_KEY` | Clé secrète Stripe |
| `STRIPE_WEBHOOK_SECRET` | Secret de signature des webhooks Stripe |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Clé publique Stripe (client) |
| `RESEND_API_KEY` | Clé API Resend |
| `META_PIXEL_ID` | ID du Pixel Meta |
| `META_CAPI_TOKEN` | Token de la Conversions API Meta |
| `BLOB_READ_WRITE_TOKEN` | Token Vercel Blob |
| `ADMIN_PASSWORD` | Mot de passe d'accès admin |

## Déploiement

Le déploiement se fait **sur Vercel via Git** :

```bash
git push origin main
```

Chaque push sur `main` déclenche un déploiement de production sur Vercel.
Connecte d'abord le dépôt à un projet Vercel (Import Git Repository), puis
configure les variables d'environnement ci-dessus dans le dashboard.

## Structure du projet

```
app/                 # Routes (App Router)
  api/               # Routes API (route handlers)
  fonts.ts           # Fonts Google (next/font)
  layout.tsx         # Layout racine
  page.tsx           # Page d'accueil
  globals.css        # Styles globaux Tailwind
lib/                 # Logique applicative
  db/
    client.ts        # Client Drizzle (Neon)
    schema.ts        # Schéma de base de données
  stripe.ts          # Client Stripe
  resend.ts          # Client Resend
  meta-capi.ts       # Meta Conversions API
  utils.ts           # Utilitaires
components/          # Composants React réutilisables
```

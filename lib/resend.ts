import { Resend } from "resend";

let client: Resend | null = null;

/**
 * Renvoie le client Resend, ou null si RESEND_API_KEY n'est pas défini.
 * Lazy + non bloquant : l'absence de clé ne doit jamais faire planter
 * l'import d'une route (ex. webhook Stripe).
 */
export function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (!client) client = new Resend(key);
  return client;
}

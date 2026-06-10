import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "sdm_admin";
const SESSION_MS = 8 * 60 * 60 * 1000; // 8 h
export const SESSION_MAX_AGE = Math.floor(SESSION_MS / 1000);

function hmac(payload: string, key: string): string {
  return createHmac("sha256", key).update(payload).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/** Vérifie le mot de passe fourni contre ADMIN_PASSWORD (comparaison constante). */
export function checkPassword(input?: string): boolean {
  const key = process.env.ADMIN_PASSWORD;
  if (!key || !input) return false;
  return safeEqual(input, key);
}

/** Jeton de session signé : `${expiration}.${HMAC(expiration)}`. */
export function createSessionToken(): string {
  const key = process.env.ADMIN_PASSWORD;
  if (!key) throw new Error("ADMIN_PASSWORD environment variable is not set");
  const exp = String(Date.now() + SESSION_MS);
  return `${exp}.${hmac(exp, key)}`;
}

export function verifySessionToken(token?: string): boolean {
  const key = process.env.ADMIN_PASSWORD;
  if (!key || !token) return false;
  const [exp, sig] = token.split(".");
  if (!exp || !sig) return false;
  const expMs = Number(exp);
  if (!Number.isFinite(expMs) || expMs < Date.now()) return false;
  try {
    return safeEqual(sig, hmac(exp, key));
  } catch {
    return false;
  }
}

/** Lit le cookie de session côté serveur et confirme l'authentification. */
export function isAuthenticated(): boolean {
  return verifySessionToken(cookies().get(ADMIN_COOKIE)?.value);
}

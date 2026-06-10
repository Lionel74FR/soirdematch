import Stripe from "stripe";

let cached: Stripe | null = null;

/**
 * Returns a lazily-instantiated Stripe client.
 * Throws only when actually called without STRIPE_SECRET_KEY set,
 * so importing this module at build time never crashes.
 */
export function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY environment variable is not set");
  }
  if (!cached) {
    cached = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-02-24.acacia",
      typescript: true,
    });
  }
  return cached;
}

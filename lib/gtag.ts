/**
 * Envoie un événement à Google Analytics 4 (côté client).
 *
 * Résilient au timing de chargement de gtag.js : si `window.gtag` n'est pas
 * encore prêt, on installe l'amorce officielle (qui empile les appels dans
 * `dataLayer`) pour que l'événement soit traité dès que la librairie charge.
 * Sans effet lors du rendu serveur.
 */
export function trackEvent(
  name: string,
  params?: Record<string, unknown>,
): void {
  if (typeof window === "undefined") return;
  const w = window as unknown as {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  };
  w.dataLayer = w.dataLayer || [];
  if (typeof w.gtag !== "function") {
    w.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params
      w.dataLayer!.push(arguments);
    } as (...args: unknown[]) => void;
  }
  w.gtag("event", name, params ?? {});
}

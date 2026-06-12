"use client";

import Script from "next/script";

/**
 * Google Analytics 4 (gtag.js). Le Measurement ID (G-XXXX) est public :
 * il est volontairement exposé côté client via NEXT_PUBLIC_GA_MEASUREMENT_ID.
 * Le composant ne rend rien si l'ID n'est pas défini.
 *
 * L'amorce (dataLayer + gtag + config) est chargée en `beforeInteractive`
 * afin que `window.gtag` et la configuration soient prêts AVANT le premier
 * rendu React. Les événements émis dans un useEffect au montage (ex.
 * start_questionnaire, complete_registration) ne sont donc jamais perdus.
 */
export default function GoogleAnalytics({ gaId }: { gaId: string }) {
  return (
    <>
      <Script id="ga-init" strategy="beforeInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          gtag('config', '${gaId}');
        `}
      </Script>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />
    </>
  );
}

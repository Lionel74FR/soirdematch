"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

type Fbq = (...args: unknown[]) => void;

/**
 * Pixel Meta (Facebook) côté navigateur. Le Pixel ID est public : il est
 * visible dans les requêtes émises par le navigateur. Il complète le suivi
 * serveur (Conversions API) déjà en place.
 *
 * Anti-doublon PageView :
 * - `fbq('init', …)` est exécuté UNE SEULE FOIS via un script `beforeInteractive`
 *   (avant l'hydratation), donc `window.fbq` est prêt avant tout effet React.
 * - `fbq('track', 'PageView')` n'est PAS dans le snippet inline : il est émis
 *   uniquement depuis un `useEffect` déclenché par `usePathname`, ce qui donne
 *   exactement 1 PageView au premier chargement, puis 1 à chaque changement de
 *   route (navigation App Router).
 * - Un garde au niveau module (`lastTrackedPath`) empêche un second envoi pour
 *   un chemin identique (ex. double invocation des effets par React Strict Mode
 *   en développement).
 */

let lastTrackedPath: string | null = null;

export default function FacebookPixel({ pixelId }: { pixelId: string }) {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const fbq = (window as unknown as { fbq?: Fbq }).fbq;
    if (!fbq) return;
    if (pathname === lastTrackedPath) return;
    lastTrackedPath = pathname;
    fbq("track", "PageView");
  }, [pathname]);

  return (
    <>
      <Script id="fb-pixel-init" strategy="beforeInteractive">
        {`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${pixelId}');
        `}
      </Script>
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  );
}

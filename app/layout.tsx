import type { Metadata } from "next";
import { montserrat, poppins, spaceMono } from "./fonts";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import FacebookPixel from "@/components/FacebookPixel";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://soir-de-match.app"),
  title: {
    default: "Soir de Match — Soirée célibataires à Annecy",
    template: "%s · Soir de Match",
  },
  description:
    "La soirée célibataires d'Annecy où l'algorithme a déjà fait les présentations. Profils compatibles, buffet inclus, DJ et afterparty au Chardon d'Écosse.",
  keywords: [
    "soirée célibataires",
    "rencontre",
    "Annecy",
    "célibataires",
    "algorithme",
    "Soir de Match",
    "Le Chardon d'Écosse",
  ],
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: "https://soir-de-match.app",
    siteName: "Soir de Match",
    title: "Soir de Match — Soirée célibataires à Annecy",
    description:
      "La soirée célibataires d'Annecy où l'algorithme a déjà fait les présentations. Profils compatibles, buffet inclus, DJ et afterparty au Chardon d'Écosse.",
    images: [
      {
        url: "https://soir-de-match.app/og-image.png",
        width: 1200,
        height: 630,
        alt: "Soir de Match — Soirée célibataires à Annecy",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Soir de Match — Soirée célibataires à Annecy",
    description:
      "La soirée célibataires d'Annecy où l'algorithme a déjà fait les présentations. Profils compatibles, buffet inclus, DJ et afterparty au Chardon d'Écosse.",
    images: ["https://soir-de-match.app/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const gaId =
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "G-Y3F5325JWP";
  const fbPixelId =
    process.env.NEXT_PUBLIC_META_PIXEL_ID || "1020187170361219";
  return (
    <html
      lang="fr"
      className={`${montserrat.variable} ${poppins.variable} ${spaceMono.variable}`}
    >
      <body>
        {children}
        {gaId ? <GoogleAnalytics gaId={gaId} /> : null}
        {fbPixelId ? <FacebookPixel pixelId={fbPixelId} /> : null}
      </body>
    </html>
  );
}

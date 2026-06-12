import type { Metadata } from "next";
import { montserrat, poppins, spaceMono } from "./fonts";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://soir-de-match.app"),
  title: {
    default: "Soir de Match — Speed-dating à Annecy",
    template: "%s · Soir de Match",
  },
  description:
    "Une soirée speed-dating au Chardon d'Écosse, à Annecy. Rencontre des célibataires près de chez toi autour d'un verre, puis découvre tes matchs.",
  keywords: [
    "speed dating",
    "Annecy",
    "rencontre",
    "célibataires",
    "Soir de Match",
    "Le Chardon d'Écosse",
  ],
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: "https://soir-de-match.app",
    siteName: "Soir de Match",
    title: "Soir de Match — Speed-dating à Annecy",
    description:
      "Une soirée speed-dating au Chardon d'Écosse, à Annecy. Rencontre des célibataires près de chez toi autour d'un verre, puis découvre tes matchs.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Soir de Match — Speed-dating à Annecy",
    description:
      "Une soirée speed-dating au Chardon d'Écosse, à Annecy. Rencontre des célibataires près de chez toi autour d'un verre.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const gaId =
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "G-Y3F5325JWP";
  return (
    <html
      lang="fr"
      className={`${montserrat.variable} ${poppins.variable} ${spaceMono.variable}`}
    >
      <body>
        {children}
        {gaId ? <GoogleAnalytics gaId={gaId} /> : null}
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { montserrat, poppins, spaceMono } from "./fonts";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import "./globals.css";

export const metadata: Metadata = {
  title: "Next.js App",
  description: "Next.js 14 application deployed on Vercel",
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

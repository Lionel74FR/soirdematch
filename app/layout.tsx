import type { Metadata } from "next";
import { montserrat, poppins, spaceMono } from "./fonts";
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
  return (
    <html
      lang="fr"
      className={`${montserrat.variable} ${poppins.variable} ${spaceMono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}

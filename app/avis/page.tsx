import type { Metadata } from "next";
import AvisForm from "@/components/AvisForm";

export const metadata: Metadata = {
  title: "Ton avis — Soir de Match",
  description:
    "Dis-nous comment s'est passée ta soirée Soir de Match. 2 minutes, anonyme, et ça nous aide énormément.",
  robots: { index: false },
};

export default function AvisPage() {
  return <AvisForm />;
}

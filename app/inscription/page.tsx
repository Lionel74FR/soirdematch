import type { Metadata } from "next";
import Questionnaire from "@/components/Questionnaire";

export const metadata: Metadata = {
  title: "Inscription — Soir de Match",
  description:
    "Réponds au questionnaire pour participer à la soirée célibataires Soir de Match à Annecy. 3 minutes, et l'algorithme fait le reste.",
};

export default function InscriptionPage() {
  return <Questionnaire />;
}

import LegalLayout from "@/components/LegalLayout";

export const metadata = {
  title: "Mentions légales — Soir de Match",
};

export default function MentionsLegalesPage() {
  return (
    <LegalLayout title="Mentions légales">
      <h2>Éditeur du site</h2>
      <p>
        Le présent site « Soir de Match » est édité par{" "}
        <strong>Matalon Events</strong>.
      </p>
      <p>
        Responsable de la publication et responsable du traitement des données à
        caractère personnel : <strong>Lionel Hunziker</strong>.
      </p>

      <h2>Hébergement</h2>
      <p>
        Le site est hébergé par <strong>Vercel Inc.</strong> et sa base de
        données par <strong>Neon</strong>. Les données sont stockées sur des
        serveurs situés dans l&apos;Union européenne.
      </p>

      <h2>Propriété intellectuelle</h2>
      <p>
        L&apos;ensemble des contenus présents sur ce site (textes, visuels,
        identité graphique) est protégé par le droit de la propriété
        intellectuelle. Toute reproduction sans autorisation est interdite.
      </p>

      <h2>Données personnelles</h2>
      <p>
        Le traitement des données personnelles est détaillé dans notre{" "}
        <a href="/confidentialite">politique de confidentialité</a>, conformément
        au Règlement général sur la protection des données (RGPD).
      </p>

      <h2>Développement</h2>
      <p>Site développé par proIA Conseil.</p>
    </LegalLayout>
  );
}

import LegalLayout from "@/components/LegalLayout";

export const metadata = {
  title: "Politique de confidentialité — Soir de Match",
};

export default function ConfidentialitePage() {
  return (
    <LegalLayout title="Politique de confidentialité">
      <p>
        Cette politique décrit comment <strong>Matalon Events</strong>{" "}
        (responsable de traitement : Lionel Hunziker) collecte et traite vos
        données personnelles dans le cadre de l&apos;événement « Soir de Match »,
        conformément au RGPD.
      </p>

      <h2>Finalité du traitement</h2>
      <p>
        Vos données sont collectées dans l&apos;unique but d&apos;
        <strong>organiser la soirée</strong> et de réaliser l&apos;
        <strong>appariement (matching)</strong> des participants en fonction de
        leurs affinités et de leurs critères de rencontre.
      </p>

      <h2>Données collectées</h2>
      <ul>
        <li>Prénom, adresse email et numéro de téléphone ;</li>
        <li>Genre et année de naissance ;</li>
        <li>
          Critères de rencontre : orientation, tranche d&apos;âge recherchée,
          rapport au tabac ;
        </li>
        <li>
          Réponses au questionnaire d&apos;affinités : type de relation
          recherché, valeurs, centres d&apos;intérêt, énergie sociale ;
        </li>
        <li>Statut de paiement de la participation.</li>
      </ul>

      <h2>Base légale</h2>
      <p>
        Le traitement repose sur votre <strong>consentement</strong>, recueilli
        lors de l&apos;inscription, et sur l&apos;
        <strong>exécution du service</strong> auquel vous souscrivez.
      </p>

      <h2>Durée de conservation</h2>
      <p>
        Vos données sont conservées pendant la durée nécessaire à
        l&apos;organisation de l&apos;événement, puis{" "}
        <strong>supprimées définitivement 30 jours après la soirée</strong>. Cette
        suppression est automatisée.
      </p>

      <h2>Vos droits</h2>
      <p>
        Conformément au RGPD, vous disposez d&apos;un droit d&apos;
        <strong>accès</strong>, de <strong>rectification</strong>, de{" "}
        <strong>suppression</strong>, d&apos;opposition et de portabilité de vos
        données. Pour les exercer, contactez le responsable de traitement,
        Lionel Hunziker, via Matalon Events.
      </p>

      <h2>Sous-traitants</h2>
      <p>
        Pour fournir ce service, nous faisons appel aux sous-traitants suivants,
        qui n&apos;utilisent vos données que pour notre compte :
      </p>
      <ul>
        <li>
          <strong>Vercel</strong> — hébergement du site (serveurs UE) ;
        </li>
        <li>
          <strong>Neon</strong> — hébergement de la base de données (serveurs
          UE) ;
        </li>
        <li>
          <strong>Stripe</strong> — traitement sécurisé des paiements ;
        </li>
        <li>
          <strong>Resend</strong> — envoi des emails de confirmation ;
        </li>
        <li>
          <strong>Meta</strong> — mesure et optimisation des campagnes
          publicitaires.
        </li>
      </ul>
    </LegalLayout>
  );
}

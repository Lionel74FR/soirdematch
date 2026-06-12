import { getResend } from "./resend";

/**
 * Adresse d'expédition. DOIT appartenir à un domaine vérifié dans Resend
 * (sinon l'envoi est refusé). Surchargeable via RESEND_FROM.
 */
const FROM =
  process.env.RESEND_FROM || "Soir de Match <noreply@soir-de-match.app>";

function formatFrDate(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Europe/Paris",
  }).format(date);
}

type ConfirmationParams = {
  to: string;
  firstName: string;
  eventTitle: string;
  eventDate: Date;
};

/**
 * Envoie l'email de confirmation après un paiement réussi.
 * No-op (avec avertissement) si Resend n'est pas configuré.
 * Lève une erreur si Resend renvoie un échec, pour que l'appelant la logue.
 */
export async function sendRegistrationConfirmation(
  params: ConfirmationParams,
): Promise<void> {
  const resend = getResend();
  if (!resend) {
    console.warn(
      "Resend non configuré (RESEND_API_KEY absente) : email de confirmation non envoyé.",
    );
    return;
  }

  const dateStr = formatFrDate(params.eventDate);
  const html = confirmationHtml({
    firstName: params.firstName,
    eventTitle: params.eventTitle,
    dateStr,
  });

  const { error } = await resend.emails.send({
    from: FROM,
    to: params.to,
    subject: "Ta place pour Soir de Match est confirmée 💘",
    html,
  });

  if (error) {
    throw new Error(
      `Resend: ${error.message ?? JSON.stringify(error)}`,
    );
  }
}

function confirmationHtml({
  firstName,
  eventTitle,
  dateStr,
}: {
  firstName: string;
  eventTitle: string;
  dateStr: string;
}): string {
  return `<!doctype html>
<html lang="fr">
  <body style="margin:0;padding:0;background:#0f1330;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1a1f3a;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">Ta place pour ${eventTitle} est réservée.</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0f1330;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fdf6ec;border-radius:20px;overflow:hidden;">
            <tr>
              <td style="background:#1a1f3a;padding:34px 32px 28px;text-align:center;">
                <div style="font-size:12px;letter-spacing:0.32em;color:#f5e9d8;font-weight:600;">SOIR DE MATCH</div>
                <div style="font-size:46px;line-height:1;margin-top:14px;">💘</div>
                <h1 style="margin:14px 0 0;font-size:25px;color:#fdf6ec;font-weight:800;">Ta place est réservée&nbsp;!</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:30px 32px 8px;">
                <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">Salut ${firstName},</p>
                <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">Ton paiement a bien été reçu et ta place pour <strong>${eventTitle}</strong> est confirmée. On a hâte de te voir&nbsp;!</p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 20px;background:#fff;border:1px solid #eaddc7;border-radius:14px;">
                  <tr>
                    <td style="padding:18px 20px;">
                      <div style="font-size:12px;letter-spacing:0.12em;color:#c9742f;font-weight:700;text-transform:uppercase;">Quand</div>
                      <div style="font-size:16px;margin-top:4px;color:#1a1f3a;font-weight:600;">${dateStr}</div>
                      <div style="font-size:12px;letter-spacing:0.12em;color:#c9742f;font-weight:700;text-transform:uppercase;margin-top:14px;">Où</div>
                      <div style="font-size:16px;margin-top:4px;color:#1a1f3a;font-weight:600;">Le Chardon d'Écosse — Annecy</div>
                    </td>
                  </tr>
                </table>
                <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">Tes matchs te seront révélés le soir même. D'ici là, prépare ton plus beau sourire&nbsp;😉</p>
                <p style="margin:0;font-size:16px;line-height:1.6;">À très vite,<br/>L'équipe Soir de Match</p>
              </td>
            </tr>
            <tr>
              <td style="padding:4px 32px 6px;">
                <a href="https://www.instagram.com/soirdematch/" style="text-decoration:none;display:block;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fff;border:1px solid #eaddc7;border-radius:14px;">
                    <tr>
                      <td width="48" valign="middle" style="padding:16px 0 16px 18px;">
                        <div style="width:40px;height:40px;border-radius:11px;background:linear-gradient(135deg,#ffc93c,#f07b5c,#cd6973);text-align:center;line-height:40px;font-size:20px;">📸</div>
                      </td>
                      <td valign="middle" style="padding:16px 18px;">
                        <div style="font-size:15px;font-weight:700;color:#1a1f3a;">Suis-nous sur Instagram</div>
                        <div style="font-size:13px;color:#8a8470;margin-top:2px;">Coulisses, ambiance et prochaines dates : @soirdematch</div>
                      </td>
                    </tr>
                  </table>
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 32px 30px;">
                <hr style="border:none;border-top:1px solid #eaddc7;margin:0 0 16px;" />
                <p style="margin:0;font-size:12px;line-height:1.6;color:#8a8470;">Tu reçois cet email car tu t'es inscrit(e) à une soirée Soir de Match. Tes données sont conservées 30&nbsp;jours après l'événement puis supprimées (voir notre politique de confidentialité).</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

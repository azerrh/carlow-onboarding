import { Resend } from "resend";

/**
 * Helpers d'envoi d'emails transactionnels via Resend.
 *
 * Stratégie défensive : si RESEND_API_KEY est absent (ex : déploiement
 * preview sans config), on logge un warning et on n'envoie pas — on ne
 * fait JAMAIS échouer le flow métier (inscription, paiement) à cause
 * d'un email qui ne part pas.
 *
 * Le domaine `onboarding@resend.dev` est fourni par Resend pour les
 * comptes en tier gratuit. Pour passer en prod avec un domaine custom
 * (`noreply@carlow.fr`), il faudra vérifier le domaine sur Resend.
 */

/**
 * Adresse d'expédition.
 *
 * - Par défaut : `onboarding@resend.dev` (domaine fourni par Resend en plan
 *   gratuit — limité à l'email du compte propriétaire).
 * - Une fois le domaine `carlow.fr` vérifié sur resend.com/domains, passer
 *   `RESEND_FROM_EMAIL=Carlow <noreply@carlow.fr>` dans `.env` et redéployer
 *   → tous les emails partiront depuis carlow.fr et arriveront chez tous
 *   les destinataires (plus de limite).
 *
 * Le format Resend accepte "Nom <email@domaine>" ou juste "email@domaine".
 */
const FROM = process.env.RESEND_FROM_EMAIL ?? "Carlow <onboarding@resend.dev>";
const SITE_URL = "https://carlowonboarding.vercel.app";

/** Lazy init : on évite de crash au build si la clé est absente. */
function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn(
      "[email] RESEND_API_KEY manquant — envoi désactivé pour ce déploiement."
    );
    return null;
  }
  return new Resend(key);
}

/** Wrapper commun : log + jamais d'erreur remontée. */
async function send(opts: {
  to: string;
  subject: string;
  html: string;
  context: string;
}): Promise<{ sent: boolean }> {
  const client = getResend();
  if (!client) return { sent: false };

  try {
    await client.emails.send({
      from: FROM,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    });
    console.log(`[email] ✓ ${opts.context} → ${opts.to}`);
    return { sent: true };
  } catch (error) {
    console.error(`[email] ✗ ${opts.context} → ${opts.to}`, error);
    return { sent: false };
  }
}

/* ============================================================
   TEMPLATE COMMUN
   ============================================================ */

/**
 * Layout HTML commun pour tous les emails.
 * Inlined styles (Resend / la plupart des clients mail ne lisent pas
 * les <style> globaux).
 */
function emailLayout({
  title,
  body,
  cta,
}: {
  title: string;
  body: string;
  cta?: { label: string; href: string };
}): string {
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#f9f7f4">
      <div style="background:linear-gradient(135deg,#E87A30,#c46020);padding:24px;border-radius:12px 12px 0 0;text-align:center">
        <h1 style="color:white;margin:0;font-size:28px;font-weight:700;letter-spacing:-0.5px">Carlow</h1>
        <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:13px">Marketplace B2B EnR</p>
      </div>
      <div style="background:white;padding:32px;border:1px solid #e5e3df;border-top:none;border-radius:0 0 12px 12px">
        <h2 style="color:#1a1a1a;font-size:22px;margin:0 0 16px;font-weight:600">${title}</h2>
        <div style="color:#444;font-size:15px;line-height:1.6">${body}</div>
        ${
          cta
            ? `
            <div style="text-align:center;margin:28px 0 8px">
              <a href="${cta.href}" style="background:#E87A30;color:white;padding:13px 26px;border-radius:10px;text-decoration:none;font-size:14px;font-weight:600;display:inline-block">
                ${cta.label}
              </a>
            </div>`
            : ""
        }
        <hr style="border:none;border-top:1px solid #e5e3df;margin:24px 0 16px" />
        <p style="color:#999;font-size:11px;text-align:center;margin:0">
          Carlow — Marketplace B2B spécialiste des équipements EnR<br/>
          Si vous n'êtes pas à l'origine de cet email, ignorez-le simplement.
        </p>
      </div>
    </div>
  `;
}

/* ============================================================
   ENROLEMENT VENDEUR
   ============================================================ */

export async function sendWelcomeEmail(name: string, email: string) {
  return send({
    to: email,
    subject: "Bienvenue sur Carlow — Votre inscription est confirmée",
    context: "welcome",
    html: emailLayout({
      title: `Bonjour ${name} !`,
      body: `
        <p>Votre inscription sur le portail vendeur Carlow a bien été enregistrée. Votre dossier est en cours de traitement.</p>
        <div style="background:#fef5ec;border-radius:10px;padding:18px;margin:20px 0;border-left:4px solid #E87A30">
          <p style="margin:0 0 8px;font-size:14px;color:#1a1a1a;font-weight:700">Prochaines étapes :</p>
          <ul style="margin:0;padding-left:20px;color:#444;font-size:14px;line-height:1.8">
            <li>Complétez vos informations société</li>
            <li>Déposez vos documents réglementaires</li>
            <li>Ajoutez vos certifications EnR</li>
            <li>Configurez votre logistique</li>
          </ul>
        </div>
      `,
      cta: { label: "Accéder à mon espace vendeur", href: `${SITE_URL}/dashboard` },
    }),
  });
}

export async function sendDossierSoumisEmail(name: string, email: string) {
  return send({
    to: email,
    subject: "Carlow — Votre dossier a été soumis avec succès",
    context: "dossier-soumis",
    html: emailLayout({
      title: `Dossier reçu, ${name} !`,
      body: `
        <p>Votre dossier vendeur est complet. Notre équipe va le vérifier sous 24-48h. Vous recevrez un email dès l'activation de votre compte.</p>
        <div style="background:#f0faf5;border-radius:10px;padding:18px;margin:20px 0;border-left:4px solid #22a06b">
          <p style="margin:0;font-size:14px;color:#22a06b;font-weight:700">✓ Dossier soumis avec succès</p>
          <p style="margin:6px 0 0;font-size:13px;color:#444">Vérification en cours par l'équipe Carlow.</p>
        </div>
      `,
    }),
  });
}

export async function sendCompteActiveEmail(name: string, email: string) {
  return send({
    to: email,
    subject: "🎉 Carlow — Votre compte vendeur est activé !",
    context: "compte-active",
    html: emailLayout({
      title: `Félicitations ${name} !`,
      body: `
        <p>Votre compte vendeur Carlow est maintenant <strong>actif</strong>. Vous pouvez commencer à vendre vos équipements EnR sur notre marketplace européenne.</p>
        <div style="background:#f0faf5;border-radius:10px;padding:18px;margin:20px 0;border-left:4px solid #22a06b">
          <p style="margin:0;font-size:14px;color:#22a06b;font-weight:700">✓ Compte activé</p>
          <p style="margin:6px 0 0;font-size:13px;color:#444">Vous pouvez désormais créer votre catalogue et publier vos produits.</p>
        </div>
      `,
      cta: { label: "Accéder au tableau de bord", href: `${SITE_URL}/dashboard` },
    }),
  });
}

/* ============================================================
   COMMANDES
   ============================================================ */

interface OrderLineForEmail {
  productName: string;
  quantity: number;
  unitPriceCents: number;
}

function renderOrderTable(lines: OrderLineForEmail[], totalCents: number): string {
  const rows = lines
    .map(
      (l) => `
      <tr>
        <td style="padding:10px;border-bottom:1px solid #f0eee9;color:#1a1a1a;font-size:13px">
          ${l.productName}
        </td>
        <td style="padding:10px;border-bottom:1px solid #f0eee9;text-align:center;color:#666;font-size:13px">
          ${l.quantity}
        </td>
        <td style="padding:10px;border-bottom:1px solid #f0eee9;text-align:right;color:#1a1a1a;font-size:13px;font-weight:600">
          ${(l.unitPriceCents * l.quantity / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
        </td>
      </tr>
    `
    )
    .join("");

  return `
    <table style="width:100%;border-collapse:collapse;margin:20px 0;background:white;border:1px solid #e5e3df;border-radius:10px;overflow:hidden">
      <thead>
        <tr style="background:#f9f7f4">
          <th style="padding:10px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:#666">Article</th>
          <th style="padding:10px;text-align:center;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:#666">Qté</th>
          <th style="padding:10px;text-align:right;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:#666">Total</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
      <tfoot>
        <tr style="background:#fef5ec">
          <td colspan="2" style="padding:14px;text-align:right;font-size:14px;font-weight:700;color:#1a1a1a">Total commande</td>
          <td style="padding:14px;text-align:right;font-size:16px;font-weight:700;color:#E87A30">
            ${(totalCents / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
          </td>
        </tr>
      </tfoot>
    </table>
  `;
}

/** Email envoyé à l'acheteur après paiement validé par Stripe. */
export async function sendOrderConfirmationEmail({
  buyerName,
  buyerEmail,
  orderId,
  lines,
  totalCents,
  invoiceUrl,
}: {
  buyerName: string;
  buyerEmail: string;
  orderId: string;
  lines: OrderLineForEmail[];
  totalCents: number;
  invoiceUrl?: string;
}) {
  return send({
    to: buyerEmail,
    subject: `✓ Carlow — Commande confirmée #${orderId.slice(0, 8)}`,
    context: "order-confirmation",
    html: emailLayout({
      title: `Merci ${buyerName} !`,
      body: `
        <p>Votre commande <strong>#${orderId.slice(0, 8)}</strong> a bien été enregistrée et le paiement a été validé.</p>
        ${renderOrderTable(lines, totalCents)}
        <p style="font-size:13px;color:#666">
          Les vendeurs concernés ont été notifiés et préparent votre commande.
          Vous pouvez suivre son statut depuis votre espace acheteur.
        </p>
        ${
          invoiceUrl
            ? `<p style="font-size:13px;color:#666"><strong>Facture :</strong> <a href="${invoiceUrl}" style="color:#E87A30">Télécharger le PDF</a></p>`
            : ""
        }
      `,
      cta: { label: "Suivre ma commande", href: `${SITE_URL}/buyer/orders` },
    }),
  });
}

/** Email envoyé au vendeur quand une commande contient un de ses produits. */
export async function sendVendorNewOrderEmail({
  vendorName,
  vendorEmail,
  orderId,
  buyerName,
  lines,
  subtotalCents,
}: {
  vendorName: string;
  vendorEmail: string;
  orderId: string;
  buyerName: string;
  lines: OrderLineForEmail[];
  subtotalCents: number;
}) {
  return send({
    to: vendorEmail,
    subject: `🛒 Nouvelle commande Carlow #${orderId.slice(0, 8)}`,
    context: "vendor-new-order",
    html: emailLayout({
      title: `Bonjour ${vendorName} !`,
      body: `
        <p>Vous venez de recevoir une nouvelle commande de la part de <strong>${buyerName}</strong>.</p>
        ${renderOrderTable(lines, subtotalCents)}
        <p style="font-size:13px;color:#666">
          Préparez l'expédition et mettez à jour le statut depuis votre tableau de bord.
        </p>
      `,
      cta: { label: "Voir la commande", href: `${SITE_URL}/dashboard/commandes` },
    }),
  });
}

/* ============================================================
   AUTH (verify email + reset password)
   ============================================================ */

export async function sendVerifyEmailEmail({
  name,
  email,
  verifyUrl,
}: {
  name: string;
  email: string;
  verifyUrl: string;
}) {
  return send({
    to: email,
    subject: "Carlow — Confirmez votre adresse email",
    context: "verify-email",
    html: emailLayout({
      title: `Bonjour ${name} !`,
      body: `
        <p>Merci de vous être inscrit sur Carlow. Pour finaliser votre inscription, confirmez votre adresse email en cliquant sur le bouton ci-dessous.</p>
        <p style="font-size:13px;color:#666">Ce lien expire dans 7 jours. Si vous n'avez pas créé de compte, ignorez simplement cet email.</p>
      `,
      cta: { label: "Confirmer mon email", href: verifyUrl },
    }),
  });
}

export async function sendResetPasswordEmail({
  name,
  email,
  resetUrl,
}: {
  name: string;
  email: string;
  resetUrl: string;
}) {
  return send({
    to: email,
    subject: "Carlow — Réinitialisation de votre mot de passe",
    context: "reset-password",
    html: emailLayout({
      title: `Réinitialisation demandée`,
      body: `
        <p>Bonjour ${name},</p>
        <p>Une demande de réinitialisation de mot de passe a été effectuée pour votre compte Carlow. Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe.</p>
        <div style="background:#fef5ec;border-radius:10px;padding:14px;margin:18px 0;border-left:4px solid #E87A30">
          <p style="margin:0;font-size:13px;color:#1a1a1a"><strong>⏱ Ce lien expire dans 1 heure.</strong></p>
          <p style="margin:6px 0 0;font-size:12px;color:#666">Si vous n'avez pas demandé cette réinitialisation, ignorez simplement cet email — votre mot de passe restera inchangé.</p>
        </div>
      `,
      cta: { label: "Choisir un nouveau mot de passe", href: resetUrl },
    }),
  });
}

/** Email envoyé à l'acheteur quand le statut de sa commande change. */
export async function sendOrderStatusChangedEmail({
  buyerName,
  buyerEmail,
  orderId,
  newStatus,
}: {
  buyerName: string;
  buyerEmail: string;
  orderId: string;
  newStatus: "EN_COURS" | "LIVREE" | "ANNULEE" | string;
}) {
  const statusLabels: Record<string, { label: string; emoji: string; color: string }> = {
    EN_COURS: { label: "En cours de préparation", emoji: "📦", color: "#E87A30" },
    LIVREE: { label: "Livrée", emoji: "✓", color: "#22a06b" },
    ANNULEE: { label: "Annulée", emoji: "✗", color: "#cc0000" },
  };
  const meta = statusLabels[newStatus] ?? {
    label: newStatus,
    emoji: "🔔",
    color: "#666",
  };

  return send({
    to: buyerEmail,
    subject: `${meta.emoji} Carlow — Commande #${orderId.slice(0, 8)} : ${meta.label}`,
    context: "order-status-changed",
    html: emailLayout({
      title: `Mise à jour de votre commande`,
      body: `
        <p>Bonjour ${buyerName},</p>
        <p>Le statut de votre commande <strong>#${orderId.slice(0, 8)}</strong> vient d'évoluer :</p>
        <div style="background:white;border:2px solid ${meta.color};border-radius:10px;padding:18px;margin:20px 0;text-align:center">
          <p style="margin:0;font-size:32px;line-height:1">${meta.emoji}</p>
          <p style="margin:8px 0 0;font-size:18px;font-weight:700;color:${meta.color}">
            ${meta.label}
          </p>
        </div>
      `,
      cta: { label: "Voir ma commande", href: `${SITE_URL}/buyer/orders` },
    }),
  });
}

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendWelcomeEmail(name: string, email: string) {
  try {
    await resend.emails.send({
      from: "Carlow <onboarding@resend.dev>",
      to: email,
      subject: "Bienvenue sur Carlow — Votre inscription est confirmee",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
          <div style="background:#E87A30;padding:20px;border-radius:8px 8px 0 0;text-align:center">
            <h1 style="color:white;margin:0;font-size:24px">C arlow</h1>
            <p style="color:white;margin:8px 0 0;font-size:14px">Marketplace BtoB EnR</p>
          </div>
          <div style="background:white;padding:32px;border:1px solid #e5e3df;border-top:none;border-radius:0 0 8px 8px">
            <h2 style="color:#333;font-size:20px;margin:0 0 16px">Bonjour ${name} !</h2>
            <p style="color:#666;font-size:15px;line-height:1.6;margin:0 0 16px">
              Votre inscription sur le portail vendeur Carlow a bien ete enregistree.
              Votre dossier est en cours de traitement.
            </p>
            <div style="background:#f9f7f4;border-radius:8px;padding:16px;margin:20px 0">
              <p style="margin:0 0 8px;font-size:14px;color:#333;font-weight:bold">Prochaines etapes :</p>
              <ul style="margin:0;padding-left:20px;color:#666;font-size:14px;line-height:1.8">
                <li>Completez vos informations societe</li>
                <li>Deposez vos documents reglementaires</li>
                <li>Ajoutez vos certifications EnR</li>
                <li>Configurez votre logistique</li>
              </ul>
            </div>
            <div style="text-align:center;margin:24px 0">
              <a href="https://carlow-onboarding.vercel.app/dashboard"
                style="background:#E87A30;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:bold">
                Acceder a mon espace vendeur
              </a>
            </div>
            <p style="color:#aaa;font-size:12px;text-align:center;margin:16px 0 0">
              Carlow — Marketplace BtoB specialiste EnR
            </p>
          </div>
        </div>
      `,
    });
    console.log("Email de bienvenue envoye a", email);
  } catch (error) {
    console.error("Erreur envoi email:", error);
  }
}

export async function sendDossierSoumisEmail(name: string, email: string) {
  try {
    await resend.emails.send({
      from: "Carlow <onboarding@resend.dev>",
      to: email,
      subject: "Carlow — Votre dossier a ete soumis avec succes",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
          <div style="background:#E87A30;padding:20px;border-radius:8px 8px 0 0;text-align:center">
            <h1 style="color:white;margin:0;font-size:24px">C arlow</h1>
          </div>
          <div style="background:white;padding:32px;border:1px solid #e5e3df;border-top:none;border-radius:0 0 8px 8px">
            <h2 style="color:#333;font-size:20px;margin:0 0 16px">Dossier recu, ${name} !</h2>
            <p style="color:#666;font-size:15px;line-height:1.6;margin:0 0 16px">
              Votre dossier vendeur est complet. Notre equipe va le verifier sous 24-48h.
              Vous recevrez un email de confirmation a l activation de votre compte.
            </p>
            <div style="background:#f0faf5;border-radius:8px;padding:16px;margin:20px 0;border-left:4px solid #22a06b">
              <p style="margin:0;font-size:14px;color:#22a06b;font-weight:bold">
                Dossier soumis avec succes
              </p>
              <p style="margin:6px 0 0;font-size:13px;color:#666">
                Verification en cours par l equipe Carlow
              </p>
            </div>
            <p style="color:#aaa;font-size:12px;text-align:center;margin:24px 0 0">
              Carlow — Marketplace BtoB specialiste EnR
            </p>
          </div>
        </div>
      `,
    });
  } catch (error) {
    console.error("Erreur envoi email dossier:", error);
  }
}

export async function sendCompteActiveEmail(name: string, email: string) {
  try {
    await resend.emails.send({
      from: "Carlow <onboarding@resend.dev>",
      to: email,
      subject: "Carlow — Votre compte vendeur est active !",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
          <div style="background:#E87A30;padding:20px;border-radius:8px 8px 0 0;text-align:center">
            <h1 style="color:white;margin:0;font-size:24px">C arlow</h1>
          </div>
          <div style="background:white;padding:32px;border:1px solid #e5e3df;border-top:none;border-radius:0 0 8px 8px">
            <h2 style="color:#333;font-size:20px;margin:0 0 16px">Felicitations ${name} !</h2>
            <p style="color:#666;font-size:15px;line-height:1.6;margin:0 0 16px">
              Votre compte vendeur Carlow est maintenant actif.
              Vous pouvez commencer a vendre vos equipements EnR sur notre marketplace.
            </p>
            <div style="text-align:center;margin:24px 0">
              <a href="https://carlow-onboarding.vercel.app/dashboard"
                style="background:#E87A30;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:bold">
                Acceder a la marketplace
              </a>
            </div>
            <p style="color:#aaa;font-size:12px;text-align:center;margin:16px 0 0">
              Carlow — Marketplace BtoB specialiste EnR
            </p>
          </div>
        </div>
      `,
    });
  } catch (error) {
    console.error("Erreur envoi email activation:", error);
  }
}
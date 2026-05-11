import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Conditions d'utilisation — Carlow",
  description: "Conditions générales d'utilisation de la plateforme Carlow.",
};

export default function CguPage() {
  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
        Conditions Générales d&apos;Utilisation
      </h1>
      <p className="mt-2 text-sm text-[rgb(var(--muted))]">
        Les présentes Conditions Générales d&apos;Utilisation (CGU) ont
        pour objet de définir les modalités d&apos;utilisation de la
        plateforme Carlow par ses utilisateurs (acheteurs, vendeurs,
        visiteurs).
      </p>

      <h2 className="mt-8 text-lg font-semibold">1. Accès au service</h2>
      <p className="mt-2 text-sm">
        L&apos;accès à la marketplace publique de Carlow est libre et
        gratuit. L&apos;ouverture d&apos;un compte vendeur ou acheteur est
        également gratuite. Seuls les paiements effectués via la
        plateforme sont soumis à frais (commission marketplace de 5% côté
        vendeur).
      </p>

      <h2 className="mt-8 text-lg font-semibold">2. Création de compte</h2>
      <p className="mt-2 text-sm">
        L&apos;inscription nécessite la fourniture d&apos;informations
        exactes : nom, email professionnel, mot de passe. Pour les
        vendeurs, l&apos;activation effective du compte requiert la
        soumission d&apos;un dossier complet (informations société, K-Bis,
        documents bancaires, certifications) qui sera validé sous 24-48h
        par l&apos;équipe Carlow.
      </p>
      <p className="mt-2 text-sm">
        L&apos;utilisateur est responsable de la confidentialité de ses
        identifiants. Tout usage de son compte est réputé fait par
        lui-même.
      </p>

      <h2 className="mt-8 text-lg font-semibold">3. Engagements des vendeurs</h2>
      <p className="mt-2 text-sm">
        Les vendeurs s&apos;engagent à :
      </p>
      <ul className="mt-2 ml-5 list-disc space-y-1 text-sm">
        <li>Fournir des produits conformes aux normes européennes (marquage CE) ;</li>
        <li>Maintenir des descriptions et photos exactes ;</li>
        <li>Tenir leur stock à jour ;</li>
        <li>Honorer les commandes dans les délais annoncés ;</li>
        <li>Répondre aux messages des acheteurs dans un délai raisonnable ;</li>
        <li>Respecter les obligations fiscales et sociales applicables.</li>
      </ul>

      <h2 className="mt-8 text-lg font-semibold">4. Engagements des acheteurs</h2>
      <ul className="mt-2 ml-5 list-disc space-y-1 text-sm">
        <li>Fournir des informations de livraison exactes ;</li>
        <li>Régler les commandes selon les modalités prévues ;</li>
        <li>Utiliser la plateforme dans le respect des CGV ;</li>
        <li>Ne pas tenter de contourner la commission marketplace en réalisant des transactions hors plateforme.</li>
      </ul>

      <h2 className="mt-8 text-lg font-semibold">5. Contenu publié</h2>
      <p className="mt-2 text-sm">
        Les utilisateurs (vendeurs, acheteurs déposant un avis) sont seuls
        responsables des contenus qu&apos;ils publient. Ils s&apos;interdisent
        de publier tout contenu illicite, diffamatoire, contrefaisant ou
        contraire aux bonnes mœurs.
      </p>
      <p className="mt-2 text-sm">
        Carlow se réserve le droit de modérer a posteriori tout contenu
        signalé comme problématique, et le cas échéant de suspendre le
        compte de l&apos;auteur.
      </p>

      <h2 className="mt-8 text-lg font-semibold">6. Disponibilité du service</h2>
      <p className="mt-2 text-sm">
        Carlow met tout en œuvre pour assurer un fonctionnement
        ininterrompu de la plateforme, sans toutefois garantir une
        disponibilité de 100%. Des opérations de maintenance peuvent être
        effectuées, idéalement annoncées 48h à l&apos;avance.
      </p>

      <h2 className="mt-8 text-lg font-semibold">7. Suspension et résiliation</h2>
      <p className="mt-2 text-sm">
        Carlow peut suspendre ou résilier un compte en cas de manquement
        grave aux présentes CGU ou aux CGV (fraude, produit non conforme,
        défaut de livraison répété, etc.). L&apos;utilisateur peut
        également résilier son compte à tout moment depuis son espace
        personnel.
      </p>

      <h2 className="mt-8 text-lg font-semibold">8. Évolution des CGU</h2>
      <p className="mt-2 text-sm">
        Carlow se réserve le droit de modifier les présentes CGU à tout
        moment. Les utilisateurs en seront informés par email au moins 30
        jours avant l&apos;entrée en vigueur des modifications.
      </p>

      <h2 className="mt-8 text-lg font-semibold">9. Droit applicable</h2>
      <p className="mt-2 text-sm">
        Les présentes CGU sont régies par le droit français.
      </p>
    </>
  );
}

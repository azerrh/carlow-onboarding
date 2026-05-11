import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Conditions générales de vente — Carlow",
  description: "Conditions générales de vente de la marketplace Carlow.",
};

export default function CgvPage() {
  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
        Conditions Générales de Vente
      </h1>
      <p className="mt-2 text-sm text-[rgb(var(--muted))]">
        Les présentes Conditions Générales de Vente (CGV) régissent
        l&apos;ensemble des transactions effectuées via la plateforme
        Carlow, à compter de leur acceptation expresse par
        l&apos;acheteur lors de la commande.
      </p>

      <h2 className="mt-8 text-lg font-semibold">1. Champ d&apos;application</h2>
      <p className="mt-2 text-sm">
        Carlow est une marketplace B2B exclusivement réservée aux
        professionnels (entreprises et indépendants disposant d&apos;un
        numéro de TVA intracommunautaire valide). Les présentes CGV
        s&apos;appliquent à toute commande passée par un acheteur
        professionnel auprès d&apos;un vendeur référencé sur la plateforme.
      </p>

      <h2 className="mt-8 text-lg font-semibold">2. Produits et vendeurs</h2>
      <p className="mt-2 text-sm">
        Les produits proposés sur Carlow sont des équipements
        d&apos;énergies renouvelables : panneaux photovoltaïques,
        onduleurs, batteries de stockage, pompes à chaleur, infrastructures
        de recharge pour véhicules électriques (IRVE), accessoires et
        consommables associés.
      </p>
      <p className="mt-2 text-sm">
        Chaque vendeur reste seul responsable de la description, des
        caractéristiques techniques, de la disponibilité, de
        l&apos;expédition et du service après-vente de ses produits.
      </p>

      <h2 className="mt-8 text-lg font-semibold">3. Prix et facturation</h2>
      <p className="mt-2 text-sm">
        Les prix affichés sur la plateforme sont exprimés en euros. Sauf
        mention contraire, ils s&apos;entendent <strong>TTC</strong> pour
        les acheteurs assujettis à la TVA française. Pour les acheteurs
        intracommunautaires bénéficiant de l&apos;auto-liquidation, la TVA
        est due dans le pays de destination conformément à la
        réglementation européenne.
      </p>
      <p className="mt-2 text-sm">
        Une facture conforme est générée automatiquement à chaque commande
        et téléchargeable depuis l&apos;espace acheteur.
      </p>

      <h2 className="mt-8 text-lg font-semibold">4. Commande et paiement</h2>
      <p className="mt-2 text-sm">
        La commande devient ferme et définitive après validation du
        paiement par Stripe. Les moyens de paiement acceptés sont les
        cartes bancaires (Visa, Mastercard, American Express) ainsi que les
        moyens proposés par Stripe Checkout selon le pays de
        l&apos;acheteur. Carlow ne stocke aucune donnée bancaire.
      </p>

      <h2 className="mt-8 text-lg font-semibold">5. Livraison</h2>
      <p className="mt-2 text-sm">
        Les conditions de livraison (incoterm, délai, transporteur) sont
        définies par chaque vendeur sur la fiche produit. Sauf accord
        spécifique, la livraison s&apos;effectue selon
        l&apos;<strong>incoterm DAP</strong> (Rendu au lieu de destination).
        Les délais indiqués sont donnés à titre indicatif.
      </p>

      <h2 className="mt-8 text-lg font-semibold">6. Réception et conformité</h2>
      <p className="mt-2 text-sm">
        L&apos;acheteur s&apos;engage à vérifier l&apos;état des
        marchandises dès leur réception. Toute réserve doit être formulée
        auprès du transporteur et notifiée au vendeur par écrit dans un
        délai de <strong>3 jours ouvrés</strong>.
      </p>

      <h2 className="mt-8 text-lg font-semibold">7. Garantie</h2>
      <p className="mt-2 text-sm">
        Les produits bénéficient des garanties légales de conformité et
        contre les vices cachés (articles 1641 et suivants du Code civil).
        Les garanties commerciales spécifiques sont indiquées sur chaque
        fiche produit.
      </p>

      <h2 className="mt-8 text-lg font-semibold">8. Droit de rétractation</h2>
      <p className="mt-2 text-sm">
        Conformément à l&apos;article L. 121-21 du Code de la consommation,
        le droit de rétractation de 14 jours <strong>ne s&apos;applique
        pas</strong> aux transactions entre professionnels.
      </p>

      <h2 className="mt-8 text-lg font-semibold">9. Commission marketplace</h2>
      <p className="mt-2 text-sm">
        Carlow perçoit une commission de <strong>5%</strong> sur le montant
        TTC de chaque transaction réalisée via la plateforme. Cette
        commission est prélevée automatiquement via Stripe Connect lorsque
        le vendeur a finalisé son onboarding bancaire.
      </p>

      <h2 className="mt-8 text-lg font-semibold">10. Litiges</h2>
      <p className="mt-2 text-sm">
        En cas de litige entre acheteur et vendeur, Carlow met à
        disposition une messagerie intégrée et un canal de médiation. À
        défaut d&apos;accord amiable, les tribunaux français sont seuls
        compétents.
      </p>

      <h2 className="mt-8 text-lg font-semibold">11. Droit applicable</h2>
      <p className="mt-2 text-sm">
        Les présentes CGV sont soumises au droit français. Tout litige
        sera porté devant le tribunal de commerce compétent du siège de
        Solelh Energie.
      </p>
    </>
  );
}

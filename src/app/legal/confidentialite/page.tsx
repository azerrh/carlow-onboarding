import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Politique de confidentialité — Carlow",
  description:
    "Politique de protection des données personnelles de la plateforme Carlow (RGPD).",
};

export default function ConfidentialitePage() {
  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
        Politique de confidentialité
      </h1>
      <p className="mt-2 text-sm text-[rgb(var(--muted))]">
        La présente politique décrit la manière dont Solelh Energie (Carlow)
        collecte, utilise et protège les données personnelles dans le
        cadre de l&apos;utilisation de sa plateforme, en conformité avec
        le Règlement Général sur la Protection des Données (RGPD).
      </p>

      <h2 className="mt-8 text-lg font-semibold">1. Responsable du traitement</h2>
      <p className="mt-2 text-sm">
        Le responsable du traitement des données est Solelh Energie,
        éditrice de la plateforme Carlow. Toute demande relative à vos
        données peut être adressée à :{" "}
        <a
          href="mailto:contact@carlow.fr"
          className="text-[rgb(var(--primary))] hover:underline"
        >
          contact@carlow.fr
        </a>
        .
      </p>

      <h2 className="mt-8 text-lg font-semibold">2. Données collectées</h2>
      <p className="mt-2 text-sm">Carlow collecte les données suivantes :</p>
      <ul className="mt-2 ml-5 list-disc space-y-1 text-sm">
        <li>
          <strong>Acheteurs</strong> : nom, email, téléphone, adresse de
          livraison, historique des commandes, favoris, avis publiés.
        </li>
        <li>
          <strong>Vendeurs</strong> : nom, email, raison sociale, SIRET,
          numéro de TVA, adresse, IBAN, documents réglementaires (K-Bis,
          statuts, RIB, pièce d&apos;identité du dirigeant), certifications
          produits.
        </li>
        <li>
          <strong>Données techniques</strong> : adresse IP, user-agent,
          logs de connexion (pour la sécurité).
        </li>
        <li>
          <strong>Données de paiement</strong> : aucune donnée bancaire
          n&apos;est stockée par Carlow. Stripe est l&apos;unique
          processeur de paiement.
        </li>
      </ul>

      <h2 className="mt-8 text-lg font-semibold">3. Finalités du traitement</h2>
      <ul className="mt-2 ml-5 list-disc space-y-1 text-sm">
        <li>Gestion des comptes utilisateurs et de l&apos;authentification ;</li>
        <li>Traitement des commandes et des paiements ;</li>
        <li>Communication transactionnelle (confirmation de commande, suivi) ;</li>
        <li>Vérification de la conformité des vendeurs (KYC, VIES) ;</li>
        <li>Amélioration du service et des fonctionnalités ;</li>
        <li>Respect des obligations légales et comptables (10 ans pour les factures).</li>
      </ul>

      <h2 className="mt-8 text-lg font-semibold">4. Base légale</h2>
      <p className="mt-2 text-sm">
        Les traitements reposent sur :
      </p>
      <ul className="mt-2 ml-5 list-disc space-y-1 text-sm">
        <li>
          L&apos;<strong>exécution du contrat</strong> entre vous et
          Carlow (CGU, CGV) ;
        </li>
        <li>
          L&apos;<strong>intérêt légitime</strong> de Carlow pour la
          sécurité et l&apos;amélioration de la plateforme ;
        </li>
        <li>
          Les <strong>obligations légales</strong> applicables (KYC,
          comptabilité, fiscalité) ;
        </li>
        <li>
          Votre <strong>consentement</strong> explicite pour certains
          cookies non essentiels (mesure d&apos;audience, marketing).
        </li>
      </ul>

      <h2 className="mt-8 text-lg font-semibold">5. Durée de conservation</h2>
      <ul className="mt-2 ml-5 list-disc space-y-1 text-sm">
        <li>
          <strong>Comptes actifs</strong> : conservés tant que vous
          utilisez le service ;
        </li>
        <li>
          <strong>Comptes inactifs</strong> : supprimés après 3 ans sans
          connexion ;
        </li>
        <li>
          <strong>Factures et données de commande</strong> : 10 ans
          (obligation comptable) ;
        </li>
        <li>
          <strong>Logs techniques</strong> : 12 mois maximum ;
        </li>
        <li>
          <strong>Documents KYC vendeurs</strong> : 5 ans après la
          clôture du compte (obligation anti-blanchiment).
        </li>
      </ul>

      <h2 className="mt-8 text-lg font-semibold">6. Destinataires</h2>
      <p className="mt-2 text-sm">
        Vos données sont accessibles à :
      </p>
      <ul className="mt-2 ml-5 list-disc space-y-1 text-sm">
        <li>L&apos;équipe Carlow (validation des dossiers, support) ;</li>
        <li>Stripe (paiements) ;</li>
        <li>Resend (envoi d&apos;emails transactionnels) ;</li>
        <li>Vercel et Prisma (hébergement) ;</li>
        <li>L&apos;administration fiscale et les autorités compétentes sur réquisition.</li>
      </ul>
      <p className="mt-2 text-sm">
        Vos données ne sont jamais vendues à des tiers à des fins
        commerciales.
      </p>

      <h2 className="mt-8 text-lg font-semibold">7. Transferts hors UE</h2>
      <p className="mt-2 text-sm">
        Vercel étant basée aux États-Unis, certains traitements techniques
        peuvent impliquer un transfert hors UE. Ces transferts sont
        encadrés par les <strong>Clauses Contractuelles Types</strong> de
        la Commission européenne, garantissant un niveau de protection
        équivalent au RGPD.
      </p>

      <h2 className="mt-8 text-lg font-semibold">8. Vos droits</h2>
      <p className="mt-2 text-sm">
        Conformément au RGPD, vous disposez à tout moment des droits
        suivants :
      </p>
      <ul className="mt-2 ml-5 list-disc space-y-1 text-sm">
        <li><strong>Droit d&apos;accès</strong> : connaître les données que nous détenons sur vous ;</li>
        <li><strong>Droit de rectification</strong> : corriger vos informations ;</li>
        <li><strong>Droit à l&apos;effacement</strong> : supprimer votre compte et vos données ;</li>
        <li><strong>Droit à la portabilité</strong> : récupérer vos données dans un format lisible ;</li>
        <li><strong>Droit d&apos;opposition</strong> : refuser certains traitements ;</li>
        <li><strong>Droit à la limitation</strong> du traitement.</li>
      </ul>
      <p className="mt-2 text-sm">
        Vous pouvez exercer ces droits directement depuis votre espace
        personnel :
        <br />
        <a
          href="/buyer/account"
          className="text-[rgb(var(--primary))] hover:underline"
        >
          → Mon compte acheteur
        </a>{" "}
        (boutons &quot;Télécharger mes données&quot; et &quot;Supprimer
        mon compte&quot;).
      </p>
      <p className="mt-2 text-sm">
        Vous pouvez également écrire à{" "}
        <a
          href="mailto:contact@carlow.fr"
          className="text-[rgb(var(--primary))] hover:underline"
        >
          contact@carlow.fr
        </a>{" "}
        ou déposer une réclamation auprès de la{" "}
        <a
          href="https://www.cnil.fr"
          target="_blank"
          rel="noreferrer"
          className="text-[rgb(var(--primary))] hover:underline"
        >
          CNIL
        </a>
        .
      </p>

      <h2 className="mt-8 text-lg font-semibold">9. Sécurité</h2>
      <p className="mt-2 text-sm">
        Carlow met en œuvre des mesures techniques et organisationnelles
        adaptées : chiffrement TLS pour les communications, hachage bcrypt
        des mots de passe, contrôles d&apos;accès stricts, audits réguliers
        de sécurité.
      </p>
    </>
  );
}

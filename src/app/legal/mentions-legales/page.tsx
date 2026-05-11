import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mentions légales — Carlow",
  description: "Informations légales de la plateforme Carlow / Solelh Energie.",
};

export default function MentionsLegalesPage() {
  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
        Mentions légales
      </h1>
      <p className="mt-2 text-sm text-[rgb(var(--muted))]">
        Conformément aux dispositions des articles 6-III et 19 de la loi
        n° 2004-575 du 21 juin 2004 pour la Confiance dans l&apos;économie
        numérique (LCEN), les informations suivantes sont portées à la
        connaissance des utilisateurs.
      </p>

      <h2 className="mt-8 text-lg font-semibold">1. Éditeur du site</h2>
      <div className="mt-3 space-y-1 text-sm">
        <p><strong>Raison sociale</strong> : Solelh Energie</p>
        <p><strong>Marque commerciale</strong> : Carlow</p>
        <p><strong>Site web</strong> : carlow.fr</p>
        <p><strong>Représentants légaux</strong> : M. Paul-Emile Dours, M. Romain Porquet, M. Damien Eybalin</p>
        <p><strong>Activité</strong> : Édition et exploitation d&apos;une marketplace B2B
        spécialisée dans les équipements d&apos;énergies renouvelables.</p>
      </div>

      <h2 className="mt-8 text-lg font-semibold">2. Directeur de la publication</h2>
      <p className="mt-2 text-sm">
        Le directeur de la publication est le représentant légal de Solelh
        Energie. Pour toute demande relative au contenu éditorial du site,
        merci d&apos;adresser un courrier à l&apos;adresse de
        l&apos;éditeur.
      </p>

      <h2 className="mt-8 text-lg font-semibold">3. Hébergeur</h2>
      <div className="mt-3 space-y-1 text-sm">
        <p><strong>Vercel Inc.</strong></p>
        <p>440 N Barranca Ave #4133, Covina, CA 91723, États-Unis</p>
        <p>Site web : <a href="https://vercel.com" className="text-[rgb(var(--primary))] hover:underline">vercel.com</a></p>
      </div>

      <h2 className="mt-8 text-lg font-semibold">4. Base de données</h2>
      <p className="mt-2 text-sm">
        La base de données PostgreSQL est hébergée par <strong>Prisma Data Platform</strong>{" "}
        (db.prisma.io), au sein de l&apos;Union européenne (région
        EU-West).
      </p>

      <h2 className="mt-8 text-lg font-semibold">5. Stockage de fichiers</h2>
      <p className="mt-2 text-sm">
        Les documents et photos déposés par les vendeurs sont stockés sur
        <strong> Supabase Storage</strong>, dans des serveurs situés au sein
        de l&apos;Union européenne.
      </p>

      <h2 className="mt-8 text-lg font-semibold">6. Paiements</h2>
      <p className="mt-2 text-sm">
        Les paiements en ligne sont traités par <strong>Stripe Payments
        Europe Ltd</strong> (siège social : 1 Grand Canal Street Lower,
        Dublin 2, Irlande). Carlow ne stocke aucune donnée bancaire ;
        toutes les transactions transitent directement par les serveurs
        certifiés PCI-DSS de Stripe.
      </p>

      <h2 className="mt-8 text-lg font-semibold">7. Propriété intellectuelle</h2>
      <p className="mt-2 text-sm">
        L&apos;ensemble des éléments présents sur le site Carlow (textes,
        logos, images, code source, architecture, base de données) est
        protégé par le droit d&apos;auteur et le droit des bases de données.
        Toute reproduction, représentation ou exploitation totale ou
        partielle est interdite sans accord écrit préalable de
        l&apos;éditeur.
      </p>
      <p className="mt-2 text-sm">
        Les marques, logos et photos déposés par les vendeurs restent la
        propriété exclusive de leurs titulaires respectifs.
      </p>

      <h2 className="mt-8 text-lg font-semibold">8. Limitation de responsabilité</h2>
      <p className="mt-2 text-sm">
        Carlow agit en qualité d&apos;intermédiaire technique mettant en
        relation acheteurs et vendeurs professionnels du secteur des EnR.
        Les caractéristiques techniques, certifications et descriptions
        des produits restent sous la responsabilité exclusive des vendeurs.
        Carlow s&apos;engage à mettre en œuvre tous les moyens raisonnables
        pour vérifier la qualité des vendeurs référencés (vérification VIES
        TVA, contrôle documentaire, certifications produits).
      </p>

      <h2 className="mt-8 text-lg font-semibold">9. Contact</h2>
      <p className="mt-2 text-sm">
        Pour toute question relative aux présentes mentions légales :
        <br />
        Adresse postale : à compléter par Solelh Energie.
        <br />
        Email : <a href="mailto:contact@carlow.fr" className="text-[rgb(var(--primary))] hover:underline">contact@carlow.fr</a>
      </p>
    </>
  );
}

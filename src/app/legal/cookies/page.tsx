"use client";

import Link from "next/link";
import { openCookieSettings } from "@/components/ui/CookieConsent";

/**
 * Page "Politique cookies". En `"use client"` pour permettre le bouton
 * "Modifier mes préférences cookies" qui réouvre le bandeau de consentement.
 */
export default function CookiesPage() {
  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
        Politique de gestion des cookies
      </h1>
      <p className="mt-2 text-sm text-[rgb(var(--muted))]">
        Carlow utilise différents types de cookies et technologies
        similaires pour assurer le bon fonctionnement de la plateforme et
        améliorer l&apos;expérience utilisateur. Cette page détaille leur
        usage et vous permet de modifier vos préférences à tout moment.
      </p>

      <h2 className="mt-8 text-lg font-semibold">1. Qu&apos;est-ce qu&apos;un cookie ?</h2>
      <p className="mt-2 text-sm">
        Un cookie est un petit fichier texte déposé par un site web sur
        votre navigateur. Il permet de mémoriser des informations sur
        votre visite (préférences, panier, identifiant de session) afin
        d&apos;améliorer votre expérience.
      </p>

      <h2 className="mt-8 text-lg font-semibold">2. Catégories de cookies utilisés</h2>

      <div className="mt-4 space-y-4">
        <div className="rounded-xl border border-[rgb(var(--border))]/60 bg-[rgb(var(--bg))]/60 p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold">Cookies strictement nécessaires</h3>
            <span className="rounded-full bg-[rgb(var(--success))]/10 px-2 py-0.5 text-[10px] font-semibold text-[rgb(var(--success))]">
              Toujours actifs
            </span>
          </div>
          <p className="mt-1.5 text-sm">
            Indispensables au fonctionnement de la plateforme. Ils permettent
            la connexion, la persistance du panier, le maintien de la
            session et la mémorisation des préférences (mode sombre).
          </p>
          <p className="mt-2 text-[11px] text-[rgb(var(--muted))]">
            Exemples : <code>carlow-cart</code>, <code>carlow-theme</code>,{" "}
            <code>buyerId</code>, <code>vendorId</code>, cookies de session
            httpOnly.
          </p>
        </div>

        <div className="rounded-xl border border-[rgb(var(--border))]/60 p-4">
          <h3 className="text-sm font-bold">Cookies de mesure d&apos;audience</h3>
          <p className="mt-1.5 text-sm">
            Nous permettent de comprendre comment les visiteurs utilisent
            la plateforme (pages les plus consultées, temps passé), de
            manière anonymisée. Aucun profilage individuel n&apos;est
            réalisé.
          </p>
          <p className="mt-2 text-[11px] text-[rgb(var(--muted))]">
            Fournisseur : Vercel Analytics (UE). Désactivés par défaut.
          </p>
        </div>

        <div className="rounded-xl border border-[rgb(var(--border))]/60 p-4">
          <h3 className="text-sm font-bold">Cookies marketing / réseaux sociaux</h3>
          <p className="mt-1.5 text-sm">
            Permettent de personnaliser le contenu et les publicités, et
            de mesurer la performance des campagnes. Désactivés par
            défaut.
          </p>
          <p className="mt-2 text-[11px] text-[rgb(var(--muted))]">
            Carlow n&apos;utilise actuellement aucun cookie de cette
            catégorie. Cette section est conservée à titre prospectif.
          </p>
        </div>
      </div>

      <h2 className="mt-8 text-lg font-semibold">3. Modifier mes préférences</h2>
      <p className="mt-2 text-sm">
        Vous pouvez à tout moment réouvrir le bandeau de consentement pour
        modifier vos choix :
      </p>
      <button
        onClick={openCookieSettings}
        className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[rgb(var(--primary))] px-4 py-2 text-sm font-semibold text-[rgb(var(--primary-contrast))] transition hover:brightness-95"
      >
        🍪 Modifier mes préférences cookies
      </button>

      <h2 className="mt-8 text-lg font-semibold">4. Suppression des cookies</h2>
      <p className="mt-2 text-sm">
        Vous pouvez également supprimer les cookies déjà installés via les
        paramètres de votre navigateur. La procédure dépend du navigateur
        utilisé :
      </p>
      <ul className="mt-2 ml-5 list-disc space-y-1 text-sm">
        <li>
          <strong>Chrome</strong> : Paramètres → Confidentialité et sécurité
          → Cookies et autres données de sites
        </li>
        <li>
          <strong>Firefox</strong> : Paramètres → Vie privée et sécurité →
          Cookies et données de sites
        </li>
        <li>
          <strong>Safari</strong> : Préférences → Confidentialité → Gérer
          les données de sites web
        </li>
        <li>
          <strong>Edge</strong> : Paramètres → Cookies et autorisations de
          site
        </li>
      </ul>

      <h2 className="mt-8 text-lg font-semibold">5. En savoir plus</h2>
      <p className="mt-2 text-sm">
        Pour plus d&apos;informations sur la gestion de vos données :
      </p>
      <ul className="mt-2 ml-5 list-disc space-y-1 text-sm">
        <li>
          <Link
            href="/legal/confidentialite"
            className="text-[rgb(var(--primary))] hover:underline"
          >
            Notre politique de confidentialité
          </Link>
        </li>
        <li>
          <a
            href="https://www.cnil.fr/fr/cookies-et-autres-traceurs"
            target="_blank"
            rel="noreferrer"
            className="text-[rgb(var(--primary))] hover:underline"
          >
            Cookies et autres traceurs — CNIL
          </a>
        </li>
      </ul>
    </>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";

/**
 * Bandeau de consentement cookies (RGPD).
 *
 * 3 catégories :
 *  - necessary : toujours activé (panier, auth, préférences)
 *  - analytics : Vercel Analytics / Plausible (désactivé par défaut)
 *  - marketing : retargeting, pixel, etc. (désactivé par défaut)
 *
 * Choix utilisateur persisté en localStorage. Un événement custom
 * `carlow:consent` est dispatché à chaque changement, pour permettre
 * aux scripts analytics conditionnels d'écouter et de s'activer.
 *
 * UX : 3 actions explicites (accepter tout / refuser tout / personnaliser).
 * On NE défile pas le bouton "X" qui force le rejet implicite (banni par
 * la CNIL 2022).
 */

const STORAGE_KEY = "carlow-cookie-consent";
const CONSENT_VERSION = 1; // bump si on change les catégories

export interface ConsentChoice {
  version: number;
  necessary: true; // toujours true
  analytics: boolean;
  marketing: boolean;
  decidedAt: string; // ISO date
}

function readConsent(): ConsentChoice | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ConsentChoice;
    if (parsed.version !== CONSENT_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeConsent(c: ConsentChoice): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(c));
    // Notifie le reste de l'app
    window.dispatchEvent(new CustomEvent("carlow:consent", { detail: c }));
  } catch {
    // localStorage indisponible — on ignore (l'utilisateur reverra le banner)
  }
}

export function CookieConsent() {
  const [open, setOpen] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    // Affiche le banner seulement si pas encore consenti.
    const existing = readConsent();
    if (!existing) {
      // Petite latence pour ne pas flash au load.
      const t = setTimeout(() => setOpen(true), 600);
      return () => clearTimeout(t);
    }
    setAnalytics(existing.analytics);
    setMarketing(existing.marketing);
  }, []);

  function save(choice: { analytics: boolean; marketing: boolean }) {
    writeConsent({
      version: CONSENT_VERSION,
      necessary: true,
      analytics: choice.analytics,
      marketing: choice.marketing,
      decidedAt: new Date().toISOString(),
    });
    setOpen(false);
    setShowCustomize(false);
  }

  function acceptAll() {
    save({ analytics: true, marketing: true });
  }
  function rejectAll() {
    save({ analytics: false, marketing: false });
  }
  function saveCustom() {
    save({ analytics, marketing });
  }

  if (!open) return null;

  return (
    <>
      {/* Overlay léger (semi-transparent, n'empêche pas de continuer la nav). */}
      <div
        aria-hidden="true"
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px] sm:hidden"
      />

      <div
        role="dialog"
        aria-label="Préférences cookies"
        aria-modal="false"
        className="fixed inset-x-3 bottom-3 z-50 sm:bottom-4 sm:left-4 sm:right-auto sm:max-w-md"
      >
        <div className="card-shadow rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5">
          <div className="flex items-start gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[rgb(var(--primary))]/10 text-lg">
              🍪
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-bold tracking-tight">
                Nous utilisons des cookies
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-[rgb(var(--muted))]">
                Certains sont nécessaires au fonctionnement du site (panier,
                connexion). D&apos;autres nous permettent de mesurer
                l&apos;audience et d&apos;améliorer votre expérience. Vous
                pouvez accepter, refuser ou choisir au cas par cas.{" "}
                <Link
                  href="/legal/cookies"
                  className="font-medium text-[rgb(var(--primary))] hover:underline"
                >
                  En savoir plus
                </Link>
                .
              </p>
            </div>
          </div>

          {showCustomize && (
            <div className="mt-4 space-y-2 border-t border-[rgb(var(--border))] pt-3">
              <CategoryRow
                title="Strictement nécessaires"
                description="Panier, connexion, préférences. Indispensables."
                checked
                disabled
              />
              <CategoryRow
                title="Mesure d'audience"
                description="Comptage anonymisé des visites pour améliorer le site."
                checked={analytics}
                onChange={setAnalytics}
              />
              <CategoryRow
                title="Marketing / réseaux sociaux"
                description="Personnalisation de contenu et publicités."
                checked={marketing}
                onChange={setMarketing}
              />
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {!showCustomize ? (
              <>
                <button
                  onClick={acceptAll}
                  className="flex-1 rounded-xl bg-[rgb(var(--primary))] px-4 py-2 text-xs font-semibold text-[rgb(var(--primary-contrast))] transition hover:brightness-95"
                >
                  Tout accepter
                </button>
                <button
                  onClick={rejectAll}
                  className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-xs font-medium hover:bg-black/[0.02]"
                >
                  Tout refuser
                </button>
                <button
                  onClick={() => setShowCustomize(true)}
                  className="text-xs font-medium text-[rgb(var(--muted))] underline-offset-2 hover:text-[rgb(var(--fg))] hover:underline"
                >
                  Personnaliser
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={saveCustom}
                  className="flex-1 rounded-xl bg-[rgb(var(--primary))] px-4 py-2 text-xs font-semibold text-[rgb(var(--primary-contrast))] transition hover:brightness-95"
                >
                  Enregistrer mes choix
                </button>
                <button
                  onClick={() => setShowCustomize(false)}
                  className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-xs font-medium hover:bg-black/[0.02]"
                >
                  Retour
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function CategoryRow({
  title,
  description,
  checked,
  onChange,
  disabled,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange?: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label
      className={cn(
        "flex items-start gap-3 rounded-xl border border-[rgb(var(--border))]/60 px-3 py-2",
        disabled
          ? "cursor-default bg-black/[0.02]"
          : "cursor-pointer hover:border-[rgb(var(--primary))]/30 hover:bg-[rgb(var(--primary))]/[0.03]"
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.checked)}
        className="mt-0.5 h-4 w-4 rounded border-[rgb(var(--border))] text-[rgb(var(--primary))] focus:ring-[rgb(var(--primary))]/30"
      />
      <div>
        <p className="text-xs font-semibold">{title}</p>
        <p className="text-[11px] text-[rgb(var(--muted))]">{description}</p>
      </div>
    </label>
  );
}

/**
 * Helper exposé pour réouvrir le bandeau depuis n'importe où (ex: lien
 * "Modifier mes préférences cookies" dans le footer).
 */
export function openCookieSettings(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  } catch {
    // ignore
  }
}

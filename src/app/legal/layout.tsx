import Link from "next/link";
import { Brand } from "@/components/ui/Brand";
import { Button } from "@/components/ui/Button";

/**
 * Layout commun aux 5 pages légales.
 * - Header sobre avec retour à l'accueil
 * - Sidebar de navigation entre les pages
 * - Footer avec date de dernière mise à jour
 *
 * Ces pages doivent être facilement maintenables — éviter les composants
 * complexes, privilégier du HTML sémantique avec classes Tailwind directes.
 */

const LINKS = [
  { href: "/legal/mentions-legales", label: "Mentions légales" },
  { href: "/legal/cgv", label: "Conditions de vente" },
  { href: "/legal/cgu", label: "Conditions d'utilisation" },
  { href: "/legal/confidentialite", label: "Politique de confidentialité" },
  { href: "/legal/cookies", label: "Politique cookies" },
];

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="portal-page min-h-screen">
      <header className="sticky top-0 z-10 border-b border-[rgb(var(--border))]/60 bg-[rgb(var(--card))]/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
          <Link href="/">
            <Brand variant="compact" />
          </Link>
          <Link href="/">
            <Button variant="ghost" size="sm">
              Retour au site
            </Button>
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
          {/* Sidebar navigation */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-[rgb(var(--muted))]">
              Informations légales
            </p>
            <nav>
              <ul className="space-y-0.5">
                {LINKS.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="block rounded-lg px-3 py-2 text-sm text-[rgb(var(--fg))] transition hover:bg-[rgb(var(--primary))]/[0.06] hover:text-[rgb(var(--primary))]"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>

          {/* Contenu */}
          <article className="prose prose-sm max-w-none rounded-2xl border border-[rgb(var(--border))]/60 bg-[rgb(var(--card))] p-6 sm:p-8">
            {children}
            <hr className="my-8 border-[rgb(var(--border))]" />
            <p className="text-[11px] text-[rgb(var(--muted))]">
              Dernière mise à jour : mai 2026 — Carlow / Solelh Energie ·
              carlow.fr
            </p>
          </article>
        </div>
      </div>
    </div>
  );
}

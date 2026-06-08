"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Brand } from "@/components/ui/Brand";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { cn } from "@/lib/cn";

/**
 * Barre de navigation UNIFIÉE pour tout l'espace acheteur.
 *
 * Avant : chaque page acheteur avait son propre header codé en dur, avec
 * des liens différents (parfois "Mon espace", parfois "Mon compte", certains
 * boutons manquants). Incohérent et déroutant.
 *
 * Maintenant : un seul composant, mêmes liens partout, avec mise en
 * évidence automatique de la page active (via usePathname).
 *
 * Responsive : liens visibles sur desktop, menu hamburger sur mobile.
 */

const NAV_LINKS: { label: string; href: string }[] = [
  { label: "Tableau de bord", href: "/buyer/dashboard" },
  { label: "Mes commandes", href: "/buyer/orders" },
  { label: "Mes devis", href: "/buyer/devis" },
  { label: "Favoris", href: "/buyer/favoris" },
  { label: "Avis", href: "/buyer/avis" },
  { label: "Alertes", href: "/buyer/alertes" },
  { label: "Parrainage", href: "/buyer/parrainage" },
];

export function BuyerNav() {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  function isActive(href: string): boolean {
    return pathname === href || pathname.startsWith(href + "/");
  }

  function handleLogout() {
    if (typeof window !== "undefined") {
      localStorage.removeItem("buyerId");
    }
    router.push("/buyer/login");
  }

  return (
    <header className="sticky top-0 z-30 border-b border-[rgb(var(--border))]/70 bg-[rgb(var(--card))]/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-3 px-4 py-3">
        {/* Marque + nav desktop */}
        <div className="flex min-w-0 items-center gap-4">
          <Link href="/buyer/dashboard" className="shrink-0">
            <Brand variant="compact" />
          </Link>

          <nav className="hidden items-center gap-0.5 lg:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-xl px-3 py-1.5 text-sm font-medium transition-all duration-150",
                  isActive(link.href)
                    ? "bg-[rgb(var(--primary))]/10 font-semibold text-[rgb(var(--primary))]"
                    : "text-[rgb(var(--muted))] hover:bg-black/[0.04] hover:text-[rgb(var(--fg))]"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Actions à droite */}
        <div className="flex shrink-0 items-center gap-2">
          <ThemeToggle size="sm" className="hidden sm:grid" />

          <Link href="/marketplace" className="hidden sm:inline-flex">
            <Button variant="ghost" size="sm">
              🛒 Marketplace
            </Button>
          </Link>

          <Link
            href="/buyer/account"
            className={cn(
              "hidden items-center gap-2 rounded-xl border px-2.5 py-1.5 text-sm font-medium transition sm:inline-flex",
              isActive("/buyer/account")
                ? "border-[rgb(var(--primary))]/40 bg-[rgb(var(--primary))]/8 text-[rgb(var(--primary))]"
                : "border-[rgb(var(--border))]/80 bg-[rgb(var(--card))] hover:border-[rgb(var(--primary))]/30"
            )}
          >
            <span className="grid h-6 w-6 place-items-center rounded-lg bg-gradient-to-br from-[rgb(var(--success))] to-emerald-600 text-[11px] font-bold text-white">
              {/* Initiale dynamique non dispo ici → icône générique */}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5">
                <circle cx="12" cy="8" r="3.5" />
                <path d="M5 20a7 7 0 0 1 14 0" />
              </svg>
            </span>
            Mon compte
          </Link>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleLogout}
            className="hidden sm:inline-flex"
          >
            Déconnexion
          </Button>

          {/* Bouton hamburger mobile */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Ouvrir le menu"
            className="grid h-9 w-9 place-items-center rounded-xl text-[rgb(var(--muted))] hover:bg-black/[0.05] lg:hidden"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
              {mobileOpen ? (
                <path d="M6 6l12 12M18 6L6 18" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Menu mobile déroulant */}
      {mobileOpen && (
        <div className="animate-fade-in border-t border-[rgb(var(--border))]/60 bg-[rgb(var(--card))] px-4 py-3 lg:hidden">
          <nav className="grid gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "rounded-xl px-3 py-2.5 text-sm font-medium transition",
                  isActive(link.href)
                    ? "bg-[rgb(var(--primary))]/10 font-semibold text-[rgb(var(--primary))]"
                    : "text-[rgb(var(--fg))]/80 hover:bg-black/[0.04]"
                )}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/marketplace"
              onClick={() => setMobileOpen(false)}
              className="rounded-xl px-3 py-2.5 text-sm font-medium text-[rgb(var(--fg))]/80 hover:bg-black/[0.04]"
            >
              🛒 Marketplace
            </Link>
            <Link
              href="/buyer/account"
              onClick={() => setMobileOpen(false)}
              className={cn(
                "rounded-xl px-3 py-2.5 text-sm font-medium transition",
                isActive("/buyer/account")
                  ? "bg-[rgb(var(--primary))]/10 font-semibold text-[rgb(var(--primary))]"
                  : "text-[rgb(var(--fg))]/80 hover:bg-black/[0.04]"
              )}
            >
              Mon compte
            </Link>
            <button
              onClick={() => {
                setMobileOpen(false);
                handleLogout();
              }}
              className="mt-1 rounded-xl border-t border-[rgb(var(--border))]/60 px-3 py-2.5 text-left text-sm font-medium text-red-500 hover:bg-red-500/10"
            >
              Déconnexion
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}

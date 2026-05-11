"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { cn } from "@/lib/cn";

/**
 * VendorShell — wrapper de navigation pour toutes les pages "/dashboard/*"
 * du portail vendeur. Calqué visuellement sur AdminShell (mini icon bar +
 * sidebar pleine + drawer mobile) mais avec une nav plus légère adaptée
 * aux 6 sections vendeur.
 *
 * Auth = vendorId stocké dans localStorage (idem dashboard existant).
 * Pas de cookie httpOnly côté vendeur pour l'instant — c'est un compromis
 * pris en début de projet pour éviter de gérer un middleware côté
 * App Router. Ne jamais s'appuyer là-dessus pour des décisions de sécurité
 * serveur ; chaque API route revérifie en DB.
 */

type NavBadge = { label: string; tone: "warning" | "primary" | "danger" };

interface NavChild {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: NavBadge;
}

interface NavItem {
  label: string;
  href?: string;
  icon: React.ReactNode;
  matchPaths?: string[];
  children?: NavChild[];
  badge?: NavBadge;
}

interface SidebarSection {
  title: string;
  items: NavItem[];
}

const ICON = {
  dashboard: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  ),
  cart: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5">
      <circle cx="9" cy="20" r="1.5" />
      <circle cx="17" cy="20" r="1.5" />
      <path d="M3 4h2l2.5 11h11l2-8H6" />
    </svg>
  ),
  bag: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5">
      <path d="M5 8h14l-1 12H6L5 8z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
  ),
  book: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5">
      <path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z" />
      <path d="M5 17a3 3 0 0 1 3-3h11" />
    </svg>
  ),
  chart: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5">
      <path d="M3 3v18h18" />
      <path d="M7 14l4-4 3 3 5-7" />
    </svg>
  ),
  shop: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5">
      <path d="M3 8l1.5-3h15L21 8" />
      <path d="M4 8v11h16V8" />
      <path d="M9 8a3 3 0 0 1-6 0" />
      <path d="M15 8a3 3 0 0 1-6 0" />
      <path d="M21 8a3 3 0 0 1-6 0" />
    </svg>
  ),
  bell: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5">
      <path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2H4.5L6 16z" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </svg>
  ),
  user: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4 w-4">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  doc: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4 w-4">
      <path d="M6 3h9l4 4v14H6z" />
      <path d="M14 3v4h4" />
      <path d="M9 13h7M9 17h7" />
    </svg>
  ),
  award: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4 w-4">
      <circle cx="12" cy="9" r="6" />
      <path d="M8 14l-2 7 6-3 6 3-2-7" />
    </svg>
  ),
  truck: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4 w-4">
      <rect x="2" y="7" width="12" height="10" rx="1" />
      <path d="M14 10h5l3 3v4h-8z" />
      <circle cx="7" cy="18" r="2" />
      <circle cx="17" cy="18" r="2" />
    </svg>
  ),
  logout: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5">
      <path d="M9 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  ),
};

export interface VendorShellProps {
  children: React.ReactNode;
  unreadNotifsCount?: number;
  pendingOrdersCount?: number;
  vendorUser?: { name: string; email: string; companyName?: string | null } | null;
}

export function VendorShell({
  children,
  unreadNotifsCount = 0,
  pendingOrdersCount = 0,
  vendorUser,
}: VendorShellProps) {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Ferme automatiquement le drawer mobile sur changement de route.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Bloque le scroll du body quand le drawer mobile est ouvert.
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const sections: SidebarSection[] = [
    {
      title: "Pilotage",
      items: [
        { label: "Tableau de bord", href: "/dashboard", icon: ICON.dashboard },
        { label: "Statistiques", href: "/dashboard/ventes", icon: ICON.chart },
      ],
    },
    {
      title: "Activité",
      items: [
        {
          label: "Commandes",
          href: "/dashboard/commandes",
          icon: ICON.cart,
          badge:
            pendingOrdersCount > 0
              ? { label: String(pendingOrdersCount), tone: "primary" }
              : undefined,
        },
        {
          label: "Catalogue",
          icon: ICON.bag,
          matchPaths: ["/dashboard/catalogues", "/dashboard/produits"],
          children: [
            { label: "Produits", href: "/dashboard/produits", icon: ICON.bag },
            { label: "Catalogues", href: "/dashboard/catalogues", icon: ICON.book },
          ],
        },
      ],
    },
    {
      title: "Communication",
      items: [
        {
          label: "Notifications",
          href: "/dashboard/notifications",
          icon: ICON.bell,
          badge:
            unreadNotifsCount > 0
              ? { label: String(unreadNotifsCount), tone: "danger" }
              : undefined,
        },
      ],
    },
    {
      title: "Mon compte",
      items: [
        { label: "Mon entreprise", href: "/dashboard/entreprise", icon: ICON.shop },
        {
          label: "Onboarding",
          icon: ICON.doc,
          matchPaths: [
            "/step-2-company",
            "/step-3-documents",
            "/step-4-certifications",
            "/step-5-logistics",
          ],
          children: [
            { label: "Documents", href: "/step-3-documents", icon: ICON.doc },
            { label: "Certifications", href: "/step-4-certifications", icon: ICON.award },
            { label: "Logistique", href: "/step-5-logistics", icon: ICON.truck },
          ],
        },
        { label: "Profil", href: "/account", icon: ICON.settings },
      ],
    },
  ];

  function handleLogout() {
    if (typeof window !== "undefined") {
      localStorage.removeItem("vendorId");
    }
    router.replace("/login");
  }

  // Items "atomiques" pour la mini icon bar (un seul niveau, on prend le
  // 1er enfant ou le href direct).
  const flatTopItems = sections
    .flatMap((s) => s.items)
    .filter((it) => it.href || it.matchPaths);

  return (
    <div className="flex min-h-screen bg-[rgb(var(--bg))]">
      {/* Mini icon bar (>= lg) */}
      <aside className="sticky top-0 z-30 hidden h-screen w-14 flex-col items-center gap-1 border-r border-[rgb(var(--border))] bg-white/80 py-4 lg:flex">
        <Link
          href="/dashboard"
          className="grid h-9 w-9 place-items-center rounded-lg bg-[rgb(var(--primary))] text-white"
          aria-label="Accueil tableau de bord"
        >
          <span className="text-sm font-bold">C</span>
        </Link>
        <div className="my-1 h-px w-6 bg-[rgb(var(--border))]" />

        {flatTopItems.map((it, idx) => {
          const target = it.href ?? it.matchPaths?.[0] ?? "#";
          const active = isItemActive(it, pathname);
          return (
            <Link
              key={idx}
              href={target}
              title={it.label}
              className={cn(
                "grid h-9 w-9 place-items-center rounded-lg transition",
                active
                  ? "bg-[rgb(var(--primary))] text-white"
                  : "text-[rgb(var(--muted))] hover:bg-black/[0.04]"
              )}
            >
              {it.icon}
            </Link>
          );
        })}

        <div className="mt-auto">
          <button
            onClick={handleLogout}
            title="Déconnexion"
            className="grid h-9 w-9 place-items-center rounded-lg text-red-400 transition hover:bg-red-50 hover:text-red-600"
          >
            {ICON.logout}
          </button>
        </div>
      </aside>

      {/* Sidebar pleine (>= lg) */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 overflow-y-auto border-r border-[rgb(var(--border))] bg-white/80 lg:block">
        <div className="border-b border-[rgb(var(--border))] px-5 py-4">
          <Link href="/dashboard" className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-[rgb(var(--primary))] to-[rgb(var(--primary))]/70 text-white shadow-sm">
              <span className="text-base font-bold">C</span>
            </span>
            <div>
              <span className="text-sm font-bold tracking-tight">Carlow</span>
              <span className="ml-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[rgb(var(--muted))]">
                Vendeur
              </span>
            </div>
          </Link>
        </div>

        <nav className="px-3 py-4">
          {sections.map((section) => (
            <div key={section.title} className="mb-4 last:mb-0">
              <div className="px-3 pb-2 pt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[rgb(var(--muted))]/70">
                {section.title}
              </div>
              <ul className="space-y-0.5">
                {section.items.map((item, i) => (
                  <SidebarItem key={i} item={item} pathname={pathname} />
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </aside>

      {/* Overlay mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Drawer mobile */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-full w-72 overflow-y-auto border-r border-[rgb(var(--border))] bg-white shadow-xl transition-transform duration-300 ease-out lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
        aria-hidden={!mobileOpen}
      >
        <div className="border-b border-[rgb(var(--border))] px-4 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/dashboard"
              className="flex items-center gap-3"
              onClick={() => setMobileOpen(false)}
            >
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-[rgb(var(--primary))] text-white">
                <span className="text-base font-bold">C</span>
              </span>
              <div>
                <span className="text-sm font-bold">Carlow</span>
                <span className="ml-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[rgb(var(--muted))]">
                  Vendeur
                </span>
              </div>
            </Link>
            <button
              onClick={() => setMobileOpen(false)}
              aria-label="Fermer le menu"
              className="grid h-9 w-9 place-items-center rounded-lg text-[rgb(var(--muted))] hover:bg-black/[0.04]"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
        </div>

        <nav className="px-3 py-4">
          {sections.map((section) => (
            <div key={section.title} className="mb-4">
              <div className="px-3 pb-2 pt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[rgb(var(--muted))]/70">
                {section.title}
              </div>
              <ul className="space-y-0.5">
                {section.items.map((item, i) => (
                  <SidebarItem key={i} item={item} pathname={pathname} />
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-[rgb(var(--border))] px-4 py-3">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
          >
            <span className="text-red-500">{ICON.logout}</span>
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Contenu principal */}
      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex h-14 items-center gap-3 border-b border-[rgb(var(--border))] bg-white/80 px-4 lg:justify-end lg:px-6">
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Ouvrir le menu"
            className="grid h-9 w-9 place-items-center rounded-lg text-[rgb(var(--muted))] hover:bg-black/[0.04] lg:hidden"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <Link
            href="/dashboard"
            className="flex items-center gap-2 lg:hidden"
            onClick={() => setMobileOpen(false)}
          >
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-[rgb(var(--primary))] text-sm font-bold text-white">
              C
            </span>
            <span className="text-sm font-semibold tracking-tight">Carlow</span>
          </Link>

          <div className="flex-1 lg:hidden" />

          {/* Toggle thème */}
          <ThemeToggle size="sm" />

          {/* Lien rapide notifs (header) */}
          <Link
            href="/dashboard/notifications"
            aria-label="Notifications"
            className="relative grid h-9 w-9 place-items-center rounded-lg text-[rgb(var(--muted))] transition hover:bg-black/[0.04]"
          >
            {ICON.bell}
            {unreadNotifsCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-[1rem] place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {unreadNotifsCount}
              </span>
            )}
          </Link>

          {/* Menu utilisateur */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen((v) => !v)}
              className="flex items-center gap-2 rounded-full border border-[rgb(var(--border))] bg-white px-2 py-1.5 text-xs hover:border-[rgb(var(--primary))]/30 transition"
            >
              <span className="grid h-8 w-8 place-items-center rounded-full bg-[rgb(var(--primary))]/10 text-[rgb(var(--primary))]">
                {ICON.user}
              </span>
              <span className="hidden font-medium sm:inline">
                {vendorUser?.companyName ?? vendorUser?.name ?? "Vendeur"}
              </span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3 w-3">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
            {userMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                <div className="absolute right-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-xl border border-[rgb(var(--border))] bg-white shadow-lg">
                  <div className="border-b border-[rgb(var(--border))] px-4 py-3">
                    <div className="text-sm font-semibold">
                      {vendorUser?.name ?? "Vendeur"}
                    </div>
                    <div className="truncate text-xs text-[rgb(var(--muted))]">
                      {vendorUser?.email ?? ""}
                    </div>
                  </div>
                  <Link
                    href="/dashboard/entreprise"
                    className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-black/[0.03]"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    {ICON.shop} Mon entreprise
                  </Link>
                  <Link
                    href="/account"
                    className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-black/[0.03]"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    {ICON.settings} Profil & paramètres
                  </Link>
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      handleLogout();
                    }}
                    className="flex w-full items-center gap-2 border-t border-[rgb(var(--border))] px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    {ICON.logout} Déconnexion
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}

/* ---------------- Sub-components ---------------- */

function isItemActive(item: NavItem, pathname: string): boolean {
  if (item.href && (pathname === item.href || pathname.startsWith(item.href + "/"))) {
    return true;
  }
  if (item.matchPaths?.some((p) => pathname.startsWith(p))) return true;
  if (item.children?.some((c) => pathname.startsWith(c.href.split("?")[0]))) return true;
  return false;
}

function SidebarItem({ item, pathname }: { item: NavItem; pathname: string }) {
  const active = isItemActive(item, pathname);
  const [open, setOpen] = useState<boolean>(active);

  if (!item.children) {
    return (
      <li>
        <Link
          href={item.href ?? "#"}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
            active
              ? "bg-[rgb(var(--primary))]/[0.08] text-[rgb(var(--primary))]"
              : "text-[rgb(var(--fg))] hover:bg-black/[0.03]"
          )}
        >
          <span
            className={cn(
              "shrink-0",
              active ? "text-[rgb(var(--primary))]" : "text-[rgb(var(--muted))]"
            )}
          >
            {item.icon}
          </span>
          <span className="flex-1 truncate">{item.label}</span>
          {item.badge && <Badge tone={item.badge.tone}>{item.badge.label}</Badge>}
        </Link>
      </li>
    );
  }

  return (
    <li>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={cn(
          "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
          active
            ? "bg-[rgb(var(--primary))]/[0.08] text-[rgb(var(--primary))]"
            : "text-[rgb(var(--fg))] hover:bg-black/[0.03]"
        )}
      >
        <span
          className={cn(
            "shrink-0",
            active ? "text-[rgb(var(--primary))]" : "text-[rgb(var(--muted))]"
          )}
        >
          {item.icon}
        </span>
        <span className="flex-1 truncate text-left">{item.label}</span>
        {item.badge ? (
          <Badge tone={item.badge.tone}>{item.badge.label}</Badge>
        ) : (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className={cn("h-3.5 w-3.5 shrink-0 transition-transform", open && "rotate-90")}
          >
            <path d="M9 6l6 6-6 6" />
          </svg>
        )}
      </button>
      {open && (
        <ul className="ml-4 mt-0.5 space-y-0.5 border-l-2 border-[rgb(var(--border))]/50 pl-3">
          {item.children.map((child) => {
            const childPath = child.href.split("?")[0];
            const isActive = pathname === childPath || pathname.startsWith(childPath + "/");
            return (
              <li key={child.href}>
                <Link
                  href={child.href}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition",
                    isActive
                      ? "font-semibold text-[rgb(var(--primary))]"
                      : "text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]"
                  )}
                >
                  <span className="shrink-0">{child.icon}</span>
                  <span className="flex-1 truncate">{child.label}</span>
                  {child.badge && <Badge tone={child.badge.tone}>{child.badge.label}</Badge>}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </li>
  );
}

function Badge({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "warning" | "primary" | "danger";
}) {
  return (
    <span
      className={cn(
        "rounded-md px-1.5 py-0.5 text-[10px] font-bold",
        tone === "warning" && "bg-amber-400/90 text-amber-950",
        tone === "primary" && "bg-[rgb(var(--primary))] text-white",
        tone === "danger" && "bg-red-500 text-white"
      )}
    >
      {children}
    </span>
  );
}

/* ---------------- Page header ---------------- */

export function VendorPageHeader({
  breadcrumb,
  title,
  subtitle,
  action,
}: {
  breadcrumb: string[];
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      <div className="text-xs text-[rgb(var(--muted))]">
        {breadcrumb.map((b, i) => (
          <span key={i}>
            {i > 0 && <span className="mx-1.5">/</span>}
            <span
              className={cn(
                i === breadcrumb.length - 1 && "text-[rgb(var(--primary))] font-medium"
              )}
            >
              {b}
            </span>
          </span>
        ))}
      </div>
      <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {subtitle && (
            <p className="mt-0.5 text-sm text-[rgb(var(--muted))]">{subtitle}</p>
          )}
        </div>
        {action}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { cn } from "@/lib/cn";

type NavBadge = { label: string; tone: "warning" | "primary" | "danger" };

interface NavItem {
  label: string;
  href?: string;
  icon: React.ReactNode;
  matchPaths?: string[];
  children?: { label: string; href: string; icon: React.ReactNode; badge?: NavBadge }[];
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
  chart: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5">
      <path d="M3 3v18h18" />
      <path d="M7 14l4-4 3 3 5-7" />
    </svg>
  ),
  users: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5">
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M21.5 19c0-2.2-1.7-4-3.8-4.4" />
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
  bag: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5">
      <path d="M5 8h14l-1 12H6L5 8z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
  ),
  cart: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5">
      <circle cx="9" cy="20" r="1.5" />
      <circle cx="17" cy="20" r="1.5" />
      <path d="M3 4h2l2.5 11h11l2-8H6" />
    </svg>
  ),
  bell: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5">
      <path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2H4.5L6 16z" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  user: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4 w-4">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </svg>
  ),
  bagHeart: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4 w-4">
      <path d="M5 8h14l-1 12H6L5 8z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
      <path d="M12 17l-2-2c-1-1 0-2.5 1-2 .5.3 1 1 1 1s.5-.7 1-1c1-.5 2 1 1 2l-2 2z" />
    </svg>
  ),
  shop2: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4 w-4">
      <path d="M3 8l1.5-3h15L21 8" />
      <path d="M4 8v11h16V8" />
    </svg>
  ),
  clock: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4 w-4">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  ),
  doc: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4 w-4">
      <path d="M6 3h9l4 4v14H6z" />
      <path d="M14 3v4h4" />
      <path d="M9 13h7M9 17h7" />
    </svg>
  ),
  tag: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4 w-4">
      <path d="M3 12V4h8l9 9-8 8-9-9z" />
      <circle cx="7.5" cy="7.5" r="1.5" />
    </svg>
  ),
  book: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4 w-4">
      <path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z" />
      <path d="M5 17a3 3 0 0 1 3-3h11" />
    </svg>
  ),
  gallery: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4 w-4">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="8.5" cy="10.5" r="1.5" />
      <path d="M21 16l-5-5-9 9" />
    </svg>
  ),
  list: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4 w-4">
      <path d="M4 6h16M4 12h16M4 18h16" />
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
  carlow: (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.15" />
      <path d="M8 12l2.5 2.5L16 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

export interface AdminShellProps {
  children: React.ReactNode;
  pendingVendorsCount?: number;
  pendingOrdersCount?: number;
  unreadNotifsCount?: number;
  documentsCount?: number;
  adminUser?: { name: string; email: string } | null;
}

export function AdminShell({
  children,
  pendingVendorsCount = 0,
  pendingOrdersCount = 0,
  unreadNotifsCount = 0,
  documentsCount = 0,
  adminUser,
}: AdminShellProps) {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const sections: SidebarSection[] = [
    {
      title: "Principal",
      items: [
        { label: "Tableau de bord", href: "/admin/dashboard", icon: ICON.dashboard },
        { label: "Analytics avancés", href: "/admin/analytics", icon: ICON.chart },
      ],
    },
    {
      title: "Utilisateurs",
      items: [
        {
          label: "Utilisateurs",
          icon: ICON.users,
          matchPaths: ["/admin/utilisateurs", "/admin/acheteurs"],
          children: [
            { label: "Tous les utilisateurs", href: "/admin/utilisateurs", icon: ICON.user },
            { label: "Acheteurs", href: "/admin/acheteurs", icon: ICON.bagHeart },
          ],
        },
        {
          label: "Vendeurs",
          icon: ICON.shop,
          matchPaths: ["/admin/vendeurs", "/admin/documents"],
          badge: pendingVendorsCount > 0 ? { label: String(pendingVendorsCount), tone: "warning" } : undefined,
          children: [
            { label: "Tous les vendeurs", href: "/admin/vendeurs", icon: ICON.shop2 },
            {
              label: "En attente de validation",
              href: "/admin/vendeurs?statut=EN_ATTENTE",
              icon: ICON.clock,
              badge: pendingVendorsCount > 0 ? { label: String(pendingVendorsCount), tone: "warning" } : undefined,
            },
            {
              label: `Documents${documentsCount ? ` (${documentsCount})` : ""}`,
              href: "/admin/documents",
              icon: ICON.doc,
            },
          ],
        },
      ],
    },
    {
      title: "Catalogue",
      items: [
        {
          label: "Produits",
          icon: ICON.bag,
          matchPaths: ["/admin/produits", "/admin/catalogues", "/admin/photos"],
          children: [
            { label: "Tous les produits", href: "/admin/produits", icon: ICON.tag },
            { label: "Catalogues", href: "/admin/catalogues", icon: ICON.book },
            { label: "Photos", href: "/admin/photos", icon: ICON.gallery },
          ],
        },
      ],
    },
    {
      title: "Commerce",
      items: [
        {
          label: "Commandes",
          icon: ICON.cart,
          matchPaths: ["/admin/commandes"],
          badge: pendingOrdersCount > 0 ? { label: String(pendingOrdersCount), tone: "primary" } : undefined,
          children: [
            { label: "Toutes les commandes", href: "/admin/commandes", icon: ICON.list },
            {
              label: "En cours",
              href: "/admin/commandes?statut=EN_COURS",
              icon: ICON.truck,
              badge: pendingOrdersCount > 0 ? { label: String(pendingOrdersCount), tone: "primary" } : undefined,
            },
          ],
        },
        {
          label: "Notifications",
          href: "/admin/notifications",
          icon: ICON.bell,
          badge: unreadNotifsCount > 0 ? { label: String(unreadNotifsCount), tone: "danger" } : undefined,
        },
      ],
    },
    {
      title: "Compte",
      items: [
        { label: "Parametres", href: "/admin/parametres", icon: ICON.settings },
      ],
    },
  ];

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
  }

  return (
    <div className="flex min-h-screen bg-[rgb(var(--bg))]">
      {/* Mini icon bar */}
      <aside className="sticky top-0 z-30 hidden h-screen w-14 flex-col items-center gap-1 border-r border-[rgb(var(--border))] bg-white/80 py-4 lg:flex">
        {/* Carlow logo */}
        <Link href="/admin/dashboard" className="grid h-9 w-9 place-items-center rounded-lg bg-[rgb(var(--primary))] text-white">
          <span className="text-sm font-bold">C</span>
        </Link>
        <div className="my-1 h-px w-6 bg-[rgb(var(--border))]" />

        {sections
          .flatMap((s) => s.items)
          .filter((it) => it.href || it.matchPaths)
          .map((it, idx) => {
            const target = it.href ?? it.matchPaths?.[0] ?? "#";
            const active = isItemActive(it, pathname);
            return (
              <Link
                key={idx}
                href={target}
                className={cn(
                  "grid h-9 w-9 place-items-center rounded-lg transition",
                  active
                    ? "bg-[rgb(var(--primary))] text-white"
                    : "text-[rgb(var(--muted))] hover:bg-black/[0.04]"
                )}
                title={it.label}
              >
                {it.icon}
              </Link>
            );
          })}

        <div className="mt-auto">
          <button
            onClick={handleLogout}
            className="grid h-9 w-9 place-items-center rounded-lg text-red-400 transition hover:bg-red-50 hover:text-red-600"
            title="Deconnexion"
          >
            {ICON.logout}
          </button>
        </div>
      </aside>

      {/* Full sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 overflow-y-auto border-r border-[rgb(var(--border))] bg-white/80 lg:block">
        {/* Logo area */}
        <div className="border-b border-[rgb(var(--border))] px-5 py-4">
          <Link href="/admin/dashboard" className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-[rgb(var(--primary))] to-[rgb(var(--primary))]/70 text-white shadow-sm">
              <span className="text-base font-bold">C</span>
            </span>
            <div>
              <span className="text-sm font-bold tracking-tight">Carlow</span>
              <span className="ml-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[rgb(var(--muted))]">Admin</span>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <div className="px-3 py-4">
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
        </div>
      </aside>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-full w-72 overflow-y-auto border-r border-[rgb(var(--border))] bg-white shadow-xl transition-transform duration-300 ease-out lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
        aria-hidden={!mobileOpen}
      >
        <div className="border-b border-[rgb(var(--border))] px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/admin/dashboard" className="flex items-center gap-3" onClick={() => setMobileOpen(false)}>
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-[rgb(var(--primary))] text-white">
                <span className="text-base font-bold">C</span>
              </span>
              <div>
                <span className="text-sm font-bold">Carlow</span>
                <span className="ml-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[rgb(var(--muted))]">Admin</span>
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

        <div className="px-3 py-4">
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
        </div>

        <div className="border-t border-[rgb(var(--border))] px-4 py-3">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
          >
            <span className="text-red-500">{ICON.logout}</span>
            Deconnexion
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex min-h-screen flex-1 flex-col">
        {/* Top bar */}
        <header className="flex h-14 items-center gap-3 border-b border-[rgb(var(--border))] bg-white/80 px-4 lg:justify-end lg:px-6">
          {/* Hamburger mobile */}
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Ouvrir le menu"
            className="grid h-9 w-9 place-items-center rounded-lg text-[rgb(var(--muted))] hover:bg-black/[0.04] lg:hidden"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <Link href="/admin/dashboard" className="flex items-center gap-2 lg:hidden" onClick={() => setMobileOpen(false)}>
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-[rgb(var(--primary))] text-sm font-bold text-white">C</span>
            <span className="text-sm font-semibold tracking-tight">Carlow</span>
          </Link>

          <div className="flex-1 lg:hidden" />

          <ThemeToggle size="sm" />

          <div className="relative">
            <button
              onClick={() => setUserMenuOpen((v) => !v)}
              className="flex items-center gap-2 rounded-full border border-[rgb(var(--border))] bg-white px-2 py-1.5 text-xs hover:border-[rgb(var(--primary))]/30 transition"
            >
              <span className="grid h-8 w-8 place-items-center rounded-full bg-[rgb(var(--primary))]/10 text-[rgb(var(--primary))]">
                {ICON.user}
              </span>
              <span className="hidden font-medium sm:inline">{adminUser?.name ?? "Admin"}</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3 w-3">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
            {userMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-2 w-56 overflow-hidden rounded-xl border border-[rgb(var(--border))] bg-white shadow-lg">
                  <div className="border-b border-[rgb(var(--border))] px-4 py-3">
                    <div className="text-sm font-semibold">{adminUser?.name ?? "Admin User"}</div>
                    <div className="text-xs text-[rgb(var(--muted))]">{adminUser?.email ?? "admin@example.com"}</div>
                  </div>
                  <Link href="/admin/parametres" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-black/[0.03]" onClick={() => setUserMenuOpen(false)}>
                    {ICON.settings} Parametres
                  </Link>
                  <button
                    onClick={() => { setUserMenuOpen(false); handleLogout(); }}
                    className="flex w-full items-center gap-2 border-t border-[rgb(var(--border))] px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    {ICON.logout} Deconnexion
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

/* ---- Sub-components ---- */

function isItemActive(item: NavItem, pathname: string): boolean {
  if (item.href && pathname.startsWith(item.href)) return true;
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
          <span className={cn("shrink-0", active ? "text-[rgb(var(--primary))]" : "text-[rgb(var(--muted))]")}>
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
        <span className={cn("shrink-0", active ? "text-[rgb(var(--primary))]" : "text-[rgb(var(--muted))]")}>
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

/* ---- Page header ---- */

export function AdminPageHeader({
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
            <span className={cn(i === breadcrumb.length - 1 && "text-[rgb(var(--primary))] font-medium")}>{b}</span>
          </span>
        ))}
      </div>
      <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-0.5 text-sm text-[rgb(var(--muted))]">{subtitle}</p>}
        </div>
        {action}
      </div>
    </div>
  );
}

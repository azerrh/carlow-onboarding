"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AdminShell, AdminPageHeader } from "@/components/admin/AdminShell";
import { cn } from "@/lib/cn";

interface Stats {
  totalUsers: number;
  totalVendors: number;
  pendingVendors: number;
  submittedVendors: number;
  totalProducts: number;
  activeProducts: number;
  totalOrders: number;
  ordersInProgress: number;
  totalDocuments: number;
  unreadNotifs: number;
}

interface VendorRow {
  id: string;
  name: string;
  email: string;
  companyName: string | null;
  status: string;
  createdAt: string;
}

interface OrderRow {
  id: string;
  client: string;
  date: string;
  status: "EN_COURS" | "LIVREE" | "ANNULEE" | string;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [vendors, setVendors] = useState<VendorRow[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/stats");
        if (res.status === 401) {
          router.replace("/admin/login");
          return;
        }
        const data = await res.json();
        if (res.ok && data.success) {
          setStats(data.stats);
          setVendors(data.latestVendors ?? []);
          setOrders(data.latestOrders ?? []);
        } else {
          setError(data?.error || "Impossible de charger le dashboard.");
        }
      } catch {
        setError("Erreur reseau.");
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  async function validateVendor(id: string) {
    setVendors((vs) => vs.filter((v) => v.id !== id));
    await fetch("/api/admin/vendors", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "active" }),
    });
  }

  async function rejectVendor(id: string) {
    setVendors((vs) => vs.filter((v) => v.id !== id));
    await fetch("/api/admin/vendors", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "rejected" }),
    });
  }

  return (
    <AdminShell
      pendingVendorsCount={stats?.pendingVendors ?? 0}
      pendingOrdersCount={stats?.ordersInProgress ?? 0}
      unreadNotifsCount={stats?.unreadNotifs ?? 0}
      documentsCount={stats?.totalDocuments ?? 0}
    >
      <AdminPageHeader
        breadcrumb={["Dashboard"]}
        title="Tableau de bord"
        subtitle="Vue d'ensemble de la plateforme Carlow"
      />

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-[rgb(var(--border))]/40" />
          ))}
        </div>
      ) : (
        <>
          {/* Stat Cards */}
          <div className="animate-slide-up-1 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Utilisateurs"
              value={stats?.totalUsers ?? 0}
              badge="Tous roles"
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5">
                  <circle cx="9" cy="8" r="3.5" />
                  <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
                  <circle cx="17" cy="9" r="2.5" />
                  <path d="M21.5 19c0-2.2-1.7-4-3.8-4.4" />
                </svg>
              }
              tone="primary"
            />
            <StatCard
              label="Vendeurs"
              value={stats?.totalVendors ?? 0}
              badge={`${stats?.pendingVendors ?? 0} en attente`}
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5">
                  <path d="M3 8l1.5-3h15L21 8" />
                  <path d="M4 8v11h16V8" />
                </svg>
              }
              tone="amber"
            />
            <StatCard
              label="Produits"
              value={stats?.totalProducts ?? 0}
              badge="En catalogue"
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5">
                  <path d="M5 8h14l-1 12H6L5 8z" />
                  <path d="M9 8V6a3 3 0 0 1 6 0v2" />
                </svg>
              }
              tone="emerald"
            />
            <StatCard
              label="Commandes"
              value={stats?.totalOrders ?? 0}
              badge={`${stats?.ordersInProgress ?? 0} en cours`}
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5">
                  <circle cx="9" cy="20" r="1.5" />
                  <circle cx="17" cy="20" r="1.5" />
                  <path d="M3 4h2l2.5 11h11l2-8H6" />
                </svg>
              }
              tone="rose"
            />
          </div>

          {/* Activity bar chart (simulated with CSS) */}
          {stats && (
            <div className="animate-slide-up-2 mt-6 rounded-2xl border border-[rgb(var(--border))] bg-white p-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold">Activite recente</h2>
                  <p className="text-xs text-[rgb(var(--muted))]">Apercu des 7 derniers jours</p>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-[rgb(var(--primary))]" />
                    Commandes
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-[rgb(var(--success))]" />
                    Vendeurs
                  </span>
                </div>
              </div>
              <div className="flex items-end gap-2 sm:gap-3">
                {[65, 45, 80, 55, 90, 70, 60].map((h, i) => (
                  <div key={i} className="flex flex-1 flex-col items-center gap-2">
                    <div className="flex w-full flex-1 items-end gap-0.5" style={{ height: "120px" }}>
                      <div
                        className="w-full rounded-t-md bg-[rgb(var(--primary))]/80 transition-all hover:bg-[rgb(var(--primary))]"
                        style={{ height: `${h}%` }}
                      />
                      <div
                        className="w-full rounded-t-md bg-[rgb(var(--success))]/50 transition-all hover:bg-[rgb(var(--success))]"
                        style={{ height: `${h * 0.4}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-[rgb(var(--muted))]">
                      {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"][i]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Two-pane: latest orders + pending vendors */}
          <div className="animate-slide-up-3 mt-6 grid gap-6 lg:grid-cols-12">
            {/* Orders */}
            <div className="rounded-2xl border border-[rgb(var(--border))] bg-white lg:col-span-7">
              <div className="border-b border-[rgb(var(--border))] px-5 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="grid h-8 w-8 place-items-center rounded-lg bg-[rgb(var(--primary))]/10 text-[rgb(var(--primary))]">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4 w-4">
                        <circle cx="9" cy="20" r="1.5" />
                        <circle cx="17" cy="20" r="1.5" />
                        <path d="M3 4h2l2.5 11h11l2-8H6" />
                      </svg>
                    </div>
                    <h2 className="text-sm font-semibold">Dernieres commandes</h2>
                  </div>
                  <Link
                    href="/admin/commandes"
                    className="rounded-lg px-3 py-1.5 text-xs font-semibold text-[rgb(var(--primary))] transition hover:bg-[rgb(var(--primary))]/[0.06]"
                  >
                    Voir tout →
                  </Link>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-[rgb(var(--border))] text-left text-[11px] font-semibold uppercase tracking-wider text-[rgb(var(--muted))]">
                      <th className="px-5 py-3">#</th>
                      <th className="px-5 py-3">Client</th>
                      <th className="px-5 py-3">Date</th>
                      <th className="px-5 py-3">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-10 text-center text-sm text-[rgb(var(--muted))]">
                          <div className="flex flex-col items-center gap-2">
                            <div className="grid h-12 w-12 place-items-center rounded-full bg-black/[0.03] text-[rgb(var(--muted))]">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5">
                                <circle cx="9" cy="20" r="1.5" />
                                <circle cx="17" cy="20" r="1.5" />
                                <path d="M3 4h2l2.5 11h11l2-8H6" />
                              </svg>
                            </div>
                            <span>Aucune commande pour le moment.</span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      orders.map((o) => (
                        <tr key={o.id} className="border-b border-[rgb(var(--border))]/50 last:border-0 transition hover:bg-black/[0.01]">
                          <td className="px-5 py-3 font-mono text-xs font-semibold">#{o.id.slice(0, 8)}</td>
                          <td className="px-5 py-3">{o.client}</td>
                          <td className="px-5 py-3 text-[rgb(var(--muted))]">
                            {new Date(o.date).toLocaleDateString("fr-FR")}
                          </td>
                          <td className="px-5 py-3">
                            <OrderStatus status={o.status} />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pending vendors */}
            <div className="rounded-2xl border border-[rgb(var(--border))] bg-white lg:col-span-5">
              <div className="border-b border-[rgb(var(--border))] px-5 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="grid h-8 w-8 place-items-center rounded-lg bg-amber-100 text-amber-600">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4 w-4">
                        <circle cx="12" cy="8" r="3.5" />
                        <path d="M5 20a7 7 0 0 1 14 0" />
                      </svg>
                    </div>
                    <h2 className="text-sm font-semibold">Vendeurs en attente</h2>
                  </div>
                  <Link
                    href="/admin/vendeurs?statut=EN_ATTENTE"
                    className="rounded-lg px-3 py-1.5 text-xs font-semibold text-amber-700 transition hover:bg-amber-50"
                  >
                    Voir tout →
                  </Link>
                </div>
              </div>

              {vendors.length === 0 ? (
                <div className="py-10 text-center">
                  <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[rgb(var(--success))]/10 text-[rgb(var(--success))]">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                      <path d="M5 12l5 5 9-10" />
                    </svg>
                  </div>
                  <p className="mt-3 text-sm font-medium">Tout est en ordre</p>
                  <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                    Aucun vendeur en attente de validation.
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-[rgb(var(--border))]">
                  {vendors.map((v) => (
                    <li key={v.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[rgb(var(--primary))]/10 font-semibold text-[rgb(var(--primary))]">
                          {v.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold">{v.name}</div>
                          <div className="truncate text-xs text-[rgb(var(--muted))]">{v.email}</div>
                          {v.companyName && (
                            <div className="truncate text-[11px] text-[rgb(var(--muted))]">{v.companyName}</div>
                          )}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <button
                          onClick={() => validateVendor(v.id)}
                          className="grid h-8 w-8 place-items-center rounded-lg bg-[rgb(var(--success))] text-white transition hover:bg-[rgb(var(--success))]/90"
                          title="Valider"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="h-4 w-4">
                            <path d="M5 12l5 5 9-10" />
                          </svg>
                        </button>
                        <button
                          onClick={() => rejectVendor(v.id)}
                          className="grid h-8 w-8 place-items-center rounded-lg bg-red-500 text-white transition hover:bg-red-600"
                          title="Rejeter"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="h-4 w-4">
                            <path d="M6 6l12 12M18 6L6 18" />
                          </svg>
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div className="animate-slide-up-4 mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <QuickLinkCard
              href="/admin/vendeurs"
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5">
                  <path d="M3 8l1.5-3h15L21 8" />
                  <path d="M4 8v11h16V8" />
                </svg>
              }
              title="Gerer vendeurs"
              desc="Valider et gerer les comptes"
              color="primary"
            />
            <QuickLinkCard
              href="/admin/produits"
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5">
                  <path d="M5 8h14l-1 12H6L5 8z" />
                  <path d="M9 8V6a3 3 0 0 1 6 0v2" />
                </svg>
              }
              title="Catalogue produits"
              desc="Gerer les catalogues"
              color="emerald"
            />
            <QuickLinkCard
              href="/admin/commandes"
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5">
                  <circle cx="9" cy="20" r="1.5" />
                  <circle cx="17" cy="20" r="1.5" />
                  <path d="M3 4h2l2.5 11h11l2-8H6" />
                </svg>
              }
              title="Suivi commandes"
              desc="Gerer les livraisons"
              color="amber"
            />
            <QuickLinkCard
              href="/admin/notifications"
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5">
                  <path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2H4.5L6 16z" />
                  <path d="M10 19a2 2 0 0 0 4 0" />
                </svg>
              }
              title="Notifications"
              desc="Envoyer des alertes"
              color="rose"
            />
          </div>
        </>
      )}
    </AdminShell>
  );
}

/* ---- Sub-components ---- */

function StatCard({
  label,
  value,
  badge,
  icon,
  tone,
}: {
  label: string;
  value: number;
  badge: string;
  icon: React.ReactNode;
  tone: "primary" | "amber" | "emerald" | "rose";
}) {
  const map = {
    primary: { bg: "bg-[rgb(var(--primary))]/10", text: "text-[rgb(var(--primary))]", bar: "bg-[rgb(var(--primary))]" },
    amber: { bg: "bg-amber-100", text: "text-amber-600", bar: "bg-amber-400" },
    emerald: { bg: "bg-[rgb(var(--success))]/10", text: "text-[rgb(var(--success))]", bar: "bg-[rgb(var(--success))]" },
    rose: { bg: "bg-rose-100", text: "text-rose-600", bar: "bg-rose-400" },
  } as const;
  const t = map[tone];

  return (
    <div className="group overflow-hidden rounded-2xl border border-[rgb(var(--border))] bg-white transition hover:shadow-md">
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-sm text-[rgb(var(--muted))]">{label}</div>
            <div className="mt-2 text-3xl font-bold tracking-tight">{value.toLocaleString()}</div>
          </div>
          <span className={cn("grid h-10 w-10 place-items-center rounded-xl", t.bg, t.text)}>
            {icon}
          </span>
        </div>
        <div className="mt-3">
          <span className={cn("inline-block rounded-md px-2 py-0.5 text-[11px] font-semibold", t.bg, t.text)}>
            {badge}
          </span>
        </div>
      </div>
      <div className={cn("h-0.5 w-full", t.bar)} />
    </div>
  );
}

function OrderStatus({ status }: { status: string }) {
  const meta: Record<string, { label: string; cls: string }> = {
    EN_COURS: { label: "En cours", cls: "bg-amber-100 text-amber-700" },
    LIVREE: { label: "Livree", cls: "bg-[rgb(var(--success))]/10 text-[rgb(var(--success))]" },
    ANNULEE: { label: "Annulee", cls: "bg-rose-100 text-rose-700" },
  };
  const m = meta[status] ?? { label: status, cls: "bg-black/[0.06] text-[rgb(var(--muted))]" };
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold", m.cls)}>
      {m.label}
    </span>
  );
}

function QuickLinkCard({
  href,
  icon,
  title,
  desc,
  color,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
  color: "primary" | "emerald" | "amber" | "rose";
}) {
  const colors = {
    primary: "border-[rgb(var(--primary))]/20 hover:border-[rgb(var(--primary))]/40 hover:bg-[rgb(var(--primary))]/[0.03]",
    emerald: "border-[rgb(var(--success))]/20 hover:border-[rgb(var(--success))]/40 hover:bg-[rgb(var(--success))]/[0.03]",
    amber: "border-amber-200 hover:border-amber-300 hover:bg-amber-50",
    rose: "border-rose-200 hover:border-rose-300 hover:bg-rose-50",
  };
  const iconColors = {
    primary: "bg-[rgb(var(--primary))]/10 text-[rgb(var(--primary))]",
    emerald: "bg-[rgb(var(--success))]/10 text-[rgb(var(--success))]",
    amber: "bg-amber-100 text-amber-600",
    rose: "bg-rose-100 text-rose-600",
  };

  return (
    <Link
      href={href}
      className={cn("flex items-center gap-3 rounded-xl border bg-white p-4 transition", colors[color])}
    >
      <div className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl", iconColors[color])}>
        {icon}
      </div>
      <div>
        <div className="text-sm font-semibold">{title}</div>
        <div className="text-xs text-[rgb(var(--muted))]">{desc}</div>
      </div>
    </Link>
  );
}

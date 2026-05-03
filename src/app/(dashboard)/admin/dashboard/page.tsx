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
        setError("Erreur réseau.");
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
        title="Tableau de Bord"
        subtitle="Bienvenue, Admin User — Vue d'ensemble de la plateforme"
      />

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-[rgb(var(--muted))]">Chargement…</p>
      ) : (
        <>
          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Utilisateurs"
              value={stats?.totalUsers ?? 0}
              badge="Tous rôles"
              tone="indigo"
            />
            <StatCard
              label="Vendeurs"
              value={stats?.totalVendors ?? 0}
              badge={`${stats?.pendingVendors ?? 0} en attente`}
              tone="amber"
            />
            <StatCard
              label="Produits"
              value={stats?.totalProducts ?? 0}
              badge="En catalogue"
              tone="emerald"
            />
            <StatCard
              label="Commandes"
              value={stats?.totalOrders ?? 0}
              badge={`${stats?.ordersInProgress ?? 0} en cours`}
              tone="rose"
            />
          </div>

          {/* Two-pane: latest orders + pending vendors */}
          <div className="mt-6 grid gap-6 lg:grid-cols-12">
            <div className="rounded-2xl border border-[rgb(var(--border))] bg-white p-5 lg:col-span-7">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-base font-semibold">
                  <span className="text-[#6366f1]">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      className="h-5 w-5"
                    >
                      <circle cx="9" cy="20" r="1.5" />
                      <circle cx="17" cy="20" r="1.5" />
                      <path d="M3 4h2l2.5 11h11l2-8H6" />
                    </svg>
                  </span>
                  Dernières Commandes
                </h2>
                <Link
                  href="/admin/commandes"
                  className="rounded-lg border border-[#6366f1]/30 px-3 py-1 text-xs font-semibold text-[#6366f1] hover:bg-[#6366f1]/[0.06]"
                >
                  Voir tout
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-[rgb(var(--border))] text-left text-xs font-semibold text-[rgb(var(--muted))]">
                      <th className="py-2 pr-3">#</th>
                      <th className="py-2 pr-3">Client</th>
                      <th className="py-2 pr-3">Date</th>
                      <th className="py-2 pr-3">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="py-8 text-center text-sm text-[rgb(var(--muted))]"
                        >
                          Aucune commande pour le moment.
                        </td>
                      </tr>
                    ) : (
                      orders.map((o) => (
                        <tr
                          key={o.id}
                          className="border-b border-[rgb(var(--border))]/60 last:border-0"
                        >
                          <td className="py-2.5 pr-3 font-semibold">#{o.id}</td>
                          <td className="py-2.5 pr-3">{o.client}</td>
                          <td className="py-2.5 pr-3 text-[rgb(var(--muted))]">
                            {new Date(o.date).toLocaleDateString("fr-FR")}
                          </td>
                          <td className="py-2.5 pr-3">
                            <OrderStatus status={o.status} />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-2xl border border-[rgb(var(--border))] bg-white p-5 lg:col-span-5">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-base font-semibold">
                  <span className="text-amber-500">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      className="h-5 w-5"
                    >
                      <circle cx="12" cy="8" r="3.5" />
                      <path d="M5 20a7 7 0 0 1 14 0" />
                      <path d="M16 11l1.5 1.5L21 9" />
                    </svg>
                  </span>
                  Vendeurs en Attente
                </h2>
                <Link
                  href="/admin/vendeurs?statut=EN_ATTENTE"
                  className="rounded-lg border border-amber-300 px-3 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-50"
                >
                  Voir tout
                </Link>
              </div>

              {vendors.length === 0 ? (
                <div className="py-8 text-center">
                  <div className="text-2xl">✅</div>
                  <p className="mt-2 text-sm text-[rgb(var(--muted))]">
                    Aucun vendeur en attente de validation.
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-[rgb(var(--border))]">
                  {vendors.map((v) => (
                    <li
                      key={v.id}
                      className="flex items-center justify-between gap-3 py-3"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#6366f1]/10 font-semibold text-[#6366f1]">
                          {v.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold">
                            {v.name}
                          </div>
                          <div className="truncate text-xs text-[rgb(var(--muted))]">
                            {v.email}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => validateVendor(v.id)}
                          className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-500 text-white hover:bg-emerald-600"
                          title="Valider"
                        >
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.2"
                            className="h-4 w-4"
                          >
                            <path d="M5 12l5 5 9-10" />
                          </svg>
                        </button>
                        <button
                          onClick={() => rejectVendor(v.id)}
                          className="grid h-8 w-8 place-items-center rounded-lg bg-rose-500 text-white hover:bg-rose-600"
                          title="Rejeter"
                        >
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.2"
                            className="h-4 w-4"
                          >
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
  tone,
}: {
  label: string;
  value: number;
  badge: string;
  tone: "indigo" | "amber" | "emerald" | "rose";
}) {
  const map = {
    indigo: { bar: "bg-indigo-500", chip: "bg-indigo-100 text-indigo-700", icon: "bg-indigo-100 text-indigo-600" },
    amber: { bar: "bg-amber-400", chip: "bg-amber-100 text-amber-700", icon: "bg-amber-100 text-amber-600" },
    emerald: { bar: "bg-emerald-500", chip: "bg-emerald-100 text-emerald-700", icon: "bg-emerald-100 text-emerald-600" },
    rose: { bar: "bg-rose-400", chip: "bg-rose-100 text-rose-600", icon: "bg-rose-100 text-rose-600" },
  } as const;
  const t = map[tone];

  return (
    <div className="overflow-hidden rounded-2xl border border-[rgb(var(--border))] bg-white">
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-sm text-[rgb(var(--muted))]">{label}</div>
            <div className="mt-2 text-3xl font-semibold tracking-tight">{value}</div>
          </div>
          <span className={cn("grid h-10 w-10 place-items-center rounded-full", t.icon)}>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              className="h-5 w-5"
            >
              <circle cx="12" cy="12" r="9" />
            </svg>
          </span>
        </div>
        <div className="mt-3">
          <span className={cn("inline-block rounded-md px-2 py-0.5 text-[11px] font-semibold", t.chip)}>
            {badge}
          </span>
        </div>
      </div>
      <div className={cn("h-1 w-full", t.bar)} />
    </div>
  );
}

function OrderStatus({ status }: { status: string }) {
  const meta: Record<string, { label: string; cls: string }> = {
    EN_COURS: { label: "En cours", cls: "bg-amber-100 text-amber-700" },
    LIVREE: { label: "Livrée", cls: "bg-emerald-100 text-emerald-700" },
    ANNULEE: { label: "Annulée", cls: "bg-rose-100 text-rose-700" },
  };
  const m = meta[status] ?? { label: status, cls: "bg-black/[0.06] text-[rgb(var(--muted))]" };
  return (
    <span className={cn("inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold", m.cls)}>
      {m.label}
    </span>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AdminShell, AdminPageHeader } from "@/components/admin/AdminShell";
import {
  LineChart,
  BarsChart,
  DonutChart,
  KpiCard,
  type DonutSlice,
} from "@/components/admin/Charts";
import { cn } from "@/lib/cn";

/**
 * Dashboard admin Carlow.
 *
 * Vue d'ensemble pilotage plateforme :
 *  - 4 KPIs vedettes avec tendance 30j vs 30j précédents (CA, commandes,
 *    vendeurs, acheteurs)
 *  - Courbe CA mensuel 12 mois
 *  - Bars commandes mensuelles 12 mois
 *  - Donut répartition catégories produits
 *  - Donut statuts commandes
 *  - Top 5 vendeurs (CA) + Top 5 produits (quantité)
 *  - Actions rapides : vendeurs en attente, dernières commandes
 *  - Compteurs secondaires (stock docs, certifications, etc.)
 *
 * Performance : un seul appel API qui retourne TOUTES les agrégations
 * d'un coup → 1 round-trip réseau. Au-delà de quelques milliers de
 * lignes, envisager du caching + revalidation.
 */

interface Stats {
  totalUsers: number;
  totalVendors: number;
  activeVendors: number;
  pendingVendors: number;
  submittedVendors: number;
  rejectedVendors: number;
  totalBuyers: number;
  newBuyers30: number;
  totalProducts: number;
  activeProducts: number;
  totalDocuments: number;
  totalOrders: number;
  orders30: number;
  ordersPrev30: number;
  ordersInProgress: number;
  ordersLivree: number;
  ordersAnnulee: number;
  unreadNotifs: number;
  totalRevenueCents: number;
  revenue30Cents: number;
  revenuePrev30Cents: number;
  revenueThisMonthCents: number;
  avgOrderCents: number;
  commissionRevenueCents: number;
  commissionRatePct: number;
  revenueGrowthPct: number;
  ordersGrowthPct: number;
}

interface Timeseries {
  labels: string[];
  orders: number[];
  revenueCents: number[];
  vendorSignups: number[];
  buyerSignups: number[];
}

interface TopVendor {
  id: string;
  name: string;
  revenueCents: number;
  quantity: number;
}

interface TopProduct {
  id: string;
  name: string;
  category: string | null;
  vendor: string;
  quantity: number;
  revenueCents: number;
}

interface CategoryStat {
  category: string;
  count: number;
  percent: number;
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
  status: string;
  totalCents: number;
}

const STATUS_COLORS: Record<string, { color: string; label: string }> = {
  EN_COURS: { color: "#F59E0B", label: "En cours" },
  LIVREE: { color: "#22A06B", label: "Livrée" },
  ANNULEE: { color: "#DC2626", label: "Annulée" },
};

const CATEGORY_PALETTE = [
  "#E87A30",
  "#22A06B",
  "#0EA5E9",
  "#A855F7",
  "#F59E0B",
  "#EC4899",
  "#14B8A6",
  "#64748B",
];

function fmtPrice(cents: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function fmtDate(d: string): string {
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
  });
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [timeseries, setTimeseries] = useState<Timeseries | null>(null);
  const [topVendors, setTopVendors] = useState<TopVendor[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [productsByCategory, setProductsByCategory] = useState<CategoryStat[]>([]);
  const [ordersByStatus, setOrdersByStatus] = useState<Record<string, number>>({});
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
          setTimeseries(data.timeseries);
          setTopVendors(data.topVendors ?? []);
          setTopProducts(data.topProducts ?? []);
          setProductsByCategory(data.productsByCategory ?? []);
          setOrdersByStatus(data.ordersByStatus ?? {});
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

  const categorySlices: DonutSlice[] = productsByCategory.map((c, i) => ({
    label: c.category,
    value: c.count,
    color: CATEGORY_PALETTE[i % CATEGORY_PALETTE.length]!,
  }));

  const orderStatusSlices: DonutSlice[] = Object.entries(ordersByStatus).map(
    ([key, count]) => ({
      label: STATUS_COLORS[key]?.label ?? key,
      value: count,
      color: STATUS_COLORS[key]?.color ?? "#64748B",
    })
  );

  return (
    <AdminShell
      pendingVendorsCount={stats?.pendingVendors ?? 0}
      pendingOrdersCount={stats?.ordersInProgress ?? 0}
      unreadNotifsCount={stats?.unreadNotifs ?? 0}
      documentsCount={stats?.totalDocuments ?? 0}
    >
      <AdminPageHeader
        breadcrumb={["Dashboard"]}
        title="Vue d'ensemble"
        subtitle="Statistiques globales de la plateforme Carlow"
      />

      {error && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>{error}</span>
          <button
            onClick={() => window.location.reload()}
            className="shrink-0 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100"
          >
            🔄 Réessayer
          </button>
        </div>
      )}

      {error ? null : loading || !stats || !timeseries ? (
        <div className="grid h-64 place-items-center text-sm text-[rgb(var(--muted))]">
          Chargement des statistiques…
        </div>
      ) : (
        <>
          {/* 4 KPIs vedettes avec trend */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              label="CA total (30j)"
              value={fmtPrice(stats.revenue30Cents)}
              icon="💰"
              trend={stats.revenueGrowthPct}
              trendLabel="vs 30j précédents"
              highlight
            />
            <KpiCard
              label="Commandes (30j)"
              value={String(stats.orders30)}
              icon="🛒"
              trend={stats.ordersGrowthPct}
              trendLabel="vs 30j précédents"
            />
            <KpiCard
              label="Vendeurs actifs"
              value={String(stats.activeVendors)}
              icon="🏭"
              trendLabel={`sur ${stats.totalVendors} inscrits`}
            />
            <KpiCard
              label="Acheteurs"
              value={String(stats.totalBuyers)}
              icon="👤"
              trend={
                stats.totalBuyers > 0
                  ? Math.round((stats.newBuyers30 / stats.totalBuyers) * 100)
                  : 0
              }
              trendLabel={`+${stats.newBuyers30} en 30j`}
            />
          </div>

          {/* Récap revenus */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <RevenueTile
              label="CA total"
              value={fmtPrice(stats.totalRevenueCents)}
              sublabel="Cumulé depuis l'origine"
            />
            <RevenueTile
              label="CA ce mois"
              value={fmtPrice(stats.revenueThisMonthCents)}
              sublabel={`Mois en cours`}
            />
            <RevenueTile
              label="Panier moyen"
              value={fmtPrice(stats.avgOrderCents)}
              sublabel="Par commande"
            />
            <RevenueTile
              label="Commission marketplace"
              value={fmtPrice(stats.commissionRevenueCents)}
              sublabel={`Estimation ${stats.commissionRatePct}% du CA`}
              accent
            />
          </div>

          {/* Charts row 1 : CA mensuel + Commandes mensuelles */}
          <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
            <ChartCard
              title="Chiffre d'affaires mensuel"
              subtitle="Sur les 12 derniers mois"
            >
              <LineChart
                labels={timeseries.labels}
                series={timeseries.revenueCents}
                format={(v) => fmtPrice(v)}
                color="#E87A30"
              />
            </ChartCard>

            <ChartCard
              title="Commandes mensuelles"
              subtitle="Volume de commandes par mois"
            >
              <BarsChart
                labels={timeseries.labels}
                series={timeseries.orders}
                color="#22A06B"
              />
            </ChartCard>
          </div>

          {/* Charts row 2 : Donuts catégories + statuts */}
          <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
            <ChartCard
              title="Catégories de produits"
              subtitle={`Répartition sur ${stats.activeProducts} produits actifs`}
            >
              {categorySlices.length > 0 ? (
                <DonutChart
                  slices={categorySlices}
                  centerLabel="Catégories"
                  centerValue={String(categorySlices.length)}
                />
              ) : (
                <EmptyState icon="📦" label="Aucun produit actif" />
              )}
            </ChartCard>

            <ChartCard
              title="Statuts des commandes"
              subtitle={`Sur ${stats.totalOrders} commandes`}
            >
              {orderStatusSlices.length > 0 ? (
                <DonutChart
                  slices={orderStatusSlices}
                  centerLabel="Commandes"
                  centerValue={String(stats.totalOrders)}
                />
              ) : (
                <EmptyState icon="🛒" label="Aucune commande" />
              )}
            </ChartCard>
          </div>

          {/* Charts row 3 : Signups acheteurs/vendeurs */}
          <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
            <ChartCard
              title="Inscriptions vendeurs"
              subtitle="Nouveaux vendeurs sur 12 mois"
            >
              <BarsChart
                labels={timeseries.labels}
                series={timeseries.vendorSignups}
                color="#A855F7"
              />
            </ChartCard>

            <ChartCard
              title="Inscriptions acheteurs"
              subtitle="Nouveaux acheteurs sur 12 mois"
            >
              <BarsChart
                labels={timeseries.labels}
                series={timeseries.buyerSignups}
                color="#0EA5E9"
              />
            </ChartCard>
          </div>

          {/* Top vendeurs + Top produits */}
          <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
            <ChartCard title="Top 5 vendeurs" subtitle="Par chiffre d'affaires">
              {topVendors.length === 0 ? (
                <EmptyState icon="🏭" label="Aucune donnée de vente" />
              ) : (
                <ol className="space-y-2">
                  {topVendors.map((v, i) => {
                    const max = Math.max(
                      ...topVendors.map((t) => t.revenueCents),
                      1
                    );
                    const w = (v.revenueCents / max) * 100;
                    return (
                      <li
                        key={v.id}
                        className="rounded-xl border border-[rgb(var(--border))]/60 bg-[rgb(var(--bg))]/40 px-3 py-2.5"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={cn(
                              "grid h-7 w-7 shrink-0 place-items-center rounded-lg text-xs font-bold",
                              i === 0
                                ? "bg-amber-100 text-amber-700"
                                : i === 1
                                  ? "bg-gray-100 text-gray-700"
                                  : i === 2
                                    ? "bg-orange-100 text-orange-700"
                                    : "bg-black/[0.04] text-[rgb(var(--muted))]"
                            )}
                          >
                            {i + 1}
                          </span>
                          <p className="min-w-0 flex-1 truncate text-sm font-semibold">
                            {v.name}
                          </p>
                          <span className="shrink-0 text-sm font-bold tracking-tight">
                            {fmtPrice(v.revenueCents)}
                          </span>
                        </div>
                        <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-black/[0.04]">
                          <div
                            className="h-full rounded-full bg-[rgb(var(--primary))]/80"
                            style={{ width: `${w}%` }}
                          />
                        </div>
                        <p className="mt-1 text-[10px] text-[rgb(var(--muted))]">
                          {v.quantity} article{v.quantity > 1 ? "s" : ""} vendu
                          {v.quantity > 1 ? "s" : ""}
                        </p>
                      </li>
                    );
                  })}
                </ol>
              )}
            </ChartCard>

            <ChartCard title="Top 5 produits" subtitle="Par quantité vendue">
              {topProducts.length === 0 ? (
                <EmptyState icon="📦" label="Aucun produit vendu" />
              ) : (
                <ol className="space-y-2">
                  {topProducts.map((p, i) => (
                    <li
                      key={p.id}
                      className="flex items-center gap-3 rounded-xl border border-[rgb(var(--border))]/60 bg-[rgb(var(--bg))]/40 px-3 py-2.5"
                    >
                      <span
                        className={cn(
                          "grid h-7 w-7 shrink-0 place-items-center rounded-lg text-xs font-bold",
                          i === 0
                            ? "bg-amber-100 text-amber-700"
                            : i === 1
                              ? "bg-gray-100 text-gray-700"
                              : i === 2
                                ? "bg-orange-100 text-orange-700"
                                : "bg-black/[0.04] text-[rgb(var(--muted))]"
                        )}
                      >
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{p.name}</p>
                        <p className="truncate text-[11px] text-[rgb(var(--muted))]">
                          {p.vendor}
                          {p.category ? ` · ${p.category}` : ""}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold">
                          {p.quantity} vendu{p.quantity > 1 ? "s" : ""}
                        </p>
                        <p className="text-[10px] text-[rgb(var(--muted))]">
                          {fmtPrice(p.revenueCents)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </ChartCard>
          </div>

          {/* Actions vendeurs en attente + commandes récentes */}
          <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
            <ChartCard
              title="Vendeurs en attente"
              subtitle={`${stats.pendingVendors} dossier${stats.pendingVendors > 1 ? "s" : ""} à valider`}
              action={
                <Link
                  href="/admin/vendeurs"
                  className="text-xs font-semibold text-[rgb(var(--primary))] hover:underline"
                >
                  Tout voir →
                </Link>
              }
            >
              {vendors.length === 0 ? (
                <EmptyState icon="✓" label="Aucun dossier en attente" />
              ) : (
                <ul className="space-y-2">
                  {vendors.map((v) => (
                    <li
                      key={v.id}
                      className="flex flex-col gap-2 rounded-xl border border-[rgb(var(--border))]/60 bg-[rgb(var(--bg))]/40 p-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">
                          {v.companyName ?? v.name}
                        </p>
                        <p className="truncate text-[11px] text-[rgb(var(--muted))]">
                          {v.email} · {fmtDate(v.createdAt)}
                        </p>
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => validateVendor(v.id)}
                          className="rounded-lg bg-[rgb(var(--success))]/10 px-2.5 py-1 text-[11px] font-semibold text-[rgb(var(--success))] hover:bg-[rgb(var(--success))]/20"
                        >
                          Valider
                        </button>
                        <button
                          onClick={() => rejectVendor(v.id)}
                          className="rounded-lg bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-700 hover:bg-red-100"
                        >
                          Rejeter
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </ChartCard>

            <ChartCard
              title="Commandes récentes"
              subtitle="5 dernières commandes"
              action={
                <Link
                  href="/admin/commandes"
                  className="text-xs font-semibold text-[rgb(var(--primary))] hover:underline"
                >
                  Tout voir →
                </Link>
              }
            >
              {orders.length === 0 ? (
                <EmptyState icon="🛒" label="Aucune commande" />
              ) : (
                <ul className="space-y-2">
                  {orders.map((o) => {
                    const style =
                      STATUS_COLORS[o.status] ?? STATUS_COLORS.EN_COURS!;
                    return (
                      <li
                        key={o.id}
                        className="flex items-center gap-3 rounded-xl border border-[rgb(var(--border))]/60 bg-[rgb(var(--bg))]/40 px-3 py-2.5"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">
                            {o.client}
                          </p>
                          <p className="truncate text-[11px] text-[rgb(var(--muted))]">
                            #{o.id.slice(0, 8)} · {fmtDate(o.date)}
                          </p>
                        </div>
                        <span className="shrink-0 text-sm font-bold tracking-tight">
                          {fmtPrice(o.totalCents)}
                        </span>
                        <span
                          className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                          style={{
                            background: `${style.color}1a`,
                            color: style.color,
                          }}
                        >
                          {style.label}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </ChartCard>
          </div>

          {/* Mini KPIs secondaires */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <SmallKpi label="Produits totaux" value={stats.totalProducts} icon="📦" />
            <SmallKpi label="Documents" value={stats.totalDocuments} icon="📄" />
            <SmallKpi label="Notifs non lues" value={stats.unreadNotifs} icon="🔔" />
            <SmallKpi label="Vendeurs rejetés" value={stats.rejectedVendors} icon="✗" />
          </div>
        </>
      )}
    </AdminShell>
  );
}

/* ---------- Sub-components ---------- */

function ChartCard({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[rgb(var(--border))]/60 bg-[rgb(var(--card))] p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold">{title}</h3>
          {subtitle && (
            <p className="mt-0.5 text-[11px] text-[rgb(var(--muted))]">
              {subtitle}
            </p>
          )}
        </div>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function RevenueTile({
  label,
  value,
  sublabel,
  accent,
}: {
  label: string;
  value: string;
  sublabel?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-[rgb(var(--card))] p-4",
        accent
          ? "border-[rgb(var(--primary))]/30 bg-gradient-to-br from-[rgb(var(--primary))]/[0.04] to-transparent"
          : "border-[rgb(var(--border))]/60"
      )}
    >
      <p className="text-[10px] font-bold uppercase tracking-wider text-[rgb(var(--muted))]">
        {label}
      </p>
      <p className="mt-1.5 truncate text-base font-bold tracking-tight">
        {value}
      </p>
      {sublabel && (
        <p className="mt-0.5 truncate text-[10px] text-[rgb(var(--muted))]">
          {sublabel}
        </p>
      )}
    </div>
  );
}

function SmallKpi({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: string;
}) {
  return (
    <div className="rounded-xl border border-[rgb(var(--border))]/60 bg-[rgb(var(--card))] px-4 py-3">
      <div className="flex items-center gap-2.5">
        <span className="text-base">{icon}</span>
        <div className="min-w-0 flex-1">
          <p className="text-base font-bold leading-none">{value}</p>
          <p className="mt-0.5 truncate text-[10px] text-[rgb(var(--muted))]">
            {label}
          </p>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="grid place-items-center rounded-xl border border-dashed border-[rgb(var(--border))] bg-[rgb(var(--bg))]/30 px-4 py-8 text-center">
      <span className="text-2xl">{icon}</span>
      <p className="mt-2 text-xs text-[rgb(var(--muted))]">{label}</p>
    </div>
  );
}

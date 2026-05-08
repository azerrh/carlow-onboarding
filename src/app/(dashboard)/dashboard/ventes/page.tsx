"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { VendorShell, VendorPageHeader } from "@/components/vendor/VendorShell";
import { cn } from "@/lib/cn";

interface DashboardStats {
  catalogCount: number;
  productCount: number;
  activeProductCount: number;
  orderCount: number;
  totalRevenueCents: number;
  avgOrderValueCents: number;
  documentCount: number;
  certificationCount: number;
  unreadNotifs: number;
}

interface TopProduct {
  name: string;
  category: string;
  quantitySold: number;
  revenueCents: number;
}

interface MonthlyRevenue {
  label: string;
  revenue: number;
}

interface OrdersByStatus {
  [key: string]: { count: number; label: string };
}

interface VendorMe {
  name: string;
  email: string;
  companyName: string | null;
}

function formatCents(cents: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

export default function VendorSalesStatsPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState<MonthlyRevenue[]>([]);
  const [ordersByStatus, setOrdersByStatus] = useState<OrdersByStatus>({});
  const [vendor, setVendor] = useState<VendorMe | null>(null);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const vendorId =
      typeof window !== "undefined" ? localStorage.getItem("vendorId") : null;
    if (!vendorId) {
      router.push("/login");
      return;
    }

    try {
      const [statsRes, meRes] = await Promise.all([
        fetch(`/api/vendor/dashboard-stats?id=${vendorId}`),
        fetch(`/api/vendor/me?vendorId=${vendorId}`),
      ]);
      const statsData = await statsRes.json();
      const meData = await meRes.json();

      if (statsRes.ok && statsData.success) {
        setStats(statsData.stats);
        setTopProducts(statsData.topProducts ?? []);
        setMonthlyRevenue(statsData.monthlyRevenue ?? []);
        setOrdersByStatus(statsData.ordersByStatus ?? {});
        setUnreadNotifs(statsData.stats?.unreadNotifs ?? 0);
      }
      if (meRes.ok && meData.success) {
        setVendor({
          name: meData.vendor.name,
          email: meData.vendor.email,
          companyName: meData.vendor.companyName ?? null,
        });
      }
    } catch {
      // silencieux
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const maxMonthly = useMemo(
    () => Math.max(...monthlyRevenue.map((m) => m.revenue), 1),
    [monthlyRevenue]
  );

  // Évolution sur 6 mois : compare derniers 3 mois vs 3 précédents.
  const trend = useMemo(() => {
    if (monthlyRevenue.length < 6) return null;
    const recent = monthlyRevenue.slice(3).reduce((s, m) => s + m.revenue, 0);
    const previous = monthlyRevenue.slice(0, 3).reduce((s, m) => s + m.revenue, 0);
    if (previous === 0) {
      return recent > 0 ? { pct: 100, positive: true } : null;
    }
    const pct = Math.round(((recent - previous) / previous) * 100);
    return { pct, positive: pct >= 0 };
  }, [monthlyRevenue]);

  return (
    <VendorShell vendorUser={vendor} unreadNotifsCount={unreadNotifs}>
      <VendorPageHeader
        breadcrumb={["Vendeur", "Statistiques"]}
        title="Statistiques de ventes"
        subtitle="Performance commerciale de votre catalogue Carlow."
      />

      {loading || !stats ? (
        <Card className="p-10 text-center text-sm text-[rgb(var(--muted))]">
          Chargement des statistiques…
        </Card>
      ) : (
        <>
          {/* KPIs principaux */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <KpiCard
              label="Chiffre d'affaires"
              value={formatCents(stats.totalRevenueCents)}
              icon="💰"
              highlight
            />
            <KpiCard
              label="Commandes"
              value={String(stats.orderCount)}
              icon="🛒"
            />
            <KpiCard
              label="Panier moyen"
              value={formatCents(stats.avgOrderValueCents)}
              icon="📊"
            />
            <KpiCard
              label="Produits actifs"
              value={`${stats.activeProductCount} / ${stats.productCount}`}
              icon="📦"
            />
          </div>

          {/* Tendance 6 mois */}
          {trend && (
            <Card className="mt-6 flex items-center gap-4 p-5">
              <div
                className={cn(
                  "grid h-12 w-12 place-items-center rounded-2xl text-xl",
                  trend.positive
                    ? "bg-[rgb(var(--success))]/10 text-[rgb(var(--success))]"
                    : "bg-red-50 text-red-600"
                )}
              >
                {trend.positive ? "↗" : "↘"}
              </div>
              <div className="flex-1">
                <p className="text-xs uppercase tracking-wider text-[rgb(var(--muted))]">
                  Tendance sur 6 mois
                </p>
                <p className="text-base font-semibold">
                  {trend.positive ? "+" : ""}
                  {trend.pct}% sur les 3 derniers mois vs les 3 précédents
                </p>
              </div>
            </Card>
          )}

          {/* Graphique CA mensuel */}
          <Card className="mt-6 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold">Évolution du CA</h2>
                <p className="text-xs text-[rgb(var(--muted))]">
                  Chiffre d&apos;affaires sur les 6 derniers mois
                </p>
              </div>
            </div>

            {monthlyRevenue.every((m) => m.revenue === 0) ? (
              <div className="mt-8 grid place-items-center text-center text-xs text-[rgb(var(--muted))]">
                <span className="text-3xl">📈</span>
                <p className="mt-2">Aucun revenu enregistré pour le moment</p>
              </div>
            ) : (
              <div className="mt-6 flex h-56 items-end gap-3">
                {monthlyRevenue.map((m, i) => {
                  const heightPct =
                    maxMonthly > 0 ? (m.revenue / maxMonthly) * 100 : 0;
                  return (
                    <div
                      key={i}
                      className="flex flex-1 flex-col items-center gap-2"
                    >
                      {m.revenue > 0 && (
                        <span className="text-[10px] font-medium text-[rgb(var(--muted))]">
                          {formatCents(m.revenue)}
                        </span>
                      )}
                      <div
                        className={cn(
                          "w-full rounded-t-lg transition-all duration-500",
                          heightPct > 0
                            ? "bg-gradient-to-t from-[rgb(var(--primary))] to-[rgb(var(--primary))]/40"
                            : "bg-black/[0.04]"
                        )}
                        style={{ height: `${Math.max(heightPct, 4)}%` }}
                      />
                      <span className="text-[11px] font-medium text-[rgb(var(--muted))]">
                        {m.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* 2 colonnes : top produits + statuts */}
          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <Card className="p-6 lg:col-span-2">
              <h2 className="text-base font-semibold">Top 5 des produits</h2>
              <p className="text-xs text-[rgb(var(--muted))]">
                Produits les plus vendus sur les 6 derniers mois
              </p>

              {topProducts.length === 0 ? (
                <div className="mt-6 rounded-xl border border-dashed border-[rgb(var(--border))] px-4 py-8 text-center text-xs text-[rgb(var(--muted))]">
                  Aucun produit vendu pour l&apos;instant
                </div>
              ) : (
                <ul className="mt-4 space-y-2">
                  {topProducts.map((p, i) => {
                    const maxQty = Math.max(
                      ...topProducts.map((tp) => tp.quantitySold),
                      1
                    );
                    const widthPct = (p.quantitySold / maxQty) * 100;
                    return (
                      <li
                        key={p.name + i}
                        className="rounded-xl border border-[rgb(var(--border))]/60 bg-white px-4 py-3"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={cn(
                              "grid h-8 w-8 shrink-0 place-items-center rounded-lg text-xs font-bold",
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
                            <p className="truncate text-sm font-semibold">
                              {p.name}
                            </p>
                            <p className="truncate text-[11px] text-[rgb(var(--muted))]">
                              {p.category || "Sans catégorie"}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold">
                              {p.quantitySold} vendu
                              {p.quantitySold > 1 ? "s" : ""}
                            </p>
                            <p className="text-[11px] text-[rgb(var(--muted))]">
                              {formatCents(p.revenueCents)}
                            </p>
                          </div>
                        </div>
                        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-black/[0.04]">
                          <div
                            className="h-full rounded-full bg-[rgb(var(--primary))]/70 transition-all"
                            style={{ width: `${widthPct}%` }}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>

            <Card className="p-6">
              <h2 className="text-base font-semibold">Statuts commandes</h2>
              <p className="text-xs text-[rgb(var(--muted))]">
                Répartition globale
              </p>

              {Object.keys(ordersByStatus).length === 0 ? (
                <div className="mt-6 rounded-xl border border-dashed border-[rgb(var(--border))] px-4 py-8 text-center text-xs text-[rgb(var(--muted))]">
                  Aucune commande
                </div>
              ) : (
                <div className="mt-5 space-y-4">
                  {Object.entries(ordersByStatus).map(([key, data]) => {
                    const pct =
                      stats.orderCount > 0
                        ? Math.round((data.count / stats.orderCount) * 100)
                        : 0;
                    const colorMap: Record<string, string> = {
                      "En cours": "bg-amber-400",
                      Livree: "bg-[rgb(var(--success))]",
                      Annulee: "bg-red-400",
                    };
                    const bar = colorMap[data.label] ?? "bg-gray-400";
                    return (
                      <div key={key}>
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium">{data.label}</span>
                          <span className="text-[rgb(var(--muted))]">
                            {data.count} ({pct}%)
                          </span>
                        </div>
                        <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-black/[0.04]">
                          <div
                            className={cn("h-full rounded-full transition-all", bar)}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>
        </>
      )}
    </VendorShell>
  );
}

function KpiCard({
  label,
  value,
  icon,
  highlight,
}: {
  label: string;
  value: string;
  icon: string;
  highlight?: boolean;
}) {
  return (
    <Card
      className={cn(
        "p-5",
        highlight &&
          "border-[rgb(var(--primary))]/30 bg-gradient-to-br from-[rgb(var(--primary))]/[0.04] to-transparent"
      )}
    >
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "grid h-11 w-11 place-items-center rounded-2xl text-lg",
            highlight
              ? "bg-[rgb(var(--primary))]/15"
              : "bg-[rgb(var(--primary))]/10"
          )}
        >
          {icon}
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[rgb(var(--muted))]">
            {label}
          </p>
          <p className="truncate text-lg font-semibold tracking-tight">
            {value}
          </p>
        </div>
      </div>
    </Card>
  );
}

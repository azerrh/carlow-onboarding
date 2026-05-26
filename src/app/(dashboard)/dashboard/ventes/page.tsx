"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { VendorShell, VendorPageHeader } from "@/components/vendor/VendorShell";
import { cn } from "@/lib/cn";

/* ---------------------------------------------------------------
   Types rapport IA
   --------------------------------------------------------------- */
interface AiRecommendation {
  titre: string;
  detail: string;
}
interface AiReport {
  synthese: string;
  points_forts: string[];
  points_attention: string[];
  recommandations: AiRecommendation[];
  score: number;
}

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
  const [aiReport, setAiReport] = useState<AiReport | null>(null);
  const [aiReportBusy, setAiReportBusy] = useState(false);
  const [aiReportError, setAiReportError] = useState("");
  const [aiReportDate, setAiReportDate] = useState<string | null>(null);
  const [vendorId, setVendorId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const vid =
      typeof window !== "undefined" ? localStorage.getItem("vendorId") : null;
    if (!vid) {
      router.push("/login");
      return;
    }
    setVendorId(vid);

    try {
      const [statsRes, meRes] = await Promise.all([
        fetch(`/api/vendor/dashboard-stats?id=${vid}`),
        fetch(`/api/vendor/me?vendorId=${vid}`),
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

  async function generateAiReport() {
    if (!vendorId) return;
    setAiReportBusy(true);
    setAiReportError("");
    try {
      const res = await fetch("/api/ai/sales-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendorId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setAiReportError(data?.error ?? "Génération impossible. Réessayez dans quelques minutes.");
        return;
      }
      setAiReport(data.report as AiReport);
      setAiReportDate(data.generatedAt);
    } catch {
      setAiReportError("Erreur réseau.");
    } finally {
      setAiReportBusy(false);
    }
  }

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

          {/* Rapport IA des ventes — analyse Claude */}
          <Card className="mt-6 overflow-hidden p-0">
            {/* Bande dégradée en haut */}
            <div className="h-1 w-full bg-gradient-to-r from-[rgb(var(--primary))] via-[#e8923a] to-[rgb(var(--success))]" />

            <div className="p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[rgb(var(--primary))] to-[#c05510] text-lg shadow-sm">
                    ✨
                  </span>
                  <div>
                    <h2 className="text-base font-bold tracking-tight gradient-text">
                      Rapport IA des ventes
                    </h2>
                    <p className="mt-0.5 text-xs text-[rgb(var(--muted))]">
                      Claude analyse vos performances et vous donne des recommandations stratégiques personnalisées.
                    </p>
                  </div>
                </div>
                <button
                  onClick={generateAiReport}
                  disabled={aiReportBusy}
                  className={cn(
                    "inline-flex h-10 shrink-0 items-center gap-2 rounded-xl border border-[rgb(var(--primary))]/40 bg-[rgb(var(--card))] px-4 text-sm font-bold text-[rgb(var(--primary))] transition-all duration-150",
                    "hover:border-[rgb(var(--primary))] hover:bg-[rgb(var(--primary))]/10 hover:shadow-[0_2px_8px_rgb(var(--primary)/0.15)]",
                    "disabled:cursor-not-allowed disabled:opacity-50",
                    aiReportBusy && "cursor-wait"
                  )}
                >
                  {aiReportBusy ? (
                    <>
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Analyse en cours…
                    </>
                  ) : aiReport ? (
                    "🔄 Regénérer"
                  ) : (
                    "✨ Générer le rapport"
                  )}
                </button>
              </div>

              {aiReportError && (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700 animate-fade-in">
                  ⚠️ {aiReportError}
                </div>
              )}

              {aiReport && (
                <div className="mt-6 animate-fade-in space-y-5">
                  {/* Score global */}
                  <div className="flex items-center gap-4 rounded-2xl border border-[rgb(var(--primary))]/20 bg-gradient-to-br from-[rgb(var(--primary))]/[0.05] to-transparent p-4">
                    <div className="relative grid h-20 w-20 shrink-0 place-items-center">
                      <svg viewBox="0 0 80 80" className="absolute inset-0 -rotate-90">
                        <circle cx="40" cy="40" r="34" stroke="rgb(var(--border))" strokeWidth="6" fill="none" />
                        <circle
                          cx="40"
                          cy="40"
                          r="34"
                          stroke="rgb(var(--primary))"
                          strokeWidth="6"
                          fill="none"
                          strokeLinecap="round"
                          strokeDasharray={`${(2 * Math.PI * 34 * aiReport.score) / 100} ${2 * Math.PI * 34}`}
                          className="transition-all duration-1000"
                        />
                      </svg>
                      <span className="text-2xl font-bold text-[rgb(var(--primary))]">
                        {aiReport.score}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[rgb(var(--primary))]">
                        Synthèse globale · Score {aiReport.score}/100
                      </p>
                      <p className="mt-1 text-sm leading-relaxed">
                        {aiReport.synthese}
                      </p>
                      {aiReportDate && (
                        <p className="mt-2 text-[10px] italic text-[rgb(var(--muted))]">
                          Généré le{" "}
                          {new Date(aiReportDate).toLocaleString("fr-FR", {
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Points forts & attention */}
                  <div className="grid gap-4 lg:grid-cols-2">
                    {aiReport.points_forts.length > 0 && (
                      <div className="rounded-2xl border border-[rgb(var(--success))]/25 bg-[rgb(var(--success))]/[0.04] p-4">
                        <h3 className="flex items-center gap-2 text-sm font-bold text-[rgb(var(--success))]">
                          <span>✅</span> Points forts
                        </h3>
                        <ul className="mt-3 space-y-2">
                          {aiReport.points_forts.map((p, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs leading-relaxed">
                              <span className="mt-0.5 text-[rgb(var(--success))]">▸</span>
                              <span>{p}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {aiReport.points_attention.length > 0 && (
                      <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4">
                        <h3 className="flex items-center gap-2 text-sm font-bold text-amber-700">
                          <span>⚠️</span> Points d&apos;attention
                        </h3>
                        <ul className="mt-3 space-y-2">
                          {aiReport.points_attention.map((p, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs leading-relaxed">
                              <span className="mt-0.5 text-amber-600">▸</span>
                              <span>{p}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Recommandations */}
                  {aiReport.recommandations.length > 0 && (
                    <div>
                      <h3 className="flex items-center gap-2 text-sm font-bold text-[rgb(var(--primary))]">
                        <span>💡</span> Recommandations IA
                      </h3>
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        {aiReport.recommandations.map((r, i) => (
                          <div
                            key={i}
                            className="rounded-2xl border border-[rgb(var(--border))]/70 bg-[rgb(var(--card))] p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-[rgb(var(--primary))]/30"
                          >
                            <div className="flex items-start gap-2">
                              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-[rgb(var(--primary))]/10 text-xs font-bold text-[rgb(var(--primary))]">
                                {i + 1}
                              </span>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold">{r.titre}</p>
                                <p className="mt-1 text-xs leading-relaxed text-[rgb(var(--muted))]">
                                  {r.detail}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <p className="text-[10px] italic text-[rgb(var(--muted))]">
                    💡 Ce rapport est généré automatiquement par Claude (Anthropic) à partir de vos données de ventes. Il s&apos;agit d&apos;une analyse algorithmique à valider par votre jugement.
                  </p>
                </div>
              )}

              {!aiReport && !aiReportBusy && !aiReportError && (
                <div className="mt-4 rounded-xl border border-dashed border-[rgb(var(--primary))]/25 bg-[rgb(var(--primary))]/[0.03] p-4 text-center">
                  <p className="text-xs text-[rgb(var(--muted))]">
                    Cliquez sur <strong>✨ Générer le rapport</strong> pour obtenir une analyse personnalisée de vos performances commerciales.
                  </p>
                </div>
              )}
            </div>
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
        "p-5 transition-all duration-200 hover:-translate-y-0.5",
        highlight &&
          "border-[rgb(var(--primary))]/25 bg-gradient-to-br from-[rgb(var(--primary))]/8 to-transparent"
      )}
    >
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-lg",
            highlight
              ? "bg-gradient-to-br from-[rgb(var(--primary))]/20 to-[rgb(var(--primary))]/10"
              : "bg-gradient-to-br from-[rgb(var(--primary))]/15 to-[rgb(var(--primary))]/8"
          )}
        >
          {icon}
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[rgb(var(--muted))]">
            {label}
          </p>
          <p className="truncate text-lg font-bold tracking-tight">
            {value}
          </p>
        </div>
      </div>
    </Card>
  );
}

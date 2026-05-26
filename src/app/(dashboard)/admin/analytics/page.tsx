"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AdminShell, AdminPageHeader } from "@/components/admin/AdminShell";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";

/**
 * Page Analytics avancés admin.
 *
 * Visualisations dédiées qui complètent /admin/dashboard :
 *  - Funnel d'onboarding vendeur
 *  - Heatmap commandes (jour × heure)
 *  - Indicateurs de santé plateforme
 *  - Performance détaillée par vendeur (table triable)
 *  - Distribution des prix produits
 *  - Funnel de conversion acheteur
 *  - Fidélité acheteurs (taux de récurrence)
 *  - Distribution des notes
 */

type Period = "7d" | "30d" | "90d" | "12m";

interface FunnelStep {
  step: string;
  count: number;
  ratePct: number;
}

interface VendorPerf {
  id: string;
  name: string;
  createdAt: string;
  totalProducts: number;
  activeProducts: number;
  stockedProducts: number;
  totalOrders: number;
  totalQty: number;
  totalRevenueCents: number;
  aovCents: number;
  deliveryRatePct: number;
  cancellationRatePct: number;
}

interface AnalyticsData {
  period: string;
  ordersInPeriod: number;
  onboardingFunnel: FunnelStep[];
  heatmap: { values: number[][]; max: number };
  health: {
    productsWithPhotoPct: number;
    productsWithDescriptionPct: number;
    productsWithStockPct: number;
    productsWithCategoryPct: number;
    productsWithVolumeDiscountsPct: number;
    activeVendorsPct: number;
    activeCatalogsPct: number;
    cancellationRatePct: number;
  };
  vendorPerformance: VendorPerf[];
  priceDistribution: { label: string; count: number; percent: number }[];
  buyerFunnel: { step: string; count: number; pct: number }[];
  buyerLoyalty: {
    uniqueBuyers: number;
    repeatBuyers: number;
    repeatRatePct: number;
    avgOrdersPerBuyer: number;
  };
  reviewsByRating: { rating: number; count: number; percent: number }[];
  reviewsAggregate: { average: number; count: number };
  catalog: {
    totalProducts: number;
    totalCatalogs: number;
    activeCatalogs: number;
    totalDocuments: number;
    totalCertifications: number;
  };
}

const PERIOD_LABELS: Record<Period, string> = {
  "7d": "7 jours",
  "30d": "30 jours",
  "90d": "90 jours",
  "12m": "12 mois",
};

const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

function formatCents(cents: number): string {
  if (cents >= 100_000_000)
    return (cents / 100_000_000).toFixed(1) + "M€";
  if (cents >= 100_000)
    return (cents / 100_000).toFixed(1) + "k€";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export default function AdminAnalyticsPage() {
  const router = useRouter();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("30d");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    fetch(`/api/admin/analytics?period=${period}`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        if (d.success) {
          setData(d);
        } else {
          if (d.error?.includes("autorisé")) {
            router.replace("/admin/login");
            return;
          }
          setError(d.error ?? "Erreur de chargement");
        }
      })
      .catch(() => {
        if (!cancelled) setError("Erreur réseau");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [period, router]);

  return (
    <AdminShell>
      <AdminPageHeader
        breadcrumb={["Admin", "Analytics avancés"]}
        title="📈 Analytics avancés"
        subtitle="Indicateurs de santé, funnels, performance vendeurs, distribution des prix."
        action={
          <div className="flex gap-1.5 rounded-2xl border border-[rgb(var(--border))]/70 bg-[rgb(var(--card))] p-1">
            {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  "rounded-xl px-3 py-1.5 text-xs font-semibold transition-all duration-150",
                  period === p
                    ? "bg-[rgb(var(--primary))] text-white shadow-sm"
                    : "text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]"
                )}
              >
                {PERIOD_LABELS[p]}
              </button>
            ))}
          </div>
        }
      />

      {error && (
        <Card className="mb-4 border-red-200 bg-red-50 p-4 text-sm text-red-700">
          ⚠️ {error}
        </Card>
      )}

      {loading || !data ? (
        <Card className="grid h-64 place-items-center text-sm text-[rgb(var(--muted))]">
          Chargement des analytics…
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Bandeau récap */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <RecapCard
              icon="📦"
              label="Commandes période"
              value={String(data.ordersInPeriod)}
            />
            <RecapCard
              icon="❤️"
              label="Acheteurs fidèles"
              value={`${data.buyerLoyalty.repeatRatePct}%`}
              hint={`${data.buyerLoyalty.repeatBuyers} sur ${data.buyerLoyalty.uniqueBuyers}`}
            />
            <RecapCard
              icon="⭐"
              label="Note moyenne"
              value={
                data.reviewsAggregate.count > 0
                  ? `${data.reviewsAggregate.average} / 5`
                  : "—"
              }
              hint={`${data.reviewsAggregate.count} avis`}
            />
            <RecapCard
              icon="❌"
              label="Taux d'annulation"
              value={`${data.health.cancellationRatePct}%`}
              danger={data.health.cancellationRatePct > 10}
            />
          </div>

          {/* Funnel onboarding vendeur */}
          <Card className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-base font-bold tracking-tight">
                  🪜 Funnel d&apos;onboarding vendeur
                </h2>
                <p className="mt-0.5 text-xs text-[rgb(var(--muted))]">
                  Combien de vendeurs ont atteint chaque étape de leur dossier
                </p>
              </div>
            </div>
            <div className="mt-6 space-y-3">
              {data.onboardingFunnel.map((step, i) => {
                const width = step.ratePct;
                const isLast = i === data.onboardingFunnel.length - 1;
                return (
                  <div key={step.step}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="font-semibold">
                        <span className="inline-block w-5 text-[rgb(var(--muted))]">
                          {i + 1}.
                        </span>
                        {step.step}
                      </span>
                      <span className="font-mono text-[rgb(var(--muted))]">
                        {step.count} ({step.ratePct}%)
                      </span>
                    </div>
                    <div className="h-7 w-full overflow-hidden rounded-lg bg-black/[0.04]">
                      <div
                        className={cn(
                          "flex h-full items-center justify-end pr-3 text-[10px] font-bold text-white transition-all duration-500",
                          isLast
                            ? "bg-gradient-to-r from-[rgb(var(--success))] to-emerald-500"
                            : "bg-gradient-to-r from-[rgb(var(--primary))] to-[#c05510]"
                        )}
                        style={{ width: `${Math.max(width, 6)}%` }}
                      >
                        {width >= 12 && `${width}%`}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Heatmap commandes */}
          <Card className="p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-base font-bold tracking-tight">
                  🔥 Heatmap des commandes
                </h2>
                <p className="mt-0.5 text-xs text-[rgb(var(--muted))]">
                  Quand les acheteurs commandent (jour × heure) — période :{" "}
                  <strong>{PERIOD_LABELS[period]}</strong>
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-[rgb(var(--muted))]">
                <span>Moins</span>
                {[0.15, 0.3, 0.5, 0.75, 1].map((v) => (
                  <div
                    key={v}
                    className="h-3 w-3 rounded-sm"
                    style={{
                      backgroundColor: `rgb(var(--primary) / ${v})`,
                    }}
                  />
                ))}
                <span>Plus</span>
              </div>
            </div>

            <div className="mt-5 overflow-x-auto">
              <div className="inline-block min-w-full">
                {/* Header heures */}
                <div className="flex">
                  <div className="w-12 shrink-0" />
                  {Array.from({ length: 24 }).map((_, h) => (
                    <div
                      key={h}
                      className="flex-1 text-center text-[9px] font-medium text-[rgb(var(--muted))]"
                      style={{ minWidth: "20px" }}
                    >
                      {h % 3 === 0 ? `${h}h` : ""}
                    </div>
                  ))}
                </div>
                {/* Rows par jour */}
                {data.heatmap.values.map((row, dow) => (
                  <div key={dow} className="mt-0.5 flex items-center">
                    <div className="w-12 shrink-0 text-[11px] font-semibold text-[rgb(var(--muted))]">
                      {DAYS[dow]}
                    </div>
                    {row.map((val, h) => {
                      const intensity = val / data.heatmap.max;
                      return (
                        <div
                          key={h}
                          className="group relative h-6 flex-1 cursor-pointer rounded-sm transition-transform hover:z-10 hover:scale-110"
                          style={{
                            backgroundColor:
                              val === 0
                                ? "rgb(var(--border) / 0.3)"
                                : `rgb(var(--primary) / ${Math.max(0.15, intensity)})`,
                            minWidth: "20px",
                            marginLeft: "1px",
                            marginRight: "1px",
                          }}
                          title={`${DAYS[dow]} ${h}h-${h + 1}h : ${val} commande${val > 1 ? "s" : ""}`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Santé plateforme + Funnel acheteur */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="p-6">
              <h2 className="text-base font-bold tracking-tight">
                💚 Santé de la plateforme
              </h2>
              <p className="mt-0.5 text-xs text-[rgb(var(--muted))]">
                Qualité des données et complétion du catalogue
              </p>

              <div className="mt-5 space-y-3.5">
                <HealthBar label="Produits avec photo" value={data.health.productsWithPhotoPct} />
                <HealthBar label="Produits avec description" value={data.health.productsWithDescriptionPct} />
                <HealthBar label="Produits avec stock" value={data.health.productsWithStockPct} />
                <HealthBar label="Produits avec catégorie" value={data.health.productsWithCategoryPct} />
                <HealthBar label="Produits avec remises volume" value={data.health.productsWithVolumeDiscountsPct} />
                <HealthBar label="Vendeurs actifs" value={data.health.activeVendorsPct} />
                <HealthBar label="Catalogues actifs" value={data.health.activeCatalogsPct} />
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-base font-bold tracking-tight">
                🛒 Funnel de conversion acheteur
              </h2>
              <p className="mt-0.5 text-xs text-[rgb(var(--muted))]">
                Parcours d&apos;un acheteur depuis l&apos;inscription
              </p>

              <div className="mt-5 space-y-2.5">
                {data.buyerFunnel.map((step, i) => {
                  const maxPct = data.buyerFunnel[0].pct || 100;
                  const widthRel = (step.pct / maxPct) * 100;
                  return (
                    <div key={step.step}>
                      <div className="mb-1 flex items-baseline justify-between text-xs">
                        <span className="font-semibold">
                          {i + 1}. {step.step}
                        </span>
                        <span>
                          <strong className="text-base">{step.count}</strong>
                          <span className="ml-1.5 text-[rgb(var(--muted))]">
                            ({step.pct}%)
                          </span>
                        </span>
                      </div>
                      <div className="relative h-9 w-full overflow-hidden rounded-lg bg-black/[0.04]">
                        <div
                          className="h-full bg-gradient-to-r from-[rgb(var(--success))] to-emerald-400 transition-all duration-500"
                          style={{
                            width: `${Math.max(widthRel, 4)}%`,
                            clipPath: i === 0 ? undefined : "polygon(8% 0, 100% 0, 100% 100%, 0% 100%)",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 rounded-xl border border-[rgb(var(--primary))]/20 bg-[rgb(var(--primary))]/5 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[rgb(var(--primary))]">
                  Fidélité
                </p>
                <p className="mt-1 text-sm">
                  <strong>{data.buyerLoyalty.avgOrdersPerBuyer}</strong> commande
                  {data.buyerLoyalty.avgOrdersPerBuyer > 1 ? "s" : ""} en moyenne par acheteur récurrent
                </p>
              </div>
            </Card>
          </div>

          {/* Distribution des prix + Notes */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="p-6">
              <h2 className="text-base font-bold tracking-tight">
                💰 Distribution des prix
              </h2>
              <p className="mt-0.5 text-xs text-[rgb(var(--muted))]">
                Histogramme des prix produits actifs
              </p>

              {(() => {
                const maxCount = Math.max(
                  ...data.priceDistribution.map((b) => b.count),
                  1
                );
                return (
                  <div className="mt-6 flex h-44 items-end gap-1.5">
                    {data.priceDistribution.map((b, i) => {
                      const heightPct = (b.count / maxCount) * 100;
                      return (
                        <div
                          key={b.label}
                          className="group flex flex-1 flex-col items-center gap-1.5"
                        >
                          {b.count > 0 && (
                            <span className="text-[10px] font-semibold text-[rgb(var(--muted))]">
                              {b.count}
                            </span>
                          )}
                          <div
                            className={cn(
                              "w-full rounded-t-lg transition-all duration-500",
                              b.count > 0
                                ? "bg-gradient-to-t from-[rgb(var(--primary))] to-[rgb(var(--primary))]/40 hover:from-[#c05510] hover:to-[rgb(var(--primary))]"
                                : "bg-black/[0.04]"
                            )}
                            style={{
                              height: `${Math.max(heightPct, 4)}%`,
                              animationDelay: `${i * 50}ms`,
                            }}
                            title={`${b.label} : ${b.count} produits (${b.percent}%)`}
                          />
                          <span className="text-[9px] text-center font-medium text-[rgb(var(--muted))]">
                            {b.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </Card>

            <Card className="p-6">
              <h2 className="text-base font-bold tracking-tight">
                ⭐ Distribution des avis
              </h2>
              <p className="mt-0.5 text-xs text-[rgb(var(--muted))]">
                Répartition des notes sur tous les produits
              </p>

              <div className="mt-5 flex items-center gap-4">
                <div className="text-center">
                  <p className="text-4xl font-bold tracking-tight text-[rgb(var(--primary))]">
                    {data.reviewsAggregate.count > 0
                      ? data.reviewsAggregate.average.toFixed(1)
                      : "—"}
                  </p>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
                    {data.reviewsAggregate.count} avis
                  </p>
                </div>
                <div className="flex-1 space-y-1.5">
                  {data.reviewsByRating.map((r) => (
                    <div key={r.rating} className="flex items-center gap-2">
                      <span className="flex w-12 items-center gap-0.5 text-xs font-semibold">
                        {r.rating}
                        <svg viewBox="0 0 24 24" fill="currentColor" className="h-3 w-3 text-amber-400">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                      </span>
                      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-black/[0.04]">
                        <div
                          className="h-full rounded-full bg-amber-400 transition-all duration-500"
                          style={{ width: `${r.percent}%` }}
                        />
                      </div>
                      <span className="w-12 text-right text-[10px] font-medium text-[rgb(var(--muted))]">
                        {r.count} ({r.percent}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>

          {/* Performance vendeurs */}
          <Card className="overflow-hidden p-0">
            <div className="border-b border-[rgb(var(--border))]/60 p-6">
              <h2 className="text-base font-bold tracking-tight">
                🏆 Performance détaillée des vendeurs
              </h2>
              <p className="mt-0.5 text-xs text-[rgb(var(--muted))]">
                Top 10 par CA sur la période ({PERIOD_LABELS[period]})
              </p>
            </div>

            {data.vendorPerformance.length === 0 ? (
              <div className="p-10 text-center text-sm text-[rgb(var(--muted))]">
                Aucune vente sur la période sélectionnée
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-[rgb(var(--bg))]/50 text-left text-[10px] font-bold uppercase tracking-wider text-[rgb(var(--muted))]">
                    <tr>
                      <th className="px-4 py-3">Rang</th>
                      <th className="px-4 py-3">Vendeur</th>
                      <th className="px-4 py-3 text-right">CA</th>
                      <th className="px-4 py-3 text-right">Commandes</th>
                      <th className="px-4 py-3 text-right">Panier moyen</th>
                      <th className="px-4 py-3 text-right">Produits</th>
                      <th className="px-4 py-3 text-right">Taux livraison</th>
                      <th className="px-4 py-3 text-right">Taux annulation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[rgb(var(--border))]/40">
                    {data.vendorPerformance.map((v, i) => (
                      <tr
                        key={v.id}
                        className="transition hover:bg-[rgb(var(--primary))]/[0.03]"
                      >
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              "grid h-7 w-7 place-items-center rounded-lg text-xs font-bold",
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
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/marketplace/vendeur/${v.id}`}
                            className="font-semibold hover:text-[rgb(var(--primary))]"
                          >
                            {v.name}
                          </Link>
                          <p className="text-[10px] text-[rgb(var(--muted))]">
                            Inscrit le{" "}
                            {new Date(v.createdAt).toLocaleDateString("fr-FR", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-right font-bold">
                          {formatCents(v.totalRevenueCents)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {v.totalOrders}
                          <span className="text-[10px] text-[rgb(var(--muted))]">
                            {" "}
                            ({v.totalQty} u.)
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {v.aovCents > 0 ? formatCents(v.aovCents) : "—"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="font-mono">
                            {v.activeProducts}/{v.totalProducts}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span
                            className={cn(
                              "rounded-md px-2 py-0.5 text-[10px] font-bold",
                              v.deliveryRatePct >= 80
                                ? "bg-[rgb(var(--success))]/10 text-[rgb(var(--success))]"
                                : v.deliveryRatePct >= 50
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-red-50 text-red-600"
                            )}
                          >
                            {v.deliveryRatePct}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span
                            className={cn(
                              "rounded-md px-2 py-0.5 text-[10px] font-bold",
                              v.cancellationRatePct === 0
                                ? "bg-[rgb(var(--success))]/10 text-[rgb(var(--success))]"
                                : v.cancellationRatePct < 10
                                  ? "bg-black/[0.04] text-[rgb(var(--muted))]"
                                  : "bg-red-50 text-red-600"
                            )}
                          >
                            {v.cancellationRatePct}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* Catalogue récap */}
          <Card className="p-6">
            <h2 className="text-base font-bold tracking-tight">
              📚 Récapitulatif catalogue
            </h2>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
              <MiniStat
                label="Produits actifs"
                value={String(data.catalog.totalProducts)}
              />
              <MiniStat
                label="Catalogues"
                value={`${data.catalog.activeCatalogs}/${data.catalog.totalCatalogs}`}
              />
              <MiniStat
                label="Documents"
                value={String(data.catalog.totalDocuments)}
              />
              <MiniStat
                label="Certifications"
                value={String(data.catalog.totalCertifications)}
              />
              <MiniStat
                label="Total fichiers"
                value={String(
                  data.catalog.totalDocuments + data.catalog.totalCertifications
                )}
              />
            </div>
          </Card>
        </div>
      )}
    </AdminShell>
  );
}

/* ---------------- Sous-composants ---------------- */

function RecapCard({
  icon,
  label,
  value,
  hint,
  danger,
}: {
  icon: string;
  label: string;
  value: string;
  hint?: string;
  danger?: boolean;
}) {
  return (
    <Card
      className={cn(
        "p-5 transition-all duration-200 hover:-translate-y-0.5",
        danger && "border-red-200 bg-red-50/30"
      )}
    >
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-lg",
            danger
              ? "bg-red-100"
              : "bg-gradient-to-br from-[rgb(var(--primary))]/15 to-[rgb(var(--primary))]/8"
          )}
        >
          {icon}
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[rgb(var(--muted))]">
            {label}
          </p>
          <p
            className={cn(
              "truncate text-xl font-bold tracking-tight",
              danger && "text-red-600"
            )}
          >
            {value}
          </p>
          {hint && (
            <p className="text-[10px] font-medium text-[rgb(var(--muted))]">
              {hint}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}

function HealthBar({ label, value }: { label: string; value: number }) {
  const color =
    value >= 80
      ? "from-[rgb(var(--success))] to-emerald-400"
      : value >= 50
        ? "from-amber-400 to-orange-400"
        : "from-red-400 to-red-500";
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="font-medium">{label}</span>
        <span className="font-mono font-bold">{value}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-black/[0.04]">
        <div
          className={cn(
            "h-full rounded-full bg-gradient-to-r transition-all duration-500",
            color
          )}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[rgb(var(--border))]/60 bg-[rgb(var(--card))] p-3 text-center">
      <p className="text-xl font-bold tracking-tight">{value}</p>
      <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-[rgb(var(--muted))]">
        {label}
      </p>
    </div>
  );
}

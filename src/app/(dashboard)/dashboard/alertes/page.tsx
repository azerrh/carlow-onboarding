"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { VendorShell } from "@/components/vendor/VendorShell";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";

interface AlertSubscriber {
  id: string;
  buyerEmail: string;
  buyerName: string;
  priceAtSubscription: number;
  stockAtSubscription: number;
  createdAt: string;
}

interface ProductWithAlerts {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string | null;
  reference: string | null;
  photos: { url: string }[];
  alerts: AlertSubscriber[];
}

function fmtEur(v: number) {
  return v.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}
function fmtDate(s: string) {
  return new Date(s).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

export default function VendorAlertesPage() {
  const router = useRouter();
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [products, setProducts] = useState<ProductWithAlerts[]>([]);
  const [totalSubscribers, setTotalSubscribers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    const vid = localStorage.getItem("vendorId");
    if (!vid) { router.replace("/login"); return; }
    setVendorId(vid);
  }, [router]);

  const fetchAlerts = useCallback(async () => {
    if (!vendorId) return;
    try {
      const res = await fetch(`/api/vendor/alerts?id=${vendorId}`);
      const data = await res.json();
      if (data.success) {
        setProducts(data.products ?? []);
        setTotalSubscribers(data.totalSubscribers ?? 0);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [vendorId]);

  useEffect(() => {
    if (vendorId) fetchAlerts();
  }, [vendorId, fetchAlerts]);

  return (
    <VendorShell>
      <div className="mx-auto max-w-[900px] px-4 py-8">
        {/* Titre */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Alertes acheteurs</h1>
            <p className="mt-1 text-sm text-[rgb(var(--muted))]">
              {totalSubscribers} acheteur{totalSubscribers !== 1 ? "s" : ""} abonné{totalSubscribers !== 1 ? "s" : ""} à vos produits
            </p>
          </div>
        </div>

        {/* Info */}
        <Card className="mt-5 border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <span className="text-xl">🔔</span>
            <div>
              <p className="text-sm font-semibold text-amber-800">Comment fonctionnent les alertes ?</p>
              <p className="mt-1 text-xs text-amber-700">
                Les acheteurs peuvent s&apos;abonner à vos produits pour être notifiés d&apos;une <strong>baisse de prix</strong> ou d&apos;un{" "}
                <strong>retour en stock</strong>. Les emails sont envoyés automatiquement dès que vous mettez à jour un produit.
                Mettez à jour vos prix et stocks régulièrement pour maximiser la conversion !
              </p>
            </div>
          </div>
        </Card>

        {/* Contenu */}
        <div className="mt-4 space-y-3">
          {loading ? (
            <Card className="p-10 text-center text-sm text-[rgb(var(--muted))]">Chargement…</Card>
          ) : products.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="text-3xl">🔔</div>
              <p className="mt-3 text-sm font-semibold">Aucun abonné pour l&apos;instant</p>
              <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                Les acheteurs peuvent s&apos;abonner aux alertes depuis vos fiches produit sur la marketplace.
              </p>
            </Card>
          ) : (
            products.map((product) => {
              const isExpanded = expanded === product.id;
              const inStock = product.stock > 0;

              return (
                <Card key={product.id} className="overflow-hidden p-0">
                  {/* En-tête produit */}
                  <button
                    className="flex w-full items-center gap-4 p-5 text-left hover:bg-black/[0.01] transition"
                    onClick={() => setExpanded(isExpanded ? null : product.id)}
                  >
                    {/* Photo */}
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-[rgb(var(--border))] bg-[#f8f9fc]">
                      {product.photos[0]?.url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={product.photos[0].url} alt={product.name} loading="lazy" decoding="async" className="h-full w-full object-cover" />
                      ) : (
                        <div className="grid h-full place-items-center text-xl text-[rgb(var(--muted))]">📦</div>
                      )}
                    </div>

                    {/* Infos */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={cn(
                          "rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                          inStock
                            ? "border-[rgb(var(--success))]/30 bg-[rgb(var(--success))]/10 text-[rgb(var(--success))]"
                            : "border-red-200 bg-red-50 text-red-700"
                        )}>
                          {inStock ? `Stock : ${product.stock}` : "Rupture"}
                        </span>
                        {product.category && (
                          <span className="rounded-full bg-[rgb(var(--primary))]/10 px-2 py-0.5 text-[10px] font-semibold text-[rgb(var(--primary))]">
                            {product.category}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm font-semibold">{product.name}</p>
                      <p className="text-xs text-[rgb(var(--muted))]">
                        Prix actuel : {fmtEur(product.price)}
                        {product.reference && ` · Réf. ${product.reference}`}
                      </p>
                    </div>

                    {/* Badge abonnés */}
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <div className="flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-700">
                        🔔 {product.alerts.length} abonné{product.alerts.length !== 1 ? "s" : ""}
                      </div>
                      <span className="text-xs text-[rgb(var(--muted))]">
                        {isExpanded ? "▲ Masquer" : "▼ Voir la liste"}
                      </span>
                    </div>
                  </button>

                  {/* Liste des abonnés */}
                  {isExpanded && (
                    <div className="border-t border-[rgb(var(--border))]/50">
                      <div className="px-5 py-3">
                        <p className="text-xs font-semibold text-[rgb(var(--muted))] uppercase tracking-wider mb-3">
                          Acheteurs abonnés
                        </p>
                        <div className="space-y-2">
                          {product.alerts.map((sub) => {
                            const priceDiff = product.price - sub.priceAtSubscription;
                            const pricePct = Math.round((Math.abs(priceDiff) / sub.priceAtSubscription) * 100);
                            return (
                              <div
                                key={sub.id}
                                className="flex items-center justify-between rounded-xl border border-[rgb(var(--border))]/60 bg-[#fafaf9] px-4 py-3"
                              >
                                <div>
                                  <p className="text-sm font-medium">{sub.buyerName}</p>
                                  <p className="text-xs text-[rgb(var(--muted))]">
                                    {sub.buyerEmail} · Abonné le {fmtDate(sub.createdAt)}
                                  </p>
                                  <p className="text-[11px] text-[rgb(var(--muted))]">
                                    Prix vu : {fmtEur(sub.priceAtSubscription)}
                                    {sub.stockAtSubscription === 0 && " · était en rupture"}
                                  </p>
                                </div>
                                <div className="text-right">
                                  {priceDiff < 0 && (
                                    <span className="rounded-full bg-[rgb(var(--success))]/10 px-2 py-0.5 text-[10px] font-semibold text-[rgb(var(--success))]">
                                      📉 −{pricePct}% notifié
                                    </span>
                                  )}
                                  {priceDiff > 0 && (
                                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                                      📈 +{pricePct}% depuis abonnement
                                    </span>
                                  )}
                                  {priceDiff === 0 && (
                                    <span className="text-[10px] text-[rgb(var(--muted))]">Prix inchangé</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })
          )}
        </div>
      </div>
    </VendorShell>
  );
}

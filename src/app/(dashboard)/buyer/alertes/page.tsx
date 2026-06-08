"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BuyerNav } from "@/components/buyer/BuyerNav";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";

interface AlertProduct {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string | null;
  reference: string | null;
  photos: { url: string }[];
  catalog: { vendor: { name: string; companyName: string | null } };
}

interface ProductAlert {
  id: string;
  priceAtSubscription: number;
  stockAtSubscription: number;
  createdAt: string;
  product: AlertProduct;
}

function fmtEur(v: number) {
  return v.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

export default function BuyerAlertesPage() {
  const router = useRouter();
  const [alerts, setAlerts] = useState<ProductAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [buyerEmail, setBuyerEmail] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    const id = localStorage.getItem("buyerId");
    if (!id) { router.replace("/buyer/login"); return; }

    // Récupérer l'email pour les opérations de suppression
    fetch(`/api/buyer/me?id=${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setBuyerEmail(d.buyer?.email ?? null);
      });

    fetch(`/api/alerts?buyerId=${id}`)
      .then((r) => r.json())
      .then((d) => { if (d.success) setAlerts(d.alerts ?? []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  async function handleRemove(alertId: string) {
    if (!buyerEmail) return;
    setRemoving(alertId);
    try {
      const res = await fetch(`/api/alerts?id=${alertId}&email=${encodeURIComponent(buyerEmail)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setAlerts((prev) => prev.filter((a) => a.id !== alertId));
      }
    } finally {
      setRemoving(null);
    }
  }

  return (
    <div className="portal-page min-h-screen">
      <BuyerNav />

      <div className="mx-auto max-w-[900px] px-4 py-8">
        {/* Titre */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Mes alertes prix & stock</h1>
            <p className="mt-1 text-sm text-[rgb(var(--muted))]">
              {alerts.length} alerte{alerts.length !== 1 ? "s" : ""} active{alerts.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Link href="/marketplace">
            <Button variant="secondary" size="sm">Explorer la marketplace →</Button>
          </Link>
        </div>

        {/* Nav rapide */}
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          {[
            { href: "/buyer/dashboard", label: "🏠 Tableau de bord" },
            { href: "/buyer/orders", label: "🛒 Commandes" },
            { href: "/buyer/favoris", label: "❤️ Favoris" },
            { href: "/buyer/devis", label: "📋 Devis" },
            { href: "/buyer/alertes", label: "🔔 Alertes", active: true },
          ].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "rounded-lg px-3 py-1.5 font-medium transition",
                l.active
                  ? "bg-amber-500 text-white"
                  : "bg-black/[0.04] text-[rgb(var(--muted))] hover:bg-black/[0.08]"
              )}
            >
              {l.label}
            </Link>
          ))}
        </div>

        {/* Explications */}
        <Card className="mt-5 border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <span className="text-xl">🔔</span>
            <div>
              <p className="text-sm font-semibold text-amber-800">Comment fonctionnent les alertes ?</p>
              <p className="mt-1 text-xs text-amber-700">
                Vous recevrez un email automatique dès qu&apos;un produit suivi connaît une <strong>baisse de prix</strong>{" "}
                ou un <strong>retour en stock</strong> (pour les produits en rupture). Vous pouvez supprimer une alerte à tout moment.
              </p>
            </div>
          </div>
        </Card>

        {/* Liste des alertes */}
        <div className="mt-4 space-y-3">
          {loading ? (
            <Card className="p-10 text-center text-sm text-[rgb(var(--muted))]">Chargement…</Card>
          ) : alerts.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="text-3xl">🔔</div>
              <p className="mt-3 text-sm font-semibold">Aucune alerte active</p>
              <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                Sur une fiche produit, cliquez sur &quot;🔔 M&apos;alerter&quot; pour être notifié des baisses de prix ou retours en stock.
              </p>
              <Link href="/marketplace" className="mt-4 inline-block">
                <Button size="sm">Explorer la marketplace</Button>
              </Link>
            </Card>
          ) : (
            alerts.map((alert) => {
              const product = alert.product;
              const vendorName = product.catalog.vendor.companyName ?? product.catalog.vendor.name;
              const inStock = product.stock > 0;
              const priceDiff = product.price - alert.priceAtSubscription;
              const pricePct = Math.round((Math.abs(priceDiff) / alert.priceAtSubscription) * 100);

              return (
                <Card key={alert.id} className="overflow-hidden p-0">
                  <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:gap-5">
                    {/* Photo */}
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-[rgb(var(--border))] bg-[#f8f9fc]">
                      {product.photos[0]?.url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={product.photos[0].url} alt={product.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="grid h-full place-items-center text-2xl text-[rgb(var(--muted))]">📦</div>
                      )}
                    </div>

                    {/* Infos */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={cn(
                          "rounded-full border px-2.5 py-0.5 text-[10px] font-semibold",
                          inStock
                            ? "border-[rgb(var(--success))]/30 bg-[rgb(var(--success))]/10 text-[rgb(var(--success))]"
                            : "border-red-200 bg-red-50 text-red-700"
                        )}>
                          {inStock ? `En stock (${product.stock})` : "Rupture de stock"}
                        </span>
                        {product.category && (
                          <span className="rounded-full bg-[rgb(var(--primary))]/10 px-2 py-0.5 text-[10px] font-semibold text-[rgb(var(--primary))]">
                            {product.category}
                          </span>
                        )}
                      </div>
                      <h2 className="mt-1.5 text-sm font-semibold">{product.name}</h2>
                      <p className="text-xs text-[rgb(var(--muted))]">
                        {vendorName} · Alerte depuis le {fmtDate(alert.createdAt)}
                      </p>

                      {/* Comparaison prix */}
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
                        <span className="text-[rgb(var(--muted))]">
                          Prix actuel : <strong className="text-[rgb(var(--fg))]">{fmtEur(product.price)}</strong>
                        </span>
                        <span className="text-[rgb(var(--muted))]">
                          Prix au moment de l&apos;alerte : {fmtEur(alert.priceAtSubscription)}
                        </span>
                        {priceDiff < 0 && (
                          <span className="rounded-full bg-[rgb(var(--success))]/10 px-2 py-0.5 font-semibold text-[rgb(var(--success))]">
                            📉 −{pricePct}%
                          </span>
                        )}
                        {priceDiff > 0 && (
                          <span className="rounded-full bg-amber-50 px-2 py-0.5 font-semibold text-amber-700">
                            📈 +{pricePct}%
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <Link
                        href={`/marketplace/${product.id}`}
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[rgb(var(--border))] bg-white px-3 text-xs font-semibold hover:border-[rgb(var(--primary))]/30 hover:bg-[rgb(var(--primary))]/[0.04] transition"
                      >
                        Voir le produit →
                      </Link>
                      <button
                        onClick={() => handleRemove(alert.id)}
                        disabled={removing === alert.id}
                        className="inline-flex h-8 items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 text-xs font-medium text-red-600 hover:bg-red-100 disabled:opacity-50 transition"
                      >
                        {removing === alert.id ? "…" : "🗑 Supprimer"}
                      </button>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Brand } from "@/components/ui/Brand";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StarRating } from "@/components/ui/StarRating";
import { ProductCardSkeleton, Skeleton } from "@/components/ui/Skeleton";
import { VendorBadges, type BadgeData } from "@/components/marketplace/VendorBadges";
import { cn } from "@/lib/cn";

interface VendorPublic {
  id: string;
  name: string;
  legalForm: string | null;
  activatedAt: string | null;
  memberSince: string;
  productsCount: number;
  catalogsCount: number;
  rating: { average: number; count: number };
}

interface VendorProduct {
  id: string;
  name: string;
  price: number;
  category: string | null;
  stock: number;
  reference: string | null;
  imageUrl: string | null;
  catalogName: string | null;
}

function formatPrice(p: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(p);
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });
}

export default function PublicVendorPage() {
  const { id } = useParams();
  const vendorId = typeof id === "string" ? id : Array.isArray(id) ? id[0] : "";

  const [vendor, setVendor] = useState<VendorPublic | null>(null);
  const [products, setProducts] = useState<VendorProduct[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [badges, setBadges] = useState<BadgeData[]>([]);

  useEffect(() => {
    if (!vendorId) return;
    setLoading(true);
    Promise.all([
      fetch(`/api/marketplace/vendors/${vendorId}`).then((r) => r.json()),
      fetch(`/api/marketplace/vendors/${vendorId}/badges`).then((r) => r.json()),
    ])
      .then(([data, badgesData]) => {
        if (data.success) {
          setVendor(data.vendor);
          setProducts(data.products ?? []);
          setCategories(data.categories ?? []);
        } else {
          setError(data.error || "Vendeur introuvable");
        }
        if (badgesData.success) setBadges(badgesData.badges ?? []);
      })
      .catch(() => setError("Erreur réseau"))
      .finally(() => setLoading(false));
  }, [vendorId]);

  const filteredProducts = useMemo(() => {
    if (categoryFilter === "ALL") return products;
    return products.filter((p) => p.category === categoryFilter);
  }, [products, categoryFilter]);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-[rgb(var(--border))] bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Brand variant="compact" />
            </Link>
            <nav className="hidden items-center gap-3 text-sm sm:flex">
              <Link
                href="/marketplace"
                className="text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]"
              >
                ← Retour marketplace
              </Link>
            </nav>
          </div>
          <Link href="/marketplace">
            <Button variant="ghost" size="sm">
              Marketplace
            </Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
        {loading ? (
          <>
            <Skeleton variant="card" className="h-44" />
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          </>
        ) : error ? (
          <Card className="p-10 text-center">
            <div className="text-3xl">🤔</div>
            <p className="mt-3 text-sm font-semibold">{error}</p>
            <p className="mt-1 text-xs text-[rgb(var(--muted))]">
              Ce vendeur n&apos;est peut-être plus actif sur la plateforme.
            </p>
            <div className="mt-5">
              <Link href="/marketplace">
                <Button>Retour à la marketplace</Button>
              </Link>
            </div>
          </Card>
        ) : vendor ? (
          <>
            {/* Bandeau vendeur */}
            <Card className="relative overflow-hidden p-6 sm:p-8">
              <div className="absolute -right-12 -top-12 -z-0 h-44 w-44 rounded-full bg-[rgb(var(--primary))]/15 blur-3xl" />
              <div className="absolute -bottom-10 -left-10 -z-0 h-44 w-44 rounded-full bg-[rgb(var(--success))]/10 blur-3xl" />

              <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-5">
                  <div className="grid h-20 w-20 shrink-0 place-items-center rounded-3xl bg-gradient-to-br from-[rgb(var(--primary))] to-[rgb(var(--primary))]/70 text-3xl font-bold text-white shadow-md">
                    {vendor.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-[rgb(var(--primary))]">
                      Vendeur Carlow
                    </p>
                    <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
                      {vendor.name}
                    </h1>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-[rgb(var(--muted))]">
                      {vendor.legalForm && (
                        <span className="rounded-md bg-black/[0.04] px-2 py-0.5 font-medium">
                          {vendor.legalForm}
                        </span>
                      )}
                      <span>· Membre depuis {formatDate(vendor.memberSince)}</span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-[rgb(var(--success))]/10 px-2 py-0.5 text-[rgb(var(--success))]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[rgb(var(--success))]" />
                        Compte vérifié
                      </span>
                    </div>

                    {/* Badges automatiques du vendeur */}
                    {badges.length > 0 && (
                      <div className="mt-3">
                        <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[rgb(var(--muted))]">
                          🏆 Distinctions
                        </p>
                        <VendorBadges badges={badges} variant="full" size="md" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 sm:gap-6">
                  <KpiPill
                    label="Produits"
                    value={String(vendor.productsCount)}
                  />
                  <KpiPill
                    label="Catalogues"
                    value={String(vendor.catalogsCount)}
                  />
                  <KpiPill
                    label="Note"
                    value={
                      vendor.rating.count > 0
                        ? `${vendor.rating.average.toFixed(1)}/5`
                        : "—"
                    }
                    sub={
                      vendor.rating.count > 0
                        ? `${vendor.rating.count} avis`
                        : "Aucun avis"
                    }
                  />
                </div>
              </div>

              {vendor.rating.count > 0 && (
                <div className="relative mt-6 flex items-center gap-3 border-t border-[rgb(var(--border))]/60 pt-4">
                  <StarRating value={vendor.rating.average} size="md" />
                  <span className="text-sm text-[rgb(var(--muted))]">
                    <span className="font-semibold text-[rgb(var(--fg))]">
                      {vendor.rating.average.toFixed(1)}
                    </span>{" "}
                    sur 5 — basée sur {vendor.rating.count} avis vérifié
                    {vendor.rating.count > 1 ? "s" : ""}
                  </span>
                </div>
              )}
            </Card>

            {/* Filtre catégories */}
            {categories.length > 0 && (
              <div className="mt-8 flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setCategoryFilter("ALL")}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-medium transition",
                    categoryFilter === "ALL"
                      ? "bg-[rgb(var(--primary))] text-white"
                      : "bg-black/[0.04] text-[rgb(var(--muted))] hover:bg-black/[0.08]"
                  )}
                >
                  Tous ({products.length})
                </button>
                {categories.map((c) => {
                  const count = products.filter((p) => p.category === c).length;
                  return (
                    <button
                      key={c}
                      onClick={() => setCategoryFilter(c)}
                      className={cn(
                        "rounded-full px-3 py-1.5 text-xs font-medium transition",
                        categoryFilter === c
                          ? "bg-[rgb(var(--primary))] text-white"
                          : "bg-black/[0.04] text-[rgb(var(--muted))] hover:bg-black/[0.08]"
                      )}
                    >
                      {c} ({count})
                    </button>
                  );
                })}
              </div>
            )}

            {/* Grille produits */}
            <div className="mt-6">
              {filteredProducts.length === 0 ? (
                <Card className="p-12 text-center">
                  <div className="text-3xl">📦</div>
                  <p className="mt-3 text-sm font-semibold">
                    Aucun produit dans cette catégorie
                  </p>
                  <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                    Essayez une autre catégorie ou consultez toute la marketplace.
                  </p>
                </Card>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {filteredProducts.map((p) => (
                    <Link
                      key={p.id}
                      href={`/marketplace/${p.id}`}
                      className="group flex flex-col overflow-hidden rounded-2xl border border-[rgb(var(--border))]/60 bg-white transition hover:border-[rgb(var(--primary))]/30 hover:shadow-md"
                    >
                      <div className="relative aspect-[4/3] bg-[#f8f9fc]">
                        {p.imageUrl ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={p.imageUrl}
                            alt={p.name}
                            className="h-full w-full object-cover transition group-hover:scale-[1.03]"
                          />
                        ) : (
                          <div className="grid h-full place-items-center text-4xl text-[rgb(var(--muted))]/40">
                            📦
                          </div>
                        )}
                        {p.stock === 0 && (
                          <div className="absolute inset-0 grid place-items-center bg-black/40">
                            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold">
                              Rupture
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-1 flex-col p-4">
                        <h3 className="line-clamp-2 text-sm font-semibold leading-tight">
                          {p.name}
                        </h3>
                        {p.category && (
                          <span className="mt-1.5 inline-block w-fit rounded-md bg-[rgb(var(--primary))]/8 px-1.5 py-0.5 text-[10px] font-semibold text-[rgb(var(--primary))]">
                            {p.category}
                          </span>
                        )}
                        <div className="mt-auto flex items-end justify-between pt-3">
                          <span className="text-lg font-semibold">
                            {formatPrice(p.price)}
                          </span>
                          <span className="text-[10px] text-[rgb(var(--muted))]">
                            Voir →
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
}

function KpiPill({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-2xl border border-[rgb(var(--border))]/60 bg-white px-4 py-3 text-center">
      <p className="text-xl font-bold tracking-tight">{value}</p>
      <p className="text-[10px] font-bold uppercase tracking-wider text-[rgb(var(--muted))]">
        {label}
      </p>
      {sub && (
        <p className="text-[10px] text-[rgb(var(--muted))]">{sub}</p>
      )}
    </div>
  );
}

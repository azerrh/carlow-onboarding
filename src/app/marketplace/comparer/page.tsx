"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Brand } from "@/components/ui/Brand";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { useCart } from "@/hooks/useCart";
import { useCompare } from "@/hooks/useCompare";
import { cn } from "@/lib/cn";

interface ComparedProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string | null;
  reference: string | null;
  stock: number;
  weightKg: number | null;
  dimensions: string | null;
  imageUrl: string | null;
  vendor: { id: string; name: string };
}

function formatPrice(p: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(p);
}

/**
 * Page comparateur de produits.
 *
 * Charge en parallèle les détails des produits sélectionnés via le store
 * useCompare. Calcule "le meilleur" pour chaque ligne (ex: prix mini)
 * pour mettre en avant la colonne gagnante.
 */
export default function ComparePage() {
  const productIds = useCompare((s) => s.productIds);
  const removeFromCompare = useCompare((s) => s.remove);
  const clearCompare = useCompare((s) => s.clear);
  const addToCart = useCart((s) => s.addItem);

  const [products, setProducts] = useState<ComparedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");

  const fetchProducts = useCallback(async () => {
    if (productIds.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const results = await Promise.all(
        productIds.map(async (id) => {
          const res = await fetch(`/api/marketplace/products/${id}`);
          if (!res.ok) return null;
          const data = await res.json();
          if (!data.success) return null;
          return data.product as ComparedProduct;
        })
      );
      setProducts(results.filter((p): p is ComparedProduct => !!p));
    } catch {
      // silencieux
    } finally {
      setLoading(false);
    }
  }, [productIds]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Identifie le "meilleur" pour chaque ligne comparable.
  const winners = useMemo(() => {
    if (products.length < 2) return { cheapest: null as string | null };
    const cheapest = products.reduce((min, p) => (p.price < min.price ? p : min));
    return { cheapest: cheapest.id };
  }, [products]);

  function handleAddToCart(p: ComparedProduct) {
    if (p.stock <= 0) return;
    addToCart({
      productId: p.id,
      name: p.name,
      price: p.price,
      quantity: 1,
      vendorId: p.vendor.id,
      vendorName: p.vendor.name,
      imageUrl: p.imageUrl ?? undefined,
      maxStock: p.stock,
    });
    setToast(`${p.name} ajouté au panier`);
    setTimeout(() => setToast(""), 2000);
  }

  function handleRemove(id: string) {
    removeFromCompare(id);
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-20 border-b border-[rgb(var(--border))] bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Brand variant="compact" />
            </Link>
            <Link
              href="/marketplace"
              className="hidden text-sm text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] sm:inline"
            >
              ← Retour marketplace
            </Link>
          </div>
          {products.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => clearCompare()}>
              Vider la comparaison
            </Button>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[rgb(var(--primary))]">
            Comparateur
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            Comparer les produits
          </h1>
          <p className="mt-1 text-sm text-[rgb(var(--muted))]">
            Comparez les caractéristiques techniques côte à côte avant
            d&apos;ajouter au panier.
          </p>
        </div>

        {loading ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: productIds.length || 2 }).map((_, i) => (
              <Skeleton key={i} variant="card" className="h-96" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <Card className="mt-8 p-12 text-center">
            <div className="text-3xl">⚖️</div>
            <p className="mt-3 text-base font-semibold">
              Aucun produit à comparer
            </p>
            <p className="mt-1 text-sm text-[rgb(var(--muted))]">
              Cliquez sur l&apos;icône ≡ d&apos;une carte produit pour
              l&apos;ajouter au comparateur.
            </p>
            <div className="mt-5">
              <Link href="/marketplace">
                <Button>Explorer la marketplace</Button>
              </Link>
            </div>
          </Card>
        ) : products.length === 1 ? (
          <Card className="mt-8 p-10 text-center">
            <p className="text-base font-semibold">
              Ajoutez au moins 1 produit supplémentaire
            </p>
            <p className="mt-1 text-sm text-[rgb(var(--muted))]">
              Le comparateur affiche au moins 2 produits côte à côte.
            </p>
            <div className="mt-5">
              <Link href="/marketplace">
                <Button>Continuer mes recherches</Button>
              </Link>
            </div>
          </Card>
        ) : (
          /* Tableau de comparaison */
          <div className="mt-8 overflow-x-auto">
            <table className="w-full min-w-[640px] border-separate border-spacing-0">
              <thead>
                <tr>
                  <th className="w-32 align-top">
                    <span className="sr-only">Caractéristique</span>
                  </th>
                  {products.map((p) => (
                    <th
                      key={p.id}
                      className="min-w-[200px] p-3 align-top"
                    >
                      <div className="overflow-hidden rounded-2xl border border-[rgb(var(--border))]/60 bg-white">
                        <div className="relative aspect-[4/3] bg-[#f8f9fc]">
                          {p.imageUrl ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={p.imageUrl}
                              alt={p.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="grid h-full place-items-center text-3xl text-[rgb(var(--muted))]/40">
                              📦
                            </div>
                          )}
                          <button
                            onClick={() => handleRemove(p.id)}
                            aria-label="Retirer du comparateur"
                            className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full border border-[rgb(var(--border))] bg-white/95 text-[rgb(var(--muted))] hover:text-red-600"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5">
                              <path d="M6 6l12 12M18 6L6 18" />
                            </svg>
                          </button>
                        </div>
                        <div className="p-3 text-left">
                          <Link
                            href={`/marketplace/${p.id}`}
                            className="line-clamp-2 text-sm font-semibold leading-tight hover:text-[rgb(var(--primary))]"
                          >
                            {p.name}
                          </Link>
                          <Link
                            href={`/marketplace/vendeur/${p.vendor.id}`}
                            className="mt-1 block truncate text-[11px] text-[rgb(var(--muted))] hover:text-[rgb(var(--primary))]"
                          >
                            par {p.vendor.name}
                          </Link>
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <ComparisonRow
                  label="Prix"
                  values={products.map((p) => ({
                    productId: p.id,
                    value: formatPrice(p.price),
                    highlight: winners.cheapest === p.id,
                    badge:
                      winners.cheapest === p.id && products.length > 1
                        ? "Meilleur prix"
                        : undefined,
                  }))}
                  emphasize
                />
                <ComparisonRow
                  label="Catégorie"
                  values={products.map((p) => ({
                    productId: p.id,
                    value: p.category ?? "—",
                  }))}
                />
                <ComparisonRow
                  label="Référence"
                  values={products.map((p) => ({
                    productId: p.id,
                    value: p.reference ?? "—",
                    mono: true,
                  }))}
                />
                <ComparisonRow
                  label="Stock"
                  values={products.map((p) => ({
                    productId: p.id,
                    value:
                      p.stock > 0
                        ? `${p.stock} disponible${p.stock > 1 ? "s" : ""}`
                        : "Rupture",
                    badge: p.stock === 0 ? "Indisponible" : undefined,
                    badgeColor: p.stock === 0 ? "red" : undefined,
                  }))}
                />
                <ComparisonRow
                  label="Poids"
                  values={products.map((p) => ({
                    productId: p.id,
                    value: p.weightKg !== null ? `${p.weightKg} kg` : "—",
                  }))}
                />
                <ComparisonRow
                  label="Dimensions"
                  values={products.map((p) => ({
                    productId: p.id,
                    value: p.dimensions ?? "—",
                    mono: true,
                  }))}
                />
                <ComparisonRow
                  label="Description"
                  values={products.map((p) => ({
                    productId: p.id,
                    value: p.description ?? "—",
                    multiline: true,
                  }))}
                />

                {/* Boutons d'action */}
                <tr>
                  <td className="p-3 align-top text-xs font-bold uppercase tracking-wider text-[rgb(var(--muted))]" />
                  {products.map((p) => (
                    <td key={p.id} className="p-3 align-top">
                      <Button
                        className="w-full"
                        size="sm"
                        disabled={p.stock === 0}
                        onClick={() => handleAddToCart(p)}
                      >
                        Ajouter au panier
                      </Button>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </main>

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl border border-[rgb(var(--success))]/30 bg-white px-4 py-3 text-sm font-medium shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}

/* ---------- Sub-components ---------- */

interface CellValue {
  productId: string;
  value: string;
  highlight?: boolean;
  badge?: string;
  badgeColor?: "red" | "primary";
  mono?: boolean;
  multiline?: boolean;
}

function ComparisonRow({
  label,
  values,
  emphasize,
}: {
  label: string;
  values: CellValue[];
  emphasize?: boolean;
}) {
  return (
    <tr className="border-t border-[rgb(var(--border))]/60">
      <td className="border-t border-[rgb(var(--border))]/60 p-3 align-top text-[11px] font-bold uppercase tracking-wider text-[rgb(var(--muted))]">
        {label}
      </td>
      {values.map((v) => (
        <td
          key={v.productId}
          className={cn(
            "border-t border-[rgb(var(--border))]/60 p-3 align-top text-sm",
            emphasize && "font-semibold",
            v.highlight && "bg-[rgb(var(--primary))]/[0.05]"
          )}
        >
          <div className="flex flex-col gap-1.5">
            <span
              className={cn(
                v.mono && "font-mono text-xs",
                v.multiline && "whitespace-pre-line text-xs text-[rgb(var(--fg))]/90"
              )}
            >
              {v.value}
            </span>
            {v.badge && (
              <span
                className={cn(
                  "w-fit rounded-full px-2 py-0.5 text-[10px] font-bold",
                  v.badgeColor === "red"
                    ? "bg-red-100 text-red-700"
                    : "bg-[rgb(var(--primary))]/15 text-[rgb(var(--primary))]"
                )}
              >
                {v.badge}
              </span>
            )}
          </div>
        </td>
      ))}
    </tr>
  );
}

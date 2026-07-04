"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BuyerNav } from "@/components/buyer/BuyerNav";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ProductCardSkeleton } from "@/components/ui/Skeleton";
import { SmartImage } from "@/components/ui/SmartImage";
import { useCart } from "@/hooks/useCart";
import { cn } from "@/lib/cn";

interface FavoriteProduct {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string | null;
  imageUrl: string | null;
  vendor: { id: string; name: string };
}

interface Favorite {
  id: string;
  addedAt: string;
  product: FavoriteProduct;
}

function formatPrice(p: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(p);
}

export default function BuyerFavoritesPage() {
  const router = useRouter();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [toast, setToast] = useState("");
  const addItem = useCart((s) => s.addItem);

  const fetchFavorites = useCallback(async () => {
    const buyerId =
      typeof window !== "undefined" ? localStorage.getItem("buyerId") : null;
    if (!buyerId) {
      router.replace("/buyer/login?redirect=/buyer/favoris");
      return;
    }

    try {
      const res = await fetch(`/api/buyer/favorites?buyerId=${encodeURIComponent(buyerId)}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setFavorites(data.favorites ?? []);
      }
    } catch {
      // silencieux
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  async function handleRemove(productId: string) {
    const buyerId =
      typeof window !== "undefined" ? localStorage.getItem("buyerId") : null;
    if (!buyerId) return;
    setRemovingId(productId);

    // Optimistic remove
    const previous = favorites;
    setFavorites((prev) => prev.filter((f) => f.product.id !== productId));

    try {
      const res = await fetch("/api/buyer/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ buyerId, productId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error();
      setToast("Favori retiré");
      setTimeout(() => setToast(""), 2000);
    } catch {
      setFavorites(previous);
      setToast("Erreur, réessayez");
      setTimeout(() => setToast(""), 2500);
    } finally {
      setRemovingId(null);
    }
  }

  function handleAddToCart(p: FavoriteProduct) {
    if (p.stock <= 0) return;
    addItem({
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

  function handleLogout() {
    if (typeof window !== "undefined") {
      localStorage.removeItem("buyerId");
    }
    router.push("/buyer/login");
  }

  return (
    <div className="portal-page min-h-screen">
      <BuyerNav />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[rgb(var(--primary))]">
              Acheteur
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
              Mes favoris
            </h1>
            <p className="mt-1 text-sm text-[rgb(var(--muted))]">
              Retrouvez les produits que vous avez sauvegardés.
            </p>
          </div>
          {!loading && (
            <span className="rounded-full border border-[rgb(var(--border))] bg-white px-3 py-1 text-xs font-medium text-[rgb(var(--muted))]">
              {favorites.length} favori{favorites.length > 1 ? "s" : ""}
            </span>
          )}
        </div>

        <div className="mt-8">
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : favorites.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-red-50 text-3xl">
                ❤️
              </div>
              <h2 className="mt-4 text-lg font-semibold">
                Aucun favori pour l&apos;instant
              </h2>
              <p className="mt-2 text-sm text-[rgb(var(--muted))]">
                Cliquez sur le cœur sur une carte produit pour la sauvegarder
                ici.
              </p>
              <div className="mt-6">
                <Link href="/marketplace">
                  <Button>Explorer la marketplace →</Button>
                </Link>
              </div>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {favorites.map((f) => {
                const p = f.product;
                const removing = removingId === p.id;
                return (
                  <Card
                    key={f.id}
                    className={cn(
                      "group flex flex-col overflow-hidden transition",
                      removing && "opacity-50"
                    )}
                  >
                    <div className="relative">
                      <Link
                        href={`/marketplace/${p.id}`}
                        className="relative block aspect-[4/3] bg-[#f8f9fc]"
                      >
                        {p.imageUrl ? (
                          <SmartImage
                            src={p.imageUrl}
                            alt={p.name}
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 280px"
                            className="object-cover transition group-hover:scale-[1.02]"
                          />
                        ) : (
                          <div className="grid h-full place-items-center text-3xl text-[rgb(var(--muted))]/50">
                            📦
                          </div>
                        )}
                        {p.stock === 0 && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold">
                              Rupture
                            </span>
                          </div>
                        )}
                      </Link>
                      <button
                        onClick={() => handleRemove(p.id)}
                        disabled={removing}
                        aria-label="Retirer des favoris"
                        className="absolute right-2 top-2 grid h-9 w-9 place-items-center rounded-full border border-red-200 bg-white/95 text-red-500 shadow-sm backdrop-blur transition hover:scale-110 hover:bg-red-50"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          className="h-4 w-4"
                        >
                          <path d="M12 21s-7-4.5-9.5-9C1 9 2 5 6 5c2 0 3 1 4 2.5C11 6 12 5 14 5c4 0 5 4 3.5 7-2.5 4.5-9.5 9-9.5 9z" />
                        </svg>
                      </button>
                    </div>

                    <div className="flex flex-1 flex-col p-4">
                      <Link href={`/marketplace/${p.id}`}>
                        <h3 className="line-clamp-2 text-sm font-semibold leading-tight transition hover:text-[rgb(var(--primary))]">
                          {p.name}
                        </h3>
                      </Link>
                      {p.category && (
                        <span className="mt-1.5 inline-block w-fit rounded-md bg-[rgb(var(--primary))]/8 px-1.5 py-0.5 text-[10px] font-semibold text-[rgb(var(--primary))]">
                          {p.category}
                        </span>
                      )}
                      <p className="mt-2 text-[11px] text-[rgb(var(--muted))]">
                        Vendu par {p.vendor.name}
                      </p>

                      <div className="mt-auto pt-3 flex items-end justify-between gap-2">
                        <span className="text-lg font-semibold">
                          {formatPrice(p.price)}
                        </span>
                        <Button
                          size="sm"
                          disabled={p.stock === 0}
                          onClick={() => handleAddToCart(p)}
                        >
                          Ajouter
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl border border-[rgb(var(--border))] bg-white px-4 py-3 text-sm font-medium shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}

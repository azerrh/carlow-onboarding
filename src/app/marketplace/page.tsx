"use client";

import { useCallback, useEffect, useMemo, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Brand } from "@/components/ui/Brand";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import { useCart, useCartSummary, CartItem } from "@/hooks/useCart";
import { useFavorites } from "@/hooks/useFavorites";
import { ProductCardSkeleton } from "@/components/ui/Skeleton";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string | null;
  reference: string | null;
  stock: number;
  active: boolean;
  imageUrl: string | null;
  vendor: { id: string; name: string };
  catalog: { id: string; name: string | null };
}

function MarketplaceInner() {
  const searchParams = useSearchParams();
  const canceled = searchParams.get("canceled");

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [cartOpen, setCartOpen] = useState(false);
  const [showToast, setShowToast] = useState("");
  // Filtres avancés
  const [vendorFilter, setVendorFilter] = useState("ALL");
  const [priceMin, setPriceMin] = useState<string>("");
  const [priceMax, setPriceMax] = useState<string>("");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState<"recent" | "priceAsc" | "priceDesc" | "name">("recent");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const { totalItems, totalPrice } = useCartSummary();
  const addItem = useCart((s) => s.addItem);
  const { isFavorite, toggle: toggleFavorite } = useFavorites();

  useEffect(() => {
    if (canceled) {
      setShowToast("Paiement annule. Votre panier est conserve.");
      setTimeout(() => setShowToast(""), 4000);
    }
  }, [canceled]);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/marketplace/products");
      const data = await res.json();
      if (res.ok && data.success) {
        setProducts(data.products);
        setCategories(data.categories);
      } else {
        setError(data?.error || "Erreur de chargement.");
      }
    } catch {
      setError("Erreur reseau.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Liste unique des vendeurs présents dans la marketplace (pour le select).
  const vendors = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of products) {
      if (!map.has(p.vendor.id)) map.set(p.vendor.id, p.vendor.name);
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [products]);

  const filtered = useMemo(() => {
    const min = priceMin === "" ? -Infinity : Number(priceMin);
    const max = priceMax === "" ? Infinity : Number(priceMax);

    const result = products.filter((p) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.description ?? "").toLowerCase().includes(q) ||
        (p.category ?? "").toLowerCase().includes(q) ||
        (p.reference ?? "").toLowerCase().includes(q) ||
        p.vendor.name.toLowerCase().includes(q);
      const matchCategory = categoryFilter === "ALL" || p.category === categoryFilter;
      const matchVendor = vendorFilter === "ALL" || p.vendor.id === vendorFilter;
      const matchPrice = p.price >= min && p.price <= max;
      const matchStock = !inStockOnly || p.stock > 0;
      return matchSearch && matchCategory && matchVendor && matchPrice && matchStock;
    });

    // Tri (copie pour ne pas muter l'array d'origine).
    const sorted = [...result];
    if (sortBy === "priceAsc") sorted.sort((a, b) => a.price - b.price);
    else if (sortBy === "priceDesc") sorted.sort((a, b) => b.price - a.price);
    else if (sortBy === "name") sorted.sort((a, b) => a.name.localeCompare(b.name, "fr"));
    // "recent" garde l'ordre serveur (déjà trié par createdAt desc).
    return sorted;
  }, [products, search, categoryFilter, vendorFilter, priceMin, priceMax, inStockOnly, sortBy]);

  const activeFilterCount =
    (categoryFilter !== "ALL" ? 1 : 0) +
    (vendorFilter !== "ALL" ? 1 : 0) +
    (priceMin !== "" ? 1 : 0) +
    (priceMax !== "" ? 1 : 0) +
    (inStockOnly ? 1 : 0);

  function resetFilters() {
    setSearch("");
    setCategoryFilter("ALL");
    setVendorFilter("ALL");
    setPriceMin("");
    setPriceMax("");
    setInStockOnly(false);
    setSortBy("recent");
  }

  function handleAddToCart(product: Product) {
    if (product.stock <= 0) return;
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      vendorId: product.vendor.id,
      vendorName: product.vendor.name,
      imageUrl: product.imageUrl ?? undefined,
      maxStock: product.stock, // garde-fou UI contre la sur-commande
    });
    setShowToast(`${product.name} ajoute au panier`);
    setTimeout(() => setShowToast(""), 2500);
  }

  async function handleToggleFavorite(product: Product) {
    const result = await toggleFavorite(product.id);
    if (result.needLogin) {
      setShowToast(
        result.favorited
          ? "Favori ajouté localement. Connectez-vous pour le sauvegarder."
          : "Favori retiré."
      );
    } else {
      setShowToast(
        result.favorited ? `${product.name} ajouté aux favoris ❤️` : "Favori retiré"
      );
    }
    setTimeout(() => setShowToast(""), 2500);
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-[rgb(var(--border))] bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <Brand variant="compact" />
            <nav className="hidden items-center gap-4 text-sm sm:flex">
              <Link href="/marketplace" className="font-medium text-[rgb(var(--primary))]">
                Marketplace
              </Link>
              <Link href="/login" className="text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]">
                Devenir vendeur
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/buyer/login" className="hidden sm:inline-flex">
              <Button variant="ghost" size="sm">Connexion acheteur</Button>
            </Link>
            <Link href="/buyer/login" className="sm:hidden">
              <button
                aria-label="Connexion acheteur"
                className="grid h-9 w-9 place-items-center rounded-xl border border-[rgb(var(--border))] bg-white text-[rgb(var(--muted))] hover:bg-black/[0.02]"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4 w-4">
                  <circle cx="12" cy="8" r="3.5" />
                  <path d="M5 20a7 7 0 0 1 14 0" />
                </svg>
              </button>
            </Link>
            <button
              onClick={() => setCartOpen(true)}
              aria-label="Ouvrir le panier"
              className="relative grid h-9 place-items-center rounded-xl border border-[rgb(var(--border))] bg-white px-2.5 text-sm font-medium hover:bg-black/[0.02] sm:px-3 sm:py-2"
            >
              <span className="flex items-center gap-1.5">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4 w-4">
                  <circle cx="9" cy="20" r="1.5" />
                  <circle cx="17" cy="20" r="1.5" />
                  <path d="M3 4h2l2.5 11h11l2-8H6" />
                </svg>
                <span className="hidden sm:inline">Panier</span>
              </span>
              {totalItems > 0 && (
                <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-[1.25rem] place-items-center rounded-full bg-[rgb(var(--primary))] px-1 text-[10px] font-bold text-white">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative mx-auto max-w-6xl px-4 pb-6 pt-6 sm:pt-10">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[rgb(var(--primary))] via-[rgb(var(--primary))]/90 to-[#c46020] p-6 text-white sm:p-12">
          <div className="relative z-10 max-w-lg">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Marketplace EnR
            </h1>
            <p className="mt-2 text-sm text-white/85 sm:text-base">
              Equipements d&apos;energies renouvelables neufs et reconditionnes. Panneaux solaires, onduleurs, batteries et plus.
            </p>
          </div>
          <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 sm:h-48 sm:w-48" />
          <div className="pointer-events-none absolute -bottom-12 -right-12 h-32 w-32 rounded-full bg-white/5 sm:h-56 sm:w-56" />
        </div>
      </section>

      {/* Filters */}
      <div className="mx-auto max-w-6xl px-4 pb-6">
        <div className="rounded-2xl border border-[rgb(var(--border))]/60 bg-white p-3 sm:p-4">
          {/* Ligne 1 : recherche + tri + bouton avancé */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="relative min-w-[200px] flex-1">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--muted))]">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4 w-4">
                  <circle cx="11" cy="11" r="7" />
                  <path d="M20 20l-3-3" />
                </svg>
              </span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Produit, vendeur, référence…"
                className="h-10 w-full rounded-xl border border-[rgb(var(--border))] bg-white pl-9 pr-3 text-sm focus:border-[rgb(var(--primary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]/15"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-10 cursor-pointer rounded-xl border border-[rgb(var(--border))] bg-white px-3 text-sm"
              aria-label="Filtrer par catégorie"
            >
              <option value="ALL">Toutes catégories</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="h-10 cursor-pointer rounded-xl border border-[rgb(var(--border))] bg-white px-3 text-sm"
              aria-label="Trier"
            >
              <option value="recent">Plus récents</option>
              <option value="priceAsc">Prix croissant</option>
              <option value="priceDesc">Prix décroissant</option>
              <option value="name">Nom (A-Z)</option>
            </select>
            <button
              onClick={() => setShowAdvanced((v) => !v)}
              className={cn(
                "relative inline-flex h-10 items-center gap-1.5 rounded-xl border px-3 text-sm font-medium transition",
                showAdvanced || activeFilterCount > 0
                  ? "border-[rgb(var(--primary))]/50 bg-[rgb(var(--primary))]/[0.08] text-[rgb(var(--primary))]"
                  : "border-[rgb(var(--border))] bg-white text-[rgb(var(--fg))] hover:bg-black/[0.02]"
              )}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4 w-4">
                <path d="M3 5h18l-7 9v5l-4 2v-7L3 5z" />
              </svg>
              <span className="hidden sm:inline">Filtres</span>
              {activeFilterCount > 0 && (
                <span className="grid h-5 min-w-[1.25rem] place-items-center rounded-full bg-[rgb(var(--primary))] px-1 text-[10px] font-bold text-white">
                  {activeFilterCount}
                </span>
              )}
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                className={cn("h-3 w-3 transition-transform", showAdvanced && "rotate-180")}
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
          </div>

          {/* Ligne 2 : filtres avancés (collapsible) */}
          {showAdvanced && (
            <div className="mt-3 grid gap-3 border-t border-[rgb(var(--border))]/60 pt-3 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[rgb(var(--muted))]">
                  Prix min (€)
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  value={priceMin}
                  onChange={(e) => setPriceMin(e.target.value)}
                  placeholder="0"
                  className="h-10 w-full rounded-xl border border-[rgb(var(--border))] bg-white px-3 text-sm focus:border-[rgb(var(--primary))]/60 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]/15"
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[rgb(var(--muted))]">
                  Prix max (€)
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  value={priceMax}
                  onChange={(e) => setPriceMax(e.target.value)}
                  placeholder="∞"
                  className="h-10 w-full rounded-xl border border-[rgb(var(--border))] bg-white px-3 text-sm focus:border-[rgb(var(--primary))]/60 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]/15"
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[rgb(var(--muted))]">
                  Vendeur
                </label>
                <select
                  value={vendorFilter}
                  onChange={(e) => setVendorFilter(e.target.value)}
                  className="h-10 w-full cursor-pointer rounded-xl border border-[rgb(var(--border))] bg-white px-3 text-sm"
                >
                  <option value="ALL">Tous les vendeurs</option>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <label className="flex h-10 w-full cursor-pointer items-center gap-2.5 rounded-xl border border-[rgb(var(--border))] bg-white px-3 text-sm font-medium hover:bg-black/[0.02]">
                  <input
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={(e) => setInStockOnly(e.target.checked)}
                    className="h-4 w-4 rounded border-[rgb(var(--border))] text-[rgb(var(--primary))] focus:ring-[rgb(var(--primary))]/30"
                  />
                  <span>En stock uniquement</span>
                </label>
              </div>

              {activeFilterCount > 0 && (
                <button
                  onClick={resetFilters}
                  className="col-span-full inline-flex items-center justify-center gap-2 rounded-xl border border-[rgb(var(--border))] bg-white px-3 py-2 text-xs font-medium text-[rgb(var(--muted))] hover:border-red-200 hover:bg-red-50 hover:text-red-600 sm:w-fit"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-3.5 w-3.5">
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                  Réinitialiser les filtres ({activeFilterCount})
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Products grid */}
      {loading ? (
        <div className="mx-auto max-w-6xl px-4 pb-16">
          <div className="mb-4 h-3 w-24 animate-pulse rounded bg-black/[0.06]" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="mx-auto max-w-6xl px-4">
          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="mx-auto max-w-6xl px-4">
          <div className="rounded-xl border border-dashed border-[rgb(var(--border))] bg-white/50 px-4 py-12 text-center">
            <div className="text-3xl">📦</div>
            <p className="mt-3 text-sm font-medium">Aucun produit trouve.</p>
          </div>
        </div>
      ) : (
        <div className="mx-auto max-w-6xl px-4 pb-16">
          <p className="mb-4 text-xs text-[rgb(var(--muted))]">
            {filtered.length} produit{filtered.length > 1 ? "s" : ""}
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((p) => (
              <Card
                key={p.id}
                className="group flex flex-col overflow-hidden transition hover:border-[rgb(var(--primary))]/30 hover:shadow-sm"
              >
                {/* Image + bouton favori */}
                <div className="relative">
                  <Link href={`/marketplace/${p.id}`} className="relative aspect-[4/3] bg-[#f8f9fc] block">
                    {p.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.imageUrl}
                        alt={p.name}
                        className="h-full w-full object-cover transition group-hover:scale-[1.02]"
                      />
                    ) : (
                      <div className="grid h-full place-items-center text-[rgb(var(--muted))]">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="h-12 w-12">
                          <rect x="3" y="5" width="18" height="14" rx="2" />
                          <circle cx="8.5" cy="10.5" r="1.5" />
                          <path d="M21 16l-5-5-9 9" />
                        </svg>
                      </div>
                    )}
                    {p.stock === 0 && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold">
                          Rupture de stock
                        </span>
                      </div>
                    )}
                  </Link>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleToggleFavorite(p);
                    }}
                    aria-label={
                      isFavorite(p.id) ? "Retirer des favoris" : "Ajouter aux favoris"
                    }
                    aria-pressed={isFavorite(p.id)}
                    className={cn(
                      "absolute right-2 top-2 grid h-9 w-9 place-items-center rounded-full border bg-white/95 shadow-sm backdrop-blur transition hover:scale-110",
                      isFavorite(p.id)
                        ? "border-red-200 text-red-500"
                        : "border-[rgb(var(--border))] text-[rgb(var(--muted))] hover:text-red-500"
                    )}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill={isFavorite(p.id) ? "currentColor" : "none"}
                      stroke="currentColor"
                      strokeWidth="1.8"
                      className="h-4 w-4"
                    >
                      <path d="M12 21s-7-4.5-9.5-9C1 9 2 5 6 5c2 0 3 1 4 2.5C11 6 12 5 14 5c4 0 5 4 3.5 7-2.5 4.5-9.5 9-9.5 9z" />
                    </svg>
                  </button>
                </div>

                <div className="flex flex-1 flex-col p-4">
                  <div className="flex-1">
                    <Link href={`/marketplace/${p.id}`}>
                      <h3 className="text-sm font-semibold leading-tight hover:text-[rgb(var(--primary))] transition">
                        {p.name}
                      </h3>
                    </Link>
                    {p.category && (
                      <span className="mt-1.5 inline-block rounded-md bg-[rgb(var(--primary))]/8 px-1.5 py-0.5 text-[10px] font-semibold text-[rgb(var(--primary))]">
                        {p.category}
                      </span>
                    )}
                    {p.description && (
                      <p className="mt-2 line-clamp-2 text-xs text-[rgb(var(--muted))]">
                        {p.description}
                      </p>
                    )}
                  </div>

                  <div className="mt-3 flex items-end justify-between">
                    <div>
                      <Link href={`/marketplace/${p.id}`}>
                        <span className="text-lg font-semibold hover:text-[rgb(var(--primary))] transition">
                          {p.price.toLocaleString("fr-FR", {
                            style: "currency",
                            currency: "EUR",
                          })}
                        </span>
                      </Link>
                      <div className="text-[10px] text-[rgb(var(--muted))]">
                        {p.vendor.name}
                      </div>
                    </div>
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
            ))}
          </div>
        </div>
      )}

      {/* Cart drawer */}
      {cartOpen && <CartDrawer onClose={() => setCartOpen(false)} />}

      {/* Toast */}
      {showToast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl border border-[rgb(var(--success))]/30 bg-white px-4 py-3 text-sm font-medium shadow-lg">
          {showToast}
        </div>
      )}
    </div>
  );
}

export default function MarketplacePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white">
          <div className="mx-auto max-w-6xl px-4 pb-16 pt-20">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>
      }
    >
      <MarketplaceInner />
    </Suspense>
  );
}

function CartDrawer({ onClose }: { onClose: () => void }) {
  const items = useCart((s) => s.items);
  const removeItem = useCart((s) => s.removeItem);
  const updateQuantity = useCart((s) => s.updateQuantity);
  const clearCart = useCart((s) => s.clearCart);
  const { totalPrice } = useCartSummary();

  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerName, setBuyerName] = useState("");
  const [buyerAddress, setBuyerAddress] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  async function handleCheckout() {
    if (items.length === 0) return;
    setCheckoutLoading(true);
    try {
      const res = await fetch("/api/checkout/stripe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            productId: i.productId,
            name: i.name,
            price: i.price,
            quantity: i.quantity,
          })),
          buyerEmail,
          buyerName,
          buyerAddress,
          buyerPhone,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data?.error || "Erreur lors du checkout.");
        return;
      }
      window.location.href = data.url;
    } catch {
      alert("Erreur reseau.");
    } finally {
      setCheckoutLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[rgb(var(--border))] px-6 py-4">
            <h2 className="text-lg font-semibold">Mon panier</h2>
            <button
              onClick={onClose}
              className="grid h-8 w-8 place-items-center rounded-lg hover:bg-black/[0.04]"
            >
              ✕
            </button>
          </div>

          {/* Items */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {items.length === 0 ? (
              <div className="py-12 text-center">
                <div className="text-3xl">🛒</div>
                <p className="mt-3 text-sm font-medium">Panier vide</p>
                <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                  Ajoutez des produits depuis la marketplace.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.productId} className="flex gap-3">
                    <div className="h-16 w-16 flex-shrink-0 rounded-lg bg-[#f8f9fc]">
                      {item.imageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="h-full w-full rounded-lg object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-[rgb(var(--muted))]">{item.vendorName}</p>
                      <div className="mt-1.5 flex items-center gap-2">
                        <button
                          onClick={() =>
                            updateQuantity(item.productId, item.quantity - 1)
                          }
                          className="grid h-6 w-6 place-items-center rounded-md border text-xs hover:bg-black/[0.02]"
                        >
                          −
                        </button>
                        <span className="text-xs font-medium w-4 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(item.productId, item.quantity + 1)
                          }
                          className="grid h-6 w-6 place-items-center rounded-md border text-xs hover:bg-black/[0.02]"
                        >
                          +
                        </button>
                        <span className="ml-auto text-sm font-semibold">
                          {(item.price * item.quantity).toLocaleString("fr-FR", {
                            style: "currency",
                            currency: "EUR",
                          })}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => removeItem(item.productId)}
                      className="self-start text-[rgb(var(--muted))] hover:text-red-600"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="border-t border-[rgb(var(--border))] px-6 py-4 space-y-4">
              <div className="space-y-2">
                <input
                  type="email"
                  placeholder="Email *"
                  value={buyerEmail}
                  onChange={(e) => setBuyerEmail(e.target.value)}
                  className="h-10 w-full rounded-xl border border-[rgb(var(--border))] bg-white px-3 text-sm"
                />
                <input
                  type="text"
                  placeholder="Nom complet"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  className="h-10 w-full rounded-xl border border-[rgb(var(--border))] bg-white px-3 text-sm"
                />
                <input
                  placeholder="Adresse de livraison"
                  value={buyerAddress}
                  onChange={(e) => setBuyerAddress(e.target.value)}
                  className="h-10 w-full rounded-xl border border-[rgb(var(--border))] bg-white px-3 text-sm"
                />
                <input
                  type="tel"
                  placeholder="Telephone"
                  value={buyerPhone}
                  onChange={(e) => setBuyerPhone(e.target.value)}
                  className="h-10 w-full rounded-xl border border-[rgb(var(--border))] bg-white px-3 text-sm"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total</span>
                <span className="text-xl font-bold">
                  {totalPrice.toLocaleString("fr-FR", {
                    style: "currency",
                    currency: "EUR",
                  })}
                </span>
              </div>
              <Button
                className="w-full"
                onClick={handleCheckout}
                disabled={checkoutLoading || !buyerEmail}
              >
                {checkoutLoading ? "Redirection…" : "Payer avec Stripe →"}
              </Button>
              <button
                onClick={clearCart}
                className="w-full text-center text-xs text-[rgb(var(--muted))] hover:text-red-600"
              >
                Vider le panier
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

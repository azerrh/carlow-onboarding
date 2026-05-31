"use client";

import { useCallback, useEffect, useMemo, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Brand } from "@/components/ui/Brand";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import { useCart, useCartSummary, CartItem, getEffectivePrice } from "@/hooks/useCart";
import { useFavorites } from "@/hooks/useFavorites";
import { useCompare, COMPARE_MAX } from "@/hooks/useCompare";
import { ProductCardSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { SearchAutocomplete } from "@/components/marketplace/SearchAutocomplete";
import { Chatbot } from "@/components/marketplace/Chatbot";
import { VendorBadges, type BadgeData } from "@/components/marketplace/VendorBadges";

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
  vendor: { id: string; name: string; badges?: BadgeData[] };
  catalog: { id: string; name: string | null };
  ratingAvg?: number;
  ratingCount?: number;
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
  const [sortBy, setSortBy] = useState<"recent" | "priceAsc" | "priceDesc" | "name" | "rating">("recent");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const { totalItems, totalPrice } = useCartSummary();
  const addItem = useCart((s) => s.addItem);
  const { isFavorite, toggle: toggleFavorite } = useFavorites();
  const compareIds = useCompare((s) => s.productIds);
  const toggleCompare = useCompare((s) => s.toggle);
  const clearCompare = useCompare((s) => s.clear);

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
    else if (sortBy === "rating") {
      // Trie par note moyenne décroissante, en plaçant les produits sans avis à la fin.
      sorted.sort((a, b) => {
        const aRating = a.ratingCount && a.ratingCount > 0 ? (a.ratingAvg ?? 0) : -1;
        const bRating = b.ratingCount && b.ratingCount > 0 ? (b.ratingAvg ?? 0) : -1;
        return bRating - aRating;
      });
    }
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

  function handleToggleCompare(product: Product) {
    const res = toggleCompare(product.id);
    if (res.full) {
      setShowToast(
        `Limite atteinte : ${COMPARE_MAX} produits maximum dans le comparateur.`
      );
    } else if (res.added) {
      setShowToast(`${product.name} ajouté à la comparaison`);
    } else {
      setShowToast("Retiré du comparateur");
    }
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
    <div className="min-h-screen bg-[rgb(var(--bg))]">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-[rgb(var(--border))]/70 bg-[rgb(var(--card))]/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-5">
            <Brand variant="compact" />
            <nav className="hidden items-center gap-1 text-sm sm:flex">
              <Link
                href="/marketplace"
                className="rounded-lg px-3 py-1.5 font-semibold text-[rgb(var(--primary))] transition hover:bg-[rgb(var(--primary))]/8"
              >
                Marketplace
              </Link>
              <Link
                href="/login"
                className="rounded-lg px-3 py-1.5 font-medium text-[rgb(var(--muted))] transition hover:bg-black/[0.04] hover:text-[rgb(var(--fg))]"
              >
                Devenir vendeur
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-2 sm:gap-2.5">
            <ThemeToggle size="sm" />
            <Link href="/buyer/login" className="hidden sm:inline-flex">
              <Button variant="ghost" size="sm">Connexion acheteur</Button>
            </Link>
            <Link href="/buyer/login" className="sm:hidden">
              <button
                aria-label="Connexion acheteur"
                className="grid h-9 w-9 place-items-center rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] text-[rgb(var(--muted))] hover:bg-black/[0.03] transition"
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
              className="relative inline-flex h-9 items-center gap-1.5 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 text-sm font-medium transition hover:border-[rgb(var(--primary))]/30 hover:bg-[rgb(var(--primary))]/8 hover:text-[rgb(var(--primary))]"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4 w-4">
                <circle cx="9" cy="20" r="1.5" />
                <circle cx="17" cy="20" r="1.5" />
                <path d="M3 4h2l2.5 11h11l2-8H6" />
              </svg>
              <span className="hidden sm:inline">Panier</span>
              {totalItems > 0 && (
                <span className="absolute -right-1.5 -top-1.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-[rgb(var(--primary))] px-1 text-[9px] font-bold text-white shadow-sm">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative mx-auto max-w-6xl px-4 pb-6 pt-6 sm:pt-10">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#E87A30] via-[#d96b20] to-[#b85514] p-6 text-white sm:p-12">
          {/* Motif décoratif */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -right-12 -top-12 h-56 w-56 rounded-full bg-white/10 blur-2xl sm:h-72 sm:w-72" />
            <div className="absolute -bottom-16 -left-8 h-48 w-48 rounded-full bg-black/10 blur-2xl sm:h-64 sm:w-64" />
            <div className="absolute right-1/4 top-1/2 h-32 w-32 -translate-y-1/2 rounded-full bg-white/5 blur-xl" />
            {/* Grille subtile */}
            <svg className="absolute inset-0 h-full w-full opacity-[0.06]" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="hero-grid" width="32" height="32" patternUnits="userSpaceOnUse">
                  <path d="M 32 0 L 0 0 0 32" fill="none" stroke="white" strokeWidth="0.5"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#hero-grid)" />
            </svg>
          </div>

          <div className="relative z-10 max-w-xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
              Marketplace B2B • Énergies renouvelables
            </div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-4xl">
              Trouvez vos équipements<br className="hidden sm:block" /> EnR au meilleur prix
            </h1>
            <p className="mt-3 max-w-md text-sm text-white/80 sm:text-base">
              Panneaux solaires, onduleurs, batteries et plus — neufs ou reconditionnés, directement auprès de vendeurs certifiés.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <div className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium backdrop-blur-sm">
                ✓ Vendeurs vérifiés
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium backdrop-blur-sm">
                ✓ Paiement sécurisé
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium backdrop-blur-sm">
                ✓ Devis en ligne
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filters */}
      <div className="mx-auto max-w-6xl px-4 pb-6">
        <div className="rounded-2xl border border-[rgb(var(--border))]/70 bg-[rgb(var(--card))] p-3 sm:p-4 card-shadow">
          {/* Ligne 1 : recherche + tri + bouton avancé */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <SearchAutocomplete
              value={search}
              onChange={setSearch}
              onCategorySelected={(cat) => {
                setCategoryFilter(cat);
                setSearch("");
              }}
              placeholder="Produit, vendeur, référence…"
            />
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
              <option value="rating">Mieux notés</option>
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
        <div className="mx-auto max-w-6xl px-4 pb-16">
          <EmptyState
            icon="🔍"
            title="Aucun produit ne correspond à votre recherche"
            description={
              activeFilterCount > 0
                ? `Essayez de modifier vos filtres ou réinitialisez-les pour voir tous les produits disponibles.`
                : "La marketplace est en cours de constitution. Revenez bientôt pour découvrir nos premiers vendeurs."
            }
            action={
              activeFilterCount > 0 ? (
                <Button variant="secondary" onClick={resetFilters}>
                  ✕ Réinitialiser les filtres ({activeFilterCount})
                </Button>
              ) : (
                <Link href="/register">
                  <Button>Devenir vendeur pionnier →</Button>
                </Link>
              )
            }
            variant="highlight"
          />
        </div>
      ) : (
        <div className="mx-auto max-w-6xl px-4 pb-16">
          <p className="mb-4 text-xs font-medium text-[rgb(var(--muted))]">
            {filtered.length} produit{filtered.length > 1 ? "s" : ""}
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((p) => (
              <div
                key={p.id}
                className={cn(
                  "group flex flex-col overflow-hidden rounded-[var(--radius)] border border-[rgb(var(--border))]/80 bg-[rgb(var(--card))] card-shadow",
                  "transition-all duration-200 hover:-translate-y-0.5 hover:border-[rgb(var(--primary))]/30 hover:card-shadow-hover"
                )}
              >
                {/* Image + boutons */}
                <div className="relative">
                  <Link
                    href={`/marketplace/${p.id}`}
                    className="relative block aspect-[4/3] overflow-hidden bg-[rgb(var(--bg))]"
                  >
                    {p.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.imageUrl}
                        alt={p.name}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.04]"
                      />
                    ) : (
                      <div className="grid h-full place-items-center text-[rgb(var(--muted))]/40">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="h-14 w-14">
                          <rect x="3" y="5" width="18" height="14" rx="2" />
                          <circle cx="8.5" cy="10.5" r="1.5" />
                          <path d="M21 16l-5-5-9 9" />
                        </svg>
                      </div>
                    )}
                    {p.stock === 0 && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-[1px]">
                        <span className="rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-[rgb(var(--fg))] shadow">
                          Rupture de stock
                        </span>
                      </div>
                    )}
                  </Link>

                  {/* Boutons flottants */}
                  <div className="absolute right-2.5 top-2.5 flex flex-col gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleToggleFavorite(p); }}
                      aria-label={isFavorite(p.id) ? "Retirer des favoris" : "Ajouter aux favoris"}
                      aria-pressed={isFavorite(p.id)}
                      className={cn(
                        "grid h-8 w-8 place-items-center rounded-full border bg-[rgb(var(--card))]/95 shadow-sm backdrop-blur-sm transition-all duration-150 hover:scale-110",
                        isFavorite(p.id)
                          ? "border-red-200 text-red-500"
                          : "border-[rgb(var(--border))] text-[rgb(var(--muted))] hover:border-red-200 hover:text-red-500"
                      )}
                    >
                      <svg viewBox="0 0 24 24" fill={isFavorite(p.id) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5">
                        <path d="M12 21s-7-4.5-9.5-9C1 9 2 5 6 5c2 0 3 1 4 2.5C11 6 12 5 14 5c4 0 5 4 3.5 7-2.5 4.5-9.5 9-9.5 9z" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleToggleCompare(p); }}
                      aria-label={compareIds.includes(p.id) ? "Retirer du comparateur" : "Ajouter au comparateur"}
                      aria-pressed={compareIds.includes(p.id)}
                      title="Comparer"
                      className={cn(
                        "grid h-8 w-8 place-items-center rounded-full border bg-[rgb(var(--card))]/95 shadow-sm backdrop-blur-sm transition-all duration-150 hover:scale-110",
                        compareIds.includes(p.id)
                          ? "border-[rgb(var(--primary))]/50 text-[rgb(var(--primary))]"
                          : "border-[rgb(var(--border))] text-[rgb(var(--muted))] hover:border-[rgb(var(--primary))]/40 hover:text-[rgb(var(--primary))]"
                      )}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5">
                        <path d="M8 5v14M16 5v14M3 9h10M21 15H11" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Contenu */}
                <div className="flex flex-1 flex-col p-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      {p.category && (
                        <span className="inline-block rounded-md bg-[rgb(var(--primary))]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[rgb(var(--primary))]">
                          {p.category}
                        </span>
                      )}
                      {p.ratingCount !== undefined && p.ratingCount > 0 && p.ratingAvg !== undefined && (
                        <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-amber-600">
                          <svg viewBox="0 0 24 24" fill="currentColor" className="h-3 w-3">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                          </svg>
                          {p.ratingAvg.toFixed(1)}
                          <span className="font-normal text-[rgb(var(--muted))]">
                            ({p.ratingCount})
                          </span>
                        </span>
                      )}
                    </div>
                    <Link href={`/marketplace/${p.id}`}>
                      <h3 className="mt-1.5 text-sm font-semibold leading-snug transition hover:text-[rgb(var(--primary))]">
                        {p.name}
                      </h3>
                    </Link>
                    {p.description && (
                      <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-[rgb(var(--muted))]">
                        {p.description}
                      </p>
                    )}
                  </div>

                  <div className="mt-3 flex items-end justify-between gap-2 border-t border-[rgb(var(--border))]/60 pt-3">
                    <div className="min-w-0">
                      <div className="text-base font-bold tracking-tight text-[rgb(var(--fg))]">
                        {p.price.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-[10px] font-medium text-[rgb(var(--muted))]">
                          {p.vendor.name}
                        </span>
                        {p.vendor.badges && p.vendor.badges.length > 0 && (
                          <VendorBadges
                            badges={p.vendor.badges}
                            variant="compact"
                            size="sm"
                          />
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      disabled={p.stock === 0}
                      onClick={() => handleAddToCart(p)}
                      className="shrink-0"
                    >
                      Ajouter
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cart drawer */}
      {cartOpen && <CartDrawer onClose={() => setCartOpen(false)} />}

      {/* Chatbot IA flottant */}
      <Chatbot />

      {/* Barre flottante comparateur */}
      {compareIds.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[rgb(var(--border))] bg-white/95 px-4 py-3 shadow-[0_-10px_30px_-10px_rgba(0,0,0,0.12)] backdrop-blur sm:bottom-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:rounded-2xl sm:border sm:px-5 sm:py-3">
          <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-[rgb(var(--primary))]/10 text-[rgb(var(--primary))]">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
                  <path d="M8 5v14M16 5v14M3 9h10M21 15H11" />
                </svg>
              </span>
              <div>
                <p className="text-sm font-semibold">
                  {compareIds.length} produit{compareIds.length > 1 ? "s" : ""} sélectionné
                  {compareIds.length > 1 ? "s" : ""}
                </p>
                <p className="text-[11px] text-[rgb(var(--muted))]">
                  Maximum {COMPARE_MAX}. Ajoutez jusqu&apos;à {COMPARE_MAX - compareIds.length} de plus.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => clearCompare()}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-[rgb(var(--muted))] hover:bg-black/[0.04]"
              >
                Vider
              </button>
              <Link href="/marketplace/comparer">
                <Button size="sm" disabled={compareIds.length < 2}>
                  Comparer →
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {showToast && (
        <div
          className={cn(
            "fixed left-1/2 z-50 -translate-x-1/2 rounded-xl border border-[rgb(var(--success))]/30 bg-white px-4 py-3 text-sm font-medium shadow-lg",
            compareIds.length > 0 ? "bottom-24 sm:bottom-20" : "bottom-6"
          )}
        >
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

interface AppliedPromo {
  vendorId: string;
  code: string;
  discountCents: number;
  type: "PERCENT" | "FIXED";
  discountValue: number;
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

  // Codes promo appliqués (un seul code par vendeur)
  const [promoInput, setPromoInput] = useState("");
  const [promoVendorId, setPromoVendorId] = useState<string>("");
  const [applyingPromo, setApplyingPromo] = useState(false);
  const [promoError, setPromoError] = useState("");
  const [appliedPromos, setAppliedPromos] = useState<AppliedPromo[]>([]);

  // Vendeurs uniques dans le panier (pour le sélecteur de promo)
  const cartVendors = useMemo(() => {
    const map = new Map<string, { name: string; subtotalCents: number }>();
    for (const item of items) {
      const effective = getEffectivePrice(item);
      const subtotalCents = Math.round(effective * item.quantity * 100);
      const existing = map.get(item.vendorId);
      if (existing) {
        existing.subtotalCents += subtotalCents;
      } else {
        map.set(item.vendorId, { name: item.vendorName, subtotalCents });
      }
    }
    return Array.from(map.entries()).map(([vendorId, v]) => ({
      vendorId,
      name: v.name,
      subtotalCents: v.subtotalCents,
    }));
  }, [items]);

  // Sélectionne automatiquement le 1er vendeur si un seul
  useEffect(() => {
    if (cartVendors.length === 1) setPromoVendorId(cartVendors[0].vendorId);
  }, [cartVendors]);

  const totalDiscountCents = appliedPromos.reduce(
    (sum, p) => sum + p.discountCents,
    0
  );
  const totalAfterDiscount = Math.max(
    0,
    totalPrice - totalDiscountCents / 100
  );

  async function handleApplyPromo() {
    setPromoError("");
    if (!promoInput.trim()) {
      setPromoError("Saisissez un code.");
      return;
    }
    const targetVendorId =
      cartVendors.length === 1 ? cartVendors[0].vendorId : promoVendorId;
    if (!targetVendorId) {
      setPromoError("Choisissez le vendeur concerné.");
      return;
    }
    // Empêche d'appliquer 2 codes au même vendeur
    if (appliedPromos.some((p) => p.vendorId === targetVendorId)) {
      setPromoError("Un code est déjà appliqué pour ce vendeur.");
      return;
    }

    const vendor = cartVendors.find((v) => v.vendorId === targetVendorId);
    if (!vendor) return;

    setApplyingPromo(true);
    try {
      const res = await fetch("/api/marketplace/promo-codes/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: promoInput.trim(),
          vendorId: targetVendorId,
          subtotalCents: vendor.subtotalCents,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setPromoError(data?.error ?? "Code invalide.");
        return;
      }
      setAppliedPromos((prev) => [
        ...prev,
        {
          vendorId: targetVendorId,
          code: data.promo.code,
          discountCents: data.promo.discountCents,
          type: data.promo.type,
          discountValue: data.promo.discountValue,
        },
      ]);
      setPromoInput("");
    } catch {
      setPromoError("Erreur réseau.");
    } finally {
      setApplyingPromo(false);
    }
  }

  function removePromo(vendorId: string) {
    setAppliedPromos((prev) => prev.filter((p) => p.vendorId !== vendorId));
  }

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
              <div className="grid h-full place-items-center py-12 text-center">
                <div>
                  <div className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-[rgb(var(--primary))]/15 to-[rgb(var(--primary))]/8 text-4xl animate-bounce-in">
                    🛒
                  </div>
                  <p className="mt-5 text-base font-bold">Panier vide</p>
                  <p className="mt-1.5 text-sm text-[rgb(var(--muted))]">
                    Ajoutez des produits depuis la marketplace<br />pour commencer votre commande.
                  </p>
                  <Button
                    size="sm"
                    className="mt-5"
                    onClick={onClose}
                  >
                    Parcourir la marketplace →
                  </Button>
                </div>
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

              {/* Codes promo */}
              <div className="rounded-xl border border-[rgb(var(--border))]/70 bg-[rgb(var(--bg))]/50 p-3">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[rgb(var(--muted))]">
                  🎟️ Code promo
                </p>

                {appliedPromos.length > 0 && (
                  <div className="mb-2 space-y-1.5">
                    {appliedPromos.map((p) => {
                      const vendorName =
                        cartVendors.find((v) => v.vendorId === p.vendorId)?.name ??
                        "Vendeur";
                      return (
                        <div
                          key={p.vendorId}
                          className="flex items-center justify-between rounded-lg border border-[rgb(var(--success))]/30 bg-[rgb(var(--success))]/8 px-2.5 py-1.5 text-xs"
                        >
                          <div>
                            <span className="font-mono font-bold text-[rgb(var(--success))]">
                              {p.code}
                            </span>
                            <span className="ml-1.5 text-[rgb(var(--muted))]">
                              · {vendorName} · −
                              {p.type === "PERCENT"
                                ? `${p.discountValue}%`
                                : `${(p.discountValue / 100).toFixed(2)}€`}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-[rgb(var(--success))]">
                              −{(p.discountCents / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
                            </span>
                            <button
                              onClick={() => removePromo(p.vendorId)}
                              className="text-[rgb(var(--muted))] hover:text-red-500"
                              aria-label="Retirer le code"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Champ d'application */}
                {cartVendors.length > appliedPromos.length && (
                  <div className="flex flex-col gap-2">
                    {cartVendors.length > 1 && (
                      <select
                        value={promoVendorId}
                        onChange={(e) => setPromoVendorId(e.target.value)}
                        className="h-9 w-full cursor-pointer rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-2.5 text-xs"
                      >
                        <option value="">Pour quel vendeur ?</option>
                        {cartVendors
                          .filter(
                            (v) =>
                              !appliedPromos.some((p) => p.vendorId === v.vendorId)
                          )
                          .map((v) => (
                            <option key={v.vendorId} value={v.vendorId}>
                              {v.name}
                            </option>
                          ))}
                      </select>
                    )}
                    <div className="flex gap-1.5">
                      <input
                        value={promoInput}
                        onChange={(e) =>
                          setPromoInput(
                            e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, "")
                          )
                        }
                        placeholder="SUMMER25"
                        className="h-9 flex-1 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-2.5 font-mono text-xs font-semibold uppercase tracking-wider focus:border-[rgb(var(--primary))]/50 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]/12"
                      />
                      <button
                        onClick={handleApplyPromo}
                        disabled={applyingPromo || !promoInput}
                        className="rounded-lg bg-[rgb(var(--primary))] px-3 text-xs font-bold text-white transition hover:brightness-[1.06] disabled:opacity-50"
                      >
                        {applyingPromo ? "…" : "Appliquer"}
                      </button>
                    </div>
                    {promoError && (
                      <p className="text-[11px] font-medium text-red-600">
                        ⚠️ {promoError}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Total */}
              <div className="space-y-1.5">
                {totalDiscountCents > 0 && (
                  <>
                    <div className="flex items-center justify-between text-xs text-[rgb(var(--muted))]">
                      <span>Sous-total</span>
                      <span>
                        {totalPrice.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-semibold text-[rgb(var(--success))]">
                      <span>Remise codes promo</span>
                      <span>
                        −{(totalDiscountCents / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
                      </span>
                    </div>
                  </>
                )}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-sm font-bold">Total à payer</span>
                  <span className="text-2xl font-bold tracking-tight">
                    {totalAfterDiscount.toLocaleString("fr-FR", {
                      style: "currency",
                      currency: "EUR",
                    })}
                  </span>
                </div>
              </div>
              <Button
                className="w-full"
                onClick={handleCheckout}
                disabled={checkoutLoading || !buyerEmail}
                size="lg"
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

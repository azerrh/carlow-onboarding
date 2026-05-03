"use client";

import { useCallback, useEffect, useMemo, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Brand } from "@/components/ui/Brand";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import { useCart, useCartSummary, CartItem } from "@/hooks/useCart";

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

  const { totalItems, totalPrice } = useCartSummary();
  const addItem = useCart((s) => s.addItem);

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

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.description ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (p.category ?? "").toLowerCase().includes(search.toLowerCase());
      const matchCategory = categoryFilter === "ALL" || p.category === categoryFilter;
      return matchSearch && matchCategory;
    });
  }, [products, search, categoryFilter]);

  function handleAddToCart(product: Product) {
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      vendorId: product.vendor.id,
      vendorName: product.vendor.name,
      imageUrl: product.imageUrl ?? undefined,
    });
    setShowToast(`${product.name} ajoute au panier`);
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
          <div className="flex items-center gap-3">
            <Link href="/buyer/login">
              <Button variant="ghost" size="sm">Connexion acheteur</Button>
            </Link>
            <button
              onClick={() => setCartOpen(true)}
              className="relative rounded-xl border border-[rgb(var(--border))] bg-white px-3 py-2 text-sm font-medium hover:bg-black/[0.02]"
            >
              Panier
              {totalItems > 0 && (
                <span className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-[rgb(var(--primary))] text-[10px] font-bold text-white">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pt-12 pb-8">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Marketplace <span className="text-[rgb(var(--primary))]">EnR</span>
        </h1>
        <p className="mt-2 text-base text-[rgb(var(--muted))]">
          Equipements d&apos;energies renouvelables neufs et reconditionnes.
        </p>
      </section>

      {/* Filters */}
      <div className="mx-auto max-w-6xl px-4 pb-6">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--muted))]">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4 w-4">
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-3-3" />
              </svg>
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un produit…"
              className="h-10 w-full rounded-xl border border-[rgb(var(--border))] bg-white pl-9 pr-3 text-sm focus:border-[rgb(var(--primary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]/15"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-10 cursor-pointer rounded-xl border border-[rgb(var(--border))] bg-white px-3 text-sm"
          >
            <option value="ALL">Toutes categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Products grid */}
      {loading ? (
        <p className="py-8 text-center text-sm text-[rgb(var(--muted))]">Chargement…</p>
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
                className="group flex flex-col overflow-hidden transition hover:border-[rgb(var(--primary))]/30"
              >
                {/* Image placeholder */}
                <div className="relative aspect-[4/3] bg-[#f8f9fc]">
                  {p.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      className="h-full w-full object-cover"
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
                </div>

                <div className="flex flex-1 flex-col p-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-semibold leading-tight">
                        {p.name}
                      </h3>
                    </div>
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
                      <div className="text-lg font-semibold">
                        {p.price.toLocaleString("fr-FR", {
                          style: "currency",
                          currency: "EUR",
                        })}
                      </div>
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
        <div className="min-h-screen bg-white grid place-items-center">
          <p className="text-sm text-[rgb(var(--muted))]">Chargement...</p>
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

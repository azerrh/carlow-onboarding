"use client";

import { useCallback, useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Brand } from "@/components/ui/Brand";
import { Button } from "@/components/ui/Button";
import { useCart, useCartSummary } from "@/hooks/useCart";
import { ProductReviews } from "@/components/marketplace/ProductReviews";
import { RecentlyViewed } from "@/components/marketplace/RecentlyViewed";
import { TranslateButton } from "@/components/marketplace/TranslateButton";
import { trackView } from "@/hooks/useRecentlyViewed";
import { cn } from "@/lib/cn";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string | null;
  reference: string | null;
  stock: number;
  active: boolean;
  weightKg: number | null;
  dimensions: string | null;
  imageUrl: string | null;
  vendor: { id: string; name: string; companyName: string | null };
  catalog: { id: string; name: string | null };
  photos: { id: string; url: string; primary: boolean }[];
  createdAt: string;
}

interface RelatedProduct {
  id: string;
  name: string;
  price: number;
  category: string | null;
  imageUrl: string | null;
  photos: { url: string }[];
}

function formatPrice(price: number): string {
  return price.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}

function ProductDetailInner() {
  const { id } = useParams();
  const productId = typeof id === "string" ? id : Array.isArray(id) ? id[0] : "";

  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<RelatedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [toast, setToast] = useState("");
  const [cartOpen, setCartOpen] = useState(false);

  const addItem = useCart((s) => s.addItem);
  const { totalItems } = useCartSummary();

  useEffect(() => {
    if (!productId) return;
    // Tracking "récemment vus" — silent en localStorage, alimente la
    // section "Vous avez consulté" sur les autres fiches produit.
    trackView(productId);
    setLoading(true);
    fetch(`/api/marketplace/products/${productId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setProduct(data.product);
          setRelated(data.related ?? []);
        } else {
          setError(data.error || "Produit non trouve");
        }
      })
      .catch(() => setError("Erreur reseau"))
      .finally(() => setLoading(false));
  }, [productId]);

  function handleAddToCart() {
    if (!product || product.stock === 0) return;
    for (let i = 0; i < quantity; i++) {
      addItem({
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        vendorId: product.vendor.id,
        vendorName: product.vendor.name,
        imageUrl: product.photos[0]?.url ?? undefined,
      });
    }
    setToast(`${quantity}x ${product.name} ajoute${quantity > 1 ? "s" : ""} au panier`);
    setTimeout(() => setToast(""), 2500);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <header className="border-b border-[rgb(var(--border))] bg-white/90 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <Brand variant="compact" />
          </div>
        </header>
        <div className="mx-auto max-w-6xl px-4 py-16">
          <div className="animate-pulse grid gap-8 lg:grid-cols-2">
            <div className="aspect-square rounded-2xl bg-[rgb(var(--border))]/40" />
            <div className="space-y-4">
              <div className="h-8 w-3/4 rounded-lg bg-[rgb(var(--border))]/40" />
              <div className="h-4 w-1/2 rounded bg-[rgb(var(--border))]/40" />
              <div className="h-24 rounded-lg bg-[rgb(var(--border))]/40" />
              <div className="h-10 w-1/3 rounded-lg bg-[rgb(var(--border))]/40" />
              <div className="h-12 w-full rounded-xl bg-[rgb(var(--border))]/40" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-white">
        <header className="border-b border-[rgb(var(--border))] bg-white/90 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <Link href="/marketplace">
              <Brand variant="compact" />
            </Link>
          </div>
        </header>
        <div className="mx-auto max-w-md px-4 py-24 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-red-100 text-red-600">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-7 w-7">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
          </div>
          <h2 className="mt-4 text-lg font-semibold">Produit introuvable</h2>
          <p className="mt-2 text-sm text-[rgb(var(--muted))]">{error || "Ce produit n'existe pas ou n'est plus disponible."}</p>
          <Link href="/marketplace">
            <Button className="mt-6">Retour a la marketplace</Button>
          </Link>
        </div>
      </div>
    );
  }

  const primaryImage = product.photos[0]?.url ?? product.imageUrl;
  const vendorName = product.vendor.companyName ?? product.vendor.name;
  const inStock = product.stock > 0;
  const lowStock = inStock && product.stock < 10;

  /**
   * JSON-LD Schema.org Product — aide Google à afficher des rich results
   * (prix, dispo, vendeur) dans les SERP. Injecté en tant que script
   * inline car la page est en Client Component.
   *
   * @see https://developers.google.com/search/docs/appearance/structured-data/product
   */
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description ?? `${product.name} — vendu par ${vendorName}`,
    image: primaryImage ? [primaryImage] : undefined,
    sku: product.reference ?? product.id,
    category: product.category ?? undefined,
    brand: {
      "@type": "Brand",
      name: vendorName,
    },
    offers: {
      "@type": "Offer",
      url: `https://carlowonboarding.vercel.app/marketplace/${product.id}`,
      priceCurrency: "EUR",
      price: product.price.toFixed(2),
      availability: inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Organization",
        name: vendorName,
      },
    },
  };

  return (
    <div className="min-h-screen bg-white">
      {/* JSON-LD Schema.org pour Google rich results */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-[rgb(var(--border))] bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <Brand variant="compact" />
            <nav className="hidden items-center gap-2 text-sm sm:flex">
              <Link href="/marketplace" className="text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]">
                Marketplace
              </Link>
              <span className="text-[rgb(var(--border))]">/</span>
              <span className="font-medium">{product.name}</span>
            </nav>
          </div>
          <button
            onClick={() => setCartOpen(true)}
            className="relative rounded-xl border border-[rgb(var(--border))] bg-white px-3 py-2 text-sm font-medium hover:bg-black/[0.02] transition"
          >
            Panier
            {totalItems > 0 && (
              <span className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-[rgb(var(--primary))] text-[10px] font-bold text-white">
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        {/* Breadcrumb mobile */}
        <nav className="mb-4 flex items-center gap-2 text-sm sm:hidden">
          <Link href="/marketplace" className="text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]">
            Marketplace
          </Link>
          <span className="text-[rgb(var(--border))]">/</span>
          <span className="font-medium text-[rgb(var(--fg))]">{product.name}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Image */}
          <div className="overflow-hidden rounded-2xl border border-[rgb(var(--border))] bg-[#f8f9fc]">
            {primaryImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={primaryImage}
                alt={product.name}
                className="h-full w-full object-cover"
                style={{ minHeight: "400px" }}
              />
            ) : (
              <div className="grid h-96 place-items-center text-[rgb(var(--muted))]">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="h-24 w-24">
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <circle cx="8.5" cy="10.5" r="1.5" />
                  <path d="M21 16l-5-5-9 9" />
                </svg>
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            {/* Category + Stock */}
            <div className="mb-3 flex flex-wrap items-center gap-2">
              {product.category && (
                <span className="rounded-lg bg-[rgb(var(--primary))]/10 px-2.5 py-1 text-xs font-semibold text-[rgb(var(--primary))]">
                  {product.category}
                </span>
              )}
              {inStock ? (
                <span className={cn(
                  "rounded-lg px-2.5 py-1 text-xs font-semibold",
                  lowStock ? "bg-amber-100 text-amber-700" : "bg-[rgb(var(--success))]/10 text-[rgb(var(--success))]"
                )}>
                  {lowStock ? `Plus que ${product.stock} en stock` : "En stock"}
                </span>
              ) : (
                <span className="rounded-lg bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">
                  Rupture de stock
                </span>
              )}
              {product.reference && (
                <span className="rounded-lg bg-black/[0.04] px-2.5 py-1 text-xs font-mono text-[rgb(var(--muted))]">
                  Ref. {product.reference}
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{product.name}</h1>

            {/* Vendor */}
            <div className="mt-2 flex items-center gap-2 text-sm text-[rgb(var(--muted))]">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4 w-4">
                <path d="M3 8l1.5-3h15L21 8" />
                <path d="M4 8v11h16V8" />
              </svg>
              Vendeur :{" "}
              <Link
                href={`/marketplace/vendeur/${product.vendor.id}`}
                className="font-medium text-[rgb(var(--fg))] underline-offset-2 hover:text-[rgb(var(--primary))] hover:underline"
              >
                {vendorName} →
              </Link>
            </div>

            {/* Price */}
            <div className="mt-6 flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight">{formatPrice(product.price)}</span>
            </div>

            {/* Description */}
            {product.description && (
              <div className="mt-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold">Description</h3>
                  <TranslateButton
                    productId={product.id}
                    originalText={product.description}
                  />
                </div>
                <p className="mt-2 text-sm leading-relaxed text-[rgb(var(--muted))] whitespace-pre-wrap">
                  {product.description}
                </p>
              </div>
            )}

            {/* Specs */}
            {(product.weightKg || product.dimensions) && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold">Caracteristiques</h3>
                <dl className="mt-2 grid gap-2 sm:grid-cols-2">
                  {product.weightKg && (
                    <div className="rounded-lg bg-black/[0.02] px-3 py-2">
                      <dt className="text-xs text-[rgb(var(--muted))]">Poids</dt>
                      <dd className="text-sm font-medium">{product.weightKg} kg</dd>
                    </div>
                  )}
                  {product.dimensions && (
                    <div className="rounded-lg bg-black/[0.02] px-3 py-2">
                      <dt className="text-xs text-[rgb(var(--muted))]">Dimensions</dt>
                      <dd className="text-sm font-medium">{product.dimensions}</dd>
                    </div>
                  )}
                </dl>
              </div>
            )}

            {/* Add to cart */}
            <div className="mt-8 border-t border-[rgb(var(--border))] pt-6">
              <div className="flex items-center gap-3">
                {/* Quantity selector */}
                <div className="flex items-center rounded-xl border border-[rgb(var(--border))]">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="grid h-10 w-10 place-items-center text-sm hover:bg-black/[0.02] transition rounded-l-xl"
                  >
                    −
                  </button>
                  <span className="w-10 text-center text-sm font-semibold">{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                    className="grid h-10 w-10 place-items-center text-sm hover:bg-black/[0.02] transition rounded-r-xl"
                  >
                    +
                  </button>
                </div>

                <Button
                  className="flex-1"
                  disabled={!inStock}
                  onClick={handleAddToCart}
                >
                  {inStock ? "Ajouter au panier" : "Indisponible"}
                </Button>
              </div>

              {lowStock && (
                <p className="mt-3 text-xs text-amber-600">
                  ⚠ Plus que {product.stock} unite{product.stock > 1 ? "s" : ""} disponible{product.stock > 1 ? "s" : ""}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Avis & notes */}
        <ProductReviews productId={product.id} />

        {/* Produits récemment consultés */}
        <RecentlyViewed exclude={product.id} />

        {/* Related products */}
        {related.length > 0 && (
          <section className="mt-16">
            <h2 className="text-lg font-semibold">Produits similaires</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((r) => (
                <Link
                  key={r.id}
                  href={`/marketplace/${r.id}`}
                  className="group rounded-xl border border-[rgb(var(--border))] overflow-hidden transition hover:border-[rgb(var(--primary))]/30 hover:shadow-sm"
                >
                  <div className="aspect-[4/3] bg-[#f8f9fc]">
                    {r.photos[0]?.url || r.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={r.photos[0]?.url ?? r.imageUrl ?? ""}
                        alt={r.name}
                        className="h-full w-full object-cover transition group-hover:scale-[1.02]"
                      />
                    ) : (
                      <div className="grid h-full place-items-center text-[rgb(var(--muted))]">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="h-10 w-10">
                          <rect x="3" y="5" width="18" height="14" rx="2" />
                          <circle cx="8.5" cy="10.5" r="1.5" />
                          <path d="M21 16l-5-5-9 9" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="text-sm font-medium leading-tight">{r.name}</h3>
                    <div className="mt-1 text-base font-bold">{formatPrice(r.price)}</div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Cart drawer */}
      {cartOpen && <CartDrawer onClose={() => setCartOpen(false)} />}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl border border-[rgb(var(--success))]/30 bg-white px-4 py-3 text-sm font-medium shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}

export default function ProductDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white grid place-items-center">
          <p className="text-sm text-[rgb(var(--muted))]">Chargement...</p>
        </div>
      }
    >
      <ProductDetailInner />
    </Suspense>
  );
}

/* ---- Cart Drawer (reused from marketplace) ---- */

import { CartItem } from "@/hooks/useCart";

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
          items: items.map((i) => ({ productId: i.productId, name: i.name, price: i.price, quantity: i.quantity })),
          buyerEmail, buyerName, buyerAddress, buyerPhone,
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
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-[rgb(var(--border))] px-6 py-4">
            <h2 className="text-lg font-semibold">Mon panier</h2>
            <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg hover:bg-black/[0.04] transition">✕</button>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {items.length === 0 ? (
              <div className="py-12 text-center">
                <div className="text-3xl">🛒</div>
                <p className="mt-3 text-sm font-medium">Panier vide</p>
                <p className="mt-1 text-xs text-[rgb(var(--muted))]">Ajoutez des produits depuis la marketplace.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.productId} className="flex gap-3">
                    <div className="h-16 w-16 flex-shrink-0 rounded-lg bg-[#f8f9fc]">
                      {item.imageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.imageUrl} alt={item.name} className="h-full w-full rounded-lg object-cover" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-[rgb(var(--muted))]">{item.vendorName}</p>
                      <div className="mt-1.5 flex items-center gap-2">
                        <button onClick={() => updateQuantity(item.productId, item.quantity - 1)} className="grid h-6 w-6 place-items-center rounded-md border text-xs hover:bg-black/[0.02] transition">−</button>
                        <span className="text-xs font-medium w-4 text-center">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.productId, item.quantity + 1)} className="grid h-6 w-6 place-items-center rounded-md border text-xs hover:bg-black/[0.02] transition">+</button>
                        <span className="ml-auto text-sm font-semibold">{(item.price * item.quantity).toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}</span>
                      </div>
                    </div>
                    <button onClick={() => removeItem(item.productId)} className="self-start text-[rgb(var(--muted))] hover:text-red-600 transition">✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
          {items.length > 0 && (
            <div className="border-t border-[rgb(var(--border))] px-6 py-4 space-y-4">
              <div className="space-y-2">
                <input type="email" placeholder="Email *" value={buyerEmail} onChange={(e) => setBuyerEmail(e.target.value)} className="h-10 w-full rounded-xl border border-[rgb(var(--border))] bg-white px-3 text-sm transition focus:border-[rgb(var(--primary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]/20" />
                <input type="text" placeholder="Nom complet" value={buyerName} onChange={(e) => setBuyerName(e.target.value)} className="h-10 w-full rounded-xl border border-[rgb(var(--border))] bg-white px-3 text-sm transition focus:border-[rgb(var(--primary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]/20" />
                <input placeholder="Adresse de livraison" value={buyerAddress} onChange={(e) => setBuyerAddress(e.target.value)} className="h-10 w-full rounded-xl border border-[rgb(var(--border))] bg-white px-3 text-sm transition focus:border-[rgb(var(--primary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]/20" />
                <input type="tel" placeholder="Telephone" value={buyerPhone} onChange={(e) => setBuyerPhone(e.target.value)} className="h-10 w-full rounded-xl border border-[rgb(var(--border))] bg-white px-3 text-sm transition focus:border-[rgb(var(--primary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]/20" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total</span>
                <span className="text-xl font-bold">{totalPrice.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}</span>
              </div>
              <Button className="w-full" onClick={handleCheckout} disabled={checkoutLoading || !buyerEmail}>
                {checkoutLoading ? "Redirection…" : "Payer avec Stripe →"}
              </Button>
              <button onClick={clearCart} className="w-full text-center text-xs text-[rgb(var(--muted))] hover:text-red-600 transition">Vider le panier</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

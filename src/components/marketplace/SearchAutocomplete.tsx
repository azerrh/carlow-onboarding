"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";

/**
 * Input de recherche marketplace avec autocomplete.
 *
 * - Debounce 200ms (équilibre réactivité / charge serveur)
 * - Ferme le panneau au clic extérieur, Escape, focus loss
 * - Sépare les résultats en 3 sections : Produits / Vendeurs / Catégories
 * - Navigation clavier basique : Entrée valide la recherche, Echap ferme
 * - Le composant reste un input contrôlé : la valeur courante est aussi
 *   pushée au parent via `onChange` (pour brancher sur le filtre existant)
 */

interface Suggestion {
  products: {
    id: string;
    name: string;
    price: number;
    category: string | null;
    imageUrl: string | null;
    vendorName: string;
  }[];
  vendors: { id: string; name: string }[];
  categories: { category: string; count: number }[];
}

function formatPrice(p: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(p);
}

export function SearchAutocomplete({
  value,
  onChange,
  onCategorySelected,
  placeholder = "Rechercher un produit, vendeur, catégorie...",
}: {
  value: string;
  onChange: (next: string) => void;
  onCategorySelected?: (category: string) => void;
  placeholder?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<Suggestion | null>(null);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch debouncé
  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setData(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `/api/marketplace/search?q=${encodeURIComponent(q.trim())}`
      );
      const json = await res.json();
      if (res.ok && json.success) {
        setData({
          products: json.products ?? [],
          vendors: json.vendors ?? [],
          categories: json.categories ?? [],
        });
      } else {
        setData(null);
      }
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(value), 200);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value, fetchSuggestions]);

  // Click extérieur ferme
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const hasResults =
    data &&
    (data.products.length > 0 ||
      data.vendors.length > 0 ||
      data.categories.length > 0);

  return (
    <div ref={wrapRef} className="relative min-w-[200px] flex-1">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--muted))]">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          className="h-4 w-4"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3-3" />
        </svg>
      </span>
      <input
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => value.length >= 2 && setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setOpen(false);
            (e.target as HTMLInputElement).blur();
          }
        }}
        placeholder={placeholder}
        className="h-10 w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] pl-9 pr-3 text-sm focus:border-[rgb(var(--primary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]/15"
      />

      {open && value.trim().length >= 2 && (
        <div className="absolute left-0 right-0 top-full z-30 mt-1.5 overflow-hidden rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] shadow-xl">
          {loading && !data ? (
            <div className="px-4 py-6 text-center text-xs text-[rgb(var(--muted))]">
              Recherche…
            </div>
          ) : !hasResults ? (
            <div className="px-4 py-6 text-center text-xs text-[rgb(var(--muted))]">
              Aucun résultat pour « {value} »
            </div>
          ) : (
            <div className="max-h-[420px] overflow-y-auto">
              {/* Produits */}
              {data!.products.length > 0 && (
                <Section title="Produits">
                  {data!.products.map((p) => (
                    <Link
                      key={p.id}
                      href={`/marketplace/${p.id}`}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 transition hover:bg-[rgb(var(--primary))]/[0.04]"
                    >
                      <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-lg bg-black/[0.04]">
                        {p.imageUrl ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={p.imageUrl}
                            alt={p.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-lg">📦</span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">
                          {p.name}
                        </p>
                        <p className="truncate text-[11px] text-[rgb(var(--muted))]">
                          {p.vendorName}
                          {p.category ? ` · ${p.category}` : ""}
                        </p>
                      </div>
                      <span className="shrink-0 text-sm font-bold text-[rgb(var(--primary))]">
                        {formatPrice(p.price)}
                      </span>
                    </Link>
                  ))}
                </Section>
              )}

              {/* Vendeurs */}
              {data!.vendors.length > 0 && (
                <Section title="Vendeurs">
                  {data!.vendors.map((v) => (
                    <Link
                      key={v.id}
                      href={`/marketplace/vendeur/${v.id}`}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 transition hover:bg-[rgb(var(--primary))]/[0.04]"
                    >
                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[rgb(var(--primary))]/10 text-sm font-bold text-[rgb(var(--primary))]">
                        {v.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="truncate text-sm font-medium">
                        {v.name}
                      </span>
                    </Link>
                  ))}
                </Section>
              )}

              {/* Catégories */}
              {data!.categories.length > 0 && (
                <Section title="Catégories">
                  {data!.categories.map((c) => (
                    <button
                      key={c.category}
                      type="button"
                      onClick={() => {
                        if (onCategorySelected) {
                          onCategorySelected(c.category);
                          setOpen(false);
                        } else {
                          router.push(
                            `/marketplace?category=${encodeURIComponent(c.category)}`
                          );
                        }
                      }}
                      className="flex w-full items-center justify-between px-3 py-2 text-left transition hover:bg-[rgb(var(--primary))]/[0.04]"
                    >
                      <span className="flex items-center gap-2">
                        <span className="grid h-7 w-7 place-items-center rounded-lg bg-[rgb(var(--primary))]/8 text-xs">
                          🏷️
                        </span>
                        <span className="text-sm font-medium">{c.category}</span>
                      </span>
                      <span className="text-[10px] text-[rgb(var(--muted))]">
                        {c.count} produit{c.count > 1 ? "s" : ""}
                      </span>
                    </button>
                  ))}
                </Section>
              )}
            </div>
          )}

          {/* Footer hint */}
          <div className="border-t border-[rgb(var(--border))]/60 bg-[rgb(var(--bg))]/40 px-3 py-1.5 text-[10px] text-[rgb(var(--muted))]">
            Tapez{" "}
            <kbd className="rounded border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-1 font-mono">
              Echap
            </kbd>{" "}
            pour fermer
          </div>
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("py-1.5")}>
      <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[rgb(var(--muted))]">
        {title}
      </p>
      {children}
    </div>
  );
}

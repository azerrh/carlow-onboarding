"use client";

import Link from "next/link";
import { useRecentlyViewedDetails } from "@/hooks/useRecentlyViewed";
import { Skeleton } from "@/components/ui/Skeleton";
import { SmartImage } from "@/components/ui/SmartImage";

/**
 * Section "Vous avez consulté" — affiche les 4 derniers produits vus
 * par l'utilisateur courant (stockage localStorage, persistant entre
 * sessions).
 *
 * Composant qui se masque automatiquement si la liste est vide → safe
 * à mettre n'importe où sans condition côté caller.
 */
function formatPrice(p: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(p);
}

export function RecentlyViewed({ exclude }: { exclude?: string }) {
  const { products, loading } = useRecentlyViewedDetails({
    exclude,
    limit: 4,
  });

  // Cas "rien à afficher" : on retourne null pour ne pas occuper d'espace
  // (vs un état "vide" qui n'a pas de sens pour cette section facultative).
  if (!loading && products.length === 0) return null;

  return (
    <section className="mt-12">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[rgb(var(--primary))]">
            Historique
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">
            Vous avez consulté
          </h2>
        </div>
      </div>

      {loading ? (
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} variant="card" className="h-64" />
          ))}
        </div>
      ) : (
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((p) => (
            <Link
              key={p.id}
              href={`/marketplace/${p.id}`}
              className="group flex flex-col overflow-hidden rounded-2xl border border-[rgb(var(--border))]/60 bg-[rgb(var(--card))] transition hover:border-[rgb(var(--primary))]/30 hover:shadow-md"
            >
              <div className="relative aspect-[4/3] bg-[rgb(var(--bg))]/50">
                {p.imageUrl ? (
                  <SmartImage
                    src={p.imageUrl}
                    alt={p.name}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 280px"
                    className="object-cover transition duration-500 group-hover:scale-[1.04]"
                  />
                ) : (
                  <div className="grid h-full place-items-center text-3xl text-[rgb(var(--muted))]/40">
                    📦
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col p-3.5">
                <h3 className="line-clamp-2 text-sm font-semibold leading-tight">
                  {p.name}
                </h3>
                <p className="mt-0.5 truncate text-[11px] text-[rgb(var(--muted))]">
                  par {p.vendor.name}
                </p>
                <div className="mt-auto pt-3 flex items-center justify-between">
                  <span className="text-base font-bold tracking-tight text-[rgb(var(--primary))]">
                    {formatPrice(p.price)}
                  </span>
                  {p.category && (
                    <span className="rounded-md bg-[rgb(var(--primary))]/8 px-1.5 py-0.5 text-[10px] font-semibold text-[rgb(var(--primary))]">
                      {p.category}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

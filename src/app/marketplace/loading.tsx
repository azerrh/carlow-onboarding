import { ProductCardSkeleton, Skeleton } from "@/components/ui/Skeleton";

/**
 * Loading state pour /marketplace.
 * Next.js le sert automatiquement pendant la transition entre routes (le
 * Suspense est tissé par App Router). Garde un visuel cohérent avec la
 * grille de la page réelle pour éviter le "flash" visuel.
 */
export default function MarketplaceLoading() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header skeleton */}
      <div className="border-b border-[rgb(var(--border))] bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Skeleton className="h-7 w-28" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-20 rounded-lg" />
            <Skeleton className="h-9 w-24 rounded-lg" />
          </div>
        </div>
      </div>

      {/* Hero skeleton */}
      <div className="mx-auto max-w-6xl px-4 pb-8 pt-10">
        <Skeleton className="mx-auto h-8 w-64" />
        <Skeleton className="mx-auto mt-3 h-4 w-96" />
      </div>

      {/* Filters skeleton */}
      <div className="mx-auto mb-6 max-w-6xl px-4">
        <div className="flex gap-3">
          <Skeleton className="h-11 flex-1 rounded-xl" />
          <Skeleton className="h-11 w-44 rounded-xl" />
        </div>
      </div>

      {/* Grid */}
      <div className="mx-auto max-w-6xl px-4 pb-16">
        <Skeleton className="mb-4 h-3 w-24" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

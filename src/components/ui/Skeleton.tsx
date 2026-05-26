import { cn } from "@/lib/cn";

/**
 * Composant Skeleton réutilisable pour les états de chargement.
 *
 * Utilisation typique :
 *   <Skeleton className="h-4 w-32" />          // ligne de texte courte
 *   <Skeleton variant="circle" className="h-10 w-10" />  // avatar
 *   <Skeleton variant="card" className="h-48" />         // bloc carte
 *
 * L'animation est définie globalement dans globals.css (.animate-skeleton)
 * avec un dégradé qui se déplace de droite à gauche.
 */
export function Skeleton({
  className,
  variant = "default",
}: {
  className?: string;
  variant?: "default" | "circle" | "card" | "text";
}) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "animate-skeleton",
        variant === "default" && "rounded-md",
        variant === "circle" && "rounded-full",
        variant === "card" && "rounded-2xl border border-[rgb(var(--border))]/40",
        variant === "text" && "h-3.5 rounded",
        className
      )}
    />
  );
}

/**
 * Skeleton préfabriqué pour une carte produit (utilisé sur marketplace
 * pendant le chargement de la liste).
 */
export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[var(--radius)] border border-[rgb(var(--border))]/60 bg-[rgb(var(--card))]">
      <Skeleton className="aspect-[4/3] w-full rounded-none" />
      <div className="space-y-2.5 p-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-20 rounded-full" />
          <Skeleton className="h-3 w-12" />
        </div>
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-3 w-3/5" />
        <div className="flex items-end justify-between pt-3 border-t border-[rgb(var(--border))]/40">
          <div className="space-y-1.5">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-2.5 w-16" />
          </div>
          <Skeleton className="h-9 w-20 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton pour une ligne de liste (commandes, notifications, etc.).
 */
export function ListItemSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-[rgb(var(--border))]/60 bg-[rgb(var(--card))] px-4 py-3">
      <Skeleton variant="circle" className="h-10 w-10 shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3.5 w-2/3" />
        <Skeleton className="h-3 w-1/3" />
      </div>
      <Skeleton className="h-6 w-16 rounded-full" />
    </div>
  );
}

/**
 * Skeleton pour une carte KPI (dashboards).
 */
export function StatCardSkeleton() {
  return (
    <div className="rounded-2xl border border-[rgb(var(--border))]/60 bg-[rgb(var(--card))] p-5">
      <div className="flex items-center gap-3">
        <Skeleton variant="circle" className="h-11 w-11 shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-2.5 w-20" />
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-2 w-16" />
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton page complète (utilisé en loading.tsx).
 */
export function PageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-3 w-48" />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      {/* Main content */}
      <Skeleton variant="card" className="h-64" />

      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton variant="card" className="h-48" />
        <Skeleton variant="card" className="h-48" />
      </div>
    </div>
  );
}

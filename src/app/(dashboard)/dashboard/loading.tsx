import { Skeleton, StatCardSkeleton } from "@/components/ui/Skeleton";

/**
 * Loading state global pour /dashboard et tous ses sous-segments
 * (commandes, ventes, entreprise, notifications, etc.).
 *
 * Next.js sert ce fichier automatiquement pendant le rendu du segment.
 * On reproduit le layout de la VendorShell sans son contenu réel pour
 * éviter le flash blanc lors des transitions.
 */
export default function DashboardLoading() {
  return (
    <div className="flex min-h-screen bg-[rgb(var(--bg))]">
      {/* Mini icon bar fake */}
      <aside className="sticky top-0 z-30 hidden h-screen w-14 flex-col items-center gap-1 border-r border-[rgb(var(--border))] bg-white/80 py-4 lg:flex">
        <Skeleton variant="circle" className="h-9 w-9" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-9 rounded-lg" />
        ))}
      </aside>

      {/* Sidebar fake */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-[rgb(var(--border))] bg-white/80 lg:block">
        <div className="border-b border-[rgb(var(--border))] px-5 py-4">
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="space-y-1 px-3 py-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full rounded-lg" />
          ))}
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex h-14 items-center gap-3 border-b border-[rgb(var(--border))] bg-white/80 px-4 lg:justify-end lg:px-6">
          <div className="flex-1 lg:hidden" />
          <Skeleton className="h-9 w-32 rounded-full" />
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {/* Page header */}
          <div className="mb-6">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="mt-3 h-7 w-64" />
            <Skeleton className="mt-2 h-3.5 w-80" />
          </div>

          {/* KPI grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </div>

          {/* Content blocks */}
          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <Skeleton variant="card" className="h-72 lg:col-span-2" />
            <Skeleton variant="card" className="h-72" />
          </div>
        </main>
      </div>
    </div>
  );
}

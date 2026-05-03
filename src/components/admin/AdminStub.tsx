"use client";

import { AdminShell, AdminPageHeader } from "@/components/admin/AdminShell";

/**
 * Page placeholder pour les sections admin pas encore implémentées.
 * Conserve la sidebar fonctionnelle pour que la nav clique partout,
 * et explique au chargé de compte ce qui sera disponible ici.
 */
export function AdminStub({
  breadcrumb,
  title,
  subtitle,
  description,
}: {
  breadcrumb: string[];
  title: string;
  subtitle?: string;
  description: string;
}) {
  return (
    <AdminShell>
      <AdminPageHeader breadcrumb={breadcrumb} title={title} subtitle={subtitle} />

      <div className="rounded-2xl border-2 border-dashed border-[rgb(var(--border))] bg-white p-12 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#6366f1]/10 text-[#6366f1]">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            className="h-7 w-7"
          >
            <path d="M12 6v6l4 2" />
            <circle cx="12" cy="12" r="9" />
          </svg>
        </div>
        <h2 className="mt-4 text-lg font-semibold">Section en cours de construction</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-[rgb(var(--muted))]">
          {description}
        </p>
        <p className="mt-4 text-xs text-[rgb(var(--muted))]">
          Cette page nécessite l&apos;extension du schéma Prisma (nouveaux modèles)
          avant de pouvoir afficher des données réelles.
        </p>
      </div>
    </AdminShell>
  );
}

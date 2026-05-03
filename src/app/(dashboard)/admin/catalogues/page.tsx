"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminShell, AdminPageHeader } from "@/components/admin/AdminShell";
import { cn } from "@/lib/cn";

interface CatalogRow {
  id: string;
  name: string | null;
  description: string | null;
  active: boolean;
  createdAt: string;
  vendor: { id: string; name: string; companyName: string | null; email: string };
  _count: { products: number };
}

export default function AdminCataloguesPage() {
  const router = useRouter();
  const [catalogs, setCatalogs] = useState<CatalogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/catalogs");
        if (res.status === 401) {
          router.replace("/admin/login");
          return;
        }
        const data = await res.json();
        if (res.ok && data.success) setCatalogs(data.catalogs);
        else setError(data?.error || "Erreur de chargement.");
      } catch {
        setError("Erreur réseau.");
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const filtered = catalogs.filter((c) => {
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      (c.name ?? "").toLowerCase().includes(q) ||
      c.vendor.name.toLowerCase().includes(q) ||
      (c.vendor.companyName ?? "").toLowerCase().includes(q)
    );
  });

  async function toggle(c: CatalogRow) {
    setCatalogs((cs) =>
      cs.map((x) => (x.id === c.id ? { ...x, active: !x.active } : x))
    );
    await fetch("/api/admin/catalogs", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: c.id, active: !c.active }),
    });
  }

  return (
    <AdminShell>
      <AdminPageHeader
        breadcrumb={["Dashboard", "Produits", "Catalogues"]}
        title="Catalogues vendeur"
        subtitle={`${catalogs.length} catalogue${catalogs.length > 1 ? "s" : ""} au total`}
      />

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-[rgb(var(--border))] bg-white p-4">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[260px]">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--muted))]">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4 w-4">
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-3-3" />
              </svg>
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par catalogue ou vendeur…"
              className="h-10 w-full rounded-xl border border-[rgb(var(--border))] bg-[#f8f9fc] pl-9 pr-3 text-sm focus:border-[#6366f1] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#6366f1]/15"
            />
          </div>
        </div>

        {loading ? (
          <p className="py-8 text-center text-sm text-[rgb(var(--muted))]">Chargement…</p>
        ) : filtered.length === 0 ? (
          <p className="py-12 text-center text-sm text-[rgb(var(--muted))]">
            Aucun catalogue trouvé.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((c) => (
              <div
                key={c.id}
                className="overflow-hidden rounded-xl border border-[rgb(var(--border))] bg-white p-5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold">
                      {c.name ?? `Catalogue #${c.id.slice(0, 6)}`}
                    </h3>
                    <p className="truncate text-xs text-[rgb(var(--muted))]">
                      {c.vendor.companyName ?? c.vendor.name}
                    </p>
                  </div>
                  <button
                    onClick={() => toggle(c)}
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                      c.active
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-black/[0.06] text-[rgb(var(--muted))]"
                    )}
                  >
                    {c.active ? "Actif" : "Inactif"}
                  </button>
                </div>
                {c.description && (
                  <p className="mt-3 line-clamp-2 text-sm text-[rgb(var(--muted))]">
                    {c.description}
                  </p>
                )}
                <div className="mt-4 flex items-center justify-between border-t border-[rgb(var(--border))] pt-3">
                  <span className="text-xs text-[rgb(var(--muted))]">
                    {c._count.products} produit{c._count.products > 1 ? "s" : ""}
                  </span>
                  <span className="text-xs text-[rgb(var(--muted))]">
                    {new Date(c.createdAt).toLocaleDateString("fr-FR")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminShell>
  );
}

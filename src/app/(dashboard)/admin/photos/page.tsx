"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminShell, AdminPageHeader } from "@/components/admin/AdminShell";

interface PhotoRow {
  id: string;
  url: string;
  primary: boolean;
  createdAt: string;
  product: {
    id: string;
    name: string;
    catalog: { vendor: { name: string } };
  };
}

export default function AdminPhotosPage() {
  const router = useRouter();
  const [photos, setPhotos] = useState<PhotoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/photos");
        if (res.status === 401) {
          router.replace("/admin/login");
          return;
        }
        const data = await res.json();
        if (res.ok && data.success) setPhotos(data.photos);
        else setError(data?.error || "Erreur de chargement.");
      } catch {
        setError("Erreur réseau.");
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  async function handleDelete(id: string) {
    if (!confirm("Supprimer cette photo ?")) return;
    setPhotos((ps) => ps.filter((p) => p.id !== id));
    await fetch(`/api/admin/photos?id=${encodeURIComponent(id)}`, { method: "DELETE" });
  }

  return (
    <AdminShell>
      <AdminPageHeader
        breadcrumb={["Dashboard", "Produits", "Photos"]}
        title="Galerie photos"
        subtitle={`${photos.length} photo${photos.length > 1 ? "s" : ""} au total`}
      />

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-[rgb(var(--border))] bg-white p-5">
        {loading ? (
          <p className="py-8 text-center text-sm text-[rgb(var(--muted))]">Chargement…</p>
        ) : photos.length === 0 ? (
          <p className="py-12 text-center text-sm text-[rgb(var(--muted))]">
            Aucune photo dans la galerie.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {photos.map((p) => (
              <div
                key={p.id}
                className="group overflow-hidden rounded-xl border border-[rgb(var(--border))] bg-white"
              >
                <div className="relative aspect-square bg-black/[0.04]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.url}
                    alt={p.product.name}
                    className="h-full w-full object-cover"
                  />
                  {p.primary && (
                    <span className="absolute left-2 top-2 rounded-md bg-amber-400 px-1.5 py-0.5 text-[10px] font-bold uppercase text-amber-950">
                      Principale
                    </span>
                  )}
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-white/90 text-rose-600 opacity-0 shadow group-hover:opacity-100"
                    title="Supprimer"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5">
                      <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />
                    </svg>
                  </button>
                </div>
                <div className="p-3">
                  <div className="truncate text-sm font-medium">{p.product.name}</div>
                  <div className="truncate text-xs text-[rgb(var(--muted))]">
                    {p.product.catalog.vendor.name}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminShell>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Brand } from "@/components/ui/Brand";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";

interface Catalog {
  id: string;
  name: string | null;
  description: string | null;
  active: boolean;
  createdAt: string;
  _count: { products: number };
}

export default function VendorCatalogsPage() {
  const router = useRouter();
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [catalogs, setCatalogs] = useState<Catalog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    const id = localStorage.getItem("vendorId");
    if (!id) {
      router.replace("/login");
      return;
    }
    setVendorId(id);
  }, [router]);

  const loadCatalogs = useCallback(async () => {
    if (!vendorId) return;
    try {
      const res = await fetch(`/api/vendor/catalogs?id=${vendorId}`);
      const data = await res.json();
      if (res.ok && data.success) setCatalogs(data.catalogs);
      else setError(data?.error || "Erreur de chargement.");
    } catch {
      setError("Erreur reseau.");
    } finally {
      setLoading(false);
    }
  }, [vendorId]);

  useEffect(() => {
    if (vendorId) loadCatalogs();
  }, [vendorId, loadCatalogs]);

  const filtered = catalogs.filter((c) => {
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      (c.name ?? "").toLowerCase().includes(q) ||
      (c.description ?? "").toLowerCase().includes(q)
    );
  });

  async function toggleActive(c: Catalog) {
    if (!vendorId) return;
    setCatalogs((cs) =>
      cs.map((x) => (x.id === c.id ? { ...x, active: !x.active } : x))
    );
    await fetch(`/api/vendor/catalogs?id=${vendorId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: c.id, active: !c.active }),
    });
  }

  async function handleDelete(id: string) {
    if (!vendorId) return;
    if (!confirm("Supprimer ce catalogue et tous ses produits ?")) return;
    setCatalogs((cs) => cs.filter((x) => x.id !== id));
    await fetch(`/api/vendor/catalogs?id=${vendorId}&catalogId=${id}`, {
      method: "DELETE",
    });
  }

  return (
    <div className="portal-page min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-[rgb(var(--border))] bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-[1100px] items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Brand variant="compact" />
            <span className="text-sm text-[rgb(var(--muted))]">/</span>
            <Link
              href="/dashboard"
              className="text-sm text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]"
            >
              Tableau de bord
            </Link>
            <span className="text-sm text-[rgb(var(--muted))]">/</span>
            <span className="text-sm font-medium">Mes catalogues</span>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              localStorage.removeItem("vendorId");
              router.push("/login");
            }}
          >
            Deconnexion
          </Button>
        </div>
      </div>

      <div className="mx-auto max-w-[1100px] px-4 py-8">
        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              Mes catalogues
            </h1>
            <p className="mt-1 text-sm text-[rgb(var(--muted))]">
              {catalogs.length} catalogue{catalogs.length > 1 ? "s" : ""} au total
            </p>
          </div>
          <Button onClick={() => setShowCreate(true)}>+ Nouveau catalogue</Button>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Search */}
        <div className="mt-6">
          <div className="relative max-w-md">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--muted))]">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4 w-4">
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-3-3" />
              </svg>
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un catalogue…"
              className="h-10 w-full rounded-xl border border-[rgb(var(--border))] bg-white pl-9 pr-3 text-sm focus:border-[rgb(var(--primary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]/15"
            />
          </div>
        </div>

        {/* Catalog list */}
        {loading ? (
          <p className="mt-8 text-center text-sm text-[rgb(var(--muted))]">Chargement…</p>
        ) : filtered.length === 0 ? (
          <div className="mt-8 rounded-xl border border-dashed border-[rgb(var(--border))] bg-white/50 px-4 py-12 text-center">
            <div className="text-3xl">📁</div>
            <p className="mt-3 text-sm font-medium">
              {search ? "Aucun resultat." : "Aucun catalogue cree."}
            </p>
            {!search && (
              <Button className="mt-4" onClick={() => setShowCreate(true)}>
                Creer mon premier catalogue
              </Button>
            )}
          </div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((c) => (
              <Card
                key={c.id}
                className="overflow-hidden p-5 transition hover:border-[rgb(var(--primary))]/30"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold">
                      {c.name ?? `Catalogue #${c.id.slice(0, 6)}`}
                    </h3>
                    <span className="text-xs text-[rgb(var(--muted))]">
                      {new Date(c.createdAt).toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                  <button
                    onClick={() => toggleActive(c)}
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                      c.active
                        ? "bg-[rgb(var(--success))]/10 text-[rgb(var(--success))]"
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
                  <Link
                    href={`/dashboard/produits?catalog=${c.id}`}
                    className="text-xs font-medium text-[rgb(var(--primary))] hover:underline"
                  >
                    {c._count.products} produit{c._count.products > 1 ? "s" : ""} →
                  </Link>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleDelete(c.id)}
                      title="Supprimer"
                      className="grid h-7 w-7 place-items-center rounded-md border border-rose-300 bg-rose-50 text-rose-600 hover:bg-rose-100"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5">
                        <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />
                      </svg>
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {showCreate && (
        <CreateCatalogModal
          vendorId={vendorId}
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            loadCatalogs();
          }}
        />
      )}
    </div>
  );
}

function CreateCatalogModal({
  vendorId,
  onClose,
  onCreated,
}: {
  vendorId: string | null;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setSubmitting(true);
    try {
      const res = await fetch(`/api/vendor/catalogs?id=${vendorId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description: description || null }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setErr(data?.error || "Creation impossible.");
        setSubmitting(false);
        return;
      }
      onCreated();
    } catch {
      setErr("Erreur reseau.");
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold">Nouveau catalogue</h2>
        <p className="mt-1 text-sm text-[rgb(var(--muted))]">
          Creer un catalogue pour organiser vos produits.
        </p>

        {err && (
          <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {err}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 grid gap-4">
          <label className="block">
            <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-[rgb(var(--muted))]">
              Nom *
            </span>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Panneaux solaires 2026"
              className="h-10 w-full rounded-xl border border-[rgb(var(--border))] bg-white px-3 text-sm focus:border-[rgb(var(--primary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]/15"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-[rgb(var(--muted))]">
              Description
            </span>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description du catalogue…"
              className="w-full rounded-xl border border-[rgb(var(--border))] bg-white p-3 text-sm focus:border-[rgb(var(--primary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]/15"
            />
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="h-10 rounded-xl border border-[rgb(var(--border))] bg-white px-4 text-sm font-semibold hover:bg-black/[0.02]"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting || !name}
              className={cn(
                "h-10 rounded-xl bg-[rgb(var(--primary))] px-4 text-sm font-semibold text-white hover:brightness-95",
                (submitting || !name) && "opacity-60"
              )}
            >
              {submitting ? "Creation…" : "Creer le catalogue"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

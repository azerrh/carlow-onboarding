"use client";

import { useCallback, useEffect, useMemo, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Brand } from "@/components/ui/Brand";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";

interface Product {
  id: string;
  name: string;
  reference: string | null;
  description: string | null;
  price: number;
  weightKg: number | null;
  dimensions: string | null;
  category: string | null;
  stock: number;
  active: boolean;
  createdAt: string;
  catalog: { id: string; name: string | null };
  photos: { id: string; url: string; primary: boolean }[];
}

interface CatalogOption {
  id: string;
  name: string | null;
}

interface Stats {
  total: number;
  active: number;
  noPhoto: number;
  zeroStock: number;
}

function ProductsInner({ preselectedCatalog }: { preselectedCatalog: string | null }) {
  const router = useRouter();

  const [vendorId, setVendorId] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [catalogs, setCatalogs] = useState<CatalogOption[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, noPhoto: 0, zeroStock: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [catalogFilter, setCatalogFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [showCreate, setShowCreate] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);

  useEffect(() => {
    const id = localStorage.getItem("vendorId");
    if (!id) {
      router.replace("/login");
      return;
    }
    setVendorId(id);
  }, [router]);

  const loadData = useCallback(async () => {
    if (!vendorId) return;
    try {
      const [pRes, cRes] = await Promise.all([
        fetch(`/api/vendor/products?id=${vendorId}`),
        fetch(`/api/vendor/catalogs?id=${vendorId}`),
      ]);
      const pData = await pRes.json();
      const cData = await cRes.json();
      if (pRes.ok && pData.success) {
        setProducts(pData.products);
        setStats(pData.stats);
      }
      if (cRes.ok && cData.success) setCatalogs(cData.catalogs);
    } catch {
      // Erreur silencieuse
    } finally {
      setLoading(false);
    }
  }, [vendorId]);

  useEffect(() => {
    if (vendorId) loadData();
  }, [vendorId, loadData]);

  useEffect(() => {
    if (preselectedCatalog && catalogs.length > 0) {
      setCatalogFilter(preselectedCatalog);
    }
  }, [preselectedCatalog, catalogs]);

  const categories = useMemo(() => {
    return Array.from(
      new Set(products.map((p) => p.category).filter(Boolean) as string[])
    );
  }, [products]);

  const filtered = products.filter((p) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      (p.reference ?? "").toLowerCase().includes(q) ||
      (p.category ?? "").toLowerCase().includes(q);
    const matchCatalog = catalogFilter === "ALL" || p.catalog.id === catalogFilter;
    const matchStatus =
      statusFilter === "ALL" ||
      (statusFilter === "ACTIVE" && p.active) ||
      (statusFilter === "INACTIVE" && !p.active);
    const matchCategory = categoryFilter === "ALL" || p.category === categoryFilter;
    return matchSearch && matchCatalog && matchStatus && matchCategory;
  });

  async function toggleActive(p: Product) {
    if (!vendorId) return;
    setProducts((ps) =>
      ps.map((x) => (x.id === p.id ? { ...x, active: !x.active } : x))
    );
    await fetch(`/api/vendor/products?id=${vendorId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: p.id, active: !p.active }),
    });
  }

  async function handleDelete(id: string) {
    if (!vendorId) return;
    if (!confirm("Supprimer ce produit ?")) return;
    setProducts((ps) => ps.filter((x) => x.id !== id));
    await fetch(`/api/vendor/products?id=${vendorId}&productId=${id}`, {
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
            <span className="text-sm font-medium">Mes produits</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/dashboard/catalogues">
              <Button variant="ghost" size="sm">Catalogues</Button>
            </Link>
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
      </div>

      <div className="mx-auto max-w-[1100px] px-4 py-8">
        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              Mes produits
            </h1>
            <p className="mt-1 text-sm text-[rgb(var(--muted))]">
              {stats.total} produit{stats.total > 1 ? "s" : ""} au total
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/dashboard/produits/import">
              <Button variant="secondary" disabled={catalogs.length === 0}>
                📥 Import CSV
              </Button>
            </Link>
            <Button
              onClick={() => setShowCreate(true)}
              disabled={catalogs.length === 0}
            >
              + Nouveau produit
            </Button>
          </div>
        </div>

        {catalogs.length === 0 && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Creer d&apos;abord un catalogue pour ajouter des produits.{" "}
            <Link href="/dashboard/catalogues" className="font-semibold underline">
              Gerer mes catalogues →
            </Link>
          </div>
        )}

        {/* Stats */}
        <div className="mt-6 grid gap-4 sm:grid-cols-4">
          <Tile label="Total" value={stats.total} tone="indigo" />
          <Tile label="Actifs" value={stats.active} tone="emerald" />
          <Tile label="Sans photo" value={stats.noPhoto} tone="amber" />
          <Tile label="Stock zero" value={stats.zeroStock} tone="rose" />
        </div>

        {/* Filters */}
        <Card className="mt-6 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--muted))]">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4 w-4">
                  <circle cx="11" cy="11" r="7" />
                  <path d="M20 20l-3-3" />
                </svg>
              </span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Nom, reference, categorie…"
                className="h-10 w-full rounded-xl border border-[rgb(var(--border))] bg-[#f8f9fc] pl-9 pr-3 text-sm focus:border-[rgb(var(--primary))] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]/15"
              />
            </div>
            <select
              value={catalogFilter}
              onChange={(e) => setCatalogFilter(e.target.value)}
              className="h-10 cursor-pointer rounded-xl border border-[rgb(var(--border))] bg-[#f8f9fc] px-3 text-sm"
            >
              <option value="ALL">Tous les catalogues</option>
              {catalogs.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name ?? `Catalogue ${c.id.slice(0, 6)}`}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="h-10 cursor-pointer rounded-xl border border-[rgb(var(--border))] bg-[#f8f9fc] px-3 text-sm"
            >
              <option value="ALL">Tous statuts</option>
              <option value="ACTIVE">Actifs</option>
              <option value="INACTIVE">Inactifs</option>
            </select>
            {categories.length > 0 && (
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="h-10 cursor-pointer rounded-xl border border-[rgb(var(--border))] bg-[#f8f9fc] px-3 text-sm"
              >
                <option value="ALL">Toutes categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            )}
          </div>
        </Card>

        {/* Product table */}
        <Card className="mt-6 overflow-hidden">
          {loading ? (
            <p className="py-8 text-center text-sm text-[rgb(var(--muted))]">Chargement…</p>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center">
              <div className="text-3xl">📦</div>
              <p className="mt-3 text-sm font-medium">Aucun produit trouve.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-[rgb(var(--border))] text-left text-[11px] font-semibold uppercase tracking-wider text-[rgb(var(--muted))]">
                    <th className="py-3 pr-3">Photo</th>
                    <th className="py-3 pr-3">Produit</th>
                    <th className="py-3 pr-3">Catalogue</th>
                    <th className="py-3 pr-3">Prix</th>
                    <th className="py-3 pr-3">Stock</th>
                    <th className="py-3 pr-3">Statut</th>
                    <th className="py-3 pr-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => (
                    <tr
                      key={p.id}
                      className="border-b border-[rgb(var(--border))]/60 last:border-0 hover:bg-black/[0.015]"
                    >
                      <td className="py-3 pr-3">
                        {p.photos[0] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={p.photos[0].url}
                            alt={p.name}
                            className="h-10 w-10 rounded-lg object-cover"
                          />
                        ) : (
                          <span className="grid h-10 w-10 place-items-center rounded-lg bg-black/[0.04] text-[rgb(var(--muted))]">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5">
                              <rect x="3" y="5" width="18" height="14" rx="2" />
                              <circle cx="8.5" cy="10.5" r="1.5" />
                              <path d="M21 16l-5-5-9 9" />
                            </svg>
                          </span>
                        )}
                      </td>
                      <td className="py-3 pr-3">
                        <div className="font-semibold">{p.name}</div>
                        <div className="flex items-center gap-2 text-xs text-[rgb(var(--muted))]">
                          {p.reference && <span className="font-mono">{p.reference}</span>}
                          {p.category && (
                            <span className="rounded-md bg-indigo-50 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700">
                              {p.category}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 pr-3 text-[rgb(var(--fg))]">
                        {p.catalog.name ?? "—"}
                      </td>
                      <td className="py-3 pr-3 font-semibold">
                        {p.price.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
                      </td>
                      <td className="py-3 pr-3">
                        <span
                          className={cn(
                            "rounded-md px-2 py-0.5 text-xs font-semibold",
                            p.stock === 0
                              ? "bg-rose-100 text-rose-700"
                              : p.stock < 10
                                ? "bg-amber-100 text-amber-700"
                                : "bg-emerald-100 text-emerald-700"
                          )}
                        >
                          {p.stock}
                        </span>
                      </td>
                      <td className="py-3 pr-3">
                        <button
                          onClick={() => toggleActive(p)}
                          className={cn(
                            "inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold transition",
                            p.active
                              ? "bg-[rgb(var(--success))]/10 text-[rgb(var(--success))] hover:bg-[rgb(var(--success))]/20"
                              : "bg-black/[0.06] text-[rgb(var(--muted))] hover:bg-black/[0.1]"
                          )}
                        >
                          {p.active ? "Actif" : "Inactif"}
                        </button>
                      </td>
                      <td className="py-3 pr-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setEditProduct(p)}
                            title="Modifier"
                            className="grid h-7 w-7 place-items-center rounded-md border border-[rgb(var(--border))] bg-white hover:bg-black/[0.02]"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(p.id)}
                            title="Supprimer"
                            className="grid h-7 w-7 place-items-center rounded-md border border-rose-300 bg-rose-50 text-rose-600 hover:bg-rose-100"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5">
                              <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {showCreate && (
        <ProductModal
          vendorId={vendorId}
          catalogs={catalogs}
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            loadData();
          }}
        />
      )}

      {editProduct && (
        <ProductModal
          vendorId={vendorId}
          catalogs={catalogs}
          product={editProduct}
          onClose={() => setEditProduct(null)}
          onCreated={() => {
            setEditProduct(null);
            loadData();
          }}
        />
      )}
    </div>
  );
}

function SearchParamsWrapper() {
  const searchParams = useSearchParams();
  const catalog = searchParams.get("catalog");
  return <ProductsInner preselectedCatalog={catalog} />;
}

export default function VendorProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="grid min-h-screen place-items-center">
          <p className="text-sm text-[rgb(var(--muted))]">Chargement...</p>
        </div>
      }
    >
      <SearchParamsWrapper />
    </Suspense>
  );
}

function Tile({ label, value, tone }: { label: string; value: number; tone: string }) {
  const map: Record<string, { bg: string; icon: string }> = {
    indigo: { bg: "bg-indigo-50", icon: "bg-indigo-200/70 text-indigo-700" },
    amber: { bg: "bg-amber-50", icon: "bg-amber-200/70 text-amber-700" },
    emerald: { bg: "bg-emerald-50", icon: "bg-emerald-200/70 text-emerald-700" },
    rose: { bg: "bg-rose-50", icon: "bg-rose-200/70 text-rose-600" },
  };
  const t = map[tone];
  return (
    <Card className={cn("flex items-center gap-4 p-5", t.bg)}>
      <span className={cn("grid h-10 w-10 place-items-center rounded-full", t.icon)}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5">
          <path d="M5 8h14l-1 12H6L5 8z" />
          <path d="M9 8V6a3 3 0 0 1 6 0v2" />
        </svg>
      </span>
      <div>
        <div className="text-xs font-medium text-[rgb(var(--muted))]">{label}</div>
        <div className="text-2xl font-semibold tracking-tight">{value}</div>
      </div>
    </Card>
  );
}

function ProductModal({
  vendorId,
  catalogs,
  product,
  onClose,
  onCreated,
}: {
  vendorId: string | null;
  catalogs: CatalogOption[];
  product?: Product | null;
  onClose: () => void;
  onCreated: () => void;
}) {
  const isEdit = !!product;
  const [form, setForm] = useState({
    catalogId: product?.catalog.id ?? catalogs[0]?.id ?? "",
    name: product?.name ?? "",
    reference: product?.reference ?? "",
    description: product?.description ?? "",
    category: product?.category ?? "",
    price: product?.price.toString() ?? "",
    stock: product?.stock.toString() ?? "0",
    weightKg: product?.weightKg?.toString() ?? "",
    dimensions: product?.dimensions ?? "",
    active: product?.active ?? true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setSubmitting(true);
    try {
      const url = isEdit
        ? `/api/vendor/products?id=${vendorId}`
        : `/api/vendor/products?id=${vendorId}`;
      const method = isEdit ? "PUT" : "POST";
      const body = {
        ...(isEdit ? { id: product!.id } : {}),
        ...form,
        price: Number(form.price),
        stock: Number(form.stock),
        weightKg: form.weightKg ? Number(form.weightKg) : null,
      };
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setErr(data?.error || (isEdit ? "Modification impossible." : "Creation impossible."));
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
        className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold">
          {isEdit ? "Modifier le produit" : "Nouveau produit"}
        </h2>
        <p className="mt-1 text-sm text-[rgb(var(--muted))]">
          {isEdit
            ? "Modifier les informations du produit."
            : "Renseigne les informations du produit."}
        </p>

        {err && (
          <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {err}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="sm:col-span-2">
            <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-[rgb(var(--muted))]">
              Catalogue *
            </span>
            <select
              required
              value={form.catalogId}
              onChange={(e) => setForm((f) => ({ ...f, catalogId: e.target.value }))}
              className="h-10 w-full cursor-pointer rounded-xl border border-[rgb(var(--border))] bg-white px-3 text-sm"
            >
              {catalogs.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name ?? `Catalogue ${c.id.slice(0, 6)}`}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-[rgb(var(--muted))]">
              Nom *
            </span>
            <input
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="h-10 w-full rounded-xl border border-[rgb(var(--border))] bg-white px-3 text-sm"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-[rgb(var(--muted))]">
              Reference
            </span>
            <input
              value={form.reference}
              onChange={(e) => setForm((f) => ({ ...f, reference: e.target.value }))}
              className="h-10 w-full rounded-xl border border-[rgb(var(--border))] bg-white px-3 text-sm"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-[rgb(var(--muted))]">
              Categorie
            </span>
            <input
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              placeholder="Panneau solaire, Onduleur…"
              className="h-10 w-full rounded-xl border border-[rgb(var(--border))] bg-white px-3 text-sm"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-[rgb(var(--muted))]">
              Prix (€) *
            </span>
            <input
              required
              type="number"
              step="0.01"
              min="0"
              value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
              className="h-10 w-full rounded-xl border border-[rgb(var(--border))] bg-white px-3 text-sm"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-[rgb(var(--muted))]">
              Stock
            </span>
            <input
              type="number"
              min="0"
              value={form.stock}
              onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
              className="h-10 w-full rounded-xl border border-[rgb(var(--border))] bg-white px-3 text-sm"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-[rgb(var(--muted))]">
              Poids (kg)
            </span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.weightKg}
              onChange={(e) => setForm((f) => ({ ...f, weightKg: e.target.value }))}
              className="h-10 w-full rounded-xl border border-[rgb(var(--border))] bg-white px-3 text-sm"
            />
          </label>

          <label className="sm:col-span-2">
            <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-[rgb(var(--muted))]">
              Dimensions
            </span>
            <input
              value={form.dimensions}
              onChange={(e) => setForm((f) => ({ ...f, dimensions: e.target.value }))}
              placeholder="1200x800x40 mm"
              className="h-10 w-full rounded-xl border border-[rgb(var(--border))] bg-white px-3 text-sm"
            />
          </label>

          <label className="sm:col-span-2">
            <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-[rgb(var(--muted))]">
              Description
            </span>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full rounded-xl border border-[rgb(var(--border))] bg-white p-3 text-sm"
            />
          </label>

          <div className="col-span-full mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-10 rounded-xl border border-[rgb(var(--border))] bg-white px-4 text-sm font-semibold hover:bg-black/[0.02]"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting || !form.catalogId || !form.name || !form.price}
              className={cn(
                "h-10 rounded-xl bg-[rgb(var(--primary))] px-4 text-sm font-semibold text-white hover:brightness-95",
                (submitting || !form.catalogId || !form.name || !form.price) && "opacity-60"
              )}
            >
              {submitting ? (isEdit ? "Modification…" : "Creation…") : (isEdit ? "Enregistrer" : "Creer le produit")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

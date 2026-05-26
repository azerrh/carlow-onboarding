"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminShell, AdminPageHeader } from "@/components/admin/AdminShell";
import { cn } from "@/lib/cn";

interface ProductRow {
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
  catalog: {
    id: string;
    name: string | null;
    vendor: { name: string; companyName: string | null };
  };
  photos: { id: string; url: string; primary: boolean }[];
  _count: { photos: number };
}

interface CatalogOption {
  id: string;
  name: string | null;
  vendor: { name: string };
}

export default function AdminProduitsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [catalogs, setCatalogs] = useState<CatalogOption[]>([]);
  const [stats, setStats] = useState({ total: 0, active: 0, noPhoto: 0, zeroStock: 0 });
  const [search, setSearch] = useState("");
  const [catalogFilter, setCatalogFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  async function reload() {
    try {
      const [pRes, cRes] = await Promise.all([
        fetch("/api/admin/products"),
        fetch("/api/admin/catalogs"),
      ]);
      if (pRes.status === 401) {
        router.replace("/admin/login");
        return;
      }
      const pData = await pRes.json();
      const cData = await cRes.json();
      if (pRes.ok && pData.success) {
        setProducts(pData.products);
        setStats(pData.stats);
      }
      if (cRes.ok && cData.success) setCatalogs(cData.catalogs);
    } catch {
      setError("Erreur réseau.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  async function toggleActive(p: ProductRow) {
    setProducts((ps) =>
      ps.map((x) => (x.id === p.id ? { ...x, active: !x.active } : x))
    );
    await fetch("/api/admin/products", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: p.id, active: !p.active }),
    });
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer ce produit ? Les photos liées seront aussi supprimées.")) return;
    setProducts((ps) => ps.filter((x) => x.id !== id));
    await fetch(`/api/admin/products?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  }

  return (
    <AdminShell>
      <AdminPageHeader
        breadcrumb={["Dashboard", "Produits"]}
        title="Gestion des Produits"
        subtitle={`${stats.total} produit${stats.total > 1 ? "s" : ""} au total`}
        action={
          <button
            onClick={() => setShowCreate(true)}
            disabled={catalogs.length === 0}
            className={cn(
              "inline-flex items-center gap-2 rounded-xl bg-[rgb(var(--primary))] px-4 py-2 text-sm font-semibold text-white hover:bg-[rgb(var(--primary))]/90",
              catalogs.length === 0 && "cursor-not-allowed opacity-50"
            )}
            title={catalogs.length === 0 ? "Aucun catalogue disponible — créer d'abord un vendeur+catalogue" : ""}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Nouveau produit
          </button>
        }
      />

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="animate-slide-up grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Tile label="Total produits" value={stats.total} tone="primary" />
        <Tile label="Actifs" value={stats.active} tone="emerald" />
        <Tile label="Sans photo" value={stats.noPhoto} tone="amber" />
        <Tile label="Stock zero" value={stats.zeroStock} tone="rose" />
      </div>

      <div className="animate-slide-up-1 mt-6 rounded-2xl border border-[rgb(var(--border))] bg-white">
        <div className="border-b border-[rgb(var(--border))] px-5 py-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-[rgb(var(--primary))]/10 text-[rgb(var(--primary))]">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4 w-4">
                  <path d="M5 8h14l-1 12H6L5 8z" />
                  <path d="M9 8V6a3 3 0 0 1 6 0v2" />
                </svg>
              </div>
              <h2 className="text-sm font-semibold">Liste des produits</h2>
            </div>
            <span className="text-xs text-[rgb(var(--muted))]">{filtered.length} resultat{filtered.length > 1 ? "s" : ""}</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[220px]">
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
                className="h-10 w-full rounded-xl border border-[rgb(var(--border))] bg-white pl-9 pr-3 text-sm transition focus:border-[rgb(var(--primary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]/20"
              />
            </div>
            <select
              value={catalogFilter}
              onChange={(e) => setCatalogFilter(e.target.value)}
              className="h-10 cursor-pointer rounded-xl border border-[rgb(var(--border))] bg-white px-3 text-sm transition focus:border-[rgb(var(--primary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]/20"
            >
              <option value="ALL">Tous les catalogues</option>
              {catalogs.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name ?? `Catalogue ${c.id.slice(0, 6)}`} — {c.vendor.name}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="h-10 cursor-pointer rounded-xl border border-[rgb(var(--border))] bg-white px-3 text-sm transition focus:border-[rgb(var(--primary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]/20"
            >
              <option value="ALL">Tous statuts</option>
              <option value="ACTIVE">Actifs</option>
              <option value="INACTIVE">Inactifs</option>
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-10 cursor-pointer rounded-xl border border-[rgb(var(--border))] bg-white px-3 text-sm transition focus:border-[rgb(var(--primary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]/20"
            >
              <option value="ALL">Toutes categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <button
              onClick={() => { setSearch(""); setCatalogFilter("ALL"); setStatusFilter("ALL"); setCategoryFilter("ALL"); }}
              className="h-10 rounded-xl bg-[rgb(var(--primary))] px-4 text-sm font-semibold text-white transition hover:bg-[rgb(var(--primary))]/90"
            >
              Reset
            </button>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          {loading ? (
            <div className="py-12 text-center">
              <p className="text-sm text-[rgb(var(--muted))]">Chargement…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-black/[0.03] text-[rgb(var(--muted))]">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5">
                  <path d="M5 8h14l-1 12H6L5 8z" />
                  <path d="M9 8V6a3 3 0 0 1 6 0v2" />
                </svg>
              </div>
              <p className="mt-3 text-sm font-medium">Aucun produit trouve</p>
              <p className="mt-1 text-xs text-[rgb(var(--muted))]">Essayez de modifier vos filtres.</p>
            </div>
          ) : (
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-[rgb(var(--border))] text-left text-[11px] font-semibold uppercase tracking-wider text-[rgb(var(--muted))]">
                  <th className="py-3 pr-3">#</th>
                  <th className="py-3 pr-3">Photo</th>
                  <th className="py-3 pr-3">Produit</th>
                  <th className="py-3 pr-3">Catalogue / Vendeur</th>
                  <th className="py-3 pr-3">Prix</th>
                  <th className="py-3 pr-3">Stock</th>
                  <th className="py-3 pr-3">Statut</th>
                  <th className="py-3 pr-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => (
                  <tr
                    key={p.id}
                    className="border-b border-[rgb(var(--border))]/60 last:border-0 hover:bg-black/[0.015]"
                  >
                    <td className="py-3 pr-3 text-xs text-[rgb(var(--muted))]">#{i + 1}</td>
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
                          <span className="rounded-md bg-[rgb(var(--primary))]/10 px-1.5 py-0.5 text-[10px] font-semibold text-[rgb(var(--primary))]">
                            {p.category}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 pr-3">
                      <div className="text-[rgb(var(--fg))]">
                        {p.catalog.name ?? "—"}
                      </div>
                      <div className="text-xs text-[rgb(var(--muted))]">
                        {p.catalog.vendor.companyName ?? p.catalog.vendor.name}
                      </div>
                    </td>
                    <td className="py-3 pr-3 font-semibold">
                      {p.price.toLocaleString("fr-FR", {
                        style: "currency",
                        currency: "EUR",
                      })}
                    </td>
                    <td className="py-3 pr-3">
                        <span
                          className={cn(
                            "rounded-md px-2 py-0.5 text-xs font-semibold",
                            p.stock === 0
                              ? "bg-rose-100 text-rose-700"
                              : p.stock < 10
                                ? "bg-amber-100 text-amber-700"
                                : "bg-[rgb(var(--success))]/10 text-[rgb(var(--success))]"
                          )}
                        >
                          {p.stock}
                        </span>
                    </td>
                    <td className="py-3 pr-3">
                        <button
                          onClick={() => toggleActive(p)}
                          className={cn(
                            "inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold transition",
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
          )}
        </div>
      </div>

      {showCreate && (
        <CreateProductModal
          catalogs={catalogs}
          onClose={() => setShowCreate(false)}
          onCreated={async () => {
            setShowCreate(false);
            await reload();
          }}
        />
      )}
    </AdminShell>
  );
}

/* ---- Sub-components ---- */

function Tile({ label, value, tone }: { label: string; value: number; tone: "primary" | "amber" | "emerald" | "rose" }) {
  const map = {
    primary: { bg: "bg-[rgb(var(--primary))]/10", text: "text-[rgb(var(--primary))]" },
    amber: { bg: "bg-amber-50", text: "text-amber-700" },
    emerald: { bg: "bg-[rgb(var(--success))]/10", text: "text-[rgb(var(--success))]" },
    rose: { bg: "bg-rose-50", text: "text-rose-600" },
  } as const;
  const t = map[tone];
  return (
    <div className={cn("overflow-hidden rounded-2xl p-5 transition hover:shadow-sm", t.bg)}>
      <div className="text-xs font-medium text-[rgb(var(--muted))]">{label}</div>
      <div className={cn("mt-2 text-2xl font-bold tracking-tight", t.text)}>{value.toLocaleString()}</div>
    </div>
  );
}

function CreateProductModal({
  catalogs,
  onClose,
  onCreated,
}: {
  catalogs: CatalogOption[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({
    catalogId: catalogs[0]?.id ?? "",
    name: "",
    reference: "",
    description: "",
    category: "",
    price: "",
    stock: "0",
    weightKg: "",
    dimensions: "",
    active: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          price: Number(form.price),
          stock: Number(form.stock),
          weightKg: form.weightKg ? Number(form.weightKg) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setErr(data?.error || "Création impossible.");
        setSubmitting(false);
        return;
      }
      onCreated();
    } catch {
      setErr("Erreur réseau.");
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold">Nouveau produit</h2>
        <p className="mt-1 text-sm text-[rgb(var(--muted))]">
          Renseigne les informations du produit. La photo se gère ensuite.
        </p>

        {err && (
          <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {err}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 grid gap-3 sm:grid-cols-2">
          <Field label="Catalogue" full>
            <select
              required
              value={form.catalogId}
              onChange={(e) => setForm((f) => ({ ...f, catalogId: e.target.value }))}
              className="h-10 w-full cursor-pointer rounded-xl border border-[rgb(var(--border))] bg-white px-3 text-sm"
            >
              {catalogs.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name ?? `Catalogue ${c.id.slice(0, 6)}`} — {c.vendor.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Nom *">
            <Input
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </Field>
          <Field label="Référence">
            <Input
              value={form.reference}
              onChange={(e) => setForm((f) => ({ ...f, reference: e.target.value }))}
            />
          </Field>

          <Field label="Catégorie">
            <Input
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              placeholder="Panneau solaire, Onduleur…"
            />
          </Field>
          <Field label="Prix (€) *">
            <Input
              required
              type="number"
              step="0.01"
              min="0"
              value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
            />
          </Field>

          <Field label="Stock">
            <Input
              type="number"
              min="0"
              value={form.stock}
              onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
            />
          </Field>
          <Field label="Poids (kg)">
            <Input
              type="number"
              step="0.01"
              min="0"
              value={form.weightKg}
              onChange={(e) => setForm((f) => ({ ...f, weightKg: e.target.value }))}
            />
          </Field>

          <Field label="Dimensions" full>
            <Input
              value={form.dimensions}
              onChange={(e) => setForm((f) => ({ ...f, dimensions: e.target.value }))}
              placeholder="1200x800x40 mm"
            />
          </Field>

          <Field label="Description" full>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full rounded-xl border border-[rgb(var(--border))] bg-white p-3 text-sm transition focus:border-[rgb(var(--primary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]/20"
            />
          </Field>

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
              disabled={submitting || !form.catalogId}
                className={cn(
                  "h-10 rounded-xl bg-[rgb(var(--primary))] px-4 text-sm font-semibold text-white transition hover:bg-[rgb(var(--primary))]/90",
                  (submitting || !form.catalogId) && "opacity-60"
                )}
            >
              {submitting ? "Création…" : "Créer le produit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  full,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <label className={cn("block", full && "sm:col-span-2")}>
      <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-[rgb(var(--muted))]">
        {label}
      </span>
      {children}
    </label>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="h-10 w-full rounded-xl border border-[rgb(var(--border))] bg-white px-3 text-sm transition focus:border-[rgb(var(--primary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]/20"
    />
  );
}

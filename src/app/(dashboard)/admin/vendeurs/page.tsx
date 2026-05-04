"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AdminShell, AdminPageHeader } from "@/components/admin/AdminShell";
import { cn } from "@/lib/cn";

interface Vendor {
  id: string;
  name: string;
  email: string;
  status: string;
  onboardingStep: number;
  companyName: string | null;
  siret: string | null;
  vatNumber: string | null;
  vatValid?: boolean;
  createdAt: string;
}

type StatutFilter = "ALL" | "EN_ATTENTE" | "VALIDE" | "REJETE";

const STATUS_TO_FILTER: Record<string, StatutFilter> = {
  pending: "EN_ATTENTE",
  submitted: "EN_ATTENTE",
  active: "VALIDE",
  rejected: "REJETE",
};

const STATUS_BADGE: Record<string, { label: string; cls: string; dot: string }> = {
  pending: { label: "En attente", cls: "bg-amber-100 text-amber-700", dot: "bg-amber-400" },
  submitted: { label: "En attente", cls: "bg-amber-100 text-amber-700", dot: "bg-amber-400" },
  active: { label: "Valide", cls: "bg-[rgb(var(--success))]/10 text-[rgb(var(--success))]", dot: "bg-[rgb(var(--success))]" },
  rejected: { label: "Rejete", cls: "bg-rose-100 text-rose-700", dot: "bg-rose-400" },
};

export default function AdminVendeursPage() {
  return (
    <Suspense fallback={null}>
      <Inner />
    </Suspense>
  );
}

function Inner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const statutParam = (searchParams.get("statut") as StatutFilter) || "ALL";

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [search, setSearch] = useState("");
  const [statut, setStatut] = useState<StatutFilter>(statutParam);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setStatut(statutParam);
  }, [statutParam]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/vendors");
        if (res.status === 401) {
          router.replace("/admin/login");
          return;
        }
        const data = await res.json();
        if (res.ok && data.success) {
          setVendors(data.vendors ?? []);
        } else {
          setError(data?.error || "Impossible de charger les vendeurs.");
        }
      } catch {
        setError("Erreur reseau.");
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const stats = useMemo(() => {
    return {
      total: vendors.length,
      enAttente: vendors.filter((v) => STATUS_TO_FILTER[v.status] === "EN_ATTENTE").length,
      valides: vendors.filter((v) => STATUS_TO_FILTER[v.status] === "VALIDE").length,
      rejetes: vendors.filter((v) => STATUS_TO_FILTER[v.status] === "REJETE").length,
    };
  }, [vendors]);

  const filtered = vendors.filter((v) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      v.name.toLowerCase().includes(q) ||
      v.email.toLowerCase().includes(q) ||
      (v.companyName ?? "").toLowerCase().includes(q);
    const matchStatut = statut === "ALL" || STATUS_TO_FILTER[v.status] === statut;
    return matchSearch && matchStatut;
  });

  async function updateStatus(id: string, dbStatus: string) {
    const previous = vendors;
    setVendors((vs) => vs.map((v) => (v.id === id ? { ...v, status: dbStatus } : v)));
    try {
      const res = await fetch("/api/admin/vendors", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: dbStatus }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setVendors(previous);
      setError("Mise a jour impossible.");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer ce vendeur ?")) return;
    const previous = vendors;
    setVendors((vs) => vs.filter((v) => v.id !== id));
    try {
      const res = await fetch(`/api/admin/vendors?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
    } catch {
      setVendors(previous);
      setError("Suppression impossible.");
    }
  }

  return (
    <AdminShell pendingVendorsCount={stats.enAttente}>
      <AdminPageHeader
        breadcrumb={["Dashboard", "Vendeurs"]}
        title="Gestion des vendeurs"
        subtitle={`${stats.total} vendeur${stats.total > 1 ? "s" : ""} inscrit${stats.total > 1 ? "s" : ""}`}
      />

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Stat tiles */}
      <div className="animate-slide-up grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Tile label="Total vendeurs" value={stats.total} tone="primary" />
        <Tile label="En attente" value={stats.enAttente} tone="amber" />
        <Tile label="Valides" value={stats.valides} tone="emerald" />
        <Tile label="Rejetes" value={stats.rejetes} tone="rose" />
      </div>

      {/* Filters + Table */}
      <div className="animate-slide-up-1 mt-6 rounded-2xl border border-[rgb(var(--border))] bg-white">
        <div className="border-b border-[rgb(var(--border))] px-5 py-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-[rgb(var(--primary))]/10 text-[rgb(var(--primary))]">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4 w-4">
                  <path d="M3 8l1.5-3h15L21 8" />
                  <path d="M4 8v11h16V8" />
                </svg>
              </div>
              <h2 className="text-sm font-semibold">Liste des vendeurs</h2>
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
                placeholder="Rechercher par nom, email, entreprise…"
                className="h-10 w-full rounded-xl border border-[rgb(var(--border))] bg-white pl-9 pr-3 text-sm transition focus:border-[rgb(var(--primary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]/20"
              />
            </div>
            <select
              value={statut}
              onChange={(e) => setStatut(e.target.value as StatutFilter)}
              className="h-10 cursor-pointer rounded-xl border border-[rgb(var(--border))] bg-white px-3 text-sm transition focus:border-[rgb(var(--primary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]/20"
            >
              <option value="ALL">Tous les statuts</option>
              <option value="EN_ATTENTE">En attente</option>
              <option value="VALIDE">Valides</option>
              <option value="REJETE">Rejetes</option>
            </select>
            <button
              onClick={() => { setSearch(""); setStatut("ALL"); }}
              className="h-10 rounded-xl bg-[rgb(var(--primary))] px-4 text-sm font-semibold text-white transition hover:bg-[rgb(var(--primary))]/90"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-12 text-center">
              <p className="text-sm text-[rgb(var(--muted))]">Chargement…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-black/[0.03] text-[rgb(var(--muted))]">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5">
                  <path d="M3 8l1.5-3h15L21 8" />
                  <path d="M4 8v11h16V8" />
                </svg>
              </div>
              <p className="mt-3 text-sm font-medium">Aucun vendeur trouve</p>
              <p className="mt-1 text-xs text-[rgb(var(--muted))]">Essayez de modifier vos filtres.</p>
            </div>
          ) : (
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-[rgb(var(--border))] text-left text-[11px] font-semibold uppercase tracking-wider text-[rgb(var(--muted))]">
                  <th className="px-5 py-3">#</th>
                  <th className="px-5 py-3">Vendeur</th>
                  <th className="px-5 py-3">Entreprise</th>
                  <th className="px-5 py-3">Etape</th>
                  <th className="px-5 py-3">Statut</th>
                  <th className="px-5 py-3">Profil</th>
                  <th className="px-5 py-3">Inscrit le</th>
                  <th className="px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((v, i) => {
                  const badge = STATUS_BADGE[v.status] ?? STATUS_BADGE.pending;
                  return (
                    <tr
                      key={v.id}
                      className="border-b border-[rgb(var(--border))]/50 last:border-0 transition hover:bg-black/[0.01]"
                    >
                      <td className="px-5 py-3 text-xs text-[rgb(var(--muted))]">#{i + 1}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[rgb(var(--primary))]/10 text-xs font-bold text-[rgb(var(--primary))]">
                            {v.name.charAt(0).toUpperCase()}
                          </span>
                          <div>
                            <div className="font-semibold">{v.name}</div>
                            <div className="text-xs text-[rgb(var(--muted))]">{v.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        {v.companyName ? (
                          <div>
                            <div className="text-sm font-medium">{v.companyName}</div>
                            {v.siret && <div className="font-mono text-[11px] text-[rgb(var(--muted))]">{v.siret}</div>}
                          </div>
                        ) : (
                          <span className="text-[rgb(var(--muted))]">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-black/[0.06]">
                            <div
                              className="h-full rounded-full bg-[rgb(var(--primary))]"
                              style={{ width: `${(v.onboardingStep / 6) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-[rgb(var(--muted))]">{v.onboardingStep}/6</span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold", badge.cls)}>
                          <span className={cn("h-1.5 w-1.5 rounded-full", badge.dot)} />
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        {v.vatValid || v.companyName ? (
                          <span className="grid h-6 w-6 place-items-center rounded-full bg-[rgb(var(--success))]/10 text-[rgb(var(--success))]">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" className="h-3.5 w-3.5">
                              <path d="M5 12l5 5 9-10" />
                            </svg>
                          </span>
                        ) : (
                          <span className="grid h-6 w-6 place-items-center rounded-full bg-rose-100 text-rose-500">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" className="h-3.5 w-3.5">
                              <path d="M6 6l12 12M18 6L6 18" />
                            </svg>
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-[rgb(var(--muted))]">
                        {new Date(v.createdAt).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1.5">
                          <IconBtn tone="info" title="Voir">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5">
                              <circle cx="12" cy="12" r="3" />
                              <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
                            </svg>
                          </IconBtn>
                          <IconBtn tone="warning" title="Valider" onClick={() => updateStatus(v.id, "active")}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
                              <path d="M5 12l5 5 9-10" />
                            </svg>
                          </IconBtn>
                          <IconBtn tone="danger" title="Supprimer" onClick={() => handleDelete(v.id)}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5">
                              <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />
                            </svg>
                          </IconBtn>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
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

function IconBtn({ children, tone, title, onClick }: { children: React.ReactNode; tone: "info" | "warning" | "danger"; title: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        "grid h-7 w-7 place-items-center rounded-md border transition",
        tone === "info" && "border-[rgb(var(--primary))]/30 bg-[rgb(var(--primary))]/[0.06] text-[rgb(var(--primary))] hover:bg-[rgb(var(--primary))]/[0.12]",
        tone === "warning" && "border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100",
        tone === "danger" && "border-rose-300 bg-rose-50 text-rose-600 hover:bg-rose-100"
      )}
    >
      {children}
    </button>
  );
}

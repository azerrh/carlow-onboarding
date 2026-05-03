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

// Mapping statut DB ↔ vocabulaire métier (français)
const STATUS_TO_FILTER: Record<string, StatutFilter> = {
  pending: "EN_ATTENTE",
  submitted: "EN_ATTENTE",
  active: "VALIDE",
  rejected: "REJETE",
};

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  pending: { label: "En attente", cls: "bg-amber-100 text-amber-700" },
  submitted: { label: "En attente", cls: "bg-amber-100 text-amber-700" },
  active: { label: "Validé", cls: "bg-emerald-100 text-emerald-700" },
  rejected: { label: "Rejeté", cls: "bg-rose-100 text-rose-700" },
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
        setError("Erreur réseau.");
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const stats = useMemo(() => {
    return {
      total: vendors.length,
      enAttente: vendors.filter(
        (v) => STATUS_TO_FILTER[v.status] === "EN_ATTENTE"
      ).length,
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
      setError("Mise à jour impossible.");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer ce vendeur ? Action irréversible.")) return;
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
        title="Gestion des Vendeurs"
        subtitle={`${stats.total} vendeur${stats.total > 1 ? "s" : ""} inscrit${stats.total > 1 ? "s" : ""}`}
      />

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Stat tiles */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Tile label="Total vendeurs" value={stats.total} tone="indigo" />
        <Tile label="En attente" value={stats.enAttente} tone="amber" />
        <Tile label="Validés" value={stats.valides} tone="emerald" />
        <Tile label="Rejetés" value={stats.rejetes} tone="rose" />
      </div>

      {/* Filters card */}
      <div className="mt-6 rounded-2xl border border-[rgb(var(--border))] bg-white p-4">
        <div className="flex flex-wrap items-center gap-3">
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
              placeholder="Rechercher par nom ou email…"
              className="h-10 w-full rounded-xl border border-[rgb(var(--border))] bg-[#f8f9fc] pl-9 pr-3 text-sm focus:border-[#6366f1] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#6366f1]/15"
            />
          </div>
          <select
            value={statut}
            onChange={(e) => setStatut(e.target.value as StatutFilter)}
            className="h-10 cursor-pointer rounded-xl border border-[rgb(var(--border))] bg-[#f8f9fc] px-3 text-sm focus:border-[#6366f1] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#6366f1]/15"
          >
            <option value="ALL">Tous les statuts</option>
            <option value="EN_ATTENTE">En attente</option>
            <option value="VALIDE">Validés</option>
            <option value="REJETE">Rejetés</option>
          </select>
          <button
            onClick={() => {
              setSearch("");
              setStatut("ALL");
            }}
            className="h-10 rounded-xl bg-[#6366f1] px-4 text-sm font-semibold text-white hover:bg-[#5558e6]"
          >
            Filtrer
          </button>
        </div>

        {/* Table */}
        <div className="mt-4 overflow-x-auto">
          {loading ? (
            <p className="py-8 text-center text-sm text-[rgb(var(--muted))]">Chargement…</p>
          ) : filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-[rgb(var(--muted))]">
              Aucun vendeur trouvé.
            </p>
          ) : (
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-[rgb(var(--border))] text-left text-[11px] font-semibold uppercase tracking-wider text-[rgb(var(--muted))]">
                  <th className="py-3 pr-3">#</th>
                  <th className="py-3 pr-3">Vendeur</th>
                  <th className="py-3 pr-3">Email</th>
                  <th className="py-3 pr-3">Documents</th>
                  <th className="py-3 pr-3">Statut dossier</th>
                  <th className="py-3 pr-3">Profil</th>
                  <th className="py-3 pr-3">Inscrit le</th>
                  <th className="py-3 pr-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((v, i) => {
                  const badge = STATUS_BADGE[v.status] ?? STATUS_BADGE.pending;
                  return (
                    <tr
                      key={v.id}
                      className="border-b border-[rgb(var(--border))]/60 last:border-0 hover:bg-black/[0.015]"
                    >
                      <td className="py-3 pr-3 text-xs text-[rgb(var(--muted))]">#{i + 1}</td>
                      <td className="py-3 pr-3">
                        <div className="flex items-center gap-2.5">
                          <span className="grid h-8 w-8 place-items-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                            {v.name.charAt(0).toUpperCase()}
                          </span>
                          <span className="font-semibold uppercase">{v.name}</span>
                        </div>
                      </td>
                      <td className="py-3 pr-3 text-[rgb(var(--fg))]">{v.email}</td>
                      <td className="py-3 pr-3">
                        {v.onboardingStep > 1 ? (
                          <span className="inline-flex items-center justify-center rounded-md bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700">
                            {v.onboardingStep}
                          </span>
                        ) : (
                          <span className="text-[rgb(var(--muted))]">—</span>
                        )}
                      </td>
                      <td className="py-3 pr-3">
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold",
                            badge.cls
                          )}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-3 pr-3">
                        {v.vatValid || v.companyName ? (
                          <span className="grid h-6 w-6 place-items-center rounded-full bg-emerald-100 text-emerald-600">
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
                      <td className="py-3 pr-3 text-[rgb(var(--muted))]">
                        {new Date(v.createdAt).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="py-3 pr-3">
                        <div className="flex items-center gap-1.5">
                          <IconBtn tone="info" title="Voir">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5">
                              <circle cx="12" cy="12" r="3" />
                              <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
                            </svg>
                          </IconBtn>
                          <IconBtn
                            tone="warning"
                            title="Valider"
                            onClick={() => updateStatus(v.id, "active")}
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
                              <path d="M5 12l5 5 9-10" />
                            </svg>
                          </IconBtn>
                          <IconBtn
                            tone="danger"
                            title="Supprimer"
                            onClick={() => handleDelete(v.id)}
                          >
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

function Tile({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "indigo" | "amber" | "emerald" | "rose";
}) {
  const map = {
    indigo: { bg: "bg-indigo-50", icon: "bg-indigo-200/70 text-indigo-700" },
    amber: { bg: "bg-amber-50", icon: "bg-amber-200/70 text-amber-700" },
    emerald: { bg: "bg-emerald-50", icon: "bg-emerald-200/70 text-emerald-700" },
    rose: { bg: "bg-rose-50", icon: "bg-rose-200/70 text-rose-600" },
  } as const;
  const t = map[tone];
  return (
    <div className={cn("flex items-center gap-4 rounded-2xl p-5", t.bg)}>
      <span className={cn("grid h-12 w-12 place-items-center rounded-full", t.icon)}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-6 w-6">
          <path d="M3 8l1.5-3h15L21 8" />
          <path d="M4 8v11h16V8" />
        </svg>
      </span>
      <div>
        <div className="text-xs font-medium text-[rgb(var(--muted))]">{label}</div>
        <div className="text-2xl font-semibold tracking-tight">{value}</div>
      </div>
    </div>
  );
}

function IconBtn({
  children,
  tone,
  title,
  onClick,
}: {
  children: React.ReactNode;
  tone: "info" | "warning" | "danger";
  title: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        "grid h-7 w-7 place-items-center rounded-md border transition",
        tone === "info" && "border-cyan-300 bg-cyan-50 text-cyan-600 hover:bg-cyan-100",
        tone === "warning" && "border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100",
        tone === "danger" && "border-rose-300 bg-rose-50 text-rose-600 hover:bg-rose-100"
      )}
    >
      {children}
    </button>
  );
}

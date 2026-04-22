"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Brand } from "@/components/ui/Brand";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
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
  createdAt: string;
}

type StatusKey = "pending" | "submitted" | "active" | "rejected";

const STATUS_META: Record<StatusKey, { label: string; cls: string }> = {
  pending: {
    label: "En cours",
    cls: "bg-black/[0.04] text-[rgb(var(--muted))]",
  },
  submitted: {
    label: "Soumis",
    cls: "bg-[rgb(var(--primary))]/10 text-[rgb(var(--primary))]",
  },
  active: {
    label: "Actif",
    cls: "bg-[rgb(var(--success))]/10 text-[rgb(var(--success))]",
  },
  rejected: {
    label: "Rejeté",
    cls: "bg-red-50 text-red-600",
  },
};

export default function AdminPage() {
  const router = useRouter();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | StatusKey>("all");
  const [error, setError] = useState("");

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

  const filtered = vendors.filter((v) => {
    const q = search.toLowerCase();
    const matchSearch =
      v.name.toLowerCase().includes(q) ||
      v.email.toLowerCase().includes(q) ||
      (v.companyName ?? "").toLowerCase().includes(q);
    const matchFilter = filter === "all" || v.status === filter;
    return matchSearch && matchFilter;
  });

  const stats = {
    total: vendors.length,
    pending: vendors.filter((v) => v.status === "pending").length,
    submitted: vendors.filter((v) => v.status === "submitted").length,
    active: vendors.filter((v) => v.status === "active").length,
  };

  async function updateStatus(id: string, status: StatusKey) {
    const previous = vendors;
    setVendors((vs) => vs.map((v) => (v.id === id ? { ...v, status } : v)));
    try {
      const res = await fetch("/api/admin/vendors", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setVendors(previous);
      setError("Mise à jour impossible.");
    }
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
  }

  if (loading) {
    return (
      <div className="portal-page grid min-h-screen place-items-center">
        <p className="text-sm text-[rgb(var(--muted))]">Chargement…</p>
      </div>
    );
  }

  return (
    <div className="portal-page min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-[rgb(var(--border))]/60 bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Brand variant="compact" />
            <span className="rounded-full bg-[rgb(var(--primary))]/10 px-2 py-0.5 text-[11px] font-semibold text-[rgb(var(--primary))]">
              Admin
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")}>
              Portail vendeur
            </Button>
            <Button variant="secondary" size="sm" onClick={handleLogout}>
              Déconnexion
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold tracking-tight">Gestion des vendeurs</h1>
        <p className="mt-1 text-sm text-[rgb(var(--muted))]">
          Carlow Marketplace — interface d&apos;administration
        </p>

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Stats */}
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total vendeurs" value={stats.total} tone="default" />
          <StatCard label="En cours" value={stats.pending} tone="muted" />
          <StatCard label="Dossiers soumis" value={stats.submitted} tone="primary" />
          <StatCard label="Comptes actifs" value={stats.active} tone="success" />
        </div>

        {/* Liste vendeurs */}
        <Card className="mt-8 overflow-hidden">
          <div className="flex flex-wrap items-center gap-3 border-b border-[rgb(var(--border))] px-5 py-4">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher vendeur, email, société…"
              className="h-10 flex-1 min-w-[220px] rounded-xl border border-[rgb(var(--border))] bg-white px-3 text-sm focus:border-[rgb(var(--primary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]/20"
            />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as typeof filter)}
              className="h-10 cursor-pointer rounded-xl border border-[rgb(var(--border))] bg-white px-3 text-sm focus:border-[rgb(var(--primary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]/20"
            >
              <option value="all">Tous les statuts</option>
              <option value="pending">En cours</option>
              <option value="submitted">Soumis</option>
              <option value="active">Actif</option>
              <option value="rejected">Rejeté</option>
            </select>
            <span className="text-xs text-[rgb(var(--muted))]">
              {filtered.length} vendeur{filtered.length > 1 ? "s" : ""}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-black/[0.02]">
                  {["Vendeur", "Société", "SIRET", "Étape", "Statut", "Actions"].map((h) => (
                    <th
                      key={h}
                      className="border-b border-[rgb(var(--border))] px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-[rgb(var(--muted))]"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-10 text-center text-sm text-[rgb(var(--muted))]"
                    >
                      Aucun vendeur trouvé
                    </td>
                  </tr>
                ) : (
                  filtered.map((vendor) => (
                    <tr
                      key={vendor.id}
                      className="border-b border-[rgb(var(--border))]/60 last:border-0 hover:bg-black/[0.015]"
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-[rgb(var(--fg))]">{vendor.name}</div>
                        <div className="text-xs text-[rgb(var(--muted))]">{vendor.email}</div>
                      </td>
                      <td className="px-4 py-3 text-[rgb(var(--fg))]">
                        {vendor.companyName || "—"}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-[rgb(var(--muted))]">
                        {vendor.siret || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-black/[0.06]">
                            <div
                              className="h-full rounded-full bg-[rgb(var(--primary))] transition-all"
                              style={{
                                width: `${Math.round((vendor.onboardingStep / 6) * 100)}%`,
                              }}
                            />
                          </div>
                          <span className="text-xs text-[rgb(var(--muted))]">
                            {vendor.onboardingStep}/6
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={vendor.status} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1.5">
                          {vendor.status === "submitted" && (
                            <ActionBtn
                              onClick={() => updateStatus(vendor.id, "active")}
                              tone="success"
                            >
                              Activer
                            </ActionBtn>
                          )}
                          {vendor.status === "submitted" && (
                            <ActionBtn
                              onClick={() => updateStatus(vendor.id, "rejected")}
                              tone="danger"
                            >
                              Rejeter
                            </ActionBtn>
                          )}
                          {vendor.status === "active" && (
                            <ActionBtn
                              onClick={() => updateStatus(vendor.id, "pending")}
                              tone="muted"
                            >
                              Suspendre
                            </ActionBtn>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </main>
    </div>
  );
}

/* ---- Composants internes ---- */

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "default" | "muted" | "primary" | "success";
}) {
  return (
    <Card className="p-5">
      <div className="text-xs uppercase tracking-wider text-[rgb(var(--muted))]">{label}</div>
      <div
        className={cn(
          "mt-2 text-2xl font-semibold tracking-tight",
          tone === "default" && "text-[rgb(var(--fg))]",
          tone === "muted" && "text-[rgb(var(--muted))]",
          tone === "primary" && "text-[rgb(var(--primary))]",
          tone === "success" && "text-[rgb(var(--success))]"
        )}
      >
        {value}
      </div>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[status as StatusKey] ?? STATUS_META.pending;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold",
        meta.cls
      )}
    >
      {meta.label}
    </span>
  );
}

function ActionBtn({
  children,
  onClick,
  tone,
}: {
  children: React.ReactNode;
  onClick: () => void;
  tone: "success" | "danger" | "muted";
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition",
        tone === "success" &&
          "border-[rgb(var(--success))]/40 bg-[rgb(var(--success))]/[0.08] text-[rgb(var(--success))] hover:bg-[rgb(var(--success))]/[0.12]",
        tone === "danger" &&
          "border-red-300 bg-red-50 text-red-700 hover:bg-red-100",
        tone === "muted" &&
          "border-[rgb(var(--border))] bg-white text-[rgb(var(--muted))] hover:bg-black/[0.02]"
      )}
    >
      {children}
    </button>
  );
}

"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AdminShell, AdminPageHeader } from "@/components/admin/AdminShell";
import { cn } from "@/lib/cn";

interface OrderRow {
  id: string;
  status: string;
  totalCents: number;
  orderedAt: string;
  buyer: { id: string; name: string; email: string };
  _count: { lines: number };
}

const STATUS_META: Record<string, { label: string; cls: string; dot: string }> = {
  EN_COURS: { label: "En cours", cls: "bg-amber-100 text-amber-700", dot: "bg-amber-400" },
  LIVREE: { label: "Livree", cls: "bg-[rgb(var(--success))]/10 text-[rgb(var(--success))]", dot: "bg-[rgb(var(--success))]" },
  ANNULEE: { label: "Annulee", cls: "bg-rose-100 text-rose-700", dot: "bg-rose-400" },
};

export default function Page() {
  return (
    <Suspense fallback={null}>
      <Inner />
    </Suspense>
  );
}

function Inner() {
  const router = useRouter();
  const sp = useSearchParams();
  const initialFilter = sp.get("statut") ?? "ALL";

  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [stats, setStats] = useState({ total: 0, enCours: 0, livrees: 0, annulees: 0 });
  const [filter, setFilter] = useState<string>(initialFilter);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/orders");
        if (res.status === 401) {
          router.replace("/admin/login");
          return;
        }
        const data = await res.json();
        if (res.ok && data.success) {
          setOrders(data.orders);
          setStats(data.stats);
        } else {
          setError(data?.error || "Erreur de chargement.");
        }
      } catch {
        setError("Erreur réseau.");
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  async function setStatus(id: string, status: string) {
    setOrders((os) => os.map((o) => (o.id === id ? { ...o, status } : o)));
    await fetch("/api/admin/orders", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
  }

  const filtered = filter === "ALL" ? orders : orders.filter((o) => o.status === filter);

  return (
    <AdminShell pendingOrdersCount={stats.enCours}>
      <AdminPageHeader
        breadcrumb={["Dashboard", "Commandes"]}
        title="Toutes les commandes"
        subtitle={`${stats.total} commande${stats.total > 1 ? "s" : ""} au total`}
      />

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="animate-slide-up grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Tile label="Total" value={stats.total} tone="primary" />
        <Tile label="En cours" value={stats.enCours} tone="amber" />
        <Tile label="Livrees" value={stats.livrees} tone="emerald" />
        <Tile label="Annulees" value={stats.annulees} tone="rose" />
      </div>

      <div className="animate-slide-up-1 mt-6 rounded-2xl border border-[rgb(var(--border))] bg-white">
        {/* Header */}
        <div className="border-b border-[rgb(var(--border))] px-5 py-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-[rgb(var(--primary))]/10 text-[rgb(var(--primary))]">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4 w-4">
                  <circle cx="9" cy="20" r="1.5" />
                  <circle cx="17" cy="20" r="1.5" />
                  <path d="M3 4h2l2.5 11h11l2-8H6" />
                </svg>
              </div>
              <h2 className="text-sm font-semibold">Liste des commandes</h2>
            </div>
            <span className="text-xs text-[rgb(var(--muted))]">{filtered.length} resultat{filtered.length > 1 ? "s" : ""}</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {(["ALL", "EN_COURS", "LIVREE", "ANNULEE"] as const).map((f) => {
              const isActive = filter === f;
              return (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition",
                    isActive
                      ? "bg-[rgb(var(--primary))] text-white"
                      : "bg-black/[0.04] text-[rgb(var(--muted))] hover:bg-black/[0.08]"
                  )}
                >
                  {f !== "ALL" && <span className={cn("h-1.5 w-1.5 rounded-full", isActive ? "bg-white" : STATUS_META[f].dot)} />}
                  {f === "ALL" ? "Toutes" : STATUS_META[f].label}
                </button>
              );
            })}
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center">
            <p className="text-sm text-[rgb(var(--muted))]">Chargement…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-black/[0.03] text-[rgb(var(--muted))]">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5">
                <circle cx="9" cy="20" r="1.5" />
                <circle cx="17" cy="20" r="1.5" />
                <path d="M3 4h2l2.5 11h11l2-8H6" />
              </svg>
            </div>
            <p className="mt-3 text-sm font-medium">Aucune commande</p>
            <p className="mt-1 text-xs text-[rgb(var(--muted))]">Les commandes apparaitront ici une fois passees.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-[rgb(var(--border))] text-left text-[11px] font-semibold uppercase tracking-wider text-[rgb(var(--muted))]">
                  <th className="px-5 py-3">#</th>
                  <th className="px-5 py-3">Client</th>
                  <th className="px-5 py-3">Lignes</th>
                  <th className="px-5 py-3">Total</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Statut</th>
                  <th className="px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((o) => {
                  const meta = STATUS_META[o.status];
                  return (
                    <tr
                      key={o.id}
                      className="border-b border-[rgb(var(--border))]/50 last:border-0 transition hover:bg-black/[0.01]"
                    >
                      <td className="px-5 py-3 font-mono text-xs font-semibold">#{o.id.slice(0, 8)}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[rgb(var(--primary))]/10 text-xs font-bold text-[rgb(var(--primary))]">
                            {o.buyer.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold">{o.buyer.name}</div>
                            <div className="text-xs text-[rgb(var(--muted))]">{o.buyer.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-[rgb(var(--muted))]">{o._count.lines}</td>
                      <td className="px-5 py-3 font-semibold">
                        {(o.totalCents / 100).toLocaleString("fr-FR", {
                          style: "currency",
                          currency: "EUR",
                        })}
                      </td>
                      <td className="px-5 py-3 text-[rgb(var(--muted))]">
                        {new Date(o.orderedAt).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold",
                            meta?.cls ?? "bg-black/[0.06] text-[rgb(var(--muted))]"
                          )}
                        >
                          <span className={cn("h-1.5 w-1.5 rounded-full", meta?.dot ?? "bg-gray-400")} />
                          {meta?.label ?? o.status}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <select
                          value={o.status}
                          onChange={(e) => setStatus(o.id, e.target.value)}
                          className="h-8 cursor-pointer rounded-lg border border-[rgb(var(--border))] bg-white px-2.5 text-xs font-medium transition hover:border-[rgb(var(--primary))]/30 focus:border-[rgb(var(--primary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]/20"
                        >
                          <option value="EN_COURS">En cours</option>
                          <option value="LIVREE">Livree</option>
                          <option value="ANNULEE">Annulee</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminShell>
  );
}

function Tile({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "primary" | "amber" | "emerald" | "rose";
}) {
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

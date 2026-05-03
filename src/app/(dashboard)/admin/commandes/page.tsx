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

const STATUS_META: Record<string, { label: string; cls: string }> = {
  EN_COURS: { label: "En cours", cls: "bg-amber-100 text-amber-700" },
  LIVREE: { label: "Livrée", cls: "bg-emerald-100 text-emerald-700" },
  ANNULEE: { label: "Annulée", cls: "bg-rose-100 text-rose-700" },
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Tile label="Total" value={stats.total} tone="indigo" />
        <Tile label="En cours" value={stats.enCours} tone="amber" />
        <Tile label="Livrées" value={stats.livrees} tone="emerald" />
        <Tile label="Annulées" value={stats.annulees} tone="rose" />
      </div>

      <div className="mt-6 rounded-2xl border border-[rgb(var(--border))] bg-white p-4">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {(["ALL", "EN_COURS", "LIVREE", "ANNULEE"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-semibold transition",
                filter === f
                  ? "bg-[#6366f1] text-white"
                  : "bg-black/[0.04] text-[rgb(var(--muted))] hover:bg-black/[0.08]"
              )}
            >
              {f === "ALL" ? "Toutes" : STATUS_META[f].label}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="py-8 text-center text-sm text-[rgb(var(--muted))]">Chargement…</p>
        ) : filtered.length === 0 ? (
          <p className="py-12 text-center text-sm text-[rgb(var(--muted))]">
            Aucune commande.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-[rgb(var(--border))] text-left text-[11px] font-semibold uppercase tracking-wider text-[rgb(var(--muted))]">
                  <th className="py-3 pr-3">#</th>
                  <th className="py-3 pr-3">Client</th>
                  <th className="py-3 pr-3">Lignes</th>
                  <th className="py-3 pr-3">Total</th>
                  <th className="py-3 pr-3">Date</th>
                  <th className="py-3 pr-3">Statut</th>
                  <th className="py-3 pr-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((o) => {
                  const meta = STATUS_META[o.status];
                  return (
                    <tr
                      key={o.id}
                      className="border-b border-[rgb(var(--border))]/60 last:border-0 hover:bg-black/[0.015]"
                    >
                      <td className="py-3 pr-3 font-mono text-xs">#{o.id.slice(0, 8)}</td>
                      <td className="py-3 pr-3">
                        <div className="font-semibold">{o.buyer.name}</div>
                        <div className="text-xs text-[rgb(var(--muted))]">{o.buyer.email}</div>
                      </td>
                      <td className="py-3 pr-3 text-[rgb(var(--muted))]">{o._count.lines}</td>
                      <td className="py-3 pr-3 font-semibold">
                        {(o.totalCents / 100).toLocaleString("fr-FR", {
                          style: "currency",
                          currency: "EUR",
                        })}
                      </td>
                      <td className="py-3 pr-3 text-[rgb(var(--muted))]">
                        {new Date(o.orderedAt).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="py-3 pr-3">
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold",
                            meta?.cls ?? "bg-black/[0.06] text-[rgb(var(--muted))]"
                          )}
                        >
                          {meta?.label ?? o.status}
                        </span>
                      </td>
                      <td className="py-3 pr-3">
                        <select
                          value={o.status}
                          onChange={(e) => setStatus(o.id, e.target.value)}
                          className="h-8 cursor-pointer rounded-md border border-[rgb(var(--border))] bg-white px-2 text-xs"
                        >
                          <option value="EN_COURS">En cours</option>
                          <option value="LIVREE">Livrée</option>
                          <option value="ANNULEE">Annulée</option>
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
  tone: "indigo" | "amber" | "emerald" | "rose";
}) {
  const map = {
    indigo: { bg: "bg-indigo-50", text: "text-indigo-700" },
    amber: { bg: "bg-amber-50", text: "text-amber-700" },
    emerald: { bg: "bg-emerald-50", text: "text-emerald-700" },
    rose: { bg: "bg-rose-50", text: "text-rose-600" },
  } as const;
  const t = map[tone];
  return (
    <div className={cn("rounded-2xl p-5", t.bg)}>
      <div className="text-xs font-medium text-[rgb(var(--muted))]">{label}</div>
      <div className={cn("mt-2 text-2xl font-semibold tracking-tight", t.text)}>{value}</div>
    </div>
  );
}

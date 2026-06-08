"use client";

import { useCallback, useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { BuyerNav } from "@/components/buyer/BuyerNav";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";

interface OrderLine {
  id: string;
  quantity: number;
  unitPriceCents: number;
  product: {
    id: string;
    name: string;
    category: string | null;
    catalog: {
      name: string | null;
      vendor: { name: string; companyName: string | null };
    };
  };
}

interface Order {
  id: string;
  status: string;
  totalCents: number;
  orderedAt: string;
  updatedAt: string;
  lines: OrderLine[];
}

const ORDER_STATUS_STYLES: Record<string, { bg: string; text: string; label: string; icon: string }> = {
  EN_COURS: {
    bg: "bg-amber-50 border-amber-200",
    text: "text-amber-700",
    label: "En cours",
    icon: "📦",
  },
  LIVREE: {
    bg: "bg-[rgb(var(--success))]/10 border-[rgb(var(--success))]/30",
    text: "text-[rgb(var(--success))]",
    label: "Livree",
    icon: "✅",
  },
  ANNULEE: {
    bg: "bg-red-50 border-red-200",
    text: "text-red-700",
    label: "Annulee",
    icon: "❌",
  },
};

function formatCents(cents: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function OrdersInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const statusFilter = searchParams.get("status") || "all";

  const [buyerId, setBuyerId] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [toast, setToast] = useState("");
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const id = localStorage.getItem("buyerId");
    if (!id) {
      router.replace("/buyer/login");
      return;
    }
    setBuyerId(id);
  }, [router]);

  const loadOrders = useCallback(async () => {
    if (!buyerId) return;
    try {
      const res = await fetch(`/api/buyer/orders?id=${buyerId}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setOrders(data.orders);
      }
    } catch {
      // silencieux
    } finally {
      setLoading(false);
    }
  }, [buyerId]);

  useEffect(() => {
    if (buyerId) loadOrders();
  }, [buyerId, loadOrders]);

  function handleExportCsv() {
    if (!buyerId) return;
    setExporting(true);
    const params = new URLSearchParams({ id: buyerId });
    if (statusFilter !== "all") params.set("status", statusFilter);
    const a = document.createElement("a");
    a.href = `/api/buyer/orders/export?${params.toString()}`;
    a.download = "";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => setExporting(false), 1500);
  }

  async function handleCancel(orderId: string) {
    if (!buyerId) return;
    if (!confirm("Annuler cette commande ? Cette action est irreversible.")) return;
    try {
      const res = await fetch("/api/buyer/orders/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, buyerId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setToast(data?.error || "Annulation impossible.");
      } else {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: "ANNULEE" } : o))
        );
        setToast("Commande annulee avec succes.");
      }
    } catch {
      setToast("Erreur reseau.");
    }
    setTimeout(() => setToast(""), 3000);
  }

  const filtered =
    statusFilter === "all"
      ? orders
      : orders.filter((o) => o.status === statusFilter);

  const stats = {
    total: orders.length,
    enCours: orders.filter((o) => o.status === "EN_COURS").length,
    livree: orders.filter((o) => o.status === "LIVREE").length,
    annulee: orders.filter((o) => o.status === "ANNULEE").length,
  };

  return (
    <div className="portal-page min-h-screen">
      <BuyerNav />

      <div className="mx-auto max-w-[1100px] px-4 py-8">
        {/* Title + Export */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Mes commandes
            </h1>
            <p className="mt-1 text-sm text-[rgb(var(--muted))]">
              Historique et suivi de toutes vos commandes
            </p>
          </div>
          <button
            onClick={handleExportCsv}
            disabled={exporting || orders.length === 0}
            title="Télécharger mes commandes en CSV (Excel)"
            className={cn(
              "inline-flex h-10 shrink-0 items-center gap-2 rounded-xl border border-[rgb(var(--border))]/80 bg-[rgb(var(--card))] px-4 text-sm font-semibold text-[rgb(var(--fg))] transition-all duration-150",
              "hover:border-[rgb(var(--success))]/40 hover:bg-[rgb(var(--success))]/8 hover:text-[rgb(var(--success))]",
              "disabled:cursor-not-allowed disabled:opacity-40",
              exporting && "cursor-wait"
            )}
          >
            {exporting ? (
              <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Export…
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Exporter CSV
              </>
            )}
          </button>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile label="Total" value={stats.total} icon="🛒" />
          <StatTile label="En cours" value={stats.enCours} icon="📦" />
          <StatTile label="Livrées" value={stats.livree} icon="✅" />
          <StatTile label="Annulées" value={stats.annulee} icon="❌" />
        </div>

        {/* Filters */}
        <div className="mt-6 flex flex-wrap gap-2">
          {[
            { key: "all", label: "Toutes" },
            { key: "EN_COURS", label: "En cours" },
            { key: "LIVREE", label: "Livrées" },
            { key: "ANNULEE", label: "Annulées" },
          ].map((f) => (
            <Link
              key={f.key}
              href={`/buyer/orders${f.key !== "all" ? `?status=${f.key}` : ""}`}
              className={cn(
                "rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all duration-150",
                statusFilter === f.key
                  ? "bg-[rgb(var(--success))] text-white shadow-sm"
                  : "bg-[rgb(var(--card))] border border-[rgb(var(--border))]/70 text-[rgb(var(--muted))] hover:border-[rgb(var(--success))]/30 hover:text-[rgb(var(--fg))]"
              )}
            >
              {f.label}
            </Link>
          ))}
        </div>

        {/* Orders list */}
        {loading ? (
          <p className="mt-8 text-center text-sm text-[rgb(var(--muted))]">
            Chargement...
          </p>
        ) : filtered.length === 0 ? (
          <div className="mt-8 rounded-xl border border-dashed border-[rgb(var(--border))] bg-white/50 px-4 py-12 text-center">
            <div className="text-3xl">📋</div>
            <p className="mt-3 text-sm font-medium">Aucune commande.</p>
            <Link href="/marketplace">
              <Button className="mt-4" size="sm">
                Parcourir la marketplace
              </Button>
            </Link>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {filtered.map((order) => {
              const style =
                ORDER_STATUS_STYLES[order.status] ?? ORDER_STATUS_STYLES.EN_COURS;
              const isExpanded = expandedOrder === order.id;
              const canCancel = order.status === "EN_COURS";

              return (
                <Card
                  key={order.id}
                  className={cn(
                    "overflow-hidden transition",
                    isExpanded && "border-[rgb(var(--success))]/30"
                  )}
                >
                  {/* Order header */}
                  <button
                    onClick={() =>
                      setExpandedOrder(isExpanded ? null : order.id)
                    }
                    className="w-full p-4 sm:p-5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{style.icon}</span>
                        <div className="text-left">
                          <p className="text-sm font-semibold">
                            Commande # {order.id.slice(0, 8).toUpperCase()}
                          </p>
                          <p className="text-xs text-[rgb(var(--muted))]">
                            {formatDate(order.orderedAt)} · {order.lines.length} article{order.lines.length > 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Link
                          href={`/buyer/orders/${order.id}`}
                          className="text-xs font-medium text-[rgb(var(--link))] hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Voir details →
                        </Link>
                        <span className={cn(
                          "rounded-full border px-2.5 py-1 text-[10px] font-semibold",
                          style.bg,
                          style.text
                        )}>
                          {style.label}
                        </span>
                        <span className="text-sm font-bold">
                          {formatCents(order.totalCents)}
                        </span>
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className={cn(
                            "h-4 w-4 transition-transform",
                            isExpanded && "rotate-180"
                          )}
                        >
                          <path d="M6 9l6 6 6-6" />
                        </svg>
                      </div>
                    </div>
                  </button>

                  {/* Order details */}
                  {isExpanded && (
                    <div className="border-t border-[rgb(var(--border))] bg-[#f8f9fc] p-4 sm:p-5">
                      {/* Lines */}
                      <div className="space-y-3">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-[rgb(var(--muted))]">
                          Articles
                        </h3>
                        {order.lines.map((line) => (
                          <div
                            key={line.id}
                            className="flex items-center justify-between rounded-lg bg-white px-3 py-2.5"
                          >
                            <div>
                              <p className="text-sm font-medium">
                                {line.product.name}
                              </p>
                              <p className="text-xs text-[rgb(var(--muted))]">
                                {line.product.catalog.vendor.companyName ?? line.product.catalog.vendor.name}
                                {line.product.category && (
                                  <span className="ml-2 rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700">
                                    {line.product.category}
                                  </span>
                                )}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold">
                                {formatCents(line.unitPriceCents * line.quantity)}
                              </p>
                              <p className="text-xs text-[rgb(var(--muted))]">
                                {line.quantity} × {formatCents(line.unitPriceCents)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Actions */}
                      <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
                        {/* Télécharger la facture */}
                        {buyerId && order.status !== "ANNULEE" && (
                          <a
                            href={`/api/buyer/orders/${order.id}/invoice?buyerId=${buyerId}`}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-[rgb(var(--border))]/80 bg-[rgb(var(--card))] px-4 py-2 text-sm font-semibold text-[rgb(var(--fg))] transition hover:border-[rgb(var(--primary))]/40 hover:bg-[rgb(var(--primary))]/8 hover:text-[rgb(var(--primary))]"
                            title="Télécharger la facture PDF"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                              <polyline points="7 10 12 15 17 10" />
                              <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                            Facture PDF
                          </a>
                        )}
                        {canCancel && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCancel(order.id);
                            }}
                            className="rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
                          >
                            Annuler la commande
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl border border-[rgb(var(--success))]/30 bg-white px-4 py-3 text-sm font-medium shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}

export default function BuyerOrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white grid place-items-center">
          <p className="text-sm text-[rgb(var(--muted))]">Chargement...</p>
        </div>
      }
    >
      <OrdersInner />
    </Suspense>
  );
}

function StatTile({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: string;
}) {
  return (
    <Card className="p-5 transition-all duration-200 hover:-translate-y-0.5">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[rgb(var(--success))]/15 to-[rgb(var(--success))]/8 text-lg">
          {icon}
        </span>
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-[rgb(var(--muted))]">
            {label}
          </div>
          <div className="text-xl font-bold tracking-tight">{value}</div>
        </div>
      </div>
    </Card>
  );
}

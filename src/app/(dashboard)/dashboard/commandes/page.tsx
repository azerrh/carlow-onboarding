"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { VendorShell, VendorPageHeader } from "@/components/vendor/VendorShell";
import { OrderChat } from "@/components/chat/OrderChat";
import { cn } from "@/lib/cn";

interface OrderLine {
  id: string;
  productId: string;
  productName: string;
  reference: string | null;
  imageUrl: string | null;
  quantity: number;
  unitPriceCents: number;
  subtotalCents: number;
}

interface VendorOrder {
  id: string;
  status: string;
  orderedAt: string;
  buyer: { name: string; email: string };
  vendorSubtotalCents: number;
  itemCount: number;
  lines: OrderLine[];
  trackingNumber?: string | null;
  carrier?: string | null;
  estimatedDelivery?: string | null;
}

interface VendorMe {
  name: string;
  email: string;
  companyName: string | null;
}

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: "all", label: "Toutes" },
  { value: "EN_COURS", label: "En cours" },
  { value: "LIVREE", label: "Livrées" },
  { value: "ANNULEE", label: "Annulées" },
];

const STATUS_STYLE: Record<string, { bg: string; text: string; label: string; icon: string }> = {
  EN_COURS:  { bg: "bg-amber-50 border-amber-200", text: "text-amber-700", label: "En cours", icon: "📦" },
  CONFIRMED: { bg: "bg-blue-50 border-blue-200", text: "text-blue-700", label: "Confirmée", icon: "✅" },
  SHIPPED:   { bg: "bg-purple-50 border-purple-200", text: "text-purple-700", label: "Expédiée", icon: "🚚" },
  LIVREE:    { bg: "bg-[rgb(var(--success))]/10 border-[rgb(var(--success))]/30", text: "text-[rgb(var(--success))]", label: "Livrée", icon: "🎉" },
  ANNULEE:   { bg: "bg-red-50 border-red-200", text: "text-red-700", label: "Annulée", icon: "❌" },
};

function formatCents(cents: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function VendorOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<VendorOrder[]>([]);
  const [vendor, setVendor] = useState<VendorMe | null>(null);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [openOrderId, setOpenOrderId] = useState<string | null>(null);
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const fetchData = useCallback(async () => {
    const vid =
      typeof window !== "undefined" ? localStorage.getItem("vendorId") : null;
    if (!vid) {
      router.push("/login");
      return;
    }
    setVendorId(vid);

    try {
      const params = new URLSearchParams({ id: vid });
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (search.trim()) params.set("search", search.trim());

      const [ordersRes, meRes, notifsRes] = await Promise.all([
        fetch(`/api/vendor/orders?${params.toString()}`),
        fetch(`/api/vendor/me?vendorId=${vid}`),
        fetch(`/api/vendor/notifications?id=${vid}`),
      ]);

      const ordersData = await ordersRes.json();
      const meData = await meRes.json();
      const notifsData = await notifsRes.json();

      if (ordersRes.ok && ordersData.success) {
        setOrders(ordersData.orders ?? []);
      }
      if (meRes.ok && meData.success) {
        setVendor({
          name: meData.vendor.name,
          email: meData.vendor.email,
          companyName: meData.vendor.companyName ?? null,
        });
      }
      if (notifsRes.ok && notifsData.success) {
        setUnreadNotifs(notifsData.unreadCount ?? 0);
      }
    } catch {
      // silencieux — on laisse l'UI vide
    } finally {
      setLoading(false);
    }
  }, [router, statusFilter, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totals = useMemo(() => {
    const totalRevenue = orders.reduce((s, o) => s + o.vendorSubtotalCents, 0);
    const totalItems = orders.reduce((s, o) => s + o.itemCount, 0);
    return { totalRevenue, totalItems, count: orders.length };
  }, [orders]);

  const pendingCount = useMemo(
    () => orders.filter((o) => o.status === "EN_COURS").length,
    [orders]
  );

  async function handleExportCsv() {
    if (!vendorId) return;
    setExporting(true);
    try {
      const params = new URLSearchParams({ id: vendorId });
      if (statusFilter !== "all") params.set("status", statusFilter.toUpperCase());
      const url = `/api/vendor/orders/export?${params.toString()}`;
      // On déclenche le téléchargement via un lien temporaire
      const a = document.createElement("a");
      a.href = url;
      a.download = "";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } finally {
      setTimeout(() => setExporting(false), 1500);
    }
  }

  return (
    <VendorShell
      vendorUser={vendor}
      unreadNotifsCount={unreadNotifs}
      pendingOrdersCount={pendingCount}
    >
      <VendorPageHeader
        breadcrumb={["Vendeur", "Commandes"]}
        title="Mes commandes reçues"
        subtitle="Toutes les commandes contenant un de vos produits."
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard
          label="Commandes affichées"
          value={String(totals.count)}
          icon="🛒"
        />
        <KpiCard
          label="Articles vendus"
          value={String(totals.totalItems)}
          icon="📦"
        />
        <KpiCard
          label="Revenu (filtré)"
          value={formatCents(totals.totalRevenue)}
          icon="💰"
        />
        <KpiCard
          label="En cours"
          value={String(pendingCount)}
          icon="⏳"
          accent={pendingCount > 0}
        />
      </div>

      {/* Filtres */}
      <Card className="mt-6 p-4 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-medium transition",
                  statusFilter === f.value
                    ? "bg-[rgb(var(--primary))] text-white"
                    : "bg-black/[0.04] text-[rgb(var(--muted))] hover:bg-black/[0.08]"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="flex flex-1 items-center gap-3">
            <div className="flex-1 lg:max-w-72">
              <Input
                placeholder="Rechercher acheteur ou produit…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button
              onClick={handleExportCsv}
              disabled={exporting || orders.length === 0}
              title="Télécharger les commandes en CSV pour Excel / comptabilité"
              className={cn(
                "inline-flex h-10 shrink-0 items-center gap-2 rounded-xl border border-[rgb(var(--border))]/80 bg-[rgb(var(--card))] px-4 text-sm font-semibold text-[rgb(var(--fg))] transition-all duration-150",
                "hover:border-[rgb(var(--primary))]/40 hover:bg-[rgb(var(--primary))]/8 hover:text-[rgb(var(--primary))]",
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
        </div>
      </Card>

      {/* Liste des commandes */}
      <div className="mt-6 space-y-3">
        {loading ? (
          <Card className="p-10 text-center text-sm text-[rgb(var(--muted))]">
            Chargement des commandes…
          </Card>
        ) : orders.length === 0 ? (
          <Card className="p-10 text-center">
            <div className="text-3xl">📭</div>
            <p className="mt-3 text-sm font-semibold">Aucune commande</p>
            <p className="mt-1 text-xs text-[rgb(var(--muted))]">
              Vos commandes apparaîtront ici dès qu&apos;un acheteur passe au paiement.
            </p>
          </Card>
        ) : (
          orders.map((order) => {
            const style = STATUS_STYLE[order.status] ?? STATUS_STYLE.EN_COURS;
            const isOpen = openOrderId === order.id;
            return (
              <Card key={order.id} className="overflow-hidden p-0">
                <button
                  onClick={() =>
                    setOpenOrderId(isOpen ? null : order.id)
                  }
                  className="flex w-full flex-col gap-3 px-4 py-4 text-left transition hover:bg-black/[0.02] sm:flex-row sm:items-center sm:gap-4 sm:px-5"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <span
                      className={cn(
                        "rounded-full border px-2.5 py-0.5 text-[10px] font-semibold",
                        style.bg,
                        style.text
                      )}
                    >
                      {style.label}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {order.buyer.name}
                      </p>
                      <p className="truncate text-xs text-[rgb(var(--muted))]">
                        {order.itemCount} article{order.itemCount > 1 ? "s" : ""}{" "}
                        · {formatDate(order.orderedAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-base font-bold tracking-tight">
                        {formatCents(order.vendorSubtotalCents)}
                      </p>
                      <p className="text-[10px] text-[rgb(var(--muted))]">
                        #{order.id.slice(0, 8)}
                      </p>
                    </div>
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      className={cn(
                        "h-4 w-4 shrink-0 text-[rgb(var(--muted))] transition-transform",
                        isOpen && "rotate-180"
                      )}
                    >
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-[rgb(var(--border))] bg-black/[0.015] px-4 py-4 sm:px-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <InfoBlock label="Acheteur">
                        <p className="text-sm font-medium">{order.buyer.name}</p>
                        <p className="break-all text-xs text-[rgb(var(--muted))]">
                          {order.buyer.email}
                        </p>
                      </InfoBlock>
                      <InfoBlock label="Identifiants">
                        <p className="font-mono text-xs">#{order.id}</p>
                        <p className="text-xs text-[rgb(var(--muted))]">
                          Commandé le {formatDate(order.orderedAt)}
                        </p>
                      </InfoBlock>
                    </div>

                    <div className="mt-4 overflow-hidden rounded-xl border border-[rgb(var(--border))] bg-white">
                      <div className="border-b border-[rgb(var(--border))] bg-black/[0.02] px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-[rgb(var(--muted))]">
                        Vos articles dans cette commande
                      </div>
                      <ul className="divide-y divide-[rgb(var(--border))]/60">
                        {order.lines.map((line) => (
                          <li
                            key={line.id}
                            className="flex items-center gap-3 px-4 py-3"
                          >
                            <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-lg bg-black/[0.04]">
                              {line.imageUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={line.imageUrl}
                                  alt={line.productName}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <span className="text-xl">📦</span>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium">
                                {line.productName}
                              </p>
                              <p className="truncate text-xs text-[rgb(var(--muted))]">
                                {line.reference ? `Réf. ${line.reference} · ` : ""}
                                {line.quantity} × {formatCents(line.unitPriceCents)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold">
                                {formatCents(line.subtotalCents)}
                              </p>
                            </div>
                          </li>
                        ))}
                      </ul>
                      <div className="flex items-center justify-between border-t border-[rgb(var(--border))] bg-black/[0.015] px-4 py-2.5">
                        <span className="text-xs font-medium text-[rgb(var(--muted))]">
                          Sous-total vendeur
                        </span>
                        <span className="text-sm font-bold">
                          {formatCents(order.vendorSubtotalCents)}
                        </span>
                      </div>
                    </div>

                    {/* Suivi & statut */}
                    <OrderTrackingPanel
                      order={order}
                      vendorId={vendorId}
                      onUpdated={(updated) => {
                        setOrders((prev) =>
                          prev.map((o) => o.id === order.id ? { ...o, ...updated } : o)
                        );
                      }}
                    />

                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          if (typeof navigator !== "undefined") {
                            navigator.clipboard
                              .writeText(order.buyer.email)
                              .catch(() => {});
                          }
                        }}
                      >
                        Copier l&apos;email acheteur
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (typeof navigator !== "undefined") {
                            navigator.clipboard
                              .writeText(order.id)
                              .catch(() => {});
                          }
                        }}
                      >
                        Copier ID commande
                      </Button>
                    </div>

                    {/* Messagerie avec l'acheteur */}
                    {typeof window !== "undefined" &&
                      localStorage.getItem("vendorId") && (
                        <div className="mt-4">
                          <OrderChat
                            orderId={order.id}
                            as="vendor"
                            userId={localStorage.getItem("vendorId") ?? ""}
                          />
                        </div>
                      )}
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>
    </VendorShell>
  );
}

function KpiCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: string;
  icon: string;
  accent?: boolean;
}) {
  return (
    <Card
      className={cn(
        "p-4",
        accent && "border-[rgb(var(--primary))]/30 bg-[rgb(var(--primary))]/[0.04]"
      )}
    >
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-[rgb(var(--primary))]/10 text-base">
          {icon}
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[rgb(var(--muted))]">
            {label}
          </p>
          <p className="text-lg font-semibold tracking-tight">{value}</p>
        </div>
      </div>
    </Card>
  );
}

function InfoBlock({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-[rgb(var(--border))]/60 bg-white px-4 py-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-[rgb(var(--muted))]">
        {label}
      </p>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

// ── Status flow ──────────────────────────────────────────────
const STATUS_FLOW = [
  { value: "EN_COURS",  label: "En cours",  icon: "📦" },
  { value: "CONFIRMED", label: "Confirmer", icon: "✅" },
  { value: "SHIPPED",   label: "Expédier",  icon: "🚚" },
  { value: "LIVREE",    label: "Livrer",    icon: "🎉" },
];

function OrderTrackingPanel({
  order,
  vendorId,
  onUpdated,
}: {
  order: VendorOrder;
  vendorId: string | null;
  onUpdated: (data: Partial<VendorOrder>) => void;
}) {
  const [trackingNumber, setTrackingNumber] = useState(order.trackingNumber ?? "");
  const [carrier, setCarrier] = useState(order.carrier ?? "");
  const [estimatedDelivery, setEstimatedDelivery] = useState(
    order.estimatedDelivery ? order.estimatedDelivery.slice(0, 10) : ""
  );
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  async function updateOrder(newStatus?: string) {
    if (!vendorId) return;
    setSaving(true);
    setMsg("");
    try {
      const res = await fetch("/api/vendor/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          vendorId,
          ...(newStatus ? { status: newStatus, note: note || undefined } : {}),
          trackingNumber: trackingNumber || null,
          carrier: carrier || null,
          estimatedDelivery: estimatedDelivery || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        onUpdated({
          ...(newStatus ? { status: newStatus } : {}),
          trackingNumber: trackingNumber || null,
          carrier: carrier || null,
          estimatedDelivery: estimatedDelivery || null,
        });
        setMsg("✓ Mis à jour");
        setNote("");
      } else {
        setMsg(data.error ?? "Erreur");
      }
    } catch {
      setMsg("Erreur réseau");
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(""), 3000);
    }
  }

  const isFinal = order.status === "LIVREE" || order.status === "ANNULEE";

  return (
    <div className="mt-4 rounded-xl border border-[rgb(var(--border))]/60 bg-white p-4">
      <p className="text-[10px] font-bold uppercase tracking-wider text-[rgb(var(--muted))]">
        Suivi & statut
      </p>

      {/* Status buttons */}
      {!isFinal && (
        <div className="mt-3">
          <p className="text-xs text-[rgb(var(--muted))] mb-2">Faire passer la commande à :</p>
          <div className="flex flex-wrap gap-2">
            {STATUS_FLOW.filter((s) => s.value !== "EN_COURS" && s.value !== order.status).map((s) => (
              <button
                key={s.value}
                disabled={saving}
                onClick={() => updateOrder(s.value)}
                className={cn(
                  "inline-flex h-8 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition disabled:opacity-50",
                  s.value === "LIVREE"
                    ? "border-[rgb(var(--success))]/40 bg-[rgb(var(--success))]/10 text-[rgb(var(--success))] hover:bg-[rgb(var(--success))]/20"
                    : s.value === "SHIPPED"
                      ? "border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100"
                      : "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                )}
              >
                {s.icon} {s.label}
              </button>
            ))}
            <button
              disabled={saving}
              onClick={() => updateOrder("ANNULEE")}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50 transition"
            >
              ❌ Annuler
            </button>
          </div>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note (optionnel) — ex : Expédié via Chronopost"
            className="mt-2 h-9 w-full rounded-lg border border-[rgb(var(--border))] bg-[#fafaf9] px-3 text-xs"
          />
        </div>
      )}

      {/* Tracking fields */}
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <label className="block">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[rgb(var(--muted))]">Transporteur</span>
          <input
            value={carrier}
            onChange={(e) => setCarrier(e.target.value)}
            placeholder="Colissimo, DHL…"
            className="mt-1 h-9 w-full rounded-lg border border-[rgb(var(--border))] bg-[#fafaf9] px-3 text-xs"
          />
        </label>
        <label className="block">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[rgb(var(--muted))]">N° de suivi</span>
          <input
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            placeholder="6Q1234567890"
            className="mt-1 h-9 w-full rounded-lg border border-[rgb(var(--border))] bg-[#fafaf9] px-3 text-xs font-mono"
          />
        </label>
        <label className="block">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[rgb(var(--muted))]">Livraison estimée</span>
          <input
            type="date"
            value={estimatedDelivery}
            onChange={(e) => setEstimatedDelivery(e.target.value)}
            className="mt-1 h-9 w-full rounded-lg border border-[rgb(var(--border))] bg-[#fafaf9] px-3 text-xs"
          />
        </label>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <button
          onClick={() => updateOrder()}
          disabled={saving}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[rgb(var(--primary))] px-4 text-xs font-semibold text-white hover:brightness-95 disabled:opacity-60 transition"
        >
          {saving ? "…" : "💾 Enregistrer le suivi"}
        </button>
        {msg && (
          <span className={cn("text-xs font-semibold", msg.startsWith("✓") ? "text-[rgb(var(--success))]" : "text-red-600")}>
            {msg}
          </span>
        )}
      </div>
    </div>
  );
}

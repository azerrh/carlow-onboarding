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

const STATUS_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  EN_COURS: {
    bg: "bg-amber-50 border-amber-200",
    text: "text-amber-700",
    label: "En cours",
  },
  LIVREE: {
    bg: "bg-[rgb(var(--success))]/10 border-[rgb(var(--success))]/30",
    text: "text-[rgb(var(--success))]",
    label: "Livrée",
  },
  ANNULEE: {
    bg: "bg-red-50 border-red-200",
    text: "text-red-700",
    label: "Annulée",
  },
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
              title="Exporter en CSV pour Excel / comptabilité"
              className={cn(
                "inline-flex h-10 shrink-0 items-center gap-2 rounded-xl border border-[rgb(var(--border))] bg-white px-4 text-xs font-semibold text-[rgb(var(--fg))] transition hover:border-[rgb(var(--primary))]/30 hover:bg-[rgb(var(--primary))]/[0.04] hover:text-[rgb(var(--primary))] disabled:opacity-40",
                exporting && "cursor-wait"
              )}
            >
              {exporting ? "⏳ Export…" : "📥 Exporter CSV"}
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

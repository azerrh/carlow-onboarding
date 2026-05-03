"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Brand } from "@/components/ui/Brand";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";

interface Buyer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  createdAt: string;
  _count: { orders: number; notifications: number };
}

interface BuyerStats {
  totalSpentCents: number;
  ordersInProgress: number;
  ordersByStatus: Record<string, { count: number; label: string }>;
  unreadNotifs: number;
}

interface RecentOrder {
  id: string;
  status: string;
  totalCents: number;
  orderedAt: string;
  lines: {
    productName: string;
    vendor: string;
    quantity: number;
    unitPriceCents: number;
  }[];
}

const ORDER_STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  EN_COURS: {
    bg: "bg-amber-50 border-amber-200",
    text: "text-amber-700",
    label: "En cours",
  },
  LIVREE: {
    bg: "bg-[rgb(var(--success))]/10 border-[rgb(var(--success))]/30",
    text: "text-[rgb(var(--success))]",
    label: "Livree",
  },
  ANNULEE: {
    bg: "bg-red-50 border-red-200",
    text: "text-red-700",
    label: "Annulee",
  },
};

function formatCents(cents: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "A l&apos;instant";
  if (diffMin < 60) return `Il y a ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `Il y a ${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `Il y a ${diffD}j`;
  return date.toLocaleDateString("fr-FR");
}

export default function BuyerDashboardPage() {
  const router = useRouter();
  const [buyerId, setBuyerId] = useState<string | null>(null);
  const [buyer, setBuyer] = useState<Buyer | null>(null);
  const [stats, setStats] = useState<BuyerStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = localStorage.getItem("buyerId");
    if (!id) {
      router.replace("/buyer/login");
      return;
    }
    setBuyerId(id);
  }, [router]);

  const fetchData = useCallback(async () => {
    if (!buyerId) return;
    try {
      const [statsRes, ordersRes] = await Promise.all([
        fetch(`/api/buyer/dashboard-stats?id=${buyerId}`),
        fetch(`/api/buyer/orders?id=${buyerId}`),
      ]);

      const statsData = await statsRes.json();
      const ordersData = await ordersRes.json();

      if (statsData.success) {
        setBuyer(statsData.buyer);
        setStats(statsData.stats);
        setRecentOrders(statsData.recentOrders);
      } else {
        router.replace("/buyer/login");
        return;
      }

      if (ordersData.success) {
        // Already have recent orders from stats, but could merge if needed
      }
    } catch {
      router.replace("/buyer/login");
    } finally {
      setLoading(false);
    }
  }, [buyerId, router]);

  useEffect(() => {
    if (buyerId) fetchData();
  }, [buyerId, fetchData]);

  function handleLogout() {
    localStorage.removeItem("buyerId");
    router.push("/buyer/login");
  }

  if (loading) {
    return (
      <div className="portal-page grid min-h-screen place-items-center">
        <p className="text-sm text-[rgb(var(--muted))]">Chargement...</p>
      </div>
    );
  }

  if (!buyer) {
    return (
      <div className="portal-page grid min-h-screen place-items-center px-4">
        <Card className="max-w-md p-8 text-center">
          <p className="text-sm text-[rgb(var(--muted))]">
            Impossible de charger votre compte.
          </p>
          <Button onClick={() => router.push("/buyer/login")} className="mt-4">
            Se reconnecter
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="portal-page min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-[rgb(var(--border))] bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-[1100px] items-center justify-between px-4 py-3">
          <Brand variant="compact" />
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-[rgb(var(--muted))] sm:inline">
              {buyer.name}
            </span>
            <Link href="/buyer/account">
              <Button variant="ghost" size="sm">Mon compte</Button>
            </Link>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleLogout}
            >
              Deconnexion
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1100px] px-4 py-8">
        {/* Welcome */}
        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              Bonjour, {buyer.name} !
            </h1>
            <p className="mt-1 text-sm text-[rgb(var(--muted))]">
              Bienvenue sur votre espace acheteur Carlow.
            </p>
          </div>
          <div className="rounded-full border border-[rgb(var(--success))]/30 bg-[rgb(var(--success))]/10 px-3 py-1 text-xs font-semibold text-[rgb(var(--success))]">
            ● Compte acheteur
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile
              label="Commandes"
              value={buyer._count.orders}
              icon="🛒"
            />
            <StatTile
              label="En cours"
              value={stats.ordersInProgress}
              icon="📦"
            />
            <StatTile
              label="Total depense"
              value={formatCents(stats.totalSpentCents)}
              icon="💰"
            />
            <StatTile
              label="Membre depuis"
              value={new Date(buyer.createdAt).toLocaleDateString("fr-FR", {
                month: "short",
                year: "numeric",
              })}
              icon="📅"
            />
          </div>
        )}

        {/* Orders by status */}
        {stats && Object.keys(stats.ordersByStatus).length > 0 && (
          <Card className="mt-6 p-6">
            <h2 className="text-sm font-semibold">Mes commandes par statut</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {Object.entries(stats.ordersByStatus).map(([label, data]) => {
                const style =
                  label === "En cours"
                    ? ORDER_STATUS_STYLES.EN_COURS
                    : label === "Livree"
                      ? ORDER_STATUS_STYLES.LIVREE
                      : label === "Annulee"
                        ? ORDER_STATUS_STYLES.ANNULEE
                        : { bg: "bg-gray-50 border-gray-200", text: "text-gray-700" };
                return (
                  <div
                    key={label}
                    className={cn(
                      "rounded-xl border p-4",
                      style.bg
                    )}
                  >
                    <div className={cn("text-sm font-semibold", style.text)}>
                      {data.label}
                    </div>
                    <div className="mt-1 text-2xl font-bold">
                      {data.count}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* Recent orders */}
        <Card className="mt-6 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Commandes recentes</h2>
          </div>

          {recentOrders.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-[rgb(var(--border))] bg-white/50 px-4 py-10 text-center">
              <div className="text-3xl">🛒</div>
              <p className="mt-3 text-sm font-medium">Aucune commande pour l&apos;instant</p>
              <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                Parcourez la marketplace pour passer votre premiere commande.
              </p>
              <p className="mt-4 text-xs text-[rgb(var(--muted))]">
                <em>Marketplace en cours de finalisation</em>
              </p>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {recentOrders.map((order) => {
                const style = ORDER_STATUS_STYLES[order.status] ?? ORDER_STATUS_STYLES.EN_COURS;
                return (
                  <div
                    key={order.id}
                    className="rounded-xl border border-[rgb(var(--border))]/60 bg-white/60 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-[rgb(var(--muted))]">
                          Commande du {new Date(order.orderedAt).toLocaleDateString("fr-FR")}
                        </p>
                        <p className="mt-1 text-sm font-medium">
                          {order.lines.map((l) => l.productName).join(", ")}
                        </p>
                        <p className="text-xs text-[rgb(var(--muted))]">
                          Vendeur : {order.lines[0]?.vendor}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold">
                          {formatCents(order.totalCents)}
                        </span>
                        <span
                          className={cn(
                            "rounded-full border px-2.5 py-1 text-[10px] font-semibold",
                            style.bg,
                            style.text
                          )}
                        >
                          {style.label}
                        </span>
                      </div>
                    </div>
                    {/* Order lines detail */}
                    {order.lines.length > 1 && (
                      <div className="mt-3 border-t border-[rgb(var(--border))]/50 pt-3">
                        {order.lines.map((l, i) => (
                          <div key={i} className="flex items-center justify-between text-xs">
                            <span>{l.productName} × {l.quantity}</span>
                            <span className="font-medium">
                              {formatCents(l.unitPriceCents * l.quantity)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Quick actions */}
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Link
            href="/buyer/account"
            className="flex items-center gap-3 rounded-xl border border-[rgb(var(--border))]/60 bg-white/60 px-4 py-3 text-sm font-medium transition hover:border-[rgb(var(--success))]/30 hover:bg-[rgb(var(--success))]/[0.04]"
          >
            <span className="text-base">👤</span>
            Mon profil
          </Link>
          <Link
            href="/buyer/account"
            className="flex items-center gap-3 rounded-xl border border-[rgb(var(--border))]/60 bg-white/60 px-4 py-3 text-sm font-medium transition hover:border-[rgb(var(--success))]/30 hover:bg-[rgb(var(--success))]/[0.04]"
          >
            <span className="text-base">⚙️</span>
            Parametres
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 rounded-xl border border-[rgb(var(--border))]/60 bg-white/60 px-4 py-3 text-sm font-medium transition hover:border-red-300 hover:bg-red-50"
          >
            <span className="text-base">🚪</span>
            Deconnexion
          </button>
        </div>
      </div>
    </div>
  );
}

function StatTile({
  label,
  value,
  icon,
}: {
  label: string;
  value: number | string;
  icon: string;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-[rgb(var(--success))]/10 text-lg">
          {icon}
        </span>
        <div>
          <div className="text-xs uppercase tracking-wider text-[rgb(var(--muted))]">
            {label}
          </div>
          <div className="text-xl font-semibold tracking-tight">{value}</div>
        </div>
      </div>
    </Card>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { BuyerNav } from "@/components/buyer/BuyerNav";
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
      const statsRes = await fetch(`/api/buyer/dashboard-stats?id=${buyerId}`);
      const statsData = await statsRes.json();

      if (statsData.success) {
        setBuyer(statsData.buyer);
        setStats(statsData.stats);
        setRecentOrders(statsData.recentOrders);
      } else {
        router.replace("/buyer/login");
        return;
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
      <BuyerNav />

      <div className="mx-auto max-w-[1100px] px-4 py-8">
        {/* Welcome */}
        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Bonjour, {buyer.name} 👋
            </h1>
            <p className="mt-1 text-sm text-[rgb(var(--muted))]">
              Bienvenue sur votre espace acheteur Carlow.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[rgb(var(--success))]/30 bg-[rgb(var(--success))]/10 px-3 py-1.5 text-xs font-semibold text-[rgb(var(--success))]">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[rgb(var(--success))]" />
            Compte acheteur actif
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Link href="/buyer/orders" className="block cursor-pointer">
              <StatTile
                label="Commandes"
                value={buyer._count.orders}
                icon="🛒"
              />
            </Link>
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
            <Link href="/buyer/orders" className="text-xs font-medium text-[rgb(var(--link))] hover:underline">
              Voir toutes →
            </Link>
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
                  <Link
                    key={order.id}
                    href={`/buyer/orders/${order.id}`}
                    className="block rounded-xl border border-[rgb(var(--border))]/60 bg-white/60 p-4 transition hover:border-[rgb(var(--success))]/30 hover:bg-[rgb(var(--success))]/[0.04]"
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
                  </Link>
                );
              })}
            </div>
          )}
        </Card>

        {/* Quick actions */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <Link
            href="/buyer/orders"
            className="flex items-center gap-3 rounded-xl border border-[rgb(var(--border))]/60 bg-white/60 px-4 py-3 text-sm font-medium transition hover:border-[rgb(var(--success))]/30 hover:bg-[rgb(var(--success))]/[0.04]"
          >
            <span className="text-base">📦</span>
            Mes commandes
          </Link>
          <Link
            href="/buyer/devis"
            className="flex items-center gap-3 rounded-xl border border-[rgb(var(--border))]/60 bg-white/60 px-4 py-3 text-sm font-medium transition hover:border-[rgb(var(--primary))]/30 hover:bg-[rgb(var(--primary))]/[0.04]"
          >
            <span className="text-base">📋</span>
            Mes devis
          </Link>
          <Link
            href="/buyer/favoris"
            className="flex items-center gap-3 rounded-xl border border-[rgb(var(--border))]/60 bg-white/60 px-4 py-3 text-sm font-medium transition hover:border-red-200 hover:bg-red-50"
          >
            <span className="text-base">❤️</span>
            Mes favoris
          </Link>
          <Link
            href="/buyer/alertes"
            className="flex items-center gap-3 rounded-xl border border-[rgb(var(--border))]/60 bg-white/60 px-4 py-3 text-sm font-medium transition hover:border-amber-300 hover:bg-amber-50"
          >
            <span className="text-base">🔔</span>
            Mes alertes
          </Link>
          <Link
            href="/buyer/account"
            className="flex items-center gap-3 rounded-xl border border-[rgb(var(--border))]/60 bg-white/60 px-4 py-3 text-sm font-medium transition hover:border-[rgb(var(--success))]/30 hover:bg-[rgb(var(--success))]/[0.04]"
          >
            <span className="text-base">👤</span>
            Mon profil
          </Link>
        </div>
        <div className="mt-3 sm:hidden">
          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-[rgb(var(--border))]/60 bg-[rgb(var(--card))]/60 px-4 py-2.5 text-xs font-medium text-[rgb(var(--muted))] transition hover:border-red-300 hover:bg-red-50 hover:text-red-600"
          >
            <span>🚪</span>
            Déconnexion
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
    <Card className="p-5 transition-all duration-200 hover:-translate-y-0.5">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[rgb(var(--success))]/15 to-[rgb(var(--success))]/8 text-lg">
          {icon}
        </span>
        <div className="min-w-0">
          <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-[rgb(var(--muted))]">
            {label}
          </div>
          <div className="truncate text-xl font-bold tracking-tight">{value}</div>
        </div>
      </div>
    </Card>
  );
}

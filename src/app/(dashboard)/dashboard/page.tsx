"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
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
  createdAt: string;
}

interface DashboardStats {
  catalogCount: number;
  productCount: number;
  activeProductCount: number;
  orderCount: number;
  totalRevenueCents: number;
  documentCount: number;
  certificationCount: number;
  unreadNotifs: number;
}

interface RecentOrder {
  orderId: string;
  buyer: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  status: string;
  orderedAt: string;
}

interface Notification {
  id: string;
  content: string;
  read: boolean;
  sentAt: string;
}

const ONBOARDING_STEPS = [
  { label: "Compte" },
  { label: "Societe" },
  { label: "Documents" },
  { label: "Certifications" },
  { label: "Logistique" },
  { label: "Validation" },
];

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
  if (diffMin < 1) return "A l'instant";
  if (diffMin < 60) return `Il y a ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `Il y a ${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `Il y a ${diffD}j`;
  return date.toLocaleDateString("fr-FR");
}

export default function DashboardPage() {
  const router = useRouter();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showNotifs, setShowNotifs] = useState(false);

  const fetchData = useCallback(async () => {
    const vendorId = localStorage.getItem("vendorId");
    if (!vendorId) {
      router.push("/login");
      return;
    }

    try {
      const [dashboardRes, notifsRes] = await Promise.all([
        fetch(`/api/vendor/dashboard-stats?id=${vendorId}`),
        fetch(`/api/vendor/notifications?id=${vendorId}`),
      ]);

      const dashboardData = await dashboardRes.json();
      const notifsData = await notifsRes.json();

      if (dashboardData.success) {
        setVendor(dashboardData.vendor);
        setStats(dashboardData.stats);
        setRecentOrders(dashboardData.recentOrders);
      } else {
        router.push("/login");
        return;
      }

      if (notifsData.success) {
        setNotifications(notifsData.notifications);
        setUnreadCount(notifsData.unreadCount);
      }
    } catch {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function markAllRead() {
    const vendorId = localStorage.getItem("vendorId");
    if (!vendorId) return;
    try {
      await fetch("/api/vendor/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: vendorId }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      // silencieux
    }
  }

  if (loading) {
    return (
      <div className="portal-page grid min-h-screen place-items-center">
        <div className="text-sm text-[rgb(var(--muted))]">Chargement...</div>
      </div>
    );
  }

  const isOnboarded = (vendor?.onboardingStep ?? 0) >= 6 || vendor?.status === "submitted" || vendor?.status === "active";

  const steps = ONBOARDING_STEPS.map((step, i) => ({
    ...step,
    done: i + 1 < (vendor?.onboardingStep ?? 0) || (vendor?.status === "submitted" && i >= 0),
  }));

  const progress = Math.round(
    (steps.filter((s) => s.done).length / steps.length) * 100
  );

  const statusColor =
    vendor?.status === "submitted"
      ? "#22a06b"
      : vendor?.status === "active"
        ? "#E87A30"
        : "#888";
  const statusLabel =
    vendor?.status === "submitted"
      ? "Dossier soumis"
      : vendor?.status === "active"
        ? "Compte actif"
        : "En cours";

  return (
    <div className="portal-page min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-[rgb(var(--border))] bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-[1100px] items-center justify-between px-4 py-3">
          <Brand variant="compact" />
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-[rgb(var(--muted))] sm:inline">
              {vendor?.name}
            </span>
            <Link href="/account">
              <Button variant="ghost" size="sm">Mon compte</Button>
            </Link>
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNotifs(!showNotifs)}
              >
                Notifications
                {unreadCount > 0 && (
                  <span className="ml-1 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-[rgb(var(--primary))] px-1 text-[10px] font-bold text-white">
                    {unreadCount}
                  </span>
                )}
              </Button>
              {showNotifs && (
                <div className="absolute right-0 top-full z-20 mt-1 w-80 rounded-xl border border-[rgb(var(--border))] bg-white p-4 shadow-lg">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">Notifications</h3>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllRead}
                        className="text-[11px] text-[rgb(var(--primary))] hover:underline"
                      >
                        Tout marquer lu
                      </button>
                    )}
                  </div>
                  <div className="mt-3 max-h-72 overflow-y-auto space-y-2">
                    {notifications.length === 0 && (
                      <p className="text-xs text-[rgb(var(--muted))]">Aucune notification</p>
                    )}
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        className={cn(
                          "rounded-lg border px-3 py-2.5 text-xs",
                          n.read
                            ? "border-[rgb(var(--border))]/50 bg-white/60"
                            : "border-[rgb(var(--primary))]/30 bg-[rgb(var(--primary))]/[0.04]"
                        )}
                      >
                        <p className="font-medium">{n.content}</p>
                        <p className="mt-1 text-[10px] text-[rgb(var(--muted))]">
                          {timeAgo(n.sentAt)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                localStorage.removeItem("vendorId");
                router.push("/login");
              }}
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
              Bonjour, {vendor?.name} !
            </h1>
            <p className="mt-1 text-sm text-[rgb(var(--muted))]">
              Voici l&apos;etat de votre activite vendeur Carlow.
            </p>
          </div>
          <div
            className="rounded-full border px-3 py-1 text-xs font-semibold"
            style={{
              borderColor: `${statusColor}40`,
              backgroundColor: `${statusColor}10`,
              color: statusColor,
            }}
          >
            ● {statusLabel}
          </div>
        </div>

        {/* Stats cards */}
        {isOnboarded && stats && (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile
              label="Produits"
              value={`${stats.activeProductCount} / ${stats.productCount}`}
              sublabel="actifs"
              icon="📦"
            />
            <StatTile
              label="Catalogues"
              value={stats.catalogCount}
              icon="📁"
            />
            <StatTile
              label="Commandes"
              value={stats.orderCount}
              icon="🛒"
            />
            <StatTile
              label="Revenu total"
              value={formatCents(stats.totalRevenueCents)}
              icon="💰"
            />
          </div>
        )}

        {/* Onboarding progress */}
        {!isOnboarded ? (
          <Card className="mt-6 p-6">
            <div className="text-sm font-semibold">Progression du dossier</div>
            <div className="mt-4 h-2 w-full rounded-full bg-black/5">
              <div
                className="h-2 rounded-full bg-[rgb(var(--primary))] transition-[width] duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-3">
              {steps.map((step, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex items-center gap-2 rounded-xl border px-3 py-2.5",
                    step.done
                      ? "border-[rgb(var(--primary))]/40 bg-[rgb(var(--primary))]/[0.06]"
                      : "border-[rgb(var(--border))] bg-white/40"
                  )}
                >
                  <div
                    className={cn(
                      "grid h-6 w-6 place-items-center rounded-full text-[11px] font-bold",
                      step.done
                        ? "bg-[rgb(var(--primary))] text-white"
                        : "bg-black/10 text-[rgb(var(--muted))]"
                    )}
                  >
                    {step.done ? "✓" : i + 1}
                  </div>
                  <span
                    className={cn(
                      "text-xs font-medium",
                      step.done
                        ? "text-[rgb(var(--primary))]"
                        : "text-[rgb(var(--muted))]"
                    )}
                  >
                    {step.label}
                  </span>
                </div>
              ))}
            </div>

            {(vendor?.onboardingStep ?? 0) < 6 &&
              vendor?.status !== "submitted" && (
                <div className="mt-5 flex flex-col gap-3 rounded-[var(--radius)] border border-[rgb(var(--primary))]/40 bg-[rgb(var(--primary))]/[0.06] p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-sm font-semibold text-[rgb(var(--primary))]">
                      Dossier incomplet
                    </div>
                    <div className="mt-0.5 text-sm text-[rgb(var(--muted))]">
                      Completez votre dossier pour activer votre compte vendeur.
                    </div>
                  </div>
                  <Button onClick={() => router.push("/step-2-company")}>
                    Continuer
                  </Button>
                </div>
              )}

            {vendor?.status === "submitted" && (
              <div className="mt-5 rounded-[var(--radius)] border border-[rgb(var(--success))]/35 bg-[rgb(var(--success))]/[0.06] p-5">
                <div className="text-sm font-semibold text-[rgb(var(--success))]">
                  Dossier en cours de verification
                </div>
                <div className="mt-0.5 text-sm text-[rgb(var(--muted))]">
                  Notre equipe verifie votre dossier sous 24-48h. Vous recevrez un
                  email de confirmation.
                </div>
              </div>
            )}
          </Card>
        ) : (
          /* Onboarded vendor: quick actions */
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-4">
            <QuickAction
              href="/step-2-company"
              icon="⚙️"
              label="Modifier mes infos"
            />
            <QuickAction
              href="/step-3-documents"
              icon="📄"
              label="Mes documents"
            />
            <QuickAction
              href="/step-5-logistics"
              icon="🚚"
              label="Logistique"
            />
            <QuickAction
              href="/account"
              icon="👤"
              label="Mon profil"
            />
          </div>
        )}

        {/* Recent orders + Documents summary */}
        {isOnboarded && stats && (
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Recent orders */}
            <Card className="p-6 lg:col-span-2">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold">Commandes recentes</h2>
                <span className="text-xs text-[rgb(var(--muted))]">
                  {stats.orderCount} au total
                </span>
              </div>

              {recentOrders.length === 0 ? (
                <div className="mt-6 rounded-xl border border-dashed border-[rgb(var(--border))] bg-white/50 px-4 py-8 text-center">
                  <div className="text-2xl">🛒</div>
                  <p className="mt-2 text-sm font-medium">Aucune commande pour l&apos;instant</p>
                  <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                    Vos commandes apparaîtront ici.
                  </p>
                </div>
              ) : (
                <div className="mt-4 space-y-2">
                  {recentOrders.map((order) => {
                    const style = ORDER_STATUS_STYLES[order.status] ?? ORDER_STATUS_STYLES.EN_COURS;
                    return (
                      <div
                        key={order.orderId + order.productName}
                        className="flex items-center justify-between rounded-xl border border-[rgb(var(--border))]/60 bg-white/60 px-4 py-3"
                      >
                        <div>
                          <p className="text-sm font-medium">{order.productName}</p>
                          <p className="text-xs text-[rgb(var(--muted))]">
                            {order.buyer} · {timeAgo(order.orderedAt)}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold">
                            {formatCents(order.unitPrice * order.quantity)}
                          </span>
                          <span
                            className={cn(
                              "rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                              style.bg,
                              style.text
                            )}
                          >
                            {style.label}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            {/* Documents & Certifications summary */}
            <Card className="p-6">
              <h2 className="text-sm font-semibold">Documents & Certifications</h2>
              <div className="mt-4 space-y-3">
                <DocStat
                  label="Documents"
                  count={stats.documentCount}
                  href="/step-3-documents"
                />
                <DocStat
                  label="Certifications"
                  count={stats.certificationCount}
                  href="/step-4-certifications"
                />
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

function StatTile({
  label,
  value,
  sublabel,
  icon,
}: {
  label: string;
  value: number | string;
  sublabel?: string;
  icon: string;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-[rgb(var(--primary))]/10 text-lg">
          {icon}
        </span>
        <div>
          <div className="text-xs uppercase tracking-wider text-[rgb(var(--muted))]">
            {label}
          </div>
          <div className="text-xl font-semibold tracking-tight">{value}</div>
          {sublabel && (
            <div className="text-[10px] text-[rgb(var(--muted))]">{sublabel}</div>
          )}
        </div>
      </div>
    </Card>
  );
}

function QuickAction({
  href,
  icon,
  label,
}: {
  href: string;
  icon: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl border border-[rgb(var(--border))]/60 bg-white/60 px-4 py-3 text-sm font-medium transition hover:border-[rgb(var(--primary))]/30 hover:bg-[rgb(var(--primary))]/[0.04]"
    >
      <span className="text-base">{icon}</span>
      {label}
    </Link>
  );
}

function DocStat({
  label,
  count,
  href,
}: {
  label: string;
  count: number;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-xl border border-[rgb(var(--border))]/60 bg-white/50 px-4 py-3 transition hover:border-[rgb(var(--primary))]/30 hover:bg-[rgb(var(--primary))]/[0.04]"
    >
      <span className="text-sm font-medium">{label}</span>
      <span
        className={cn(
          "rounded-full bg-black/[0.06] px-2.5 py-0.5 text-xs font-semibold",
          count > 0 && "bg-[rgb(var(--primary))]/10 text-[rgb(var(--primary))]"
        )}
      >
        {count}
      </span>
    </Link>
  );
}

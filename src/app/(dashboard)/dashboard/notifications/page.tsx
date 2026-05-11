"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { VendorShell, VendorPageHeader } from "@/components/vendor/VendorShell";
import { PushToggle } from "@/components/ui/PushToggle";
import { cn } from "@/lib/cn";

interface Notification {
  id: string;
  content: string;
  read: boolean;
  sentAt: string;
}

interface VendorMe {
  name: string;
  email: string;
  companyName: string | null;
}

type FilterValue = "all" | "unread" | "read";

const FILTERS: { value: FilterValue; label: string }[] = [
  { value: "all", label: "Toutes" },
  { value: "unread", label: "Non lues" },
  { value: "read", label: "Lues" },
];

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "À l'instant";
  if (diffMin < 60) return `Il y a ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `Il y a ${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `Il y a ${diffD}j`;
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/**
 * Catégorise une notification par mot-clés simples sur le contenu.
 * Utile pour ajouter une icône contextuelle, sans nécessiter un champ
 * supplémentaire dans la table Notification.
 */
function categorize(content: string): { icon: string; tone: string } {
  const c = content.toLowerCase();
  if (c.includes("commande") || c.includes("achat") || c.includes("vendu")) {
    return { icon: "🛒", tone: "bg-[rgb(var(--primary))]/10 text-[rgb(var(--primary))]" };
  }
  if (c.includes("validé") || c.includes("activ") || c.includes("approuvé")) {
    return { icon: "✅", tone: "bg-[rgb(var(--success))]/10 text-[rgb(var(--success))]" };
  }
  if (c.includes("rejet") || c.includes("refus") || c.includes("erreur")) {
    return { icon: "⚠️", tone: "bg-red-50 text-red-600" };
  }
  if (c.includes("document") || c.includes("certif")) {
    return { icon: "📄", tone: "bg-amber-50 text-amber-700" };
  }
  return { icon: "🔔", tone: "bg-black/[0.04] text-[rgb(var(--muted))]" };
}

export default function VendorNotificationsPage() {
  const router = useRouter();
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [vendor, setVendor] = useState<VendorMe | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterValue>("all");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setVendorId(localStorage.getItem("vendorId"));
    }
  }, []);
  const [marking, setMarking] = useState(false);

  const fetchData = useCallback(async () => {
    const vendorId =
      typeof window !== "undefined" ? localStorage.getItem("vendorId") : null;
    if (!vendorId) {
      router.push("/login");
      return;
    }

    try {
      const [notifsRes, meRes] = await Promise.all([
        fetch(`/api/vendor/notifications?id=${vendorId}`),
        fetch(`/api/vendor/me?vendorId=${vendorId}`),
      ]);
      const notifsData = await notifsRes.json();
      const meData = await meRes.json();

      if (notifsRes.ok && notifsData.success) {
        setNotifications(notifsData.notifications ?? []);
      }
      if (meRes.ok && meData.success) {
        setVendor({
          name: meData.vendor.name,
          email: meData.vendor.email,
          companyName: meData.vendor.companyName ?? null,
        });
      }
    } catch {
      // silencieux
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const filtered = useMemo(() => {
    if (filter === "unread") return notifications.filter((n) => !n.read);
    if (filter === "read") return notifications.filter((n) => n.read);
    return notifications;
  }, [notifications, filter]);

  async function markAllAsRead() {
    const vendorId =
      typeof window !== "undefined" ? localStorage.getItem("vendorId") : null;
    if (!vendorId || unreadCount === 0) return;
    setMarking(true);
    try {
      const res = await fetch("/api/vendor/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: vendorId }),
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.read ? n : { ...n, read: true }))
        );
      }
    } finally {
      setMarking(false);
    }
  }

  async function markOneAsRead(notifId: string) {
    const vendorId =
      typeof window !== "undefined" ? localStorage.getItem("vendorId") : null;
    if (!vendorId) return;
    // Optimistic update — on remet à false si l'API échoue.
    setNotifications((prev) =>
      prev.map((n) => (n.id === notifId ? { ...n, read: true } : n))
    );
    try {
      const res = await fetch("/api/vendor/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: vendorId, notificationId: notifId }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notifId ? { ...n, read: false } : n))
      );
    }
  }

  return (
    <VendorShell vendorUser={vendor} unreadNotifsCount={unreadCount}>
      <VendorPageHeader
        breadcrumb={["Vendeur", "Notifications"]}
        title="Notifications"
        subtitle="Suivez l'activité de votre compte et vos commandes."
        action={
          unreadCount > 0 && (
            <Button
              variant="secondary"
              size="sm"
              onClick={markAllAsRead}
              disabled={marking}
            >
              {marking ? "…" : "Tout marquer comme lu"}
            </Button>
          )
        }
      />

      {/* Toggle Web Push */}
      {vendorId && (
        <div className="mb-6">
          <PushToggle user={{ vendorId }} />
        </div>
      )}

      {/* Compteur + filtres */}
      <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-[rgb(var(--primary))]/10 text-lg">
            🔔
          </span>
          <div>
            <p className="text-sm font-semibold">
              {unreadCount > 0
                ? `${unreadCount} notification${unreadCount > 1 ? "s" : ""} non lue${unreadCount > 1 ? "s" : ""}`
                : "Tout est à jour"}
            </p>
            <p className="text-xs text-[rgb(var(--muted))]">
              Total : {notifications.length}{" "}
              notification{notifications.length > 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => {
            const count =
              f.value === "all"
                ? notifications.length
                : f.value === "unread"
                  ? unreadCount
                  : notifications.length - unreadCount;
            return (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-medium transition",
                  filter === f.value
                    ? "bg-[rgb(var(--primary))] text-white"
                    : "bg-black/[0.04] text-[rgb(var(--muted))] hover:bg-black/[0.08]"
                )}
              >
                {f.label} ({count})
              </button>
            );
          })}
        </div>
      </Card>

      {/* Liste */}
      <div className="mt-6 space-y-2">
        {loading ? (
          <Card className="p-10 text-center text-sm text-[rgb(var(--muted))]">
            Chargement des notifications…
          </Card>
        ) : filtered.length === 0 ? (
          <Card className="p-10 text-center">
            <div className="text-3xl">📭</div>
            <p className="mt-3 text-sm font-semibold">
              {filter === "unread"
                ? "Aucune notification non lue"
                : filter === "read"
                  ? "Aucune notification lue"
                  : "Aucune notification"}
            </p>
            <p className="mt-1 text-xs text-[rgb(var(--muted))]">
              {filter === "all"
                ? "Vos prochaines notifications apparaîtront ici."
                : "Changez de filtre pour voir les autres notifications."}
            </p>
          </Card>
        ) : (
          filtered.map((n) => {
            const cat = categorize(n.content);
            return (
              <button
                key={n.id}
                onClick={() => !n.read && markOneAsRead(n.id)}
                className={cn(
                  "flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left transition",
                  n.read
                    ? "border-[rgb(var(--border))]/60 bg-white hover:bg-black/[0.02]"
                    : "border-[rgb(var(--primary))]/30 bg-[rgb(var(--primary))]/[0.04] hover:bg-[rgb(var(--primary))]/[0.07]"
                )}
              >
                <span
                  className={cn(
                    "grid h-9 w-9 shrink-0 place-items-center rounded-lg text-base",
                    cat.tone
                  )}
                >
                  {cat.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "text-sm",
                      n.read ? "font-normal text-[rgb(var(--fg))]" : "font-semibold"
                    )}
                  >
                    {n.content}
                  </p>
                  <p className="mt-1 text-[11px] text-[rgb(var(--muted))]">
                    {timeAgo(n.sentAt)}
                  </p>
                </div>
                {!n.read && (
                  <span
                    className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[rgb(var(--primary))]"
                    aria-label="Non lue"
                  />
                )}
              </button>
            );
          })
        )}
      </div>
    </VendorShell>
  );
}

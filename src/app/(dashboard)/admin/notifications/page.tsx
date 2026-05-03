"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminShell, AdminPageHeader } from "@/components/admin/AdminShell";
import { cn } from "@/lib/cn";

interface NotifRow {
  id: string;
  content: string;
  readAt: string | null;
  sentAt: string;
  vendor?: { name: string; email: string } | null;
  buyer?: { name: string; email: string } | null;
}

export default function AdminNotificationsPage() {
  const router = useRouter();
  const [notifs, setNotifs] = useState<NotifRow[]>([]);
  const [stats, setStats] = useState({ total: 0, unread: 0, today: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/notifications");
        if (res.status === 401) {
          router.replace("/admin/login");
          return;
        }
        const data = await res.json();
        if (res.ok && data.success) {
          setNotifs(data.notifications);
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

  async function handleDelete(id: string) {
    setNotifs((ns) => ns.filter((n) => n.id !== id));
    await fetch(`/api/admin/notifications?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  }

  return (
    <AdminShell unreadNotifsCount={stats.unread}>
      <AdminPageHeader
        breadcrumb={["Dashboard", "Notifications"]}
        title="Notifications"
        subtitle={`${stats.total} notification${stats.total > 1 ? "s" : ""} • ${stats.unread} non lue${stats.unread > 1 ? "s" : ""}`}
      />

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Tile label="Total" value={stats.total} tone="indigo" />
        <Tile label="Non lues" value={stats.unread} tone="rose" />
        <Tile label="Aujourd'hui" value={stats.today} tone="emerald" />
      </div>

      <div className="mt-6 rounded-2xl border border-[rgb(var(--border))] bg-white p-4">
        {loading ? (
          <p className="py-8 text-center text-sm text-[rgb(var(--muted))]">Chargement…</p>
        ) : notifs.length === 0 ? (
          <p className="py-12 text-center text-sm text-[rgb(var(--muted))]">
            Aucune notification.
          </p>
        ) : (
          <ul className="divide-y divide-[rgb(var(--border))]">
            {notifs.map((n) => {
              const target = n.vendor ?? n.buyer;
              const isVendor = !!n.vendor;
              return (
                <li
                  key={n.id}
                  className={cn(
                    "flex items-start gap-4 py-4",
                    !n.readAt && "bg-amber-50/40"
                  )}
                >
                  <span
                    className={cn(
                      "grid h-9 w-9 shrink-0 place-items-center rounded-full",
                      isVendor
                        ? "bg-indigo-100 text-indigo-700"
                        : "bg-emerald-100 text-emerald-700"
                    )}
                  >
                    {isVendor ? "V" : "A"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm">{n.content}</div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-[rgb(var(--muted))]">
                      <span className="font-medium">
                        {target?.name ?? "—"}
                      </span>
                      <span>•</span>
                      <span>{target?.email}</span>
                      <span>•</span>
                      <span>
                        {new Date(n.sentAt).toLocaleString("fr-FR", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {!n.readAt && (
                        <>
                          <span>•</span>
                          <span className="font-semibold text-amber-700">Non lu</span>
                        </>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(n.id)}
                    title="Supprimer"
                    className="grid h-7 w-7 shrink-0 place-items-center rounded-md border border-rose-300 bg-rose-50 text-rose-600 hover:bg-rose-100"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5">
                      <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />
                    </svg>
                  </button>
                </li>
              );
            })}
          </ul>
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
  tone: "indigo" | "rose" | "emerald";
}) {
  const map = {
    indigo: { bg: "bg-indigo-50", text: "text-indigo-700" },
    rose: { bg: "bg-rose-50", text: "text-rose-600" },
    emerald: { bg: "bg-emerald-50", text: "text-emerald-700" },
  } as const;
  const t = map[tone];
  return (
    <div className={cn("rounded-2xl p-5", t.bg)}>
      <div className="text-xs font-medium text-[rgb(var(--muted))]">{label}</div>
      <div className={cn("mt-2 text-2xl font-semibold tracking-tight", t.text)}>{value}</div>
    </div>
  );
}

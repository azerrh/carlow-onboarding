"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminShell, AdminPageHeader } from "@/components/admin/AdminShell";
import { cn } from "@/lib/cn";

interface UserRow {
  id: string;
  role: "vendor" | "buyer";
  name: string;
  email: string;
  meta: string;
  status: string;
  createdAt: string;
}

export default function AdminUtilisateursPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [stats, setStats] = useState({ total: 0, vendors: 0, buyers: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"ALL" | "vendor" | "buyer">("ALL");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/users");
        if (res.status === 401) {
          router.replace("/admin/login");
          return;
        }
        const data = await res.json();
        if (res.ok && data.success) {
          setUsers(data.users);
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

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.meta.toLowerCase().includes(q);
    const matchRole = roleFilter === "ALL" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <AdminShell>
      <AdminPageHeader
        breadcrumb={["Dashboard", "Utilisateurs"]}
        title="Tous les utilisateurs"
        subtitle={`${stats.total} compte${stats.total > 1 ? "s" : ""} (${stats.vendors} vendeurs + ${stats.buyers} acheteurs)`}
      />

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Tile label="Total" value={stats.total} tone="indigo" />
        <Tile label="Vendeurs" value={stats.vendors} tone="amber" />
        <Tile label="Acheteurs" value={stats.buyers} tone="emerald" />
      </div>

      <div className="mt-6 rounded-2xl border border-[rgb(var(--border))] bg-white p-4">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom, email, société…"
            className="h-10 flex-1 min-w-[260px] rounded-xl border border-[rgb(var(--border))] bg-[#f8f9fc] px-3 text-sm focus:border-[#6366f1] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#6366f1]/15"
          />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as typeof roleFilter)}
            className="h-10 cursor-pointer rounded-xl border border-[rgb(var(--border))] bg-[#f8f9fc] px-3 text-sm"
          >
            <option value="ALL">Tous rôles</option>
            <option value="vendor">Vendeurs</option>
            <option value="buyer">Acheteurs</option>
          </select>
        </div>

        {loading ? (
          <p className="py-8 text-center text-sm text-[rgb(var(--muted))]">Chargement…</p>
        ) : filtered.length === 0 ? (
          <p className="py-12 text-center text-sm text-[rgb(var(--muted))]">
            Aucun utilisateur.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-[rgb(var(--border))] text-left text-[11px] font-semibold uppercase tracking-wider text-[rgb(var(--muted))]">
                  <th className="py-3 pr-3">Utilisateur</th>
                  <th className="py-3 pr-3">Email</th>
                  <th className="py-3 pr-3">Rôle</th>
                  <th className="py-3 pr-3">Détail</th>
                  <th className="py-3 pr-3">Inscrit le</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr
                    key={`${u.role}-${u.id}`}
                    className="border-b border-[rgb(var(--border))]/60 last:border-0 hover:bg-black/[0.015]"
                  >
                    <td className="py-3 pr-3">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={cn(
                            "grid h-8 w-8 place-items-center rounded-full text-xs font-bold",
                            u.role === "vendor"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-emerald-100 text-emerald-700"
                          )}
                        >
                          {u.name.charAt(0).toUpperCase()}
                        </span>
                        <span className="font-semibold">{u.name}</span>
                      </div>
                    </td>
                    <td className="py-3 pr-3">{u.email}</td>
                    <td className="py-3 pr-3">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold",
                          u.role === "vendor"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-emerald-100 text-emerald-700"
                        )}
                      >
                        {u.role === "vendor" ? "Vendeur" : "Acheteur"}
                      </span>
                    </td>
                    <td className="py-3 pr-3 text-[rgb(var(--muted))]">{u.meta}</td>
                    <td className="py-3 pr-3 text-[rgb(var(--muted))]">
                      {new Date(u.createdAt).toLocaleDateString("fr-FR")}
                    </td>
                  </tr>
                ))}
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
  tone: "indigo" | "amber" | "emerald";
}) {
  const map = {
    indigo: { bg: "bg-indigo-50", text: "text-indigo-700" },
    amber: { bg: "bg-amber-50", text: "text-amber-700" },
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

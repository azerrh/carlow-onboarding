"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminShell, AdminPageHeader } from "@/components/admin/AdminShell";
import { cn } from "@/lib/cn";

interface BuyerRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  createdAt: string;
  _count: { orders: number };
}

export default function AdminAcheteursPage() {
  const router = useRouter();
  const [buyers, setBuyers] = useState<BuyerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  async function reload() {
    try {
      const res = await fetch("/api/admin/buyers");
      if (res.status === 401) {
        router.replace("/admin/login");
        return;
      }
      const data = await res.json();
      if (res.ok && data.success) setBuyers(data.buyers);
      else setError(data?.error || "Erreur de chargement.");
    } catch {
      setError("Erreur reseau.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("Supprimer cet acheteur ?")) return;
    setBuyers((bs) => bs.filter((b) => b.id !== id));
    await fetch(`/api/admin/buyers?id=${encodeURIComponent(id)}`, { method: "DELETE" });
  }

  const filtered = buyers.filter((b) => {
    const q = search.toLowerCase();
    return !q || b.name.toLowerCase().includes(q) || b.email.toLowerCase().includes(q);
  });

  return (
    <AdminShell>
      <AdminPageHeader
        breadcrumb={["Dashboard", "Utilisateurs", "Acheteurs"]}
        title="Acheteurs"
        subtitle={`${buyers.length} acheteur${buyers.length > 1 ? "s" : ""} inscrit${buyers.length > 1 ? "s" : ""}`}
        action={
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-[rgb(var(--primary))] px-4 py-2 text-sm font-semibold text-white hover:bg-[rgb(var(--primary))]/90 transition"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Nouvel acheteur
          </button>
        }
      />

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="animate-slide-up rounded-2xl border border-[rgb(var(--border))] bg-white">
        <div className="border-b border-[rgb(var(--border))] px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-[rgb(var(--primary))]/10 text-[rgb(var(--primary))]">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4 w-4">
                  <circle cx="9" cy="8" r="3.5" />
                  <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
                  <circle cx="17" cy="9" r="2.5" />
                  <path d="M21.5 19c0-2.2-1.7-4-3.8-4.4" />
                </svg>
              </div>
              <h2 className="text-sm font-semibold">Liste des acheteurs</h2>
            </div>
            <span className="text-xs text-[rgb(var(--muted))]">{filtered.length} resultat{filtered.length > 1 ? "s" : ""}</span>
          </div>
          <div className="mt-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par nom ou email…"
              className="h-10 w-full max-w-md rounded-xl border border-[rgb(var(--border))] bg-white px-3 text-sm transition focus:border-[rgb(var(--primary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]/20"
            />
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center">
            <p className="text-sm text-[rgb(var(--muted))]">Chargement…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-black/[0.03] text-[rgb(var(--muted))]">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5">
                <circle cx="9" cy="8" r="3.5" />
                <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
              </svg>
            </div>
            <p className="mt-3 text-sm font-medium">
              {buyers.length === 0 ? "Aucun acheteur inscrit" : "Aucun resultat pour cette recherche"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-[rgb(var(--border))] text-left text-[11px] font-semibold uppercase tracking-wider text-[rgb(var(--muted))]">
                  <th className="px-5 py-3">Acheteur</th>
                  <th className="px-5 py-3">Email</th>
                  <th className="px-5 py-3">Telephone</th>
                  <th className="px-5 py-3">Commandes</th>
                  <th className="px-5 py-3">Inscrit le</th>
                  <th className="px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => (
                  <tr key={b.id} className="border-b border-[rgb(var(--border))]/50 last:border-0 transition hover:bg-black/[0.01]">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[rgb(var(--primary))]/10 text-xs font-bold text-[rgb(var(--primary))]">
                          {b.name.charAt(0).toUpperCase()}
                        </span>
                        <span className="font-semibold">{b.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3">{b.email}</td>
                    <td className="px-5 py-3 text-[rgb(var(--muted))]">{b.phone ?? "—"}</td>
                    <td className="px-5 py-3">
                      <span className="rounded-md bg-[rgb(var(--primary))]/10 px-2 py-0.5 text-xs font-semibold text-[rgb(var(--primary))]">
                        {b._count.orders}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-[rgb(var(--muted))]">
                      {new Date(b.createdAt).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => handleDelete(b.id)}
                        title="Supprimer"
                        className="grid h-7 w-7 place-items-center rounded-md border border-rose-300 bg-rose-50 text-rose-600 hover:bg-rose-100 transition"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5">
                          <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCreate && (
        <CreateBuyerModal
          onClose={() => setShowCreate(false)}
          onCreated={async () => { setShowCreate(false); await reload(); }}
        />
      )}
    </AdminShell>
  );
}

function CreateBuyerModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "", address: "" });
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/buyers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          phone: form.phone.trim() || undefined,
          address: form.address.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setErr(data?.error || "Creation impossible.");
        setSubmitting(false);
        return;
      }
      onCreated();
    } catch {
      setErr("Erreur reseau.");
      setSubmitting(false);
    }
  }

  function generatePassword() {
    const charset = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*";
    let pwd = "";
    const arr = new Uint32Array(16);
    crypto.getRandomValues(arr);
    for (let i = 0; i < arr.length; i++) {
      pwd += charset[arr[i] % charset.length];
    }
    update("password", pwd);
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold">Nouvel acheteur</h2>
            <p className="mt-1 text-sm text-[rgb(var(--muted))]">Le mot de passe sera hache cote serveur.</p>
          </div>
          <button onClick={onClose} aria-label="Fermer" className="grid h-8 w-8 place-items-center rounded-lg text-[rgb(var(--muted))] hover:bg-black/[0.04] transition">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>
        {err && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>}
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <Field label="Nom complet *"><Input required value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Marie Dupont" autoFocus /></Field>
          <Field label="Email *"><Input required type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="marie@exemple.fr" /></Field>
          <Field label="Mot de passe *" hint={<button type="button" onClick={generatePassword} className="text-xs font-semibold text-[rgb(var(--primary))] hover:underline">Generer</button>}><Input required type="text" minLength={8} value={form.password} onChange={(e) => update("password", e.target.value)} placeholder="8 caracteres minimum" className="font-mono" /></Field>
          <Field label="Telephone"><Input type="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="+33 6 12 34 56 78" /></Field>
          <Field label="Adresse de livraison"><Input value={form.address} onChange={(e) => update("address", e.target.value)} placeholder="12 rue des Lilas, 75000 Paris" /></Field>
          <div className="mt-2 flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="h-10 rounded-xl border border-[rgb(var(--border))] bg-white px-4 text-sm font-semibold hover:bg-black/[0.02] transition">Annuler</button>
            <button type="submit" disabled={submitting} className={cn("h-10 rounded-xl bg-[rgb(var(--primary))] px-4 text-sm font-semibold text-white hover:bg-[rgb(var(--primary))]/90 transition", submitting && "opacity-60")}>{submitting ? "Creation…" : "Creer l'acheteur"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1 flex items-baseline justify-between gap-3">
        <span className="text-xs font-medium uppercase tracking-wider text-[rgb(var(--muted))]">{label}</span>
        {hint}
      </div>
      {children}
    </label>
  );
}

function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn("h-10 w-full rounded-xl border border-[rgb(var(--border))] bg-white px-3 text-sm transition focus:border-[rgb(var(--primary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]/20", className)}
    />
  );
}

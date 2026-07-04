"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Field } from "@/components/ui/Field";
import { BuyerNav } from "@/components/buyer/BuyerNav";
import { cn } from "@/lib/cn";

interface Buyer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  createdAt: string;
  _count: { orders: number };
}

export default function BuyerAccountPage() {
  const router = useRouter();
  const [buyer, setBuyer] = useState<Buyer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", address: "" });

  useEffect(() => {
    const buyerId = localStorage.getItem("buyerId");
    if (!buyerId) {
      router.replace("/buyer/login");
      return;
    }

    (async () => {
      try {
        const res = await fetch(`/api/buyer/me?id=${encodeURIComponent(buyerId)}`);
        if (!res.ok) {
          if (res.status === 404) {
            // ID périmé en localStorage
            localStorage.removeItem("buyerId");
            router.replace("/buyer/login");
            return;
          }
          throw new Error();
        }
        const data = await res.json();
        if (data.success) {
          setBuyer(data.buyer);
          setForm({
            name: data.buyer.name,
            phone: data.buyer.phone ?? "",
            address: data.buyer.address ?? "",
          });
        }
      } catch {
        setError("Impossible de charger votre compte.");
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  function handleLogout() {
    localStorage.removeItem("buyerId");
    router.push("/buyer/login");
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!buyer) return;
    setSavingProfile(true);
    setError("");
    try {
      const res = await fetch("/api/buyer/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: buyer.id, ...form }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data?.error || "Sauvegarde impossible.");
        return;
      }
      setBuyer((b) => (b ? { ...b, ...data.buyer } : b));
      setEditing(false);
    } catch {
      setError("Erreur réseau.");
    } finally {
      setSavingProfile(false);
    }
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

      <main className="mx-auto max-w-5xl px-6 py-10">
        {/* Bandeau profil */}
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-[rgb(var(--success))] text-2xl font-bold text-white">
              {buyer.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Bonjour, {buyer.name}
              </h1>
              <p className="text-sm text-[rgb(var(--muted))]">{buyer.email}</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Stats */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <StatTile label="Commandes" value={buyer._count.orders} icon="🛒" />
          <StatTile
            label="Membre depuis"
            value={new Date(buyer.createdAt).toLocaleDateString("fr-FR", {
              month: "long",
              year: "numeric",
            })}
            icon="📅"
          />
          <StatTile label="Statut" value="Actif" icon="✓" />
        </div>

        {/* Mes informations */}
        <Card className="mt-6 p-6 sm:p-8">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Mes informations</h2>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="text-xs font-semibold text-[rgb(var(--primary))] hover:underline"
              >
                Modifier
              </button>
            )}
          </div>

          {editing ? (
            <form onSubmit={handleSaveProfile} className="mt-6 space-y-4">
              <Field label="Nom complet">
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </Field>
              <Field label="Téléphone">
                <Input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+33 6 12 34 56 78"
                />
              </Field>
              <Field label="Adresse de livraison">
                <Input
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="12 rue des Lilas, 75000 Paris"
                />
              </Field>
              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setEditing(false);
                    setForm({
                      name: buyer.name,
                      phone: buyer.phone ?? "",
                      address: buyer.address ?? "",
                    });
                  }}
                  className="flex-1"
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={savingProfile} className="flex-[2]">
                  {savingProfile ? "Enregistrement..." : "Enregistrer"}
                </Button>
              </div>
            </form>
          ) : (
            <dl className="mt-6 grid gap-4 sm:grid-cols-2">
              <InfoRow label="Nom complet" value={buyer.name} />
              <InfoRow label="Email" value={buyer.email} mono />
              <InfoRow label="Téléphone" value={buyer.phone} />
              <InfoRow label="Adresse" value={buyer.address} className="sm:col-span-2" />
            </dl>
          )}
        </Card>

        {/* Mes commandes */}
        <Card className="mt-6 p-6 sm:p-8">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Mes commandes</h2>
            <span className="text-xs text-[rgb(var(--muted))]">
              {buyer._count.orders} au total
            </span>
          </div>

          {buyer._count.orders === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-[rgb(var(--border))] bg-white/50 px-4 py-10 text-center">
              <div className="text-3xl">🛒</div>
              <p className="mt-3 text-sm font-medium">Aucune commande pour l&apos;instant</p>
              <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                Parcourez la marketplace pour passer votre première commande.
              </p>
              <p className="mt-4 text-xs text-[rgb(var(--muted))]">
                <em>Marketplace en cours de finalisation</em>
              </p>
            </div>
          ) : (
            <p className="mt-6 text-sm text-[rgb(var(--muted))]">
              Liste des commandes à venir.
            </p>
          )}
        </Card>

        {/* Infos compte */}
        <Card className="mt-6 p-6">
          <h2 className="text-lg font-semibold">Informations du compte</h2>
          <dl className="mt-5 grid gap-4 sm:grid-cols-2">
            <InfoRow
              label="Compte créé le"
              value={new Date(buyer.createdAt).toLocaleDateString("fr-FR", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            />
            <InfoRow label="ID acheteur" value={buyer.id} mono />
          </dl>
        </Card>

        {/* Confidentialité & RGPD */}
        <RgpdSection buyerId={buyer.id} onDeleted={handleLogout} />

        {/* Liens utiles */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link
            href="/buyer/login"
            className="text-xs text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]"
          >
            Changer de compte
          </Link>
          <span className="text-[rgb(var(--muted))]/50">·</span>
          <button
            onClick={handleLogout}
            className="text-xs text-[rgb(var(--muted))] hover:text-red-600"
          >
            Se déconnecter
          </button>
          <span className="text-[rgb(var(--muted))]/50">·</span>
          <Link
            href="/legal/confidentialite"
            className="text-xs text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]"
          >
            Politique de confidentialité
          </Link>
        </div>
      </main>
    </div>
  );
}

/* ---------- RGPD Section ---------- */

function RgpdSection({
  buyerId,
  onDeleted,
}: {
  buyerId: string;
  onDeleted: () => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteText, setDeleteText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    if (deleteText !== "SUPPRIMER") {
      setError("Tapez exactement SUPPRIMER en majuscules pour confirmer.");
      return;
    }
    setDeleting(true);
    setError("");
    try {
      const res = await fetch(
        `/api/buyer/me?id=${encodeURIComponent(buyerId)}&confirm=DELETE`,
        { method: "DELETE" }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        setError(data?.error ?? "Erreur lors de la suppression.");
        return;
      }
      // Suppression OK → on déconnecte (vide localStorage + redirige).
      onDeleted();
    } catch {
      setError("Erreur réseau, réessayez.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Card className="mt-8 p-6">
      <h2 className="text-base font-semibold">Confidentialité & RGPD</h2>
      <p className="mt-1 text-xs text-[rgb(var(--muted))]">
        Conformément au RGPD, vous pouvez à tout moment télécharger
        l&apos;ensemble de vos données ou demander la suppression de votre
        compte.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {/* Export RGPD */}
        <a
          href={`/api/buyer/me/export?buyerId=${encodeURIComponent(buyerId)}`}
          target="_blank"
          rel="noreferrer"
          className="flex items-start gap-3 rounded-xl border border-[rgb(var(--border))] bg-white p-4 transition hover:border-[rgb(var(--primary))]/30 hover:bg-[rgb(var(--primary))]/[0.04]"
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[rgb(var(--primary))]/10 text-lg">
            📥
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Télécharger mes données</p>
            <p className="mt-0.5 text-[11px] text-[rgb(var(--muted))]">
              Export JSON complet (profil, commandes, favoris, avis).
            </p>
          </div>
        </a>

        {/* Suppression compte */}
        <button
          type="button"
          onClick={() => setConfirmDelete(true)}
          className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50/50 p-4 text-left transition hover:bg-red-50"
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-red-100 text-lg">
            🗑️
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-red-700">
              Supprimer mon compte
            </p>
            <p className="mt-0.5 text-[11px] text-red-600/80">
              Suppression définitive de toutes mes données.
            </p>
          </div>
        </button>
      </div>

      {/* Modal de confirmation suppression */}
      {confirmDelete && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"
          onClick={() => !deleting && setConfirmDelete(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 shadow-xl"
          >
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-red-50 text-3xl">
              ⚠️
            </div>
            <h3 className="mt-4 text-center text-lg font-bold">
              Supprimer définitivement votre compte ?
            </h3>
            <p className="mt-2 text-center text-sm text-[rgb(var(--muted))]">
              Cette action est <strong>irréversible</strong>. Toutes vos
              données seront effacées : profil, commandes, favoris, avis,
              notifications.
            </p>
            <p className="mt-3 text-center text-xs text-amber-700">
              Astuce : pensez à télécharger vos données avant si vous
              souhaitez les conserver.
            </p>

            <div className="mt-5">
              <label className="block text-xs font-semibold">
                Pour confirmer, tapez{" "}
                <span className="font-mono text-red-700">SUPPRIMER</span>
              </label>
              <Input
                value={deleteText}
                onChange={(e) => {
                  setDeleteText(e.target.value);
                  setError("");
                }}
                placeholder="SUPPRIMER"
                className="mt-1.5 font-mono"
                disabled={deleting}
              />
              {error && (
                <p className="mt-2 text-xs text-red-600">{error}</p>
              )}
            </div>

            <div className="mt-5 flex gap-2">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => {
                  setConfirmDelete(false);
                  setDeleteText("");
                  setError("");
                }}
                disabled={deleting}
              >
                Annuler
              </Button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting || deleteText !== "SUPPRIMER"}
                className={cn(
                  "flex-1 rounded-xl px-4 py-2 text-sm font-semibold transition",
                  deleteText === "SUPPRIMER" && !deleting
                    ? "bg-red-600 text-white hover:bg-red-700"
                    : "bg-red-300 text-white cursor-not-allowed"
                )}
              >
                {deleting ? "Suppression…" : "Supprimer définitivement"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Card>
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
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-[rgb(var(--primary))]/10 text-lg">
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

function InfoRow({
  label,
  value,
  mono,
  className,
}: {
  label: string;
  value?: string | null;
  mono?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className="text-xs uppercase tracking-wider text-[rgb(var(--muted))]">{label}</dt>
      <dd className="mt-1">
        <span
          className={cn(
            "text-sm text-[rgb(var(--fg))]",
            mono && "font-mono",
            !value && "text-[rgb(var(--muted))] italic"
          )}
        >
          {value || "Non renseigné"}
        </span>
      </dd>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminShell, AdminPageHeader } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";

/**
 * Page admin "Tokens actifs" — fallback quand Resend est limité.
 *
 * Permet à l'admin de copier le lien de réinitialisation de mot de passe
 * ou de vérification d'email pour le transmettre manuellement à
 * l'utilisateur (par téléphone, SMS, etc.) si l'email n'est pas arrivé.
 *
 * Cas d'usage typique : compte Resend free tier → ne peut envoyer qu'à
 * l'email du propriétaire. Tous les autres destinataires se voient
 * bloqués silencieusement. Cette page débloque les utilisateurs concernés.
 */

interface TokenRow {
  id: string;
  type: "RESET_PASSWORD" | "VERIFY_EMAIL" | string;
  userType: "BUYER" | "VENDOR" | string;
  userEmail: string | null;
  userName: string | null;
  createdAt: string;
  expiresAt: string;
  minutesLeft: number;
  url: string;
}

const TYPE_LABEL: Record<string, { label: string; color: string }> = {
  RESET_PASSWORD: { label: "Reset mot de passe", color: "#E87A30" },
  VERIFY_EMAIL: { label: "Vérification email", color: "#22A06B" },
};

export default function AdminTokensPage() {
  const router = useRouter();
  const [tokens, setTokens] = useState<TokenRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "RESET_PASSWORD" | "VERIFY_EMAIL">(
    "all"
  );

  const fetchTokens = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/tokens");
      if (res.status === 401) {
        router.replace("/admin/login");
        return;
      }
      const data = await res.json();
      if (res.ok && data.success) {
        setTokens(data.tokens ?? []);
      } else {
        setError(data?.error || "Erreur de chargement");
      }
    } catch {
      setError("Erreur réseau");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchTokens();
  }, [fetchTokens]);

  async function copyToClipboard(text: string, id: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // fallback : alert (très rare en prod)
      window.prompt("Copiez le lien manuellement :", text);
    }
  }

  const filtered =
    filter === "all" ? tokens : tokens.filter((t) => t.type === filter);

  return (
    <AdminShell>
      <AdminPageHeader
        breadcrumb={["Admin", "Tokens"]}
        title="Tokens d'authentification actifs"
        subtitle="Liens de réinitialisation et de vérification — utiles si l'email n'arrive pas"
        action={
          <Button size="sm" variant="secondary" onClick={fetchTokens}>
            🔄 Rafraîchir
          </Button>
        }
      />

      {/* Bandeau explicatif */}
      <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <p className="font-semibold">⚠️ Utilisation</p>
        <p className="mt-1 text-xs">
          Cette page liste les liens magiques générés ces dernières 24h, non
          encore utilisés et non expirés. Utilisez-la si l&apos;email
          transactionnel n&apos;a pas été reçu par l&apos;utilisateur (limitation
          Resend free tier, spam, etc.). Cliquez sur le bouton{" "}
          <strong>Copier le lien</strong> et transmettez-le par téléphone ou SMS.
        </p>
      </div>

      {/* Filtres */}
      <div className="mb-4 flex flex-wrap gap-2">
        {[
          { v: "all" as const, label: `Tous (${tokens.length})` },
          {
            v: "RESET_PASSWORD" as const,
            label: `Reset (${tokens.filter((t) => t.type === "RESET_PASSWORD").length})`,
          },
          {
            v: "VERIFY_EMAIL" as const,
            label: `Vérification (${tokens.filter((t) => t.type === "VERIFY_EMAIL").length})`,
          },
        ].map((f) => (
          <button
            key={f.v}
            onClick={() => setFilter(f.v)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-medium transition",
              filter === f.v
                ? "bg-[rgb(var(--primary))] text-white"
                : "bg-black/[0.04] text-[rgb(var(--muted))] hover:bg-black/[0.08]"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <Card className="p-10 text-center text-sm text-[rgb(var(--muted))]">
          Chargement…
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="p-10 text-center">
          <div className="text-3xl">🔑</div>
          <p className="mt-3 text-sm font-semibold">Aucun token actif</p>
          <p className="mt-1 text-xs text-[rgb(var(--muted))]">
            Aucune réinitialisation de mot de passe ou vérification d&apos;email
            en attente sur les dernières 24h.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((t) => {
            const meta = TYPE_LABEL[t.type] ?? {
              label: t.type,
              color: "#888",
            };
            return (
              <Card key={t.id} className="p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                        style={{
                          background: `${meta.color}1a`,
                          color: meta.color,
                        }}
                      >
                        {meta.label}
                      </span>
                      <span className="rounded-md bg-black/[0.04] px-1.5 py-0.5 text-[10px] font-semibold text-[rgb(var(--muted))]">
                        {t.userType}
                      </span>
                      <span className="text-[10px] text-[rgb(var(--muted))]">
                        Expire dans {t.minutesLeft} min
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-semibold">
                      {t.userName ?? "Utilisateur"}
                    </p>
                    <p className="text-xs text-[rgb(var(--muted))]">
                      {t.userEmail ?? "(email indisponible)"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => copyToClipboard(t.url, t.id)}
                    >
                      {copied === t.id ? "✓ Copié !" : "📋 Copier le lien"}
                    </Button>
                    <a
                      href={t.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[rgb(var(--border))] bg-white px-3 text-xs font-medium text-[rgb(var(--muted))] hover:bg-black/[0.02]"
                    >
                      Ouvrir →
                    </a>
                  </div>
                </div>
                <div className="mt-3 break-all rounded-lg border border-[rgb(var(--border))]/60 bg-[rgb(var(--bg))]/40 px-3 py-2 font-mono text-[11px] text-[rgb(var(--muted))]">
                  {t.url}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </AdminShell>
  );
}

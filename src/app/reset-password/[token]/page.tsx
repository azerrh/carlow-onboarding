"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Brand } from "@/components/ui/Brand";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

/**
 * Page de réinitialisation du mot de passe.
 *
 * Le token vient du segment dynamique `[token]`. On ne vérifie pas le
 * token côté client en arrivant (l'API le fera lors du POST) — ça évite
 * un round-trip inutile et garde le token confidentiel jusqu'à la
 * soumission.
 *
 * Après succès, on redirige vers la page de login appropriée selon
 * l'audience retournée par l'API.
 */

function ResetInner() {
  const { token } = useParams();
  const router = useRouter();
  const tokenStr = typeof token === "string" ? token : "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (password !== confirm) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: tokenStr, newPassword: password }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data?.error ?? "Impossible de réinitialiser le mot de passe.");
        return;
      }
      setSuccess(data.message ?? "Mot de passe mis à jour.");
      // Redirection vers la page de login appropriée après 2s.
      setTimeout(() => {
        router.replace(
          data.audience === "VENDOR" ? "/login" : "/buyer/login"
        );
      }, 2000);
    } catch {
      setError("Erreur réseau, réessayez.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="portal-page grid min-h-screen place-items-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <Brand variant="compact" />
        </div>

        <Card className="card-shadow p-8">
          {success ? (
            <div className="text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[rgb(var(--success))]/10 text-2xl">
                ✓
              </div>
              <h1 className="mt-4 text-xl font-semibold">{success}</h1>
              <p className="mt-2 text-sm text-[rgb(var(--muted))]">
                Redirection vers la page de connexion…
              </p>
            </div>
          ) : (
            <>
              <h1 className="text-xl font-semibold tracking-tight">
                Nouveau mot de passe
              </h1>
              <p className="mt-1 text-sm text-[rgb(var(--muted))]">
                Choisissez un nouveau mot de passe pour votre compte Carlow.
              </p>

              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold">
                    Nouveau mot de passe
                  </label>
                  <div className="relative">
                    <Input
                      type={showPwd ? "text" : "password"}
                      required
                      minLength={8}
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min. 8 caractères"
                      className="pr-16"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd((v) => !v)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-[10px] font-semibold text-[rgb(var(--muted))] hover:bg-black/[0.04]"
                    >
                      {showPwd ? "Masquer" : "Voir"}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold">
                    Confirmer le mot de passe
                  </label>
                  <Input
                    type={showPwd ? "text" : "password"}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Retapez le mot de passe"
                  />
                </div>

                {error && (
                  <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                    {error}
                  </p>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading || !password || !confirm}
                >
                  {loading ? "Mise à jour…" : "Mettre à jour mon mot de passe"}
                </Button>
              </form>

              <div className="mt-5 text-center">
                <Link
                  href="/forgot-password"
                  className="text-xs text-[rgb(var(--muted))] hover:text-[rgb(var(--primary))]"
                >
                  Le lien ne fonctionne plus ? Renvoyer un email
                </Link>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="portal-page grid min-h-screen place-items-center">
          <p className="text-sm text-[rgb(var(--muted))]">Chargement…</p>
        </div>
      }
    >
      <ResetInner />
    </Suspense>
  );
}

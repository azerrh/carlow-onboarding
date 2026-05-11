"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Brand } from "@/components/ui/Brand";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/cn";

/**
 * Page "Mot de passe oublié".
 *
 * - Lit `?type=BUYER|VENDOR` pour pré-sélectionner le bon onglet (utile
 *   si on arrive depuis le bouton de la page de login concernée).
 * - Affiche TOUJOURS un message neutre "Si un compte existe…" peu importe
 *   que l'email existe ou non (cohérent avec l'API timing-safe).
 */

type Audience = "BUYER" | "VENDOR";

function ForgotInner() {
  const sp = useSearchParams();
  const initial = (sp.get("type") === "VENDOR" ? "VENDOR" : "BUYER") as Audience;

  const [audience, setAudience] = useState<Audience>(initial);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), audience }),
      });
      if (res.status === 429) {
        const data = await res.json();
        setError(data?.error ?? "Trop de tentatives, réessayez plus tard.");
        return;
      }
      // Peu importe la vraie réponse, on affiche le succès.
      setSubmitted(true);
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
          {submitted ? (
            <div className="text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[rgb(var(--success))]/10 text-2xl">
                ✓
              </div>
              <h1 className="mt-4 text-xl font-semibold">Email envoyé</h1>
              <p className="mt-2 text-sm text-[rgb(var(--muted))]">
                Si un compte existe pour <strong>{email}</strong>, vous allez
                recevoir un email avec un lien pour réinitialiser votre mot
                de passe. Le lien expire dans 1 heure.
              </p>
              <p className="mt-3 text-xs text-[rgb(var(--muted))]">
                Pensez à vérifier vos spams si vous ne le voyez pas.
              </p>
              <div className="mt-6 flex flex-col gap-2">
                <Link
                  href={audience === "VENDOR" ? "/login" : "/buyer/login"}
                >
                  <Button className="w-full">Retour à la connexion</Button>
                </Link>
              </div>
            </div>
          ) : (
            <>
              <h1 className="text-xl font-semibold tracking-tight">
                Mot de passe oublié ?
              </h1>
              <p className="mt-1 text-sm text-[rgb(var(--muted))]">
                Indiquez votre email, nous vous enverrons un lien pour
                choisir un nouveau mot de passe.
              </p>

              {/* Sélection du type de compte */}
              <div className="mt-5 grid grid-cols-2 gap-2 rounded-xl bg-black/[0.04] p-1">
                <button
                  type="button"
                  onClick={() => setAudience("BUYER")}
                  className={cn(
                    "rounded-lg px-3 py-2 text-xs font-medium transition",
                    audience === "BUYER"
                      ? "bg-white text-[rgb(var(--fg))] shadow-sm"
                      : "text-[rgb(var(--muted))]"
                  )}
                >
                  Compte acheteur
                </button>
                <button
                  type="button"
                  onClick={() => setAudience("VENDOR")}
                  className={cn(
                    "rounded-lg px-3 py-2 text-xs font-medium transition",
                    audience === "VENDOR"
                      ? "bg-white text-[rgb(var(--fg))] shadow-sm"
                      : "text-[rgb(var(--muted))]"
                  )}
                >
                  Compte vendeur
                </button>
              </div>

              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                <div>
                  <label
                    htmlFor="email"
                    className="mb-1.5 block text-xs font-semibold"
                  >
                    Adresse email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="vous@example.com"
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
                  disabled={loading || !email}
                >
                  {loading ? "Envoi…" : "Envoyer le lien de réinitialisation"}
                </Button>
              </form>

              <div className="mt-5 flex items-center justify-between text-xs">
                <Link
                  href={audience === "VENDOR" ? "/login" : "/buyer/login"}
                  className="text-[rgb(var(--muted))] hover:text-[rgb(var(--primary))]"
                >
                  ← Retour à la connexion
                </Link>
                <Link
                  href={audience === "VENDOR" ? "/register" : "/buyer/register"}
                  className="text-[rgb(var(--muted))] hover:text-[rgb(var(--primary))]"
                >
                  Créer un compte
                </Link>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="portal-page grid min-h-screen place-items-center">
          <p className="text-sm text-[rgb(var(--muted))]">Chargement…</p>
        </div>
      }
    >
      <ForgotInner />
    </Suspense>
  );
}

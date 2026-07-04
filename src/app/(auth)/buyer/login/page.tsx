"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Brand } from "@/components/ui/Brand";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Field } from "@/components/ui/Field";
import { cn } from "@/lib/cn";

export default function BuyerLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/buyer/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data?.error || "Email ou mot de passe incorrect");
        setLoading(false);
        return;
      }
      localStorage.setItem("buyerId", data.buyerId);
      // Retour à la page d'origine si fournie (ex: panier marketplace), sinon compte.
      const redirect = new URLSearchParams(window.location.search).get("redirect");
      router.push(redirect || "/buyer/account");
    } catch {
      setError("Erreur réseau.");
      setLoading(false);
    }
  }

  return (
    <div className="portal-page grid min-h-screen place-items-center px-4 py-12">
      {/* Décoration de fond */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-[rgb(var(--success))]/8 blur-3xl" />
        <div className="absolute -left-24 top-1/4 h-80 w-80 rounded-full bg-[rgb(var(--primary))]/6 blur-3xl" />
        <div className="absolute bottom-0 right-1/3 h-64 w-64 rounded-full bg-[rgb(var(--success))]/5 blur-3xl" />
      </div>

      <Card className="relative w-full max-w-[420px] animate-fade-in overflow-hidden p-0">
        {/* Bande dégradée acheteur (vert) */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[rgb(var(--success))] via-[#28c87a] to-[#1a9656]" />

        <div className="p-8 sm:p-10">
          <Link href="/" aria-label="Retour à l'accueil" className="mb-7 inline-block transition hover:opacity-80">
            <Brand />
          </Link>

          <RoleLoginToggle current="buyer" />

          <h1 className="mt-7 text-[22px] font-bold tracking-tight">
            Espace acheteur
          </h1>
          <p className="mt-1 text-sm text-[rgb(var(--muted))]">
            Connectez-vous pour accéder à la marketplace
          </p>

          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            <Field label="Email">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="marie@exemple.fr"
                required
                autoComplete="email"
              />
            </Field>

            <Field label="Mot de passe">
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Votre mot de passe"
                required
                autoComplete="current-password"
              />
            </Field>

            <div className="flex justify-end -mt-1">
              <a
                href="/forgot-password?type=BUYER"
                className="text-xs font-semibold text-[rgb(var(--primary))] hover:underline underline-offset-2"
              >
                Mot de passe oublié ?
              </a>
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700 animate-fade-in">
                ⚠️ {error}
              </div>
            )}

            <Button type="submit" disabled={loading} className="mt-1 w-full" size="lg">
              {loading ? "Connexion en cours…" : "Se connecter"}
            </Button>
          </form>

          <div className="mt-7 border-t border-[rgb(var(--border))]/60 pt-5 text-center text-sm text-[rgb(var(--muted))]">
            <span>Pas encore de compte ? </span>
            <a
              className="font-bold text-[rgb(var(--primary))] hover:underline underline-offset-2"
              href="/buyer/register"
            >
              Créer un compte
            </a>
          </div>
        </div>
      </Card>
    </div>
  );
}

function RoleLoginToggle({ current }: { current: "vendor" | "buyer" }) {
  return (
    <div className="grid grid-cols-2 gap-1.5 rounded-2xl border border-[rgb(var(--border))]/70 bg-[rgb(var(--bg))]/60 p-1">
      <Link
        href="/buyer/login"
        className={cn(
          "flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-150",
          current === "buyer"
            ? "bg-[rgb(var(--card))] text-[rgb(var(--fg))] shadow-sm"
            : "text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]"
        )}
      >
        <span className="text-base">🛒</span>
        Acheteur
      </Link>
      <Link
        href="/login"
        className={cn(
          "flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-150",
          current === "vendor"
            ? "bg-[rgb(var(--card))] text-[rgb(var(--fg))] shadow-sm"
            : "text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]"
        )}
      >
        <span className="text-base">🏪</span>
        Vendeur
      </Link>
    </div>
  );
}

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

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    if (data.success) {
      localStorage.setItem("vendorId", data.vendorId);
      router.push("/step-2-company");
    } else {
      setError(data.error);
      setLoading(false);
    }
  }

  return (
    <div className="portal-page grid min-h-screen lg:grid-cols-2">
      {/* Colonne gauche — argumentaire */}
      <div className="relative hidden flex-col justify-center overflow-hidden px-14 py-12 lg:flex">
        {/* Décor */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-20 top-1/4 h-80 w-80 rounded-full bg-[rgb(var(--primary))]/10 blur-3xl" />
          <div className="absolute -right-10 bottom-1/4 h-72 w-72 rounded-full bg-[rgb(var(--success))]/8 blur-3xl" />
        </div>

        <div className="relative max-w-xl">
          <div className="inline-flex items-center gap-2.5 rounded-2xl border border-[rgb(var(--border))]/60 bg-[rgb(var(--card))]/70 px-4 py-2 backdrop-blur">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-[rgb(var(--primary))] to-[#c05510] font-bold text-white shadow-[0_2px_8px_rgb(var(--primary)/0.35)]">
              C
            </div>
            <div className="font-bold tracking-tight">Carlow</div>
          </div>

          <h2 className="mt-8 text-4xl font-bold leading-tight tracking-tight">
            Rejoignez le portail{" "}
            <span className="gradient-text">vendeur</span>
          </h2>
          <p className="mt-3 max-w-lg text-base text-[rgb(var(--muted))]">
            Onboarding rapide, vérifications automatiques et suivi clair de
            votre dossier — activation en moins de 24h.
          </p>

          <div className="mt-8 space-y-3">
            {[
              { icon: "🛡️", title: "Vérification TVA (VIES)", desc: "Validation officielle et pré-remplissage automatique." },
              { icon: "📊", title: "Suivi de progression", desc: "6 étapes claires du dossier jusqu'à la soumission." },
              { icon: "🚀", title: "Activation rapide", desc: "Votre compte validé sous 24 à 48h ouvrées." },
            ].map((item) => (
              <div
                key={item.title}
                className="flex items-center gap-3 rounded-2xl border border-[rgb(var(--border))]/60 bg-[rgb(var(--card))]/60 p-4 backdrop-blur transition hover:border-[rgb(var(--primary))]/30"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[rgb(var(--primary))]/15 to-[rgb(var(--primary))]/8 text-lg">
                  {item.icon}
                </span>
                <div>
                  <div className="text-sm font-bold">{item.title}</div>
                  <div className="mt-0.5 text-xs text-[rgb(var(--muted))]">
                    {item.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Colonne droite — formulaire */}
      <div className="grid place-items-center px-4 py-10">
        <Card className="w-full max-w-[440px] animate-fade-in overflow-hidden p-0">
          {/* Bande dégradée */}
          <div className="h-1.5 w-full bg-gradient-to-r from-[rgb(var(--primary))] via-[#e8923a] to-[#c05510]" />

          <div className="p-8 sm:p-10">
          <Brand className="mb-7" />

          {/* Toggle Acheteur/Vendeur */}
          <RoleToggle current="vendor" />

          <h1 className="mt-7 text-[22px] font-bold tracking-tight">
            Créez votre compte vendeur
          </h1>
          <p className="mt-1 text-sm text-[rgb(var(--muted))]">
            Rejoignez la marketplace B2B spécialiste EnR
          </p>

          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            <Field label="Nom complet">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Paul-Emile Dours"
                required
                autoComplete="name"
              />
            </Field>
            <Field label="Email professionnel">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contact@entreprise.fr"
                required
                autoComplete="email"
              />
            </Field>
            <Field label="Mot de passe" hint="8 caractères minimum">
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="8 caractères minimum"
                required
                minLength={8}
                autoComplete="new-password"
              />
            </Field>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full" size="lg">
              {loading ? "Création en cours..." : "Créer mon compte →"}
            </Button>
          </form>

          <div className="mt-7 border-t border-[rgb(var(--border))]/60 pt-5 text-center text-sm text-[rgb(var(--muted))]">
            <span>Déjà un compte ? </span>
            <a className="font-bold text-[rgb(var(--primary))] hover:underline underline-offset-2" href="/login">
              Se connecter
            </a>
          </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

/**
 * Toggle entre les deux rôles (vendeur / acheteur).
 * Utilisé en haut des formulaires d'inscription pour rediriger vers
 * /register (vendeur) ou /buyer/register (acheteur).
 */
function RoleToggle({ current }: { current: "vendor" | "buyer" }) {
  return (
    <div className="mb-1">
      <div className="mb-2 text-xs font-medium uppercase tracking-wider text-[rgb(var(--muted))]">
        Je m&apos;inscris en tant que
      </div>
      <div className="grid grid-cols-2 gap-1.5 rounded-2xl border border-[rgb(var(--border))]/70 bg-[rgb(var(--bg))]/60 p-1">
        <Link
          href="/buyer/register"
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
          href="/register"
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
    </div>
  );
}
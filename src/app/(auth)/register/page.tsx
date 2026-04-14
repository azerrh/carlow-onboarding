"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Brand } from "@/components/ui/Brand";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Field } from "@/components/ui/Field";

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
      <div className="hidden lg:flex flex-col justify-center px-14 py-12">
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-2 text-white backdrop-blur">
            <div className="h-8 w-8 rounded-lg bg-white/15 grid place-items-center font-semibold">
              C
            </div>
            <div className="font-semibold tracking-tight">Carlow</div>
          </div>

          <h2 className="mt-8 text-4xl font-semibold tracking-tight text-[rgb(var(--fg))]">
            Rejoignez le portail vendeur
          </h2>
          <p className="mt-3 text-base text-[rgb(var(--muted))] max-w-lg">
            Onboarding rapide, vérifications automatiques et suivi clair de votre dossier.
          </p>

          <div className="mt-8 grid grid-cols-2 gap-4 text-sm">
            <div className="rounded-2xl border border-[rgb(var(--border))] bg-white/70 p-4">
              <div className="font-semibold">Vérification TVA (VIES)</div>
              <div className="mt-1 text-[rgb(var(--muted))]">
                Validation et pré-remplissage quand possible.
              </div>
            </div>
            <div className="rounded-2xl border border-[rgb(var(--border))] bg-white/70 p-4">
              <div className="font-semibold">Suivi de progression</div>
              <div className="mt-1 text-[rgb(var(--muted))]">
                Étapes claires du dossier jusqu’à la soumission.
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid place-items-center px-4 py-10">
        <Card className="w-full max-w-[440px] p-8 sm:p-10">
          <Brand className="mb-7" />

          <h1 className="text-2xl font-semibold tracking-tight">
            Créez votre compte
          </h1>
          <p className="mt-1 text-sm text-[rgb(var(--muted))]">
            Rejoignez la marketplace BtoB spécialiste EnR
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

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Création en cours..." : "Créer mon compte →"}
            </Button>
          </form>

          <div className="mt-7 border-t border-black/5 pt-5 text-center text-sm text-[rgb(var(--muted))]">
            <span>Déjà un compte ? </span>
            <a className="font-semibold text-[rgb(var(--primary))]" href="/login">
              Se connecter
            </a>
          </div>
        </Card>
      </div>
    </div>
  );
}
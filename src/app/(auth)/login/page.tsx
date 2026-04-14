"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Brand } from "@/components/ui/Brand";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Field } from "@/components/ui/Field";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (data.success) {
      localStorage.setItem("vendorId", data.vendorId);
      router.push("/dashboard");
    } else {
      setError(data.error || "Email ou mot de passe incorrect");
      setLoading(false);
    }
  }

  return (
    <div className="portal-page grid min-h-screen place-items-center px-4 py-10">
      <Card className="w-full max-w-[440px] p-8 sm:p-10">
        <Brand className="mb-7" />

        <h1 className="text-2xl font-semibold tracking-tight">Bon retour !</h1>
        <p className="mt-1 text-sm text-[rgb(var(--muted))]">
          Connectez-vous à votre espace vendeur
        </p>

        <form onSubmit={handleSubmit} className="mt-7 space-y-4">
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

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Connexion..." : "Se connecter →"}
          </Button>
        </form>

        <div className="mt-7 border-t border-black/5 pt-5 text-center text-sm text-[rgb(var(--muted))]">
          <span>Pas encore de compte ? </span>
          <a className="font-semibold text-[rgb(var(--primary))]" href="/register">
            Créer un compte
          </a>
        </div>
      </Card>
    </div>
  );
}
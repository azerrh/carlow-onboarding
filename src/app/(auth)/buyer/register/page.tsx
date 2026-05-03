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

export default function BuyerRegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    address: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/buyer/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data?.error || "Création impossible.");
        setLoading(false);
        return;
      }
      localStorage.setItem("buyerId", data.buyerId);
      router.push("/buyer/account");
    } catch {
      setError("Erreur réseau.");
      setLoading(false);
    }
  }

  return (
    <div className="portal-page grid min-h-screen lg:grid-cols-2">
      {/* Panneau d'info */}
      <div className="hidden lg:flex flex-col justify-center px-14 py-12">
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-2 text-white backdrop-blur">
            <div className="h-8 w-8 rounded-lg bg-white/15 grid place-items-center font-semibold">
              C
            </div>
            <div className="font-semibold tracking-tight">Carlow</div>
          </div>

          <h2 className="mt-8 text-4xl font-semibold tracking-tight text-[rgb(var(--fg))]">
            Sourcez vos équipements EnR
          </h2>
          <p className="mt-3 text-base text-[rgb(var(--muted))] max-w-lg">
            Accédez au catalogue des vendeurs certifiés européens. Panneaux,
            onduleurs, batteries, IRVE — tout au même endroit.
          </p>

          <div className="mt-8 grid grid-cols-2 gap-4 text-sm">
            <div className="rounded-2xl border border-[rgb(var(--border))] bg-white/70 p-4">
              <div className="font-semibold">Vendeurs certifiés</div>
              <div className="mt-1 text-[rgb(var(--muted))]">
                Tous nos vendeurs sont contrôlés (TVA, K-Bis, CE).
              </div>
            </div>
            <div className="rounded-2xl border border-[rgb(var(--border))] bg-white/70 p-4">
              <div className="font-semibold">Paiement sécurisé</div>
              <div className="mt-1 text-[rgb(var(--muted))]">
                Stripe Connect, traçabilité des transactions.
              </div>
            </div>
            <div className="rounded-2xl border border-[rgb(var(--border))] bg-white/70 p-4">
              <div className="font-semibold">Logistique transparente</div>
              <div className="mt-1 text-[rgb(var(--muted))]">
                Délais et incoterms affichés par chaque vendeur.
              </div>
            </div>
            <div className="rounded-2xl border border-[rgb(var(--border))] bg-white/70 p-4">
              <div className="font-semibold">Support européen</div>
              <div className="mt-1 text-[rgb(var(--muted))]">
                Une équipe pour vous accompagner sur chaque commande.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Formulaire */}
      <div className="grid place-items-center px-4 py-10">
        <Card className="w-full max-w-[440px] p-8 sm:p-10">
          <Brand className="mb-7" />

          {/* Toggle */}
          <RoleToggle current="buyer" />

          <h1 className="mt-6 text-2xl font-semibold tracking-tight">
            Créez votre compte acheteur
          </h1>
          <p className="mt-1 text-sm text-[rgb(var(--muted))]">
            Accès immédiat à la marketplace
          </p>

          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            <Field label="Nom complet">
              <Input
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                placeholder="Marie Dupont"
                required
                autoComplete="name"
              />
            </Field>
            <Field label="Email">
              <Input
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                placeholder="marie@exemple.fr"
                required
                autoComplete="email"
              />
            </Field>
            <Field label="Mot de passe" hint="8 caractères minimum">
              <Input
                type="password"
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
                placeholder="8 caractères minimum"
                required
                minLength={8}
                autoComplete="new-password"
              />
            </Field>
            <Field label="Téléphone" hint="Optionnel">
              <Input
                type="tel"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                placeholder="+33 6 12 34 56 78"
                autoComplete="tel"
              />
            </Field>
            <Field label="Adresse de livraison" hint="Optionnel">
              <Input
                value={form.address}
                onChange={(e) => update("address", e.target.value)}
                placeholder="12 rue des Lilas, 75000 Paris"
                autoComplete="street-address"
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
            <a
              className="font-semibold text-[rgb(var(--primary))]"
              href="/buyer/login"
            >
              Se connecter
            </a>
          </div>
        </Card>
      </div>
    </div>
  );
}

function RoleToggle({ current }: { current: "vendor" | "buyer" }) {
  return (
    <div className="mb-1">
      <div className="mb-2 text-xs font-medium uppercase tracking-wider text-[rgb(var(--muted))]">
        Je m&apos;inscris en tant que
      </div>
      <div className="grid grid-cols-2 gap-2 rounded-2xl border border-[rgb(var(--border))] bg-black/[0.02] p-1">
        <Link
          href="/buyer/register"
          className={cn(
            "flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition",
            current === "buyer"
              ? "bg-white text-[rgb(var(--fg))] shadow-sm"
              : "text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]"
          )}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4 w-4">
            <circle cx="9" cy="20" r="1.5" />
            <circle cx="17" cy="20" r="1.5" />
            <path d="M3 4h2l2.5 11h11l2-8H6" />
          </svg>
          Acheteur
        </Link>
        <Link
          href="/register"
          className={cn(
            "flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition",
            current === "vendor"
              ? "bg-white text-[rgb(var(--fg))] shadow-sm"
              : "text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]"
          )}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4 w-4">
            <path d="M3 8l1.5-3h15L21 8" />
            <path d="M4 8v11h16V8" />
          </svg>
          Vendeur
        </Link>
      </div>
    </div>
  );
}

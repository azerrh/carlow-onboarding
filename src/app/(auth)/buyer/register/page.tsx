"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Brand } from "@/components/ui/Brand";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Field } from "@/components/ui/Field";
import { cn } from "@/lib/cn";

export default function BuyerRegisterPage() {
  return (
    <Suspense fallback={null}>
      <BuyerRegisterInner />
    </Suspense>
  );
}

function BuyerRegisterInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    address: "",
    referralCode: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showReferral, setShowReferral] = useState(false);

  // Pré-remplit le code parrain si l'utilisateur arrive via un lien
  // /buyer/register?ref=CARLOW-XXXX
  useEffect(() => {
    const refFromUrl = searchParams.get("ref");
    if (refFromUrl) {
      const cleanCode = refFromUrl.trim().toUpperCase();
      setForm((f) => ({ ...f, referralCode: cleanCode }));
      setShowReferral(true);
    }
  }, [searchParams]);

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
      // Retour à la page d'origine si fournie (ex: panier marketplace), sinon compte.
      const redirect = new URLSearchParams(window.location.search).get("redirect");
      router.push(redirect || "/buyer/account");
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
          <Link href="/" aria-label="Retour à l'accueil" className="mb-7 inline-block transition hover:opacity-80">
            <Brand />
          </Link>

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

            {/* Code parrainage — collapsible */}
            <div className="rounded-2xl border border-dashed border-[rgb(var(--primary))]/25 bg-gradient-to-br from-[rgb(var(--primary))]/[0.03] to-transparent p-3">
              {showReferral ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[rgb(var(--primary))]">
                      🎁 Code parrainage
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setShowReferral(false);
                        update("referralCode", "");
                      }}
                      className="text-[10px] font-medium text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]"
                    >
                      Retirer
                    </button>
                  </div>
                  <Input
                    value={form.referralCode}
                    onChange={(e) =>
                      update(
                        "referralCode",
                        e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, "")
                      )
                    }
                    placeholder="CARLOW-XXXXXX"
                    maxLength={14}
                    className="font-mono uppercase tracking-wider"
                  />
                  <p className="text-[10px] text-[rgb(var(--muted))]">
                    💰 Recevez <strong className="text-[rgb(var(--success))]">10€ de crédit</strong> dès votre 1ère commande livrée. Votre parrain reçoit aussi 10€.
                  </p>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowReferral(true)}
                  className="flex w-full items-center justify-between gap-2 text-left"
                >
                  <span className="flex items-center gap-2 text-xs font-semibold text-[rgb(var(--primary))]">
                    <span className="text-base">🎁</span>
                    Vous avez un code parrainage ?
                  </span>
                  <span className="text-[11px] font-medium text-[rgb(var(--muted))]">
                    + Ajouter
                  </span>
                </button>
              )}
            </div>

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

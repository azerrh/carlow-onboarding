"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Brand } from "@/components/ui/Brand";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

const FEATURES = [
  {
    icon: "⚡",
    title: "Énergies renouvelables",
    desc: "Photovoltaïque, pompes à chaleur, biomasse, mobilité IRVE.",
  },
  {
    icon: "🛡️",
    title: "Conformité garantie",
    desc: "Vérification automatique des documents réglementaires et certifications CE.",
  },
  {
    icon: "🚀",
    title: "Mise en ligne rapide",
    desc: "Onboarding guidé en 6 étapes. Activation en moins de 24h.",
  },
  {
    icon: "💼",
    title: "Plateforme B2B européenne",
    desc: "Accédez à des milliers d'installateurs professionnels qualifiés.",
  },
];

const STEPS = [
  { n: "1", t: "Compte", d: "Créez votre espace vendeur" },
  { n: "2", t: "Société", d: "Informations légales & TVA" },
  { n: "3", t: "Documents", d: "K-Bis, statuts, RIB, identité" },
  { n: "4", t: "Certifications", d: "CE, Certisolis PPE2" },
  { n: "5", t: "Logistique", d: "Incoterms & livraisons" },
  { n: "6", t: "Confirmation", d: "Activation de votre compte" },
];

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="portal-page min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-[rgb(var(--border))]/60 bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Brand />
          <nav className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost" size="sm">Se connecter</Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Devenir vendeur</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pt-16 pb-20 sm:pt-24 sm:pb-28">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[rgb(var(--primary))]/25 bg-[rgb(var(--primary))]/[0.08] px-3 py-1 text-xs font-semibold text-[rgb(var(--primary))]">
              <span className="h-1.5 w-1.5 rounded-full bg-[rgb(var(--primary))]" />
              Portail vendeur · Ouverture 2026
            </div>
            <h1 className="mt-5 text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
              Vendez vos équipements <span className="text-[rgb(var(--primary))]">EnR</span> en toute confiance.
            </h1>
            <p className="mt-5 max-w-xl text-base text-[rgb(var(--muted))] sm:text-lg">
              Carlow est la première marketplace européenne dédiée aux équipements d'énergies renouvelables neufs et reconditionnés. Rejoignez-nous en quelques minutes.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button
                onClick={() => router.push("/register")}
                className="sm:w-auto"
              >
                Créer mon compte vendeur →
              </Button>
              <Button
                variant="secondary"
                onClick={() => router.push("/login")}
                className="sm:w-auto"
              >
                J'ai déjà un compte
              </Button>
            </div>

            {/* Stats trust bar */}
            <div className="mt-10 grid max-w-md grid-cols-3 gap-6">
              <div>
                <p className="text-2xl font-semibold text-[rgb(var(--fg))]">500+</p>
                <p className="text-xs text-[rgb(var(--muted))]">Vendeurs actifs</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-[rgb(var(--fg))]">24h</p>
                <p className="text-xs text-[rgb(var(--muted))]">Activation</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-[rgb(var(--fg))]">6</p>
                <p className="text-xs text-[rgb(var(--muted))]">Catégories EnR</p>
              </div>
            </div>
          </div>

          {/* Visuel preview */}
          <div className="relative">
            <Card className="relative p-6 sm:p-8">
              <div className="flex items-center gap-3 border-b border-[rgb(var(--border))] pb-4">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-[rgb(var(--primary))] text-white font-bold">C</div>
                <div>
                  <p className="text-sm font-semibold">Votre onboarding</p>
                  <p className="text-xs text-[rgb(var(--muted))]">Progression étape 3 / 6</p>
                </div>
              </div>
              <div className="mt-5 space-y-3">
                {[
                  { done: true, label: "Compte créé" },
                  { done: true, label: "Informations société" },
                  { done: true, label: "Documents déposés" },
                  { done: false, label: "Certifications produits" },
                ].map((s, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`grid h-7 w-7 place-items-center rounded-lg text-xs font-bold ${s.done ? "bg-[rgb(var(--success))] text-white" : "bg-black/[0.08] text-[rgb(var(--muted))]"}`}>
                      {s.done ? "✓" : i + 1}
                    </div>
                    <span className={`text-sm ${s.done ? "text-[rgb(var(--fg))] font-medium" : "text-[rgb(var(--muted))]"}`}>{s.label}</span>
                  </div>
                ))}
              </div>
              <div className="mt-5 h-2 w-full overflow-hidden rounded-full bg-black/[0.06]">
                <div className="h-full w-1/2 rounded-full bg-[rgb(var(--primary))]" />
              </div>
            </Card>

            {/* Decoration */}
            <div className="absolute -top-6 -right-6 -z-0 h-24 w-24 rounded-full bg-[rgb(var(--primary))]/20 blur-2xl" />
            <div className="absolute -bottom-6 -left-6 -z-0 h-32 w-32 rounded-full bg-[rgb(var(--success))]/20 blur-3xl" />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-[rgb(var(--primary))]">Pourquoi Carlow</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            La plateforme B2B pensée pour les pros des EnR
          </h2>
          <p className="mt-4 text-[rgb(var(--muted))]">
            Une marketplace spécialisée, exigeante sur la qualité, simple à utiliser.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <Card key={f.title} className="p-6">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-[rgb(var(--primary))]/10 text-2xl">
                {f.icon}
              </div>
              <h3 className="mt-4 text-base font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-[rgb(var(--muted))]">{f.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Steps */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-[rgb(var(--primary))]">Onboarding</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            Devenez vendeur en 6 étapes
          </h2>
          <p className="mt-4 text-[rgb(var(--muted))]">
            Moins de 20 minutes pour finaliser votre dossier.
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {STEPS.map((s) => (
            <Card key={s.n} className="flex items-start gap-4 p-5">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[rgb(var(--primary))] text-sm font-bold text-white">
                {s.n}
              </div>
              <div>
                <h3 className="text-sm font-semibold">{s.t}</h3>
                <p className="mt-0.5 text-xs text-[rgb(var(--muted))]">{s.d}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA final */}
      <section className="mx-auto max-w-6xl px-6 pt-10 pb-20">
        <Card className="overflow-hidden p-10 sm:p-14">
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-2xl font-semibold sm:text-3xl">
                Prêt à rejoindre Carlow ?
              </h2>
              <p className="mt-2 text-[rgb(var(--muted))]">
                Créez votre compte vendeur gratuitement et accédez à notre réseau d'installateurs.
              </p>
            </div>
            <Button onClick={() => router.push("/register")}>
              Commencer maintenant →
            </Button>
          </div>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-[rgb(var(--border))] bg-white/60">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
          <Brand variant="compact" />
          <p className="text-xs text-[rgb(var(--muted))]">
            © 2026 Carlow · Portail vendeur · Tous droits réservés
          </p>
          <div className="flex gap-4 text-xs text-[rgb(var(--muted))]">
            <Link href="/login" className="hover:text-[rgb(var(--fg))]">Connexion</Link>
            <a href="https://carlow.fr" target="_blank" rel="noreferrer" className="hover:text-[rgb(var(--fg))]">Site principal</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

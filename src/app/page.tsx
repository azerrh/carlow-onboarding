"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Brand } from "@/components/ui/Brand";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ProductCardSkeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/cn";

interface MarketplaceProduct {
  id: string;
  name: string;
  price: number;
  imageUrl: string | null;
  category: string | null;
  vendor: { name: string };
}

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

const TRUST_LOGOS = [
  { label: "Stripe", subtitle: "Paiements sécurisés" },
  { label: "VIES", subtitle: "TVA EU validée" },
  { label: "Solelh Energie", subtitle: "Sponsor industriel" },
  { label: "Resend", subtitle: "Emails transactionnels" },
];

function formatPrice(p: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(p);
}

export default function HomePage() {
  const router = useRouter();
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Charge un échantillon de produits réels pour la section "Marketplace
  // preview". Si aucun produit n'existe en DB, on tombe sur un état vide
  // élégant plutôt que des placeholders fake.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/marketplace/products");
        const data = await res.json();
        if (cancelled) return;
        if (res.ok && data.success && Array.isArray(data.products)) {
          setProducts(data.products.slice(0, 3));
        }
      } catch {
        // silencieux — on affiche juste l'état "marketplace en construction"
      } finally {
        if (!cancelled) setLoadingProducts(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="portal-page min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-[rgb(var(--border))]/60 bg-white/75 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
          <Brand variant="compact" />
          <nav className="flex items-center gap-1 sm:gap-2">
            <Link href="/marketplace" className="hidden sm:inline-flex">
              <Button variant="ghost" size="sm">
                Marketplace
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Connexion
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Devenir vendeur</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-4 pb-16 pt-12 sm:px-6 sm:pb-24 sm:pt-20">
          <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-[rgb(var(--primary))]/25 bg-[rgb(var(--primary))]/[0.08] px-3 py-1 text-xs font-semibold text-[rgb(var(--primary))]">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[rgb(var(--primary))] opacity-50" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[rgb(var(--primary))]" />
                </span>
                Marketplace B2B EnR · Ouverture 2026
              </div>

              <h1 className="mt-5 text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-[3.4rem]">
                La marketplace dédiée aux{" "}
                <span className="bg-gradient-to-r from-[rgb(var(--primary))] to-[rgb(var(--success))] bg-clip-text text-transparent">
                  équipements EnR
                </span>{" "}
                des pros.
              </h1>

              <p className="mt-5 max-w-xl text-base text-[rgb(var(--muted))] sm:text-lg">
                Acheteurs : trouvez du matériel certifié, livré rapidement.
                Vendeurs : touchez des milliers d&apos;installateurs européens
                en un seul portail.
              </p>

              {/* Dual CTA */}
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button
                  onClick={() => router.push("/marketplace")}
                  className="sm:w-auto"
                >
                  Explorer la marketplace →
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => router.push("/register")}
                  className="sm:w-auto"
                >
                  Devenir vendeur
                </Button>
              </div>

              {/* Mini trust bar */}
              <div className="mt-10 grid max-w-md grid-cols-3 gap-6">
                <Trust label="500+" sub="Vendeurs actifs" />
                <Trust label="< 24h" sub="Activation compte" />
                <Trust label="6" sub="Catégories EnR" />
              </div>
            </div>

            {/* Visual : carte "onboarding live" stylisée */}
            <div className="relative lg:col-span-5">
              <div className="absolute -top-10 -right-10 -z-0 h-40 w-40 rounded-full bg-[rgb(var(--primary))]/25 blur-3xl" />
              <div className="absolute -bottom-10 -left-6 -z-0 h-44 w-44 rounded-full bg-[rgb(var(--success))]/25 blur-3xl" />

              <Card className="card-shadow relative animate-float-slow p-6 sm:p-8">
                <div className="flex items-center gap-3 border-b border-[rgb(var(--border))] pb-4">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-[rgb(var(--primary))] to-[rgb(var(--primary))]/70 text-base font-bold text-white shadow-sm">
                    C
                  </div>
                  <div>
                    <p className="text-sm font-semibold">
                      Onboarding vendeur
                    </p>
                    <p className="text-xs text-[rgb(var(--muted))]">
                      Étape 3 / 6 · Documents
                    </p>
                  </div>
                  <div className="ml-auto rounded-full bg-[rgb(var(--success))]/10 px-2.5 py-0.5 text-[10px] font-semibold text-[rgb(var(--success))]">
                    En cours
                  </div>
                </div>
                <div className="mt-5 space-y-2.5">
                  {[
                    { done: true, label: "Compte créé" },
                    { done: true, label: "Informations société" },
                    { done: true, label: "Documents déposés" },
                    { done: false, label: "Certifications produits" },
                  ].map((s, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div
                        className={cn(
                          "grid h-7 w-7 place-items-center rounded-lg text-xs font-bold transition",
                          s.done
                            ? "bg-[rgb(var(--success))] text-white"
                            : "bg-black/[0.06] text-[rgb(var(--muted))]"
                        )}
                      >
                        {s.done ? "✓" : i + 1}
                      </div>
                      <span
                        className={cn(
                          "text-sm",
                          s.done
                            ? "font-medium text-[rgb(var(--fg))]"
                            : "text-[rgb(var(--muted))]"
                        )}
                      >
                        {s.label}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-5 h-2 w-full overflow-hidden rounded-full bg-black/[0.05]">
                  <div className="h-full w-1/2 rounded-full bg-gradient-to-r from-[rgb(var(--primary))] to-[rgb(var(--primary))]/60" />
                </div>
                <p className="mt-3 text-[11px] text-[rgb(var(--muted))]">
                  ⚡ 50% complété · 12 min restantes
                </p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-y border-[rgb(var(--border))]/40 bg-white/50 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
          <p className="text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-[rgb(var(--muted))]">
            Construit avec un écosystème de confiance
          </p>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-8">
            {TRUST_LOGOS.map((t) => (
              <div key={t.label} className="text-center">
                <p className="text-sm font-semibold tracking-tight text-[rgb(var(--fg))]">
                  {t.label}
                </p>
                <p className="text-[11px] text-[rgb(var(--muted))]">
                  {t.subtitle}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Marketplace preview — vraies données */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[rgb(var(--primary))]">
              Aperçu marketplace
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              Découvrez les équipements disponibles
            </h2>
          </div>
          <Link href="/marketplace">
            <Button variant="ghost" size="sm">
              Voir tous les produits →
            </Button>
          </Link>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {loadingProducts ? (
            <>
              <ProductCardSkeleton />
              <ProductCardSkeleton />
              <ProductCardSkeleton />
            </>
          ) : products.length === 0 ? (
            <Card className="col-span-full p-10 text-center">
              <div className="text-4xl">🌱</div>
              <p className="mt-4 text-base font-semibold">
                Marketplace en construction
              </p>
              <p className="mt-1 text-sm text-[rgb(var(--muted))]">
                Les premiers vendeurs sont en cours d&apos;onboarding. Revenez
                bientôt !
              </p>
              <div className="mt-5 flex justify-center gap-3">
                <Link href="/register">
                  <Button size="sm">Devenir vendeur pionnier</Button>
                </Link>
              </div>
            </Card>
          ) : (
            products.map((p) => (
              <Link
                key={p.id}
                href={`/marketplace/${p.id}`}
                className="group block overflow-hidden rounded-2xl border border-[rgb(var(--border))]/60 bg-white transition hover:border-[rgb(var(--primary))]/40 hover:shadow-lg"
              >
                <div className="relative aspect-square w-full overflow-hidden bg-gradient-to-br from-black/[0.03] to-black/[0.06]">
                  {p.imageUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                    />
                  ) : (
                    <div className="grid h-full place-items-center text-5xl text-[rgb(var(--muted))]/40">
                      ⚡
                    </div>
                  )}
                  {p.category && (
                    <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-0.5 text-[10px] font-semibold backdrop-blur">
                      {p.category}
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <p className="truncate text-sm font-semibold">{p.name}</p>
                  <p className="mt-0.5 truncate text-xs text-[rgb(var(--muted))]">
                    par {p.vendor.name}
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-base font-bold text-[rgb(var(--primary))]">
                      {formatPrice(p.price)}
                    </span>
                    <span className="text-xs font-medium text-[rgb(var(--primary))] opacity-0 transition group-hover:opacity-100">
                      Voir →
                    </span>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </section>

      {/* Pour qui */}
      <section className="bg-white/40 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-[rgb(var(--primary))]">
              Pour qui
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              Une plateforme, deux audiences pro
            </h2>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            {/* Acheteurs */}
            <Card className="relative overflow-hidden p-7 sm:p-9">
              <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[rgb(var(--primary))]/10 blur-2xl" />
              <div className="relative">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[rgb(var(--primary))]/10 text-2xl">
                  🛒
                </div>
                <h3 className="mt-5 text-xl font-semibold">
                  Vous êtes installateur / acheteur
                </h3>
                <p className="mt-2 text-sm text-[rgb(var(--muted))]">
                  Trouvez du matériel certifié, comparez les vendeurs, payez
                  en toute sécurité avec Stripe.
                </p>
                <ul className="mt-5 space-y-2.5 text-sm">
                  <Bullet>Catalogue 100% certifié CE et Certisolis</Bullet>
                  <Bullet>Paiement sécurisé Stripe</Bullet>
                  <Bullet>Suivi de commande en temps réel</Bullet>
                  <Bullet>Pas de frais d&apos;inscription</Bullet>
                </ul>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link href="/marketplace">
                    <Button>Explorer le catalogue →</Button>
                  </Link>
                  <Link href="/buyer/register">
                    <Button variant="secondary">Créer un compte</Button>
                  </Link>
                </div>
              </div>
            </Card>

            {/* Vendeurs */}
            <Card className="relative overflow-hidden p-7 sm:p-9">
              <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[rgb(var(--success))]/10 blur-2xl" />
              <div className="relative">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[rgb(var(--success))]/10 text-2xl">
                  🏭
                </div>
                <h3 className="mt-5 text-xl font-semibold">
                  Vous êtes fabricant / distributeur
                </h3>
                <p className="mt-2 text-sm text-[rgb(var(--muted))]">
                  Vendez vos équipements EnR à un réseau européen
                  d&apos;installateurs qualifiés. Onboarding 6 étapes,
                  activation en 24h.
                </p>
                <ul className="mt-5 space-y-2.5 text-sm">
                  <Bullet>Vérification VIES automatique de la TVA</Bullet>
                  <Bullet>Catalogue produits + photos illimitées</Bullet>
                  <Bullet>
                    Tableau de bord : commandes, ventes, statistiques
                  </Bullet>
                  <Bullet>Paiements consolidés via Stripe Connect</Bullet>
                </ul>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link href="/register">
                    <Button>Devenir vendeur →</Button>
                  </Link>
                  <Link href="/login">
                    <Button variant="secondary">J&apos;ai déjà un compte</Button>
                  </Link>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-[rgb(var(--primary))]">
            Pourquoi Carlow
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            La plateforme B2B pensée pour les pros des EnR
          </h2>
          <p className="mt-4 text-[rgb(var(--muted))]">
            Une marketplace spécialisée, exigeante sur la qualité, simple à
            utiliser.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <Card
              key={f.title}
              className="group p-6 transition hover:-translate-y-1 hover:border-[rgb(var(--primary))]/30 hover:shadow-md"
            >
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-[rgb(var(--primary))]/10 text-2xl transition group-hover:scale-110">
                {f.icon}
              </div>
              <h3 className="mt-4 text-base font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-[rgb(var(--muted))]">{f.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Steps */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-[rgb(var(--primary))]">
            Onboarding vendeur
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            Devenez vendeur en 6 étapes
          </h2>
          <p className="mt-4 text-[rgb(var(--muted))]">
            Moins de 20 minutes pour finaliser votre dossier.
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {STEPS.map((s, i) => (
            <Card
              key={s.n}
              className={cn(
                "flex items-start gap-4 p-5 transition hover:border-[rgb(var(--primary))]/30",
                `animate-slide-up-${(i % 4) + 1}`
              )}
            >
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[rgb(var(--primary))] to-[rgb(var(--primary))]/80 text-sm font-bold text-white shadow-sm">
                {s.n}
              </div>
              <div>
                <h3 className="text-sm font-semibold">{s.t}</h3>
                <p className="mt-0.5 text-xs text-[rgb(var(--muted))]">
                  {s.d}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA final */}
      <section className="mx-auto max-w-6xl px-4 pb-20 pt-10 sm:px-6">
        <Card className="card-shadow relative overflow-hidden p-10 sm:p-14">
          <div className="absolute -top-10 right-0 -z-0 h-48 w-48 rounded-full bg-[rgb(var(--primary))]/15 blur-3xl" />
          <div className="absolute -bottom-12 -left-8 -z-0 h-56 w-56 rounded-full bg-[rgb(var(--success))]/15 blur-3xl" />
          <div className="relative flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Prêt à rejoindre Carlow ?
              </h2>
              <p className="mt-2 text-[rgb(var(--muted))]">
                Inscription gratuite. Aucun engagement. Annulation à tout
                moment.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => router.push("/register")}>
                Devenir vendeur →
              </Button>
              <Button
                variant="secondary"
                onClick={() => router.push("/marketplace")}
              >
                Voir la marketplace
              </Button>
            </div>
          </div>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-[rgb(var(--border))] bg-white/60">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <Brand variant="compact" />
          <p className="text-xs text-[rgb(var(--muted))]">
            © 2026 Carlow · Marketplace B2B EnR · Tous droits réservés
          </p>
          <div className="flex gap-4 text-xs text-[rgb(var(--muted))]">
            <Link href="/marketplace" className="hover:text-[rgb(var(--fg))]">
              Marketplace
            </Link>
            <Link href="/login" className="hover:text-[rgb(var(--fg))]">
              Connexion
            </Link>
            <a
              href="https://carlow.fr"
              target="_blank"
              rel="noreferrer"
              className="hover:text-[rgb(var(--fg))]"
            >
              carlow.fr
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ---------------- Helpers ---------------- */

function Trust({ label, sub }: { label: string; sub: string }) {
  return (
    <div>
      <p className="text-2xl font-semibold tracking-tight text-[rgb(var(--fg))]">
        {label}
      </p>
      <p className="text-xs text-[rgb(var(--muted))]">{sub}</p>
    </div>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5">
      <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-[rgb(var(--success))]/15 text-[10px] font-bold text-[rgb(var(--success))]">
        ✓
      </span>
      <span className="text-[rgb(var(--fg))]">{children}</span>
    </li>
  );
}

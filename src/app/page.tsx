"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Brand } from "@/components/ui/Brand";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ProductCardSkeleton } from "@/components/ui/Skeleton";
import { SmartImage } from "@/components/ui/SmartImage";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Chatbot } from "@/components/marketplace/Chatbot";
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
  { label: "Resend", subtitle: "Emails transactionnels" },
];

const CATEGORIES = [
  {
    icon: "☀️",
    title: "Photovoltaïque",
    desc: "Panneaux solaires monocristallins et polycristallins",
    color: "from-amber-400/15 to-orange-400/10",
    border: "border-amber-300/40",
  },
  {
    icon: "🔋",
    title: "Stockage & Batteries",
    desc: "Batteries lithium, gestion énergétique intelligente",
    color: "from-emerald-400/15 to-teal-400/10",
    border: "border-emerald-300/40",
  },
  {
    icon: "⚡",
    title: "Onduleurs",
    desc: "Hybrides, micro-onduleurs et string inverters",
    color: "from-blue-400/15 to-indigo-400/10",
    border: "border-blue-300/40",
  },
  {
    icon: "🚗",
    title: "Mobilité IRVE",
    desc: "Bornes de recharge VE résidentielles et tertiaires",
    color: "from-purple-400/15 to-violet-400/10",
    border: "border-purple-300/40",
  },
  {
    icon: "🌡️",
    title: "Pompes à chaleur",
    desc: "PAC air-eau, air-air, géothermie",
    color: "from-rose-400/15 to-pink-400/10",
    border: "border-rose-300/40",
  },
  {
    icon: "🌳",
    title: "Biomasse",
    desc: "Chaudières granulés, bois bûches, mixtes",
    color: "from-green-400/15 to-lime-400/10",
    border: "border-green-300/40",
  },
];

const STATS = [
  { value: "500+", label: "Vendeurs certifiés", icon: "🏭" },
  { value: "10k+", label: "Produits référencés", icon: "📦" },
  { value: "27", label: "Pays UE couverts", icon: "🌍" },
  { value: "98%", label: "Satisfaction client", icon: "⭐" },
];

const TESTIMONIALS = [
  {
    name: "Thomas Lefevre",
    role: "Directeur, SolarPro France",
    company: "Installateur photovoltaïque",
    quote:
      "Carlow nous a permis de centraliser nos achats matériel sur une seule plateforme. Le gain de temps est énorme et les vendeurs sont tous certifiés.",
    rating: 5,
    avatar: "TL",
  },
  {
    name: "Marie Dupont",
    role: "Responsable achats, EcoEnergie",
    company: "Bureau d'études EnR",
    quote:
      "Le comparateur de produits et le suivi de commande en temps réel sont des fonctionnalités essentielles. Carlow comprend vraiment les besoins B2B.",
    rating: 5,
    avatar: "MD",
  },
  {
    name: "Karim El Bouchikhi",
    role: "Co-fondateur, GreenInverters",
    company: "Fabricant d'onduleurs",
    quote:
      "Nous avons doublé notre chiffre d'affaires en 6 mois grâce à la visibilité offerte par Carlow auprès des installateurs européens.",
    rating: 5,
    avatar: "KE",
  },
];

const FAQS = [
  {
    q: "Combien coûte l'inscription sur Carlow ?",
    a: "L'inscription est 100% gratuite pour les acheteurs ET les vendeurs. Carlow se rémunère uniquement via une commission de 4% sur les transactions réalisées, prélevée automatiquement lors du paiement.",
  },
  {
    q: "Combien de temps prend la validation d'un compte vendeur ?",
    a: "L'onboarding prend environ 20 minutes. Une fois votre dossier soumis (informations société, documents légaux, certifications), notre équipe valide votre compte sous 24 à 48 heures ouvrées.",
  },
  {
    q: "Quels documents dois-je fournir en tant que vendeur ?",
    a: "K-Bis de moins de 3 mois, statuts de la société, RIB IBAN, certifications produits (CE, Certisolis PPE2 si applicable). La vérification TVA est automatique via le service VIES de la Commission européenne.",
  },
  {
    q: "Comment fonctionnent les paiements ?",
    a: "Tous les paiements transitent par Stripe (PCI-DSS niveau 1). Carlow utilise Stripe Connect pour reverser automatiquement les fonds aux vendeurs sous 7 jours ouvrés après la livraison.",
  },
  {
    q: "Puis-je vendre dans toute l'Europe ?",
    a: "Oui, Carlow couvre les 27 pays de l'Union Européenne. Vous définissez librement vos zones de livraison, vos tarifs Incoterms et vos délais.",
  },
  {
    q: "Que se passe-t-il en cas de litige ?",
    a: "Carlow propose un service de médiation gratuit. Pour les commandes payées via la plateforme, nous offrons une protection acheteur de 30 jours avec remboursement intégral si le produit ne correspond pas à la description.",
  },
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

  /**
   * JSON-LD Schema.org Organization + WebSite — donne à Google les
   * infos clés sur Carlow pour les rich results (sitelinks search box,
   * profil entreprise dans le panneau de droite Google).
   */
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: "Carlow",
        legalName: "Carlow",
        url: "https://carlowonboarding.vercel.app",
        logo: "https://carlowonboarding.vercel.app/opengraph-image",
        description:
          "Marketplace B2B européenne dédiée aux équipements d'énergies renouvelables : photovoltaïque, onduleurs, batteries, IRVE, pompes à chaleur.",
        email: "contact@carlow.fr",
        sameAs: ["https://carlow.fr", "https://www.carlow.fr"],
      },
      {
        "@type": "WebSite",
        url: "https://carlowonboarding.vercel.app",
        name: "Carlow",
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate:
              "https://carlowonboarding.vercel.app/marketplace?search={search_term_string}",
          },
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };

  return (
    <div className="portal-page min-h-screen">
      {/* JSON-LD Schema.org */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
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
            <ThemeToggle size="sm" />
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

      {/* Catégories */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-[rgb(var(--primary))]">
            Notre catalogue
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            6 catégories d&apos;équipements EnR
          </h2>
          <p className="mt-4 text-[rgb(var(--muted))]">
            Tout le matériel dont vous avez besoin pour vos projets d&apos;énergies renouvelables, certifié et prêt à installer.
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.map((c, i) => (
            <Link
              key={c.title}
              href={`/marketplace?category=${encodeURIComponent(c.title)}`}
              className={cn(
                "group relative overflow-hidden rounded-2xl border bg-gradient-to-br p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl",
                c.color,
                c.border,
                `animate-slide-up-${(i % 4) + 1}`
              )}
            >
              <div className="flex items-center gap-4">
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/80 text-3xl shadow-sm backdrop-blur transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                  {c.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-bold tracking-tight">{c.title}</h3>
                  <p className="mt-1 text-xs text-[rgb(var(--muted))]">{c.desc}</p>
                </div>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5 shrink-0 text-[rgb(var(--muted))] transition-all duration-300 group-hover:translate-x-1 group-hover:text-[rgb(var(--primary))]">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Stats counter */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[rgb(var(--primary))] via-[#d96b20] to-[#b85514] py-16 text-white sm:py-20">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-black/10 blur-3xl" />
          <svg className="absolute inset-0 h-full w-full opacity-[0.07]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="stats-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#stats-grid)" />
          </svg>
        </div>

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/80">
              Chiffres clés
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              La marketplace EnR de référence en Europe
            </h2>
          </div>

          <div className="mt-12 grid grid-cols-2 gap-6 lg:grid-cols-4">
            {STATS.map((s, i) => (
              <div
                key={s.label}
                className={cn(
                  "rounded-2xl border border-white/15 bg-white/10 p-6 text-center backdrop-blur-sm transition-all duration-300 hover:bg-white/15",
                  `animate-slide-up-${(i % 4) + 1}`
                )}
              >
                <div className="text-3xl">{s.icon}</div>
                <p className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                  {s.value}
                </p>
                <p className="mt-1 text-xs font-medium uppercase tracking-wide text-white/80">
                  {s.label}
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
                    <SmartImage
                      src={p.imageUrl}
                      alt={p.name}
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 300px"
                      className="object-cover transition duration-500 group-hover:scale-[1.04]"
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

      {/* Témoignages */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-[rgb(var(--primary))]">
            Ils nous font confiance
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            La parole à nos utilisateurs
          </h2>
          <p className="mt-4 text-[rgb(var(--muted))]">
            Des installateurs, des bureaux d&apos;études et des fabricants nous racontent leur expérience.
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <Card
              key={t.name}
              className={cn(
                "relative flex flex-col p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl",
                `animate-slide-up-${(i % 4) + 1}`
              )}
            >
              {/* Icône guillemet */}
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className="absolute right-6 top-6 h-8 w-8 text-[rgb(var(--primary))]/15"
              >
                <path d="M9.5 6c-3.5 0-6 2.5-6 6v6h6v-6h-3c0-2 1-3 3-3V6zm11 0c-3.5 0-6 2.5-6 6v6h6v-6h-3c0-2 1-3 3-3V6z" />
              </svg>

              {/* Étoiles */}
              <div className="flex gap-0.5">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <svg key={j} viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-amber-400">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                ))}
              </div>

              {/* Citation */}
              <p className="mt-5 flex-1 text-sm leading-relaxed text-[rgb(var(--fg))]/85">
                &ldquo;{t.quote}&rdquo;
              </p>

              {/* Auteur */}
              <div className="mt-6 flex items-center gap-3 border-t border-[rgb(var(--border))]/60 pt-5">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[rgb(var(--primary))] to-[#c05510] text-sm font-bold text-white shadow-sm">
                  {t.avatar}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">{t.name}</p>
                  <p className="truncate text-xs text-[rgb(var(--muted))]">
                    {t.role}
                  </p>
                  <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-[rgb(var(--primary))]/80">
                    {t.company}
                  </p>
                </div>
              </div>
            </Card>
          ))}
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

      {/* FAQ */}
      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-[rgb(var(--primary))]">
            Questions fréquentes
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Vous avez des questions ?
          </h2>
          <p className="mt-4 text-[rgb(var(--muted))]">
            Les réponses aux questions les plus fréquentes des vendeurs et des acheteurs.
          </p>
        </div>

        <div className="mt-10 space-y-3">
          {FAQS.map((faq, i) => (
            <FaqItem key={i} question={faq.q} answer={faq.a} index={i} />
          ))}
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-[rgb(var(--muted))]">
            Une autre question ?{" "}
            <a
              href="mailto:contact@carlow.fr"
              className="font-bold text-[rgb(var(--primary))] hover:underline underline-offset-2"
            >
              Contactez-nous directement →
            </a>
          </p>
        </div>
      </section>

      {/* Newsletter */}
      <section className="mx-auto max-w-6xl px-4 pb-10 sm:px-6">
        <Card className="relative overflow-hidden p-8 sm:p-12">
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[rgb(var(--primary))]/10 blur-3xl" />
          <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-[rgb(var(--success))]/10 blur-3xl" />

          <div className="relative grid gap-6 lg:grid-cols-2 lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-[rgb(var(--primary))]/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-[rgb(var(--primary))]">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3 w-3">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                Newsletter Carlow
              </div>
              <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
                Recevez l&apos;actu EnR chaque mois
              </h2>
              <p className="mt-2 text-sm text-[rgb(var(--muted))]">
                Nouveaux produits, vendeurs vedettes, tendances du marché et offres exclusives.
                Pas de spam — 1 email/mois maximum.
              </p>
            </div>

            <NewsletterForm />
          </div>
        </Card>
      </section>

      {/* CTA final */}
      <section className="mx-auto max-w-6xl px-4 pb-20 pt-10 sm:px-6">
        <Card className="card-shadow relative overflow-hidden p-10 sm:p-14">
          <div className="absolute -top-10 right-0 -z-0 h-48 w-48 rounded-full bg-[rgb(var(--primary))]/15 blur-3xl" />
          <div className="absolute -bottom-12 -left-8 -z-0 h-56 w-56 rounded-full bg-[rgb(var(--success))]/15 blur-3xl" />
          <div className="relative flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Prêt à rejoindre Carlow ?
              </h2>
              <p className="mt-2 text-[rgb(var(--muted))]">
                Inscription gratuite. Aucun engagement. Annulation à tout
                moment.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => router.push("/register")} size="lg">
                Devenir vendeur →
              </Button>
              <Button
                variant="secondary"
                onClick={() => router.push("/marketplace")}
                size="lg"
              >
                Voir la marketplace
              </Button>
            </div>
          </div>
        </Card>
      </section>

      {/* Footer */}
      <footer className="relative overflow-hidden border-t border-[rgb(var(--border))]/70 bg-gradient-to-b from-[rgb(var(--card))] to-[rgb(var(--bg))]">
        {/* Décor : grande typo Carlow en filigrane */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 select-none overflow-hidden">
          <span className="block translate-y-1/4 text-center text-[18vw] font-black leading-none tracking-tighter text-[rgb(var(--primary))]/[0.03]">
            CARLOW
          </span>
        </div>

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          {/* Bandeau de confiance */}
          <div className="grid gap-4 border-b border-[rgb(var(--border))]/50 py-8 sm:grid-cols-3">
            {[
              { icon: "🛡️", title: "Paiement sécurisé", desc: "Stripe · PCI-DSS niveau 1" },
              { icon: "✓", title: "Vendeurs vérifiés", desc: "Documents & certifications contrôlés" },
              { icon: "🇪🇺", title: "Couverture européenne", desc: "27 pays de l'Union Européenne" },
            ].map((item) => (
              <div key={item.title} className="flex items-center gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[rgb(var(--primary))]/15 to-[rgb(var(--primary))]/8 text-lg">
                  {item.icon}
                </span>
                <div>
                  <p className="text-sm font-bold tracking-tight">{item.title}</p>
                  <p className="text-xs text-[rgb(var(--muted))]">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Liens */}
          <div className="grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-5">
            {/* Marque + réseaux */}
            <div className="lg:col-span-2">
              <Brand variant="compact" />
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-[rgb(var(--muted))]">
                La marketplace B2B de référence pour les équipements
                d&apos;énergies renouvelables. Photovoltaïque, stockage,
                IRVE et plus.
              </p>

              {/* Réseaux sociaux */}
              <div className="mt-5 flex gap-2">
                {[
                  { label: "LinkedIn", href: "https://linkedin.com", icon: (
                    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2zM4 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4z" />
                  )},
                  { label: "Twitter", href: "https://twitter.com", icon: (
                    <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" />
                  )},
                  { label: "Instagram", href: "https://instagram.com", icon: (
                    <>
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                    </>
                  )},
                  { label: "YouTube", href: "https://youtube.com", icon: (
                    <>
                      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
                      <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
                    </>
                  )},
                ].map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={social.label}
                    className="grid h-9 w-9 place-items-center rounded-xl border border-[rgb(var(--border))]/70 bg-[rgb(var(--card))] text-[rgb(var(--muted))] transition-all duration-150 hover:-translate-y-0.5 hover:border-[rgb(var(--primary))]/40 hover:bg-[rgb(var(--primary))]/8 hover:text-[rgb(var(--primary))]"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                      {social.icon}
                    </svg>
                  </a>
                ))}
              </div>
            </div>

            {/* Plateforme */}
            <FooterColumn
              title="Plateforme"
              links={[
                { label: "Marketplace", href: "/marketplace" },
                { label: "Devenir vendeur", href: "/register" },
                { label: "Connexion vendeur", href: "/login" },
                { label: "Connexion acheteur", href: "/buyer/login" },
              ]}
            />

            {/* Légal */}
            <FooterColumn
              title="Informations légales"
              links={[
                { label: "Mentions légales", href: "/legal/mentions-legales" },
                { label: "CGV", href: "/legal/cgv" },
                { label: "CGU", href: "/legal/cgu" },
                { label: "Confidentialité", href: "/legal/confidentialite" },
                { label: "Cookies", href: "/legal/cookies" },
              ]}
            />

            {/* Contact */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[rgb(var(--fg))]/70">
                Contact
              </p>
              <ul className="mt-4 space-y-3 text-sm">
                <li>
                  <a
                    href="mailto:contact@carlow.fr"
                    className="group flex items-center gap-2 text-[rgb(var(--muted))] transition hover:text-[rgb(var(--primary))]"
                  >
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[rgb(var(--primary))]/8 text-[rgb(var(--primary))] transition group-hover:bg-[rgb(var(--primary))]/15">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                        <polyline points="22,6 12,13 2,6" />
                      </svg>
                    </span>
                    contact@carlow.fr
                  </a>
                </li>
                <li>
                  <a
                    href="https://carlow.fr"
                    target="_blank"
                    rel="noreferrer"
                    className="group flex items-center gap-2 text-[rgb(var(--muted))] transition hover:text-[rgb(var(--primary))]"
                  >
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[rgb(var(--primary))]/8 text-[rgb(var(--primary))] transition group-hover:bg-[rgb(var(--primary))]/15">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M2 12h20M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20z" />
                      </svg>
                    </span>
                    carlow.fr
                  </a>
                </li>
              </ul>

              {/* Sélecteur de thème inline */}
              <div className="mt-5">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[rgb(var(--fg))]/70">
                  Apparence
                </p>
                <ThemeToggle size="sm" />
              </div>
            </div>
          </div>

          {/* Barre de copyright */}
          <div className="flex flex-col items-center justify-between gap-3 border-t border-[rgb(var(--border))]/50 py-6 sm:flex-row">
            <p className="text-xs text-[rgb(var(--muted))]">
              © 2026 <span className="font-semibold text-[rgb(var(--fg))]">Carlow</span> · Tous droits réservés
            </p>
            <div className="flex items-center gap-4 text-xs text-[rgb(var(--muted))]">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[rgb(var(--success))]" />
                Tous les systèmes opérationnels
              </span>
              <span className="hidden sm:inline">·</span>
              <span className="hidden sm:inline">Fait avec 🧡 en France</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Chatbot IA flottant */}
      <Chatbot />
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

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[rgb(var(--fg))]/70">
        {title}
      </p>
      <ul className="mt-4 space-y-2.5 text-sm">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="group inline-flex items-center gap-1.5 text-[rgb(var(--muted))] transition hover:text-[rgb(var(--primary))]"
            >
              <span className="h-px w-0 bg-[rgb(var(--primary))] transition-all duration-200 group-hover:w-3" />
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
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

function FaqItem({ question, answer, index }: { question: string; answer: string; index: number }) {
  const [open, setOpen] = useState(index === 0); // 1ère question ouverte par défaut
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border bg-[rgb(var(--card))] transition-all duration-200",
        open
          ? "border-[rgb(var(--primary))]/40 shadow-md"
          : "border-[rgb(var(--border))]/70 hover:border-[rgb(var(--primary))]/25"
      )}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
      >
        <span className="text-sm font-semibold sm:text-base">{question}</span>
        <span
          className={cn(
            "grid h-7 w-7 shrink-0 place-items-center rounded-full transition-all duration-200",
            open
              ? "rotate-45 bg-[rgb(var(--primary))] text-white"
              : "bg-[rgb(var(--primary))]/10 text-[rgb(var(--primary))]"
          )}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-4 w-4">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </span>
      </button>
      <div
        className={cn(
          "grid transition-all duration-300 ease-in-out",
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="overflow-hidden">
          <p className="px-6 pb-5 text-sm leading-relaxed text-[rgb(var(--muted))]">
            {answer}
          </p>
        </div>
      </div>
    </div>
  );
}

function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("loading");
    setMessage("");
    // Simulation (à connecter à un vrai endpoint quand prêt)
    setTimeout(() => {
      setStatus("success");
      setMessage("Merci ! Vous êtes inscrit. À très vite dans votre boîte mail.");
      setEmail("");
    }, 700);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="votre@email.fr"
          required
          disabled={status === "loading"}
          className="h-12 flex-1 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 text-sm outline-none transition-all duration-150 placeholder:text-[rgb(var(--muted))]/60 focus:border-[rgb(var(--primary))]/50 focus:ring-3 focus:ring-[rgb(var(--primary))]/12 disabled:opacity-60"
        />
        <Button type="submit" size="lg" disabled={status === "loading"}>
          {status === "loading" ? "Envoi…" : "S'inscrire →"}
        </Button>
      </div>
      {message && (
        <p
          className={cn(
            "text-xs font-medium",
            status === "success"
              ? "text-[rgb(var(--success))]"
              : "text-red-600"
          )}
        >
          {status === "success" ? "✓ " : "⚠️ "}
          {message}
        </p>
      )}
      <p className="text-[10px] text-[rgb(var(--muted))]">
        En vous inscrivant, vous acceptez notre{" "}
        <Link href="/legal/confidentialite" className="underline hover:text-[rgb(var(--fg))]">
          politique de confidentialité
        </Link>
        . Désinscription en 1 clic.
      </p>
    </form>
  );
}

import Link from "next/link";
import { Brand } from "@/components/ui/Brand";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

/**
 * Page 404 globale (App Router).
 *
 * Next.js sert ce fichier automatiquement quand un segment retourne
 * `notFound()` ou qu'aucune route ne matche. On en profite pour proposer
 * 3 chemins de récupération principaux selon le profil utilisateur :
 * marketplace (acheteur), dashboard (vendeur), accueil.
 */
export default function NotFound() {
  return (
    <div className="portal-page relative grid min-h-screen place-items-center overflow-hidden px-4 py-12">
      {/* Décor de fond */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-[rgb(var(--primary))]/10 blur-3xl" />
        <div className="absolute -right-32 bottom-1/4 h-96 w-96 rounded-full bg-[rgb(var(--success))]/8 blur-3xl" />
      </div>

      <div className="relative w-full max-w-xl">
        <div className="mb-6 flex justify-center">
          <Brand variant="compact" />
        </div>

        <Card className="card-shadow relative overflow-hidden p-8 text-center sm:p-12 animate-fade-in">
          {/* Décor interne */}
          <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-[rgb(var(--primary))]/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-[rgb(var(--success))]/10 blur-3xl" />

          <div className="relative">
            {/* Illustration animée : "404" géant avec orbites de planètes */}
            <div className="relative mx-auto mb-2 flex h-32 w-full items-center justify-center sm:h-40">
              {/* 4 */}
              <span className="bg-gradient-to-br from-[rgb(var(--primary))] to-[#c05510] bg-clip-text text-7xl font-black tracking-tight text-transparent animate-gradient sm:text-8xl">
                4
              </span>

              {/* Le 0 = planète orbitale */}
              <div className="relative mx-1 grid h-20 w-20 place-items-center sm:h-24 sm:w-24">
                {/* Cercle central (planète) */}
                <div className="relative grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-[rgb(var(--primary))] via-[#e8923a] to-[#c05510] shadow-[0_0_30px_rgb(var(--primary)/0.45)] sm:h-20 sm:w-20">
                  <span className="text-2xl sm:text-3xl">🌍</span>
                  {/* Halo pulsant */}
                  <span className="absolute inset-0 rounded-full bg-[rgb(var(--primary))]/30 animate-ping" style={{ animationDuration: "3s" }} />
                </div>

                {/* Satellites en orbite */}
                <div className="absolute inset-0 animate-orbit" style={{ animationDuration: "6s" }}>
                  <span className="absolute left-1/2 top-0 -ml-2 grid h-4 w-4 place-items-center rounded-full bg-[rgb(var(--success))] text-[8px] shadow-md">
                    ⚡
                  </span>
                </div>
                <div className="absolute inset-0 animate-orbit" style={{ animationDuration: "10s", animationDirection: "reverse" }}>
                  <span className="absolute left-1/2 top-0 -ml-1.5 grid h-3 w-3 place-items-center rounded-full bg-amber-400 text-[7px] shadow-md">
                    ☀️
                  </span>
                </div>
              </div>

              {/* 4 */}
              <span className="bg-gradient-to-br from-[rgb(var(--primary))] to-[#c05510] bg-clip-text text-7xl font-black tracking-tight text-transparent animate-gradient sm:text-8xl">
                4
              </span>
            </div>

            <h1 className="mt-4 text-xl font-bold tracking-tight sm:text-2xl">
              Oups… cette page s&apos;est envolée !
            </h1>
            <p className="mx-auto mt-2 max-w-sm text-sm text-[rgb(var(--muted))]">
              Cette page n&apos;existe pas ou a été déplacée. Pas de panique,
              on vous remet sur les rails.
            </p>

            <div className="mt-7 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
              <Link href="/">
                <Button size="lg" className="w-full sm:w-auto">
                  ← Retour à l&apos;accueil
                </Button>
              </Link>
              <Link href="/marketplace">
                <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                  🛒 Marketplace
                </Button>
              </Link>
            </div>

            {/* Liens secondaires */}
            <div className="mt-8 border-t border-[rgb(var(--border))]/60 pt-5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[rgb(var(--muted))]">
                Ou continuez vers…
              </p>
              <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs">
                <Link
                  href="/login"
                  className="font-semibold text-[rgb(var(--muted))] hover:text-[rgb(var(--primary))] transition"
                >
                  🏪 Connexion vendeur
                </Link>
                <Link
                  href="/buyer/login"
                  className="font-semibold text-[rgb(var(--muted))] hover:text-[rgb(var(--primary))] transition"
                >
                  🛒 Connexion acheteur
                </Link>
                <Link
                  href="/register"
                  className="font-semibold text-[rgb(var(--muted))] hover:text-[rgb(var(--primary))] transition"
                >
                  ✨ Devenir vendeur
                </Link>
              </div>
            </div>
          </div>
        </Card>

        <p className="mt-6 text-center text-[11px] text-[rgb(var(--muted))]">
          © 2026 Carlow · Si le problème persiste, contactez-nous.
        </p>
      </div>
    </div>
  );
}

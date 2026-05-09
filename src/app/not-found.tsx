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
    <div className="portal-page grid min-h-screen place-items-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="mb-6 flex justify-center">
          <Brand variant="compact" />
        </div>

        <Card className="card-shadow relative overflow-hidden p-8 text-center sm:p-12">
          <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-[rgb(var(--primary))]/15 blur-3xl" />
          <div className="absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-[rgb(var(--success))]/10 blur-3xl" />

          <div className="relative">
            {/* Le "404" stylé en gradient */}
            <p className="bg-gradient-to-br from-[rgb(var(--primary))] to-[rgb(var(--primary))]/40 bg-clip-text text-7xl font-bold tracking-tight text-transparent sm:text-8xl">
              404
            </p>

            <h1 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">
              Page introuvable
            </h1>
            <p className="mt-2 text-sm text-[rgb(var(--muted))]">
              Cette page n&apos;existe pas ou a été déplacée. Pas de panique,
              on vous remet sur les rails.
            </p>

            <div className="mt-7 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
              <Link href="/">
                <Button className="w-full sm:w-auto">Retour à l&apos;accueil</Button>
              </Link>
              <Link href="/marketplace">
                <Button variant="secondary" className="w-full sm:w-auto">
                  Marketplace
                </Button>
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap justify-center gap-x-5 gap-y-1 text-xs text-[rgb(var(--muted))]">
              <Link href="/login" className="hover:text-[rgb(var(--primary))]">
                Connexion vendeur
              </Link>
              <Link href="/buyer/login" className="hover:text-[rgb(var(--primary))]">
                Connexion acheteur
              </Link>
              <Link href="/register" className="hover:text-[rgb(var(--primary))]">
                Devenir vendeur
              </Link>
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

"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Brand } from "@/components/ui/Brand";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

/**
 * Boundary d'erreur globale (App Router).
 *
 * Capturé pour toute erreur runtime non gérée par les Server/Client
 * Components. Doit être un Client Component (`"use client"`) et exporter
 * une prop `reset` permettant de retenter le rendu.
 *
 * En prod on évite de leaker la stack — on affiche un message générique +
 * digest (utile pour le support sans révéler la trace complète).
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // En dev on log la stack ; en prod Next.js l'envoie déjà dans la
    // console serveur, donc on évite le double-log.
    if (process.env.NODE_ENV !== "production") {
      console.error("[GlobalError]", error);
    }
  }, [error]);

  return (
    <div className="portal-page relative grid min-h-screen place-items-center overflow-hidden px-4 py-12">
      {/* Décor de fond */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-red-400/10 blur-3xl" />
        <div className="absolute -right-32 bottom-1/4 h-96 w-96 rounded-full bg-[rgb(var(--primary))]/8 blur-3xl" />
      </div>

      <div className="relative w-full max-w-lg">
        <div className="mb-6 flex justify-center">
          <Brand variant="compact" />
        </div>

        <Card className="card-shadow relative overflow-hidden p-8 text-center sm:p-12 animate-fade-in">
          {/* Décor */}
          <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-red-500/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-[rgb(var(--primary))]/10 blur-3xl" />

          <div className="relative">
            {/* Icône d'erreur avec wiggle */}
            <div className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-red-100 to-red-50 text-4xl animate-bounce-in shadow-[0_4px_20px_rgb(239_68_68_/0.2)]">
              <span className="animate-wiggle inline-block">⚠️</span>
            </div>

            <h1 className="mt-6 text-xl font-bold tracking-tight sm:text-2xl">
              Une erreur est survenue
            </h1>
            <p className="mx-auto mt-2 max-w-sm text-sm text-[rgb(var(--muted))]">
              Notre équipe a été notifiée. Vous pouvez réessayer ou retourner
              à l&apos;accueil.
            </p>

            {error.digest && (
              <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-[rgb(var(--border))]/60 bg-[rgb(var(--card))] px-3 py-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[rgb(var(--muted))]">
                  Code erreur
                </span>
                <span className="font-mono text-xs font-semibold">
                  {error.digest}
                </span>
              </div>
            )}

            <div className="mt-7 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
              <Button onClick={() => reset()} size="lg">
                🔄 Réessayer
              </Button>
              <Link href="/">
                <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                  ← Retour à l&apos;accueil
                </Button>
              </Link>
            </div>
          </div>
        </Card>

        <p className="mt-6 text-center text-[11px] text-[rgb(var(--muted))]">
          © 2026 Carlow · Si le problème persiste, contactez le support à{" "}
          <a
            href="mailto:support@carlow.fr"
            className="font-semibold text-[rgb(var(--primary))] hover:underline"
          >
            support@carlow.fr
          </a>
        </p>
      </div>
    </div>
  );
}

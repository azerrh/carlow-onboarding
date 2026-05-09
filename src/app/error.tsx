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
    <div className="portal-page grid min-h-screen place-items-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="mb-6 flex justify-center">
          <Brand variant="compact" />
        </div>

        <Card className="card-shadow relative overflow-hidden p-8 text-center sm:p-12">
          <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-red-500/10 blur-3xl" />
          <div className="absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-[rgb(var(--primary))]/10 blur-3xl" />

          <div className="relative">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-red-50 text-3xl">
              ⚠️
            </div>

            <h1 className="mt-5 text-xl font-semibold tracking-tight sm:text-2xl">
              Une erreur est survenue
            </h1>
            <p className="mt-2 text-sm text-[rgb(var(--muted))]">
              Notre équipe a été notifiée. Vous pouvez réessayer ou retourner
              à l&apos;accueil.
            </p>

            {error.digest && (
              <p className="mt-3 inline-block rounded-md bg-black/[0.04] px-2 py-1 font-mono text-[11px] text-[rgb(var(--muted))]">
                Code : {error.digest}
              </p>
            )}

            <div className="mt-7 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
              <Button onClick={() => reset()}>Réessayer</Button>
              <Link href="/">
                <Button variant="secondary" className="w-full sm:w-auto">
                  Retour à l&apos;accueil
                </Button>
              </Link>
            </div>
          </div>
        </Card>

        <p className="mt-6 text-center text-[11px] text-[rgb(var(--muted))]">
          © 2026 Carlow · Si le problème persiste, contactez le support.
        </p>
      </div>
    </div>
  );
}

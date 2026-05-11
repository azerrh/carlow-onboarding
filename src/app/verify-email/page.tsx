"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Brand } from "@/components/ui/Brand";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

/**
 * Page de vérification d'email.
 *
 * Reçoit le token via `?token=xxx` (généré par l'API à l'inscription).
 * Appelle GET /api/auth/verify-email pour consommer le token, puis affiche
 * un message de succès ou d'erreur + lien vers la page de connexion
 * appropriée (buyer ou vendor selon l'audience).
 */

type Status = "loading" | "success" | "error";

function VerifyInner() {
  const sp = useSearchParams();
  const token = sp.get("token");

  const [status, setStatus] = useState<Status>("loading");
  const [audience, setAudience] = useState<"BUYER" | "VENDOR" | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setError("Lien invalide (token manquant).");
      return;
    }
    fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStatus("success");
          setAudience(data.audience);
        } else {
          setStatus("error");
          setError(data?.error ?? "Lien invalide.");
        }
      })
      .catch(() => {
        setStatus("error");
        setError("Erreur réseau.");
      });
  }, [token]);

  return (
    <div className="portal-page grid min-h-screen place-items-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <Brand variant="compact" />
        </div>

        <Card className="card-shadow p-8 text-center">
          {status === "loading" && (
            <>
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-[rgb(var(--primary))] border-t-transparent" />
              <p className="mt-4 text-sm text-[rgb(var(--muted))]">
                Vérification de votre email…
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-[rgb(var(--success))]/10 text-3xl">
                ✓
              </div>
              <h1 className="mt-4 text-xl font-semibold">Email confirmé !</h1>
              <p className="mt-2 text-sm text-[rgb(var(--muted))]">
                Merci, votre adresse email est vérifiée. Vous pouvez désormais
                accéder pleinement à votre espace Carlow.
              </p>
              <div className="mt-6">
                <Link
                  href={audience === "VENDOR" ? "/login" : "/buyer/login"}
                >
                  <Button className="w-full">Se connecter</Button>
                </Link>
              </div>
            </>
          )}

          {status === "error" && (
            <>
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-amber-50 text-3xl">
                ⚠️
              </div>
              <h1 className="mt-4 text-xl font-semibold">Lien invalide</h1>
              <p className="mt-2 text-sm text-[rgb(var(--muted))]">{error}</p>
              <p className="mt-2 text-xs text-[rgb(var(--muted))]">
                Connectez-vous à votre compte pour demander un nouveau lien
                de vérification.
              </p>
              <div className="mt-6 flex flex-col gap-2">
                <Link href="/buyer/login">
                  <Button variant="secondary" className="w-full">
                    Connexion acheteur
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="secondary" className="w-full">
                    Connexion vendeur
                  </Button>
                </Link>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="portal-page grid min-h-screen place-items-center">
          <p className="text-sm text-[rgb(var(--muted))]">Chargement…</p>
        </div>
      }
    >
      <VerifyInner />
    </Suspense>
  );
}

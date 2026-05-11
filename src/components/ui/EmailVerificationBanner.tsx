"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

/**
 * Bandeau affiché en haut des dashboards si l'utilisateur n'a pas
 * encore vérifié son email. Non bloquant — informatif uniquement.
 *
 * Le bouton "Renvoyer" est rate-limité côté serveur (3 par 10 min/IP).
 */
export function EmailVerificationBanner({
  audience,
  userId,
  email,
}: {
  audience: "BUYER" | "VENDOR";
  userId: string;
  email: string;
}) {
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function resend() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audience, userId }),
      });
      if (res.status === 429) {
        const data = await res.json();
        setError(data?.error ?? "Trop de tentatives, réessayez plus tard.");
        return;
      }
      if (res.ok) {
        setSent(true);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data?.error ?? "Impossible d'envoyer l'email.");
      }
    } catch {
      setError("Erreur réseau.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mb-4 flex flex-col gap-3 rounded-xl border border-amber-300/60 bg-amber-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-amber-100 text-base">
          ✉️
        </span>
        <div>
          <p className="text-sm font-semibold text-amber-900">
            Vérifiez votre adresse email
          </p>
          <p className="text-xs text-amber-800">
            {sent
              ? `Un nouvel email vient d'être envoyé à ${email}. Pensez à vérifier vos spams.`
              : `Nous avons envoyé un lien de vérification à ${email}. Cliquez dessus pour confirmer votre compte.`}
          </p>
          {error && (
            <p className="mt-1 text-xs text-red-700">{error}</p>
          )}
        </div>
      </div>
      {!sent && (
        <Button
          size="sm"
          variant="secondary"
          onClick={resend}
          disabled={busy}
        >
          {busy ? "Envoi…" : "Renvoyer l'email"}
        </Button>
      )}
    </div>
  );
}

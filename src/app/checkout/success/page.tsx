"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Brand } from "@/components/ui/Brand";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useCart } from "@/hooks/useCart";

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<{ amountTotal?: number } | null>(null);

  const clearCart = useCart((s) => s.clearCart);

  useEffect(() => {
    clearCart();
    setLoading(false);
  }, [clearCart]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white grid place-items-center">
        <p className="text-sm text-[rgb(var(--muted))]">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-[rgb(var(--border))] bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Brand variant="compact" />
          <Link href="/marketplace">
            <Button variant="ghost" size="sm">Marketplace</Button>
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-lg px-4 py-16">
        <Card className="p-8 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[rgb(var(--success))]/10 text-3xl">
            ✓
          </div>
          <h1 className="mt-4 text-2xl font-semibold">Commande confirmée !</h1>
          <p className="mt-2 text-sm text-[rgb(var(--muted))]">
            Votre paiement a bien ete traite. Vous recevrez un email de confirmation.
          </p>
          {session && (
            <p className="mt-4 text-lg font-bold">
              {(session.amountTotal ?? 0 / 100).toLocaleString("fr-FR", {
                style: "currency",
                currency: "EUR",
              })}
            </p>
          )}
          <div className="mt-6 flex flex-col gap-3">
            <Link href="/marketplace">
              <Button className="w-full">Continuer mes achats</Button>
            </Link>
            <Link href="/buyer/login">
              <Button variant="secondary" className="w-full">
                Suivi de mes commandes
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white grid place-items-center">
          <p className="text-sm text-[rgb(var(--muted))]">Chargement...</p>
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}

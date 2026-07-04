"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Brand } from "@/components/ui/Brand";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useCart } from "@/hooks/useCart";

interface OrderSummary {
  id: string;
  status: string;
  amountTotal: number; // en centimes
  itemCount: number;
  orderedAt: string;
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<OrderSummary | null>(null);
  const [error, setError] = useState("");

  const clearCart = useCart((s) => s.clearCart);

  // Vide le panier dès l'arrivée sur la page de succès — le paiement est validé.
  useEffect(() => {
    clearCart();
  }, [clearCart]);

  // Récupère la commande créée par le webhook. Le webhook peut prendre
  // quelques secondes à s'exécuter, donc on retry jusqu'à 5x avec 1s d'écart.
  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      setError("Identifiant de session manquant.");
      return;
    }

    let cancelled = false;
    let attempts = 0;
    const MAX_ATTEMPTS = 5;

    async function attempt() {
      try {
        const res = await fetch(
          `/api/checkout/session?session_id=${encodeURIComponent(sessionId!)}`
        );
        const data = await res.json();
        if (cancelled) return;
        if (res.ok && data.success) {
          setOrder(data.order);
          setLoading(false);
          return;
        }
        if (res.status === 404 && attempts < MAX_ATTEMPTS) {
          attempts++;
          setTimeout(attempt, 1000);
          return;
        }
        setError(
          data?.error ||
            "Commande introuvable. Si le problème persiste, contactez le support."
        );
        setLoading(false);
      } catch {
        if (!cancelled) {
          setError("Erreur réseau.");
          setLoading(false);
        }
      }
    }

    attempt();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-[rgb(var(--border))] bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Brand variant="compact" />
          <Link href="/marketplace">
            <Button variant="ghost" size="sm">
              Marketplace
            </Button>
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-lg px-4 py-16">
        <Card className="p-8 text-center">
          {loading ? (
            <>
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-[rgb(var(--primary))] border-t-transparent" />
              <p className="mt-4 text-sm text-[rgb(var(--muted))]">
                Confirmation de votre commande…
              </p>
            </>
          ) : error ? (
            <>
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-amber-100 text-3xl">
                ⚠️
              </div>
              <h1 className="mt-4 text-2xl font-semibold">Paiement reçu</h1>
              <p className="mt-2 text-sm text-[rgb(var(--muted))]">
                Votre paiement a bien été traité par Stripe, mais la confirmation
                de la commande n&apos;a pas pu être affichée.
              </p>
              <p className="mt-2 text-xs text-amber-700">{error}</p>
            </>
          ) : (
            <>
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[rgb(var(--success))]/10 text-3xl">
                ✓
              </div>
              <h1 className="mt-4 text-2xl font-semibold">Commande confirmée !</h1>
              <p className="mt-2 text-sm text-[rgb(var(--muted))]">
                Votre paiement a bien été traité. Vous recevrez un email de
                confirmation.
              </p>

              {order && (
                <div className="mt-6 rounded-xl border border-[rgb(var(--border))] bg-white/50 px-4 py-4 text-left text-sm">
                  <div className="flex items-center justify-between border-b border-[rgb(var(--border))]/60 pb-2">
                    <span className="text-xs uppercase tracking-wider text-[rgb(var(--muted))]">
                      Commande
                    </span>
                    <span className="font-mono text-xs">
                      #{order.id.slice(0, 8)}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs text-[rgb(var(--muted))]">
                      Articles
                    </span>
                    <span>{order.itemCount}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-xs text-[rgb(var(--muted))]">Total</span>
                    <span className="text-lg font-bold">
                      {(order.amountTotal / 100).toLocaleString("fr-FR", {
                        style: "currency",
                        currency: "EUR",
                      })}
                    </span>
                  </div>
                </div>
              )}
            </>
          )}

          <div className="mt-6 flex flex-col gap-3">
            <Link href="/marketplace">
              <Button className="w-full">Continuer mes achats</Button>
            </Link>
            <Link href="/buyer/orders">
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

"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Brand } from "@/components/ui/Brand";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { OrderChat } from "@/components/chat/OrderChat";

interface OrderLine {
  id: string;
  quantity: number;
  unitPriceCents: number;
  product: {
    id: string;
    name: string;
    category: string | null;
    catalog: {
      name: string | null;
      vendor: { name: string; companyName: string | null };
    };
  };
}

interface Order {
  id: string;
  status: string;
  totalCents: number;
  orderedAt: string;
  updatedAt: string;
  lines: OrderLine[];
}

const STATUS_MAP: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  EN_COURS: { label: "En cours", color: "text-amber-700", bg: "bg-amber-50 border-amber-200", icon: "📦" },
  LIVREE: { label: "Livree", color: "text-green-700", bg: "bg-green-50 border-green-200", icon: "✅" },
  ANNULEE: { label: "Annulee", color: "text-red-700", bg: "bg-red-50 border-red-200", icon: "❌" },
};

function formatCents(c: number): string {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(c / 100);
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function DetailInner() {
  const router = useRouter();
  const { id } = useParams();
  const searchParams = useSearchParams();
  const orderId = typeof id === "string" ? id : Array.isArray(id) ? id[0] : "";
  const [buyerId, setBuyerId] = useState<string | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  useEffect(() => {
    const bId = localStorage.getItem("buyerId");
    if (!bId) {
      router.replace("/buyer/login");
      return;
    }
    setBuyerId(bId);
  }, [router]);

  useEffect(() => {
    if (!buyerId || !orderId) return;
    setLoading(true);
    fetch(`/api/buyer/orders/${orderId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setOrder(data.order);
        } else {
          setError(data.error || "Commande non trouvee");
        }
      })
      .catch(() => setError("Erreur reseau"))
      .finally(() => setLoading(false));
  }, [buyerId, orderId]);

  async function handleCancel() {
    if (!buyerId || !orderId) return;
    if (!confirm("Annuler cette commande ?")) return;
    try {
      const res = await fetch("/api/buyer/orders/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, buyerId }),
      });
      const data = await res.json();
      if (data.success) {
        setOrder((prev) => (prev ? { ...prev, status: "ANNULEE" } : null));
        setToast("Commande annulee avec succes.");
      } else {
        setToast(data.error || "Annulation impossible.");
      }
    } catch {
      setToast("Erreur reseau.");
    }
    setTimeout(() => setToast(""), 3000);
  }

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <p className="text-sm text-[rgb(var(--muted))]">Chargement...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen grid place-items-center p-4">
        <Card className="max-w-md p-6 text-center">
          <div className="text-3xl">🔍</div>
          <p className="mt-3 font-medium">{error || "Commande introuvable"}</p>
          <Link href="/buyer/orders">
            <Button className="mt-4" size="sm">
              Retour aux commandes
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  const status = STATUS_MAP[order.status] ?? STATUS_MAP.EN_COURS;
  const backTo = searchParams.get("back") ?? "/buyer/orders";

  return (
    <div className="portal-page min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-[rgb(var(--border))] bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-[800px] items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3 text-sm">
            <Brand variant="compact" />
            <span className="text-[rgb(var(--muted))]">/</span>
            <Link href={backTo} className="text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]">
              Mes commandes
            </Link>
            <span className="text-[rgb(var(--muted))]">/</span>
            <span className="font-medium">Detail</span>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              localStorage.removeItem("buyerId");
              router.push("/buyer/login");
            }}
          >
            Deconnexion
          </Button>
        </div>
      </div>

      <div className="mx-auto max-w-[800px] px-4 py-8">
        {/* Back link */}
        <Link href={backTo} className="text-sm text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]">
          ← Retour aux commandes
        </Link>

        {/* Order info */}
        <div className="mt-4 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              Commande #{order.id.slice(0, 8).toUpperCase()}
            </h1>
            <p className="mt-1 text-sm text-[rgb(var(--muted))]">
              Passee le {formatDate(order.orderedAt)}
            </p>
          </div>
          <span
            className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold ${status.bg} ${status.color}`}
          >
            {status.icon} {status.label}
          </span>
        </div>

        {/* Summary */}
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Card className="p-4">
            <div className="text-xs uppercase tracking-wider text-[rgb(var(--muted))]">Total</div>
            <div className="mt-1 text-xl font-bold">{formatCents(order.totalCents)}</div>
          </Card>
          <Card className="p-4">
            <div className="text-xs uppercase tracking-wider text-[rgb(var(--muted))]">Articles</div>
            <div className="mt-1 text-xl font-bold">
              {order.lines.reduce((sum, l) => sum + l.quantity, 0)}
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-xs uppercase tracking-wider text-[rgb(var(--muted))]">Derniere MAJ</div>
            <div className="mt-1 text-sm font-semibold">{formatDate(order.updatedAt)}</div>
          </Card>
        </div>

        {/* Lines */}
        <Card className="mt-6">
          <div className="p-4 sm:p-5">
            <h2 className="text-sm font-semibold">Articles commandes</h2>
            <div className="mt-4 divide-y divide-[rgb(var(--border))]">
              {order.lines.map((line) => (
                <div key={line.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-lg bg-indigo-50 text-sm font-bold text-indigo-700">
                      {line.quantity}×
                    </div>
                    <div>
                      <p className="text-sm font-medium">{line.product.name}</p>
                      <p className="text-xs text-[rgb(var(--muted))]">
                        {line.product.catalog.vendor.companyName ?? line.product.catalog.vendor.name}
                        {line.product.category && (
                          <span className="ml-2 rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700">
                            {line.product.category}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{formatCents(line.unitPriceCents * line.quantity)}</p>
                    <p className="text-xs text-[rgb(var(--muted))]">
                      {formatCents(line.unitPriceCents)} / unite
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Messagerie avec le vendeur */}
        {typeof window !== "undefined" && localStorage.getItem("buyerId") && (
          <div className="mt-6">
            <OrderChat
              orderId={order.id}
              as="buyer"
              userId={localStorage.getItem("buyerId") ?? ""}
            />
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
          <a
            href={`/api/buyer/orders/${order.id}/invoice?buyerId=${typeof window !== "undefined" ? localStorage.getItem("buyerId") ?? "" : ""}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-[rgb(var(--border))] bg-white px-4 py-2 text-sm font-medium hover:border-[rgb(var(--primary))]/40 hover:bg-[rgb(var(--primary))]/[0.04]"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4 w-4">
              <path d="M6 3h9l4 4v14H6z" />
              <path d="M14 3v4h4" />
              <path d="M9 13h7M9 17h7" />
            </svg>
            Télécharger la facture PDF
          </a>
          {order.status === "EN_COURS" && (
            <button
              onClick={handleCancel}
              className="rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
            >
              Annuler la commande
            </button>
          )}
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl border border-[rgb(var(--success))]/30 bg-white px-4 py-3 text-sm font-medium shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}

export default function OrderDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white grid place-items-center">
          <p className="text-sm text-[rgb(var(--muted))]">Chargement...</p>
        </div>
      }
    >
      <DetailInner />
    </Suspense>
  );
}

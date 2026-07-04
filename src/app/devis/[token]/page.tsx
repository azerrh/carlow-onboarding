"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Brand } from "@/components/ui/Brand";

/**
 * Page publique de consultation d'un devis.
 * Accessible via le lien envoyé par email à l'acheteur.
 * Pas besoin de compte — le token dans l'URL suffit à authentifier.
 */

interface QuoteDetail {
  id: string;
  buyerName: string;
  buyerEmail: string;
  buyerCompany: string | null;
  quantity: number;
  message: string | null;
  status: string;
  vendorPriceCents: number | null;
  vendorMessage: string | null;
  validUntil: string | null;
  pdfUrl: string | null;
  createdAt: string;
  product: {
    name: string;
    reference: string | null;
    price: number;
    category: string | null;
    photos: { url: string }[];
  };
  vendor: {
    name: string;
    companyName: string | null;
    email: string;
  };
}

const STATUS_INFO: Record<string, { label: string; color: string; emoji: string }> = {
  PENDING:   { label: "En attente de réponse du vendeur", color: "#d97706", emoji: "⏳" },
  RESPONDED: { label: "Devis reçu — en attente de votre décision", color: "#2563eb", emoji: "💼" },
  ACCEPTED:  { label: "Devis accepté", color: "#16a34a", emoji: "✅" },
  REJECTED:  { label: "Devis décliné", color: "#dc2626", emoji: "❌" },
  EXPIRED:   { label: "Devis expiré", color: "#6b7280", emoji: "⏰" },
};

function fmtEur(cents: number) {
  return (cents / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}

export default function QuotePage() {
  const { token } = useParams();
  const accessToken = typeof token === "string" ? token : Array.isArray(token) ? token[0] : "";

  const [quote, setQuote] = useState<QuoteDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [acting, setActing] = useState<"ACCEPTED" | "REJECTED" | null>(null);
  const [actionDone, setActionDone] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    fetch(`/api/quotes?token=${accessToken}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setQuote(d.quote);
        else setError(d.error ?? "Devis introuvable");
      })
      .catch(() => setError("Erreur réseau"))
      .finally(() => setLoading(false));
  }, [accessToken]);

  async function handleAction(action: "ACCEPTED" | "REJECTED") {
    if (!confirm(action === "ACCEPTED" ? "Confirmer l'acceptation de ce devis ?" : "Confirmer le refus de ce devis ?")) return;
    setActing(action);
    try {
      const res = await fetch("/api/quotes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: accessToken, action }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) { alert(data?.error ?? "Erreur"); return; }
      setQuote((q) => q ? { ...q, status: action } : q);
      setActionDone(true);
    } finally { setActing(null); }
  }

  return (
    <div className="min-h-screen bg-[#f9f7f4]">
      <header className="border-b border-[rgb(var(--border))] bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Link href="/marketplace"><Brand variant="compact" /></Link>
          <Link href="/marketplace" className="text-xs text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]">
            Retour à la marketplace →
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10">
        {loading && (
          <div className="grid h-64 place-items-center text-sm text-[rgb(var(--muted))]">
            Chargement de votre devis…
          </div>
        )}

        {error && (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
            <div className="text-4xl">😕</div>
            <h1 className="mt-4 text-lg font-semibold">Devis introuvable</h1>
            <p className="mt-2 text-sm text-[rgb(var(--muted))]">{error}</p>
          </div>
        )}

        {quote && !loading && (
          <div className="space-y-4">
            {/* En-tête statut */}
            {(() => {
              const info = STATUS_INFO[quote.status] ?? STATUS_INFO.PENDING;
              return (
                <div className="rounded-2xl bg-white p-6 shadow-sm text-center">
                  <div className="text-4xl">{info.emoji}</div>
                  <h1 className="mt-3 text-xl font-bold">Devis Carlow</h1>
                  <p className="mt-1 text-sm font-medium" style={{ color: info.color }}>{info.label}</p>
                  <p className="mt-1 text-xs text-[rgb(var(--muted))]">Réf. {quote.id.slice(0, 8).toUpperCase()} — émis le {fmtDate(quote.createdAt)}</p>
                </div>
              );
            })()}

            {/* Produit + vendeur */}
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <div className="flex items-start gap-4">
                {quote.product.photos[0]?.url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={quote.product.photos[0].url} alt={quote.product.name}
                    loading="lazy" decoding="async"
                    className="h-20 w-20 shrink-0 rounded-xl object-cover border border-[rgb(var(--border))]" />
                )}
                <div>
                  <p className="text-xs text-[rgb(var(--muted))]">Produit demandé</p>
                  <h2 className="text-base font-semibold">{quote.product.name}</h2>
                  {quote.product.reference && <p className="text-xs text-[rgb(var(--muted))]">Réf. {quote.product.reference}</p>}
                  {quote.product.category && (
                    <span className="mt-1 inline-block rounded-lg bg-[rgb(var(--primary))]/10 px-2 py-0.5 text-[10px] font-semibold text-[rgb(var(--primary))]">
                      {quote.product.category}
                    </span>
                  )}
                  <p className="mt-2 text-xs text-[rgb(var(--muted))]">
                    Vendeur : <strong>{quote.vendor.companyName ?? quote.vendor.name}</strong>
                  </p>
                </div>
              </div>
            </div>

            {/* Détail de la demande */}
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-[rgb(var(--muted))]">Votre demande</h3>
              <dl className="grid gap-3 sm:grid-cols-2">
                <div><dt className="text-[11px] text-[rgb(var(--muted))]">Acheteur</dt><dd className="text-sm font-medium">{quote.buyerName}{quote.buyerCompany ? ` — ${quote.buyerCompany}` : ""}</dd></div>
                <div><dt className="text-[11px] text-[rgb(var(--muted))]">Quantité</dt><dd className="text-sm font-medium">{quote.quantity} unité{quote.quantity > 1 ? "s" : ""}</dd></div>
                <div><dt className="text-[11px] text-[rgb(var(--muted))]">Prix catalogue</dt><dd className="text-sm font-medium">{quote.product.price.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })} / unité</dd></div>
                {quote.message && (
                  <div className="sm:col-span-2"><dt className="text-[11px] text-[rgb(var(--muted))]">Votre message</dt><dd className="mt-0.5 text-sm leading-relaxed">{quote.message}</dd></div>
                )}
              </dl>
            </div>

            {/* Réponse du vendeur */}
            {quote.status === "RESPONDED" && quote.vendorPriceCents && (
              <div className="rounded-2xl bg-white p-6 shadow-sm border-2 border-[rgb(var(--primary))]/20">
                <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-[rgb(var(--primary))]">💼 Offre du vendeur</h3>
                <div className="flex flex-col items-center gap-2 rounded-xl bg-[rgb(var(--primary))]/[0.06] py-5 text-center">
                  <p className="text-sm text-[rgb(var(--muted))]">Prix unitaire négocié</p>
                  <p className="text-3xl font-bold text-[rgb(var(--primary))]">{fmtEur(quote.vendorPriceCents)}</p>
                  <p className="text-sm text-[rgb(var(--muted))]">
                    Total pour {quote.quantity} unité{quote.quantity > 1 ? "s" : ""} :{" "}
                    <strong>{fmtEur(quote.vendorPriceCents * quote.quantity)} HT</strong>
                  </p>
                  {quote.product.price * 100 > quote.vendorPriceCents && (
                    <p className="text-xs text-[rgb(var(--success))] font-medium">
                      −{Math.round(((quote.product.price * 100 - quote.vendorPriceCents) / (quote.product.price * 100)) * 100)}% vs prix catalogue
                    </p>
                  )}
                </div>

                {quote.vendorMessage && (
                  <div className="mt-4 rounded-xl border border-[rgb(var(--border))]/60 bg-[#f8f9fc] p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-[rgb(var(--muted))] mb-1">Message du vendeur</p>
                    <p className="text-sm leading-relaxed">{quote.vendorMessage}</p>
                  </div>
                )}

                {quote.validUntil && (
                  <p className="mt-3 text-center text-xs text-[rgb(var(--muted))]">
                    ⏰ Offre valable jusqu&apos;au <strong>{fmtDate(quote.validUntil)}</strong>
                  </p>
                )}

                {quote.pdfUrl && (
                  <div className="mt-3 text-center">
                    <a href={quote.pdfUrl} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-[rgb(var(--primary))] hover:underline">
                      📄 Télécharger le PDF du devis
                    </a>
                  </div>
                )}

                {!actionDone && (
                  <div className="mt-5 flex gap-3">
                    <button onClick={() => handleAction("REJECTED")} disabled={!!acting}
                      className="flex-1 h-11 rounded-xl border border-red-200 bg-red-50 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50 transition">
                      {acting === "REJECTED" ? "…" : "❌ Décliner"}
                    </button>
                    <button onClick={() => handleAction("ACCEPTED")} disabled={!!acting}
                      className="flex-1 h-11 rounded-xl bg-[rgb(var(--success))] text-sm font-semibold text-white hover:brightness-95 disabled:opacity-50 transition">
                      {acting === "ACCEPTED" ? "…" : "✅ Accepter ce devis"}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Confirmation action */}
            {actionDone && (
              <div className="rounded-2xl bg-white p-8 shadow-sm text-center">
                <div className="text-4xl">{quote.status === "ACCEPTED" ? "🎉" : "👍"}</div>
                <h2 className="mt-3 text-lg font-semibold">
                  {quote.status === "ACCEPTED" ? "Devis accepté !" : "Devis décliné"}
                </h2>
                <p className="mt-2 text-sm text-[rgb(var(--muted))]">
                  {quote.status === "ACCEPTED"
                    ? "Le vendeur a été notifié. Il vous contactera pour finaliser votre commande."
                    : "Le vendeur a été notifié. Vous pouvez continuer à parcourir la marketplace."}
                </p>
                <Link href="/marketplace"
                  className="mt-5 inline-block rounded-xl bg-[rgb(var(--primary))] px-6 py-2.5 text-sm font-semibold text-white hover:brightness-95">
                  Retour à la marketplace
                </Link>
              </div>
            )}

            {/* Statut final (non RESPONDED) */}
            {["ACCEPTED", "REJECTED", "EXPIRED"].includes(quote.status) && (
              <div className="rounded-2xl bg-white p-6 shadow-sm text-center text-sm text-[rgb(var(--muted))]">
                Ce devis ne peut plus être modifié.{" "}
                <Link href="/marketplace" className="text-[rgb(var(--primary))] hover:underline font-medium">
                  Revenir à la marketplace →
                </Link>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

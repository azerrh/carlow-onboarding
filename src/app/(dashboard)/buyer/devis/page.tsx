"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BuyerNav } from "@/components/buyer/BuyerNav";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";

interface QuoteProduct {
  name: string;
  reference: string | null;
  price: number;
  category: string | null;
  photos: { url: string }[];
}

interface Quote {
  id: string;
  buyerName: string;
  buyerEmail: string;
  quantity: number;
  message: string | null;
  status: string;
  vendorPriceCents: number | null;
  validUntil: string | null;
  pdfUrl: string | null;
  createdAt: string;
  accessToken: string | null;
  product: QuoteProduct;
  vendor: { name: string; companyName: string | null };
}

const STATUS_META: Record<string, { label: string; bg: string; text: string; emoji: string }> = {
  PENDING:   { label: "En attente",          bg: "bg-amber-50 border-amber-200",                             text: "text-amber-700",                emoji: "⏳" },
  RESPONDED: { label: "Devis reçu",          bg: "bg-blue-50 border-blue-200",                               text: "text-blue-700",                 emoji: "💼" },
  ACCEPTED:  { label: "Accepté",             bg: "bg-[rgb(var(--success))]/10 border-[rgb(var(--success))]/30", text: "text-[rgb(var(--success))]",  emoji: "✅" },
  REJECTED:  { label: "Refusé / Décliné",   bg: "bg-red-50 border-red-200",                                 text: "text-red-700",                  emoji: "❌" },
  EXPIRED:   { label: "Expiré",              bg: "bg-gray-100 border-gray-200",                              text: "text-gray-500",                 emoji: "⏰" },
};

const FILTERS = [
  { value: "ALL", label: "Tous" },
  { value: "PENDING", label: "En attente" },
  { value: "RESPONDED", label: "Reçus" },
  { value: "ACCEPTED", label: "Acceptés" },
];

function fmtEur(cents: number) {
  return (cents / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

export default function BuyerDevisPage() {
  const router = useRouter();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [buyerId, setBuyerId] = useState<string | null>(null);

  useEffect(() => {
    const id = localStorage.getItem("buyerId");
    if (!id) { router.replace("/buyer/login"); return; }
    setBuyerId(id);
    fetch(`/api/buyer/quotes?id=${id}`)
      .then((r) => r.json())
      .then((d) => { if (d.success) setQuotes(d.quotes ?? []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  const filtered = filter === "ALL" ? quotes : quotes.filter((q) => q.status === filter);

  const respondedCount = quotes.filter((q) => q.status === "RESPONDED").length;

  return (
    <div className="portal-page min-h-screen">
      <BuyerNav />

      <div className="mx-auto max-w-[900px] px-4 py-8">
        {/* Titre */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Mes demandes de devis</h1>
            <p className="mt-1 text-sm text-[rgb(var(--muted))]">
              {quotes.length} devis au total
              {respondedCount > 0 && (
                <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                  {respondedCount} en attente de votre réponse
                </span>
              )}
            </p>
          </div>
          <Link href="/marketplace">
            <Button variant="secondary" size="sm">Explorer la marketplace →</Button>
          </Link>
        </div>

        {/* Nav rapide */}
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          {[
            { href: "/buyer/dashboard", label: "🏠 Tableau de bord" },
            { href: "/buyer/orders", label: "🛒 Commandes" },
            { href: "/buyer/favoris", label: "❤️ Favoris" },
            { href: "/buyer/devis", label: "📋 Devis", active: true },
          ].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "rounded-lg px-3 py-1.5 font-medium transition",
                l.active
                  ? "bg-[rgb(var(--primary))] text-white"
                  : "bg-black/[0.04] text-[rgb(var(--muted))] hover:bg-black/[0.08]"
              )}
            >
              {l.label}
            </Link>
          ))}
        </div>

        {/* Filtres */}
        <Card className="mt-5 p-4">
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-medium transition",
                  filter === f.value
                    ? "bg-[rgb(var(--primary))] text-white"
                    : "bg-black/[0.04] text-[rgb(var(--muted))] hover:bg-black/[0.08]"
                )}
              >
                {f.label}
                {f.value === "RESPONDED" && respondedCount > 0 && (
                  <span className="ml-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-white text-[10px] font-bold text-blue-700">
                    {respondedCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </Card>

        {/* Liste */}
        <div className="mt-4 space-y-3">
          {loading ? (
            <Card className="p-10 text-center text-sm text-[rgb(var(--muted))]">Chargement…</Card>
          ) : filtered.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="text-3xl">📋</div>
              <p className="mt-3 text-sm font-semibold">Aucune demande de devis</p>
              <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                Rendez-vous sur une fiche produit et cliquez sur &quot;Demander un devis&quot;.
              </p>
              <Link href="/marketplace" className="mt-4 inline-block">
                <Button size="sm">Explorer la marketplace</Button>
              </Link>
            </Card>
          ) : (
            filtered.map((q) => {
              const meta = STATUS_META[q.status] ?? STATUS_META.PENDING;
              const vendorName = q.vendor.companyName ?? q.vendor.name;
              const isNew = q.status === "RESPONDED";

              return (
                <Card
                  key={q.id}
                  className={cn(
                    "overflow-hidden p-0 transition",
                    isNew && "ring-2 ring-blue-200"
                  )}
                >
                  <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:gap-5">
                    {/* Photo produit */}
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-[rgb(var(--border))] bg-[#f8f9fc]">
                      {q.product.photos[0]?.url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={q.product.photos[0].url} alt={q.product.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="grid h-full place-items-center text-2xl text-[rgb(var(--muted))]">📦</div>
                      )}
                    </div>

                    {/* Infos */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={cn("rounded-full border px-2.5 py-0.5 text-[10px] font-semibold", meta.bg, meta.text)}>
                          {meta.emoji} {meta.label}
                        </span>
                        {isNew && (
                          <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white animate-pulse">
                            ACTION REQUISE
                          </span>
                        )}
                      </div>
                      <h2 className="mt-1.5 text-sm font-semibold">{q.product.name}</h2>
                      <p className="text-xs text-[rgb(var(--muted))]">
                        {vendorName} · {q.quantity} unité{q.quantity > 1 ? "s" : ""}
                        · Prix catalogue : {q.product.price.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })} / unité
                      </p>
                      <p className="mt-0.5 text-[11px] text-[rgb(var(--muted))]">
                        Demandé le {fmtDate(q.createdAt)}
                        {q.validUntil && q.status === "RESPONDED" && (
                          <span className="ml-2 text-amber-600">
                            · Expire le {fmtDate(q.validUntil)}
                          </span>
                        )}
                      </p>
                    </div>

                    {/* Prix vendeur + actions */}
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      {q.vendorPriceCents && (
                        <div className="text-right">
                          <p className="text-[11px] text-[rgb(var(--muted))]">Prix négocié</p>
                          <p className="text-base font-bold text-[rgb(var(--primary))]">{fmtEur(q.vendorPriceCents)}<span className="text-xs font-normal text-[rgb(var(--muted))]"> / unité</span></p>
                          <p className="text-xs text-[rgb(var(--muted))]">Total : {fmtEur(q.vendorPriceCents * q.quantity)}</p>
                        </div>
                      )}
                      <div className="flex gap-2">
                        {q.accessToken && (
                          <Link
                            href={`/devis/${q.accessToken}`}
                            className={cn(
                              "inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition",
                              isNew
                                ? "bg-[rgb(var(--primary))] text-white hover:brightness-95"
                                : "border border-[rgb(var(--border))] bg-white text-[rgb(var(--fg))] hover:border-[rgb(var(--primary))]/30 hover:bg-[rgb(var(--primary))]/[0.04]"
                            )}
                          >
                            {isNew ? "Voir & répondre →" : "Voir le devis →"}
                          </Link>
                        )}
                        {q.pdfUrl && (
                          <a
                            href={q.pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex h-8 items-center gap-1 rounded-lg border border-[rgb(var(--border))] bg-white px-3 text-xs font-medium text-[rgb(var(--muted))] hover:text-[rgb(var(--primary))] transition"
                          >
                            📄 PDF
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

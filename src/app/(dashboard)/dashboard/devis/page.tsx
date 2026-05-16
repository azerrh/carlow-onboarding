"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { VendorShell, VendorPageHeader } from "@/components/vendor/VendorShell";
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
  buyerPhone: string | null;
  buyerCompany: string | null;
  quantity: number;
  message: string | null;
  status: string;
  vendorPriceCents: number | null;
  vendorMessage: string | null;
  validUntil: string | null;
  pdfUrl: string | null;
  createdAt: string;
  product: QuoteProduct;
}

interface VendorMe {
  name: string;
  email: string;
  companyName: string | null;
}

const STATUS_META: Record<string, { label: string; bg: string; text: string }> = {
  PENDING:   { label: "En attente",   bg: "bg-amber-50 border-amber-200",    text: "text-amber-700" },
  RESPONDED: { label: "Répondu",      bg: "bg-blue-50 border-blue-200",      text: "text-blue-700" },
  ACCEPTED:  { label: "Accepté ✅",   bg: "bg-[rgb(var(--success))]/10 border-[rgb(var(--success))]/30", text: "text-[rgb(var(--success))]" },
  REJECTED:  { label: "Refusé",       bg: "bg-red-50 border-red-200",        text: "text-red-700" },
  EXPIRED:   { label: "Expiré",       bg: "bg-gray-100 border-gray-200",     text: "text-gray-500" },
};

const STATUS_FILTERS = [
  { value: "ALL", label: "Tous" },
  { value: "PENDING", label: "En attente" },
  { value: "RESPONDED", label: "Répondus" },
  { value: "ACCEPTED", label: "Acceptés" },
];

function formatCents(c: number) {
  return (c / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}

export default function VendorQuotesPage() {
  const router = useRouter();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [vendor, setVendor] = useState<VendorMe | null>(null);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [openQuoteId, setOpenQuoteId] = useState<string | null>(null);
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState(0);

  const fetchData = useCallback(async () => {
    const vid = typeof window !== "undefined" ? localStorage.getItem("vendorId") : null;
    if (!vid) { router.push("/login"); return; }
    setVendorId(vid);
    try {
      const [quotesRes, meRes, notifsRes] = await Promise.all([
        fetch(`/api/vendor/quotes?id=${vid}&status=${statusFilter}`),
        fetch(`/api/vendor/me?vendorId=${vid}`),
        fetch(`/api/vendor/notifications?id=${vid}`),
      ]);
      const quotesData = await quotesRes.json();
      const meData = await meRes.json();
      const notifsData = await notifsRes.json();
      if (quotesData.success) {
        setQuotes(quotesData.quotes ?? []);
        setPendingCount(quotesData.pendingCount ?? 0);
      }
      if (meData.success) setVendor({ name: meData.vendor.name, email: meData.vendor.email, companyName: meData.vendor.companyName ?? null });
      if (notifsData.success) setUnreadNotifs(notifsData.unreadCount ?? 0);
    } catch { /* silencieux */ }
    finally { setLoading(false); }
  }, [router, statusFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <VendorShell vendorUser={vendor} unreadNotifsCount={unreadNotifs}>
      <VendorPageHeader
        breadcrumb={["Vendeur", "Devis"]}
        title="Demandes de devis"
        subtitle="Répondez aux demandes de prix de vos acheteurs professionnels."
        action={
          pendingCount > 0 ? (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
              {pendingCount} en attente
            </span>
          ) : null
        }
      />

      {/* Filtres */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((f) => (
            <button key={f.value} onClick={() => setStatusFilter(f.value)}
              className={cn("rounded-lg px-3 py-1.5 text-xs font-medium transition",
                statusFilter === f.value ? "bg-[rgb(var(--primary))] text-white" : "bg-black/[0.04] text-[rgb(var(--muted))] hover:bg-black/[0.08]"
              )}>
              {f.label}
            </button>
          ))}
        </div>
      </Card>

      {/* Liste */}
      <div className="mt-4 space-y-3">
        {loading ? (
          <Card className="p-10 text-center text-sm text-[rgb(var(--muted))]">Chargement…</Card>
        ) : quotes.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="text-3xl">📋</div>
            <p className="mt-3 text-sm font-semibold">Aucune demande de devis</p>
            <p className="mt-1 text-xs text-[rgb(var(--muted))]">
              Les acheteurs qui demandent un devis sur vos produits apparaîtront ici.
            </p>
          </Card>
        ) : (
          quotes.map((q) => (
            <QuoteCard
              key={q.id}
              quote={q}
              vendorId={vendorId}
              isOpen={openQuoteId === q.id}
              onToggle={() => setOpenQuoteId(openQuoteId === q.id ? null : q.id)}
              onRefresh={fetchData}
            />
          ))
        )}
      </div>
    </VendorShell>
  );
}

/* ------------------------------------------------------------------ */
/*  QuoteCard — affiche 1 devis + formulaire de réponse collapsible    */
/* ------------------------------------------------------------------ */

function QuoteCard({
  quote,
  vendorId,
  isOpen,
  onToggle,
  onRefresh,
}: {
  quote: Quote;
  vendorId: string | null;
  isOpen: boolean;
  onToggle: () => void;
  onRefresh: () => void;
}) {
  const meta = STATUS_META[quote.status] ?? STATUS_META.PENDING;
  const [form, setForm] = useState({
    price: quote.vendorPriceCents ? String(quote.vendorPriceCents / 100) : String(Math.round(quote.product.price * quote.quantity * 100) / 100 / quote.quantity),
    message: quote.vendorMessage ?? "",
    validDays: "14",
  });
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");
  const [refusing, setRefusing] = useState(false);

  const catalogPriceUnit = quote.product.price;
  const negotiatedPriceUnit = form.price ? Number(form.price) : 0;
  const saving = catalogPriceUnit > 0 && negotiatedPriceUnit < catalogPriceUnit
    ? Math.round(((catalogPriceUnit - negotiatedPriceUnit) / catalogPriceUnit) * 100)
    : 0;

  async function handleRespond(e: React.FormEvent) {
    e.preventDefault();
    if (!vendorId) return;
    setErr(""); setSubmitting(true);
    try {
      const res = await fetch("/api/vendor/quotes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quoteId: quote.id,
          vendorId,
          vendorPriceCents: Math.round(Number(form.price) * 100),
          vendorMessage: form.message || null,
          validDays: Number(form.validDays),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) { setErr(data?.error ?? "Erreur"); return; }
      onRefresh();
    } catch { setErr("Erreur réseau."); }
    finally { setSubmitting(false); }
  }

  async function handleRefuse() {
    if (!vendorId || !confirm("Refuser définitivement cette demande ?")) return;
    setRefusing(true);
    try {
      await fetch("/api/vendor/quotes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quoteId: quote.id, vendorId, action: "REJECTED" }),
      });
      onRefresh();
    } finally { setRefusing(false); }
  }

  return (
    <Card className="overflow-hidden p-0">
      {/* En-tête cliquable */}
      <button onClick={onToggle}
        className="flex w-full flex-col gap-3 px-5 py-4 text-left hover:bg-black/[0.01] sm:flex-row sm:items-center sm:gap-4 transition">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span className={cn("rounded-full border px-2.5 py-0.5 text-[10px] font-semibold shrink-0", meta.bg, meta.text)}>
            {meta.label}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{quote.product.name}</p>
            <p className="text-xs text-[rgb(var(--muted))]">
              {quote.buyerName}{quote.buyerCompany ? ` — ${quote.buyerCompany}` : ""} · {quote.quantity} unité{quote.quantity > 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-right shrink-0">
          {quote.vendorPriceCents && (
            <div>
              <p className="text-sm font-bold">{formatCents(quote.vendorPriceCents * quote.quantity)}</p>
              <p className="text-[10px] text-[rgb(var(--muted))]">{formatCents(quote.vendorPriceCents)} / unité</p>
            </div>
          )}
          <p className="text-[11px] text-[rgb(var(--muted))]">
            {new Date(quote.createdAt).toLocaleDateString("fr-FR")}
          </p>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
            className={cn("h-4 w-4 text-[rgb(var(--muted))] transition-transform", isOpen && "rotate-180")}>
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </button>

      {/* Détail */}
      {isOpen && (
        <div className="border-t border-[rgb(var(--border))]/60 px-5 py-4 space-y-5">
          {/* Infos acheteur */}
          <div className="grid gap-2 sm:grid-cols-2 rounded-xl bg-[#f8f9fc] p-4 text-sm">
            <div><span className="text-xs text-[rgb(var(--muted))]">Nom</span><p className="font-medium">{quote.buyerName}</p></div>
            <div><span className="text-xs text-[rgb(var(--muted))]">Email</span><p className="font-medium">{quote.buyerEmail}</p></div>
            {quote.buyerCompany && <div><span className="text-xs text-[rgb(var(--muted))]">Société</span><p className="font-medium">{quote.buyerCompany}</p></div>}
            {quote.buyerPhone && <div><span className="text-xs text-[rgb(var(--muted))]">Téléphone</span><p className="font-medium">{quote.buyerPhone}</p></div>}
            <div><span className="text-xs text-[rgb(var(--muted))]">Quantité</span><p className="font-medium">{quote.quantity} unité{quote.quantity > 1 ? "s" : ""}</p></div>
            <div><span className="text-xs text-[rgb(var(--muted))]">Prix catalogue</span><p className="font-medium">{(quote.product.price).toLocaleString("fr-FR", { style: "currency", currency: "EUR" })} / unité</p></div>
            {quote.message && (
              <div className="sm:col-span-2">
                <span className="text-xs text-[rgb(var(--muted))]">Message</span>
                <p className="mt-0.5 text-sm leading-relaxed">{quote.message}</p>
              </div>
            )}
          </div>

          {/* Formulaire de réponse */}
          {quote.status === "PENDING" && (
            <form onSubmit={handleRespond} className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-[rgb(var(--muted))]">Votre réponse</p>
              {err && <p className="text-xs text-red-600 rounded-lg border border-red-200 bg-red-50 px-3 py-2">{err}</p>}
              <div className="grid gap-3 sm:grid-cols-3">
                <label className="block">
                  <span className="mb-1 block text-[11px] font-medium text-[rgb(var(--muted))]">Prix unitaire négocié (€) *</span>
                  <input required type="number" step="0.01" min="0.01" value={form.price}
                    onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                    className="h-10 w-full rounded-xl border border-[rgb(var(--border))] px-3 text-sm focus:border-[rgb(var(--primary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]/15" />
                  {saving > 0 && (
                    <p className="mt-1 text-[10px] text-[rgb(var(--success))]">
                      Remise : −{saving}% vs catalogue
                    </p>
                  )}
                </label>
                <label className="block">
                  <span className="mb-1 block text-[11px] font-medium text-[rgb(var(--muted))]">Total (€)</span>
                  <div className="flex h-10 items-center rounded-xl border border-[rgb(var(--border))]/60 bg-[#f8f9fc] px-3 text-sm font-semibold">
                    {negotiatedPriceUnit > 0
                      ? (negotiatedPriceUnit * quote.quantity).toLocaleString("fr-FR", { style: "currency", currency: "EUR" })
                      : "—"}
                  </div>
                </label>
                <label className="block">
                  <span className="mb-1 block text-[11px] font-medium text-[rgb(var(--muted))]">Validité (jours)</span>
                  <select value={form.validDays} onChange={(e) => setForm((f) => ({ ...f, validDays: e.target.value }))}
                    className="h-10 w-full rounded-xl border border-[rgb(var(--border))] bg-white px-3 text-sm">
                    <option value="7">7 jours</option>
                    <option value="14">14 jours</option>
                    <option value="30">30 jours</option>
                    <option value="60">60 jours</option>
                  </select>
                </label>
              </div>
              <label className="block">
                <span className="mb-1 block text-[11px] font-medium text-[rgb(var(--muted))]">Message / conditions</span>
                <textarea rows={2} value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                  placeholder="Conditions de paiement, délai de livraison, commentaires…"
                  className="w-full rounded-xl border border-[rgb(var(--border))] p-3 text-sm focus:border-[rgb(var(--primary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]/15" />
              </label>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={handleRefuse} disabled={refusing}
                  className="h-9 rounded-xl border border-red-200 bg-red-50 px-4 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50">
                  {refusing ? "…" : "Refuser"}
                </button>
                <button type="submit" disabled={submitting}
                  className="h-9 rounded-xl bg-[rgb(var(--primary))] px-5 text-xs font-semibold text-white hover:brightness-95 disabled:opacity-60">
                  {submitting ? "Envoi…" : "✅ Envoyer le devis"}
                </button>
              </div>
            </form>
          )}

          {/* Devis déjà répondu */}
          {quote.status !== "PENDING" && quote.vendorPriceCents && (
            <div className="rounded-xl border border-[rgb(var(--border))]/60 bg-[#f8f9fc] p-4 text-sm">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[rgb(var(--muted))] mb-2">Devis envoyé</p>
              <p><strong>Prix unitaire :</strong> {formatCents(quote.vendorPriceCents)}</p>
              <p><strong>Total :</strong> {formatCents(quote.vendorPriceCents * quote.quantity)}</p>
              {quote.validUntil && <p><strong>Valable jusqu'au :</strong> {new Date(quote.validUntil).toLocaleDateString("fr-FR")}</p>}
              {quote.pdfUrl && (
                <a href={quote.pdfUrl} target="_blank" rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-[rgb(var(--primary))] hover:underline">
                  📄 Télécharger le PDF
                </a>
              )}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

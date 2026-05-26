"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Brand } from "@/components/ui/Brand";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StarRating } from "@/components/ui/StarRating";
import { cn } from "@/lib/cn";

interface MyReview {
  id: string;
  productId: string;
  productName: string;
  productCategory: string | null;
  productImageUrl: string | null;
  vendor: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
}

interface PendingProduct {
  id: string;
  name: string;
  category: string | null;
  imageUrl: string | null;
  vendor: string;
}

interface Stats {
  totalReviews: number;
  averageGiven: number;
  pendingCount: number;
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function BuyerReviewsPage() {
  const router = useRouter();
  const [buyerId, setBuyerId] = useState<string | null>(null);
  const [reviews, setReviews] = useState<MyReview[]>([]);
  const [pending, setPending] = useState<PendingProduct[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalReviews: 0,
    averageGiven: 0,
    pendingCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending">("all");
  const [toast, setToast] = useState("");

  useEffect(() => {
    const id = localStorage.getItem("buyerId");
    if (!id) {
      router.replace("/buyer/login");
      return;
    }
    setBuyerId(id);
  }, [router]);

  const loadReviews = useCallback(async () => {
    if (!buyerId) return;
    try {
      const res = await fetch(`/api/buyer/reviews?buyerId=${buyerId}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setReviews(data.reviews ?? []);
        setPending(data.pendingProducts ?? []);
        setStats(data.stats ?? { totalReviews: 0, averageGiven: 0, pendingCount: 0 });
      }
    } catch {
      // silencieux
    } finally {
      setLoading(false);
    }
  }, [buyerId]);

  useEffect(() => {
    if (buyerId) loadReviews();
  }, [buyerId, loadReviews]);

  async function handleDelete(productId: string) {
    if (!buyerId) return;
    if (!confirm("Supprimer définitivement cet avis ?")) return;
    try {
      const res = await fetch(
        `/api/marketplace/reviews?buyerId=${encodeURIComponent(
          buyerId
        )}&productId=${encodeURIComponent(productId)}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (!res.ok || !data.success) {
        setToast(data?.error ?? "Suppression impossible.");
      } else {
        setToast("Avis supprimé.");
        await loadReviews();
      }
    } catch {
      setToast("Erreur réseau.");
    }
    setTimeout(() => setToast(""), 3000);
  }

  return (
    <div className="portal-page min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-[rgb(var(--border))]/70 bg-[rgb(var(--card))]/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1100px] items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <Brand variant="compact" />
            <nav className="hidden items-center gap-1 text-sm sm:flex">
              <Link
                href="/buyer/dashboard"
                className="rounded-lg px-2.5 py-1.5 font-medium text-[rgb(var(--muted))] transition hover:bg-black/[0.04] hover:text-[rgb(var(--fg))]"
              >
                Tableau de bord
              </Link>
              <span className="text-[rgb(var(--border))]">/</span>
              <span className="rounded-lg px-2.5 py-1.5 text-sm font-semibold text-[rgb(var(--primary))]">
                Mes avis
              </span>
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/marketplace">
              <Button variant="ghost" size="sm">
                Marketplace
              </Button>
            </Link>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                localStorage.removeItem("buyerId");
                router.push("/buyer/login");
              }}
            >
              Déconnexion
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1100px] px-4 py-8">
        {/* Title */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">⭐ Mes avis</h1>
          <p className="mt-1 text-sm text-[rgb(var(--muted))]">
            Gérez les avis que vous avez publiés sur la marketplace Carlow.
          </p>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatTile
            label="Avis publiés"
            value={String(stats.totalReviews)}
            icon="✍️"
          />
          <StatTile
            label="Note moyenne donnée"
            value={stats.averageGiven > 0 ? `${stats.averageGiven} / 5` : "—"}
            icon="⭐"
          />
          <StatTile
            label="À évaluer"
            value={String(stats.pendingCount)}
            icon="🛍️"
            highlight={stats.pendingCount > 0}
          />
        </div>

        {/* Filters */}
        <div className="mt-6 flex flex-wrap gap-2">
          <button
            onClick={() => setFilter("all")}
            className={cn(
              "rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all duration-150",
              filter === "all"
                ? "bg-[rgb(var(--primary))] text-white shadow-sm"
                : "bg-[rgb(var(--card))] border border-[rgb(var(--border))]/70 text-[rgb(var(--muted))] hover:border-[rgb(var(--primary))]/30 hover:text-[rgb(var(--fg))]"
            )}
          >
            Mes avis ({stats.totalReviews})
          </button>
          <button
            onClick={() => setFilter("pending")}
            className={cn(
              "rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all duration-150",
              filter === "pending"
                ? "bg-[rgb(var(--primary))] text-white shadow-sm"
                : "bg-[rgb(var(--card))] border border-[rgb(var(--border))]/70 text-[rgb(var(--muted))] hover:border-[rgb(var(--primary))]/30 hover:text-[rgb(var(--fg))]"
            )}
          >
            À évaluer ({stats.pendingCount})
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <Card className="mt-6 p-10 text-center text-sm text-[rgb(var(--muted))]">
            Chargement…
          </Card>
        ) : filter === "all" ? (
          reviews.length === 0 ? (
            <Card className="mt-6 p-10 text-center">
              <div className="text-4xl">⭐</div>
              <p className="mt-4 text-sm font-semibold">
                Vous n&apos;avez encore publié aucun avis
              </p>
              <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                Après avoir reçu un produit, partagez votre expérience pour aider la communauté.
              </p>
              {stats.pendingCount > 0 && (
                <Button
                  size="sm"
                  className="mt-5"
                  onClick={() => setFilter("pending")}
                >
                  {stats.pendingCount} produit{stats.pendingCount > 1 ? "s" : ""} à évaluer →
                </Button>
              )}
            </Card>
          ) : (
            <div className="mt-6 space-y-3">
              {reviews.map((r) => (
                <Card key={r.id} className="p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                    {/* Image produit */}
                    <Link
                      href={`/marketplace/${r.productId}`}
                      className="block h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-[rgb(var(--bg))]"
                    >
                      {r.productImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={r.productImageUrl}
                          alt={r.productName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="grid h-full place-items-center text-2xl text-[rgb(var(--muted))]/40">
                          📦
                        </div>
                      )}
                    </Link>

                    {/* Info & avis */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <Link
                            href={`/marketplace/${r.productId}`}
                            className="text-sm font-semibold hover:text-[rgb(var(--primary))] transition"
                          >
                            {r.productName}
                          </Link>
                          <p className="mt-0.5 text-xs text-[rgb(var(--muted))]">
                            {r.vendor}
                            {r.productCategory && (
                              <span className="ml-2 rounded-md bg-[rgb(var(--primary))]/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[rgb(var(--primary))]">
                                {r.productCategory}
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <StarRating value={r.rating} size="md" />
                          <span className="text-sm font-bold">{r.rating}/5</span>
                        </div>
                      </div>

                      {r.comment && (
                        <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-[rgb(var(--fg))]/90">
                          {r.comment}
                        </p>
                      )}

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[rgb(var(--border))]/60 pt-3">
                        <p className="text-[11px] text-[rgb(var(--muted))]">
                          Publié le {formatDate(r.createdAt)}
                          {r.updatedAt !== r.createdAt && (
                            <span> · modifié le {formatDate(r.updatedAt)}</span>
                          )}
                        </p>
                        <div className="flex items-center gap-2">
                          <Link href={`/marketplace/${r.productId}#avis`}>
                            <Button variant="ghost" size="sm">
                              Modifier
                            </Button>
                          </Link>
                          <button
                            onClick={() => handleDelete(r.productId)}
                            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-red-500 transition hover:bg-red-500/10"
                          >
                            Supprimer
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )
        ) : pending.length === 0 ? (
          <Card className="mt-6 p-10 text-center">
            <div className="text-4xl">🎉</div>
            <p className="mt-4 text-sm font-semibold">
              Aucun produit en attente d&apos;évaluation
            </p>
            <p className="mt-1 text-xs text-[rgb(var(--muted))]">
              Vous avez évalué tous vos produits achetés. Bravo !
            </p>
            <Link href="/marketplace">
              <Button size="sm" className="mt-5">
                Découvrir d&apos;autres produits →
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {pending.map((p) => (
              <Card key={p.id} className="p-4">
                <div className="flex items-center gap-3">
                  <Link
                    href={`/marketplace/${p.id}`}
                    className="block h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-[rgb(var(--bg))]"
                  >
                    {p.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.imageUrl}
                        alt={p.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="grid h-full place-items-center text-xl text-[rgb(var(--muted))]/40">
                        📦
                      </div>
                    )}
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/marketplace/${p.id}`}
                      className="block truncate text-sm font-semibold hover:text-[rgb(var(--primary))] transition"
                    >
                      {p.name}
                    </Link>
                    <p className="truncate text-xs text-[rgb(var(--muted))]">
                      {p.vendor}
                    </p>
                    {p.category && (
                      <span className="mt-1 inline-block rounded-md bg-[rgb(var(--primary))]/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[rgb(var(--primary))]">
                        {p.category}
                      </span>
                    )}
                  </div>
                </div>
                <Link href={`/marketplace/${p.id}#avis`}>
                  <Button size="sm" className="mt-3 w-full">
                    ⭐ Laisser un avis
                  </Button>
                </Link>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl border border-[rgb(var(--success))]/30 bg-[rgb(var(--card))] px-4 py-3 text-sm font-medium shadow-lg animate-fade-in">
          {toast}
        </div>
      )}
    </div>
  );
}

function StatTile({
  label,
  value,
  icon,
  highlight,
}: {
  label: string;
  value: string;
  icon: string;
  highlight?: boolean;
}) {
  return (
    <Card
      className={cn(
        "p-5 transition-all duration-200 hover:-translate-y-0.5",
        highlight &&
          "border-[rgb(var(--primary))]/30 bg-gradient-to-br from-[rgb(var(--primary))]/8 to-transparent"
      )}
    >
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-lg",
            highlight
              ? "bg-gradient-to-br from-[rgb(var(--primary))]/20 to-[rgb(var(--primary))]/10"
              : "bg-gradient-to-br from-amber-200/40 to-amber-100/20"
          )}
        >
          {icon}
        </span>
        <div className="min-w-0">
          <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-[rgb(var(--muted))]">
            {label}
          </div>
          <div className="truncate text-xl font-bold tracking-tight">{value}</div>
        </div>
      </div>
    </Card>
  );
}

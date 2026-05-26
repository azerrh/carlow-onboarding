"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StarRating } from "@/components/ui/StarRating";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/cn";

/**
 * Section "Avis & notes" pour la fiche produit.
 *
 * Architecture :
 *  - Lit le buyerId en localStorage (auth client). Si absent, on cache le
 *    formulaire et on affiche un CTA login.
 *  - Charge `/api/marketplace/reviews?productId=...` pour la liste publique
 *    + ma review si je suis connecté.
 *  - L'API renvoie 403 si je tente de poster sans avoir acheté le produit
 *    → on affiche le message d'erreur tel quel, c'est explicite.
 *
 * Pas de pagination pour l'instant (cap à 50 reviews côté API). À ajouter
 * si la marketplace a beaucoup de trafic.
 */

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  author: string;
}

interface MyReview {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Stats {
  average: number;
  count: number;
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function ProductReviews({ productId }: { productId: string }) {
  const [buyerId, setBuyerId] = useState<string | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<Stats>({ average: 0, count: 0 });
  const [myReview, setMyReview] = useState<MyReview | null>(null);
  const [loading, setLoading] = useState(true);

  // Form state
  const [formRating, setFormRating] = useState(5);
  const [formComment, setFormComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setBuyerId(localStorage.getItem("buyerId"));
    }
  }, []);

  const fetchReviews = useCallback(async () => {
    try {
      const url = new URL(
        "/api/marketplace/reviews",
        typeof window !== "undefined" ? window.location.origin : "http://localhost"
      );
      url.searchParams.set("productId", productId);
      if (buyerId) url.searchParams.set("buyerId", buyerId);

      const res = await fetch(url.toString());
      const data = await res.json();
      if (res.ok && data.success) {
        setReviews(data.reviews ?? []);
        setStats(data.stats ?? { average: 0, count: 0 });
        setMyReview(data.myReview ?? null);
        if (data.myReview) {
          setFormRating(data.myReview.rating);
          setFormComment(data.myReview.comment ?? "");
        }
      }
    } catch {
      // silencieux
    } finally {
      setLoading(false);
    }
  }, [productId, buyerId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!buyerId) return;
    setSubmitError("");
    setSubmitSuccess("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/marketplace/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyerId,
          productId,
          rating: formRating,
          comment: formComment.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setSubmitError(data?.error ?? "Erreur lors de la publication");
        return;
      }
      setSubmitSuccess(myReview ? "Avis mis à jour ✓" : "Avis publié ✓");
      // Recharge pour avoir la liste à jour avec le bon nom d'auteur etc.
      await fetchReviews();
    } catch {
      setSubmitError("Erreur réseau, réessayez.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!buyerId || !myReview) return;
    if (!confirm("Supprimer définitivement votre avis sur ce produit ?")) return;
    setSubmitting(true);
    setSubmitError("");
    setSubmitSuccess("");
    try {
      const res = await fetch(
        `/api/marketplace/reviews?buyerId=${encodeURIComponent(buyerId)}&productId=${encodeURIComponent(productId)}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (!res.ok || !data.success) {
        setSubmitError(data?.error ?? "Impossible de supprimer l'avis");
        return;
      }
      setSubmitSuccess("Avis supprimé ✓");
      setMyReview(null);
      setFormRating(5);
      setFormComment("");
      await fetchReviews();
    } catch {
      setSubmitError("Erreur réseau, réessayez.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mt-12">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
            Avis & notes
          </h2>
          <p className="mt-1 text-sm text-[rgb(var(--muted))]">
            Retours d&apos;acheteurs ayant commandé ce produit.
          </p>
        </div>

        {!loading && stats.count > 0 && (
          <div className="flex items-center gap-3 rounded-xl border border-[rgb(var(--border))] bg-white px-4 py-2.5">
            <StarRating value={stats.average} size="md" />
            <div className="text-sm">
              <span className="font-bold">{stats.average.toFixed(1)}</span>
              <span className="text-[rgb(var(--muted))]">
                {" "}
                · {stats.count} avis
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Formulaire (si connecté) ou CTA login */}
      <div className="mt-6">
        {!buyerId ? (
          <Card className="flex flex-col items-start justify-between gap-3 p-5 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-semibold">Vous avez essayé ce produit ?</p>
              <p className="text-xs text-[rgb(var(--muted))]">
                Connectez-vous à votre compte acheteur pour laisser un avis.
              </p>
            </div>
            <Link
              href={`/buyer/login?redirect=/marketplace/${productId}`}
            >
              <Button size="sm">Se connecter</Button>
            </Link>
          </Card>
        ) : (
          <Card className="p-5">
            <form onSubmit={handleSubmit}>
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[rgb(var(--muted))]">
                  Votre note
                </span>
                <StarRating
                  mode="input"
                  value={formRating}
                  onChange={setFormRating}
                  size="lg"
                />
                <span className="text-sm font-semibold">{formRating}/5</span>
              </div>
              <textarea
                value={formComment}
                onChange={(e) => setFormComment(e.target.value)}
                maxLength={1000}
                rows={3}
                placeholder="Partagez votre expérience (optionnel)…"
                className="mt-4 w-full rounded-xl border border-[rgb(var(--border))] bg-white p-3 text-sm focus:border-[rgb(var(--primary))]/60 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]/15"
              />
              <div className="mt-1 text-right text-[10px] text-[rgb(var(--muted))]">
                {formComment.length}/1000
              </div>

              {submitError && (
                <p className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  {submitError}
                </p>
              )}
              {submitSuccess && (
                <p className="mt-2 rounded-lg border border-[rgb(var(--success))]/30 bg-[rgb(var(--success))]/10 px-3 py-2 text-xs text-[rgb(var(--success))]">
                  {submitSuccess}
                </p>
              )}

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-[11px] text-[rgb(var(--muted))]">
                  {myReview
                    ? "Vous avez déjà un avis. La soumission le mettra à jour."
                    : "Un seul avis par produit. Vous pourrez le modifier plus tard."}
                </p>
                <div className="flex items-center gap-2">
                  {myReview && (
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={submitting}
                      className="rounded-lg px-3 py-1.5 text-xs font-semibold text-red-500 transition hover:bg-red-500/10 disabled:opacity-50"
                    >
                      Supprimer
                    </button>
                  )}
                  <Button type="submit" size="sm" disabled={submitting}>
                    {submitting
                      ? "Envoi…"
                      : myReview
                        ? "Mettre à jour"
                        : "Publier l'avis"}
                  </Button>
                </div>
              </div>
            </form>
          </Card>
        )}
      </div>

      {/* Liste publique */}
      <div className="mt-6 space-y-3">
        {loading ? (
          <>
            <Skeleton variant="card" className="h-24" />
            <Skeleton variant="card" className="h-24" />
          </>
        ) : reviews.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="text-3xl">⭐</div>
            <p className="mt-3 text-sm font-semibold">
              Aucun avis pour le moment
            </p>
            <p className="mt-1 text-xs text-[rgb(var(--muted))]">
              Soyez le premier à donner votre avis sur ce produit.
            </p>
          </Card>
        ) : (
          reviews.map((r) => {
            const isMine = !!myReview && myReview.id === r.id;
            return (
              <Card
                key={r.id}
                className={cn(
                  "p-5",
                  isMine && "border-[rgb(var(--primary))]/30 bg-[rgb(var(--primary))]/[0.03]"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-[rgb(var(--primary))]/10 text-sm font-bold text-[rgb(var(--primary))]">
                      {r.author.charAt(0).toUpperCase()}
                    </span>
                    <div>
                      <p className="text-sm font-semibold">
                        {r.author}
                        {isMine && (
                          <span className="ml-2 rounded-md bg-[rgb(var(--primary))]/10 px-1.5 py-0.5 text-[10px] font-bold text-[rgb(var(--primary))]">
                            Vous
                          </span>
                        )}
                      </p>
                      <p className="text-[11px] text-[rgb(var(--muted))]">
                        {formatDate(r.createdAt)}
                      </p>
                    </div>
                  </div>
                  <StarRating value={r.rating} size="sm" />
                </div>
                {r.comment && (
                  <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-[rgb(var(--fg))]">
                    {r.comment}
                  </p>
                )}
              </Card>
            );
          })
        )}
      </div>
    </section>
  );
}

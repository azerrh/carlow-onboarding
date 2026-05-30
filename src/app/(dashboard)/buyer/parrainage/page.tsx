"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Brand } from "@/components/ui/Brand";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";

interface ReferralData {
  code: string;
  rewardCents: number;
  creditCents: number;
  earnedCents: number;
  myReferrer: { name: string; code: string } | null;
  stats: {
    totalReferred: number;
    rewardedCount: number;
    pendingCount: number;
  };
  referrals: {
    id: string;
    status: "pending" | "rewarded" | "cancelled";
    rewardCents: number;
    createdAt: string;
    rewardedAt: string | null;
    buyer: { name: string; email: string; signupAt: string };
  }[];
}

function formatEuros(cents: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function BuyerReferralPage() {
  const router = useRouter();
  const [buyerId, setBuyerId] = useState<string | null>(null);
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [shareUrl, setShareUrl] = useState("");

  useEffect(() => {
    const id = localStorage.getItem("buyerId");
    if (!id) {
      router.replace("/buyer/login");
      return;
    }
    setBuyerId(id);
  }, [router]);

  const loadData = useCallback(async () => {
    if (!buyerId) return;
    try {
      const res = await fetch(`/api/buyer/referral?buyerId=${buyerId}`);
      const d = await res.json();
      if (res.ok && d.success) {
        setData(d);
        // URL de partage = base + /buyer/register?ref=CODE
        const baseUrl =
          typeof window !== "undefined" ? window.location.origin : "";
        setShareUrl(`${baseUrl}/buyer/register?ref=${d.code}`);
      }
    } catch {
      /* silencieux */
    } finally {
      setLoading(false);
    }
  }, [buyerId]);

  useEffect(() => {
    if (buyerId) loadData();
  }, [buyerId, loadData]);

  function copyToClipboard(text: string, label: string) {
    if (typeof navigator === "undefined" || !navigator.clipboard) return;
    navigator.clipboard.writeText(text);
    setToast(`${label} copié dans le presse-papier ✓`);
    setTimeout(() => setToast(""), 2500);
  }

  function shareWhatsApp() {
    if (!data) return;
    const text = encodeURIComponent(
      `Salut ! Je viens de découvrir Carlow, la marketplace B2B des équipements EnR. Inscris-toi avec mon code ${data.code} et on reçoit chacun 10€ : ${shareUrl}`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  }

  function shareEmail() {
    if (!data) return;
    const subject = encodeURIComponent("Rejoins-moi sur Carlow — 10€ offerts");
    const body = encodeURIComponent(
      `Salut !\n\nJe viens de découvrir Carlow, la marketplace B2B des équipements d'énergies renouvelables.\n\nInscris-toi avec mon code ${data.code} et on reçoit chacun 10€ de crédit sur ta 1ère commande livrée.\n\nLien direct : ${shareUrl}\n\nÀ bientôt !`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`);
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
                Parrainage
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
        {/* Title + intro */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">
            🎁 Programme parrainage
          </h1>
          <p className="mt-1 text-sm text-[rgb(var(--muted))]">
            Invitez vos contacts et gagnez{" "}
            <strong className="text-[rgb(var(--success))]">
              {data ? formatEuros(data.rewardCents) : "10€"}
            </strong>{" "}
            chacun à leur 1ère commande livrée.
          </p>
        </div>

        {loading || !data ? (
          <Card className="grid h-64 place-items-center text-sm text-[rgb(var(--muted))]">
            Chargement…
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Stats KPI */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <KpiCard
                icon="💰"
                label="Crédit disponible"
                value={formatEuros(data.creditCents)}
                highlight={data.creditCents > 0}
              />
              <KpiCard
                icon="🎉"
                label="Total gagné"
                value={formatEuros(data.earnedCents)}
              />
              <KpiCard
                icon="👥"
                label="Filleuls inscrits"
                value={String(data.stats.totalReferred)}
              />
              <KpiCard
                icon="✅"
                label="Récompensés"
                value={String(data.stats.rewardedCount)}
              />
            </div>

            {/* Code de partage — hero card */}
            <Card className="relative overflow-hidden p-0">
              {/* Bande dégradée */}
              <div className="h-1.5 w-full bg-gradient-to-r from-[rgb(var(--primary))] via-[#e8923a] to-[#c05510]" />

              {/* Décor */}
              <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[rgb(var(--primary))]/10 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-[rgb(var(--success))]/10 blur-3xl" />

              <div className="relative grid gap-6 p-7 lg:grid-cols-5">
                {/* Code */}
                <div className="lg:col-span-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[rgb(var(--primary))]">
                    Votre code unique
                  </p>
                  <button
                    onClick={() => copyToClipboard(data.code, "Code")}
                    className="group mt-2 flex w-full items-center justify-between gap-3 rounded-2xl border-2 border-dashed border-[rgb(var(--primary))]/40 bg-gradient-to-br from-[rgb(var(--primary))]/8 to-[rgb(var(--primary))]/3 p-4 transition-all duration-200 hover:border-[rgb(var(--primary))] hover:bg-[rgb(var(--primary))]/10"
                  >
                    <span className="font-mono text-xl font-bold tracking-wider text-[rgb(var(--primary))] sm:text-2xl">
                      {data.code}
                    </span>
                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-[rgb(var(--primary))]/15 text-[rgb(var(--primary))] transition group-hover:scale-110">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                        <rect x="9" y="9" width="13" height="13" rx="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                    </span>
                  </button>
                  <p className="mt-2 text-[10px] text-[rgb(var(--muted))]">
                    Cliquez pour copier
                  </p>
                </div>

                {/* Partage */}
                <div className="lg:col-span-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[rgb(var(--primary))]">
                    Lien de partage
                  </p>
                  <div className="mt-2 flex gap-2">
                    <input
                      readOnly
                      value={shareUrl}
                      onClick={(e) => (e.target as HTMLInputElement).select()}
                      className="h-11 flex-1 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))]/50 px-3.5 text-xs text-[rgb(var(--fg))]/80 focus:outline-none"
                    />
                    <button
                      onClick={() => copyToClipboard(shareUrl, "Lien")}
                      className="grid h-11 w-11 place-items-center rounded-xl border border-[rgb(var(--border))]/80 bg-[rgb(var(--card))] text-[rgb(var(--muted))] transition hover:border-[rgb(var(--primary))]/40 hover:bg-[rgb(var(--primary))]/8 hover:text-[rgb(var(--primary))]"
                      title="Copier le lien"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
                        <rect x="9" y="9" width="13" height="13" rx="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                    </button>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                    <button
                      onClick={shareWhatsApp}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#25D366]/40 bg-[#25D366]/8 px-3 py-2 text-xs font-bold text-[#1aa852] transition hover:bg-[#25D366]/15"
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                        <path d="M17.5 14.4c-.3-.1-1.7-.8-2-.9-.3-.1-.5-.1-.7.1-.2.3-.7.9-.9 1.1-.2.1-.3.2-.6 0-1.7-.9-2.9-1.6-4-3.5-.3-.5.3-.5.8-1.5.1-.2 0-.3 0-.4 0-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.4 0 1.4 1 2.8 1.2 3 .1.2 2 3 4.7 4.2 1.6.7 2.3.7 3.1.6.5-.1 1.7-.7 1.9-1.4.2-.7.2-1.3.2-1.4-.1-.1-.2-.2-.5-.3M12 22a10 10 0 0 1-5.4-1.6l-.4-.2-4 1 1.1-3.9-.3-.4A10 10 0 1 1 12 22m0-18a8 8 0 0 0-6.8 12.2l.3.5-.8 2.9 3-.8.5.3A8 8 0 1 0 12 4" />
                      </svg>
                      WhatsApp
                    </button>
                    <button
                      onClick={shareEmail}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-[rgb(var(--border))]/80 bg-[rgb(var(--card))] px-3 py-2 text-xs font-bold text-[rgb(var(--fg))] transition hover:border-[rgb(var(--primary))]/40 hover:bg-[rgb(var(--primary))]/8 hover:text-[rgb(var(--primary))]"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                        <polyline points="22,6 12,13 2,6" />
                      </svg>
                      Email
                    </button>
                    <button
                      onClick={() => copyToClipboard(`Inscris-toi sur Carlow avec mon code ${data.code} et gagnons 10€ chacun : ${shareUrl}`, "Message")}
                      className="col-span-2 inline-flex items-center justify-center gap-2 rounded-xl border border-[rgb(var(--border))]/80 bg-[rgb(var(--card))] px-3 py-2 text-xs font-bold text-[rgb(var(--fg))] transition hover:border-[rgb(var(--primary))]/40 hover:bg-[rgb(var(--primary))]/8 hover:text-[rgb(var(--primary))] sm:col-span-1"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
                        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8z" />
                      </svg>
                      Message
                    </button>
                  </div>
                </div>
              </div>
            </Card>

            {/* Comment ça marche */}
            <Card className="p-6">
              <h2 className="text-base font-bold tracking-tight">
                💡 Comment ça marche
              </h2>
              <div className="mt-5 grid gap-4 lg:grid-cols-3">
                {[
                  {
                    n: "1",
                    icon: "📤",
                    title: "Partagez votre code",
                    desc: "Envoyez votre code unique ou votre lien à vos contacts professionnels.",
                  },
                  {
                    n: "2",
                    icon: "✍️",
                    title: "Ils s'inscrivent",
                    desc: "Vos filleuls créent un compte acheteur en utilisant votre code.",
                  },
                  {
                    n: "3",
                    icon: "🎉",
                    title: "Vous gagnez tous les deux",
                    desc: `Dès leur 1ère commande livrée, ${formatEuros(data.rewardCents)} sont crédités sur chacun de vos comptes.`,
                  },
                ].map((step) => (
                  <div
                    key={step.n}
                    className="relative rounded-2xl border border-[rgb(var(--border))]/60 bg-[rgb(var(--card))] p-5"
                  >
                    <div className="absolute -top-3 -left-3 grid h-9 w-9 place-items-center rounded-2xl bg-gradient-to-br from-[rgb(var(--primary))] to-[#c05510] text-sm font-bold text-white shadow-md">
                      {step.n}
                    </div>
                    <div className="text-3xl">{step.icon}</div>
                    <h3 className="mt-2 text-sm font-bold">{step.title}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-[rgb(var(--muted))]">
                      {step.desc}
                    </p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Mon parrain (si filleul) */}
            {data.myReferrer && (
              <Card className="border-[rgb(var(--success))]/25 bg-[rgb(var(--success))]/5 p-5">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[rgb(var(--success))]/15 text-lg">
                    🤝
                  </span>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-[rgb(var(--success))]">
                      Vous avez été parrainé(e) par
                    </p>
                    <p className="text-sm">
                      <strong>{data.myReferrer.name}</strong> (code{" "}
                      <span className="font-mono">{data.myReferrer.code}</span>)
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {/* Liste filleuls */}
            <Card className="overflow-hidden p-0">
              <div className="border-b border-[rgb(var(--border))]/60 p-6">
                <h2 className="text-base font-bold tracking-tight">
                  👥 Mes filleuls
                </h2>
                <p className="mt-0.5 text-xs text-[rgb(var(--muted))]">
                  {data.stats.totalReferred} personne
                  {data.stats.totalReferred > 1 ? "s" : ""} inscrite
                  {data.stats.totalReferred > 1 ? "s" : ""} via votre code
                  {data.stats.pendingCount > 0 && (
                    <>
                      {" "}— <strong>{data.stats.pendingCount} en attente</strong> de leur 1ère commande
                    </>
                  )}
                </p>
              </div>

              {data.referrals.length === 0 ? (
                <div className="p-10 text-center">
                  <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-[rgb(var(--primary))]/15 to-[rgb(var(--primary))]/8 text-3xl">
                    👥
                  </div>
                  <p className="mt-4 text-sm font-bold">
                    Aucun filleul pour le moment
                  </p>
                  <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                    Partagez votre code pour commencer à gagner des crédits.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-[rgb(var(--border))]/40">
                  {data.referrals.map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between gap-3 p-4"
                    >
                      <div className="flex items-center gap-3">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[rgb(var(--primary))]/15 to-[rgb(var(--primary))]/8 text-sm font-bold text-[rgb(var(--primary))]">
                          {r.buyer.name.charAt(0).toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate">
                            {r.buyer.name}
                          </p>
                          <p className="truncate text-[11px] text-[rgb(var(--muted))]">
                            {r.buyer.email} · Inscrit le {formatDate(r.buyer.signupAt)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        {r.status === "rewarded" ? (
                          <>
                            <span className="inline-flex items-center gap-1 rounded-full bg-[rgb(var(--success))]/10 px-2.5 py-0.5 text-[10px] font-bold text-[rgb(var(--success))]">
                              ✓ {formatEuros(r.rewardCents)} crédités
                            </span>
                            {r.rewardedAt && (
                              <p className="mt-1 text-[10px] text-[rgb(var(--muted))]">
                                {formatDate(r.rewardedAt)}
                              </p>
                            )}
                          </>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-700">
                            ⏳ En attente
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
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

function KpiCard({
  icon,
  label,
  value,
  highlight,
}: {
  icon: string;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <Card
      className={cn(
        "p-5 transition-all duration-200 hover:-translate-y-0.5",
        highlight &&
          "border-[rgb(var(--success))]/30 bg-gradient-to-br from-[rgb(var(--success))]/8 to-transparent"
      )}
    >
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-lg",
            highlight
              ? "bg-gradient-to-br from-[rgb(var(--success))]/20 to-[rgb(var(--success))]/10"
              : "bg-gradient-to-br from-[rgb(var(--primary))]/15 to-[rgb(var(--primary))]/8"
          )}
        >
          {icon}
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[rgb(var(--muted))]">
            {label}
          </p>
          <p
            className={cn(
              "truncate text-xl font-bold tracking-tight",
              highlight && "text-[rgb(var(--success))]"
            )}
          >
            {value}
          </p>
        </div>
      </div>
    </Card>
  );
}

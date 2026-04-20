"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Brand } from "@/components/ui/Brand";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";

type Vendor = {
  id: string;
  name: string;
  email: string;
  status: string;
  companyName?: string | null;
  siret?: string | null;
  vatNumber?: string | null;
  vatValid?: boolean;
  legalForm?: string | null;
  address?: string | null;
  iban?: string | null;
  incoterms?: string | null;
  onboardingStep: number;
  createdAt: string;
  activatedAt?: string | null;
};

const ONBOARDING_STEPS = [
  { n: 1, label: "Compte", path: "/register" },
  { n: 2, label: "Société", path: "/step-2-company" },
  { n: 3, label: "Documents", path: "/step-3-documents" },
  { n: 4, label: "Certifications", path: "/step-4-certifications" },
  { n: 5, label: "Logistique", path: "/step-5-logistics" },
  { n: 6, label: "Confirmation", path: "/step-6-confirmation" },
];

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  pending: {
    bg: "bg-[rgb(var(--primary))]/10 border-[rgb(var(--primary))]/30",
    text: "text-[rgb(var(--primary))]",
    label: "En cours de validation",
  },
  active: {
    bg: "bg-[rgb(var(--success))]/10 border-[rgb(var(--success))]/30",
    text: "text-[rgb(var(--success))]",
    label: "Compte actif",
  },
  rejected: {
    bg: "bg-red-50 border-red-200",
    text: "text-red-700",
    label: "Rejeté",
  },
};

export default function AccountPage() {
  const router = useRouter();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const vendorId = localStorage.getItem("vendorId");
    if (!vendorId) {
      router.push("/login");
      return;
    }

    (async () => {
      try {
        const res = await fetch(`/api/vendor/me?vendorId=${encodeURIComponent(vendorId)}`);
        const data = await res.json();
        if (res.ok && data.success) setVendor(data.vendor);
      } catch {
        // silencieux
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  function handleLogout() {
    localStorage.removeItem("vendorId");
    router.push("/login");
  }

  if (loading) {
    return (
      <div className="portal-page grid min-h-screen place-items-center">
        <p className="text-sm text-[rgb(var(--muted))]">Chargement...</p>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="portal-page grid min-h-screen place-items-center px-4">
        <Card className="max-w-md p-8 text-center">
          <p className="text-sm text-[rgb(var(--muted))]">Impossible de charger vos informations.</p>
          <Button onClick={() => router.push("/login")} className="mt-4">
            Se reconnecter
          </Button>
        </Card>
      </div>
    );
  }

  const currentStep = vendor.onboardingStep;
  const progress = Math.min((currentStep / 6) * 100, 100);
  const statusStyle = STATUS_STYLES[vendor.status] ?? STATUS_STYLES.pending;
  const isComplete = currentStep >= 6;
  const nextStep = ONBOARDING_STEPS.find((s) => s.n === currentStep) ?? ONBOARDING_STEPS[5];

  return (
    <div className="portal-page min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-[rgb(var(--border))]/60 bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Brand />
          <nav className="flex items-center gap-2">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">Tableau de bord</Button>
            </Link>
            <Button variant="secondary" size="sm" onClick={handleLogout}>
              Déconnexion
            </Button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        {/* Bandeau profil */}
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-[rgb(var(--primary))] text-2xl font-bold text-white">
              {vendor.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Bonjour, {vendor.name}
              </h1>
              <p className="text-sm text-[rgb(var(--muted))]">{vendor.email}</p>
            </div>
          </div>
          <div className={cn("rounded-full border px-3 py-1 text-xs font-semibold", statusStyle.bg, statusStyle.text)}>
            ● {statusStyle.label}
          </div>
        </div>

        {/* Progression onboarding */}
        <Card className="mt-8 p-6 sm:p-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Progression de votre inscription</h2>
              <p className="text-sm text-[rgb(var(--muted))]">
                {isComplete
                  ? "🎉 Félicitations ! Votre inscription est complète."
                  : `Étape ${currentStep} sur 6 — ${nextStep.label}`}
              </p>
            </div>
            {!isComplete && (
              <Button onClick={() => router.push(nextStep.path)} size="sm">
                Continuer →
              </Button>
            )}
          </div>
          <div className="mt-5 h-2 w-full overflow-hidden rounded-full bg-black/[0.06]">
            <div
              className="h-full rounded-full bg-[rgb(var(--primary))] transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {ONBOARDING_STEPS.map((s) => {
              const done = s.n < currentStep;
              const active = s.n === currentStep;
              return (
                <Link
                  key={s.n}
                  href={done || active ? s.path : "#"}
                  className={cn(
                    "flex items-center gap-2 rounded-xl border px-3 py-2 text-xs transition",
                    done && "border-[rgb(var(--success))]/30 bg-[rgb(var(--success))]/[0.06]",
                    active && "border-[rgb(var(--primary))]/40 bg-[rgb(var(--primary))]/[0.06]",
                    !done && !active && "border-[rgb(var(--border))] bg-white/50 opacity-60"
                  )}
                >
                  <span
                    className={cn(
                      "grid h-5 w-5 place-items-center rounded-full text-[10px] font-bold",
                      done && "bg-[rgb(var(--success))] text-white",
                      active && "bg-[rgb(var(--primary))] text-white",
                      !done && !active && "bg-black/[0.08] text-[rgb(var(--muted))]"
                    )}
                  >
                    {done ? "✓" : s.n}
                  </span>
                  <span
                    className={cn(
                      "truncate font-medium",
                      done && "text-[rgb(var(--success))]",
                      active && "text-[rgb(var(--primary))]",
                      !done && !active && "text-[rgb(var(--muted))]"
                    )}
                  >
                    {s.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </Card>

        {/* Grille infos */}
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          {/* Informations société */}
          <Card className="p-6 lg:col-span-2">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Informations de la société</h2>
              <Link
                href="/step-2-company"
                className="text-xs font-semibold text-[rgb(var(--primary))] hover:underline"
              >
                Modifier
              </Link>
            </div>
            <dl className="mt-5 grid gap-4 sm:grid-cols-2">
              <InfoRow label="Raison sociale" value={vendor.companyName} />
              <InfoRow label="Forme juridique" value={vendor.legalForm} />
              <InfoRow label="SIRET" value={vendor.siret} mono />
              <InfoRow
                label="N° TVA"
                value={vendor.vatNumber}
                mono
                badge={
                  vendor.vatValid ? (
                    <span className="rounded-full bg-[rgb(var(--success))]/10 px-2 py-0.5 text-[10px] font-semibold text-[rgb(var(--success))]">
                      ✓ Valide
                    </span>
                  ) : null
                }
              />
              <InfoRow label="Adresse" value={vendor.address} className="sm:col-span-2" />
            </dl>
          </Card>

          {/* Actions rapides */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold">Actions rapides</h2>
            <div className="mt-5 space-y-2">
              <ActionLink href="/step-3-documents" icon="📄" label="Mes documents" />
              <ActionLink href="/step-4-certifications" icon="🏆" label="Mes certifications" />
              <ActionLink href="/step-5-logistics" icon="🚚" label="Logistique" />
              <ActionLink href="/dashboard" icon="📊" label="Tableau de bord" />
            </div>
          </Card>
        </div>

        {/* Infos bancaires + logistique */}
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Coordonnées bancaires</h2>
              <Link
                href="/step-3-documents"
                className="text-xs font-semibold text-[rgb(var(--primary))] hover:underline"
              >
                Modifier
              </Link>
            </div>
            <dl className="mt-5 space-y-4">
              <InfoRow label="IBAN" value={vendor.iban} mono />
            </dl>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Logistique</h2>
              <Link
                href="/step-5-logistics"
                className="text-xs font-semibold text-[rgb(var(--primary))] hover:underline"
              >
                Modifier
              </Link>
            </div>
            <dl className="mt-5 space-y-4">
              <InfoRow label="Incoterms" value={vendor.incoterms} />
            </dl>
          </Card>
        </div>

        {/* Infos compte */}
        <Card className="mt-6 p-6">
          <h2 className="text-lg font-semibold">Informations du compte</h2>
          <dl className="mt-5 grid gap-4 sm:grid-cols-3">
            <InfoRow
              label="Compte créé le"
              value={new Date(vendor.createdAt).toLocaleDateString("fr-FR", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            />
            <InfoRow
              label="Activé le"
              value={
                vendor.activatedAt
                  ? new Date(vendor.activatedAt).toLocaleDateString("fr-FR", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })
                  : "—"
              }
            />
            <InfoRow label="ID vendeur" value={vendor.id} mono />
          </dl>
        </Card>
      </main>
    </div>
  );
}

function InfoRow({
  label,
  value,
  mono,
  className,
  badge,
}: {
  label: string;
  value?: string | null;
  mono?: boolean;
  className?: string;
  badge?: React.ReactNode;
}) {
  return (
    <div className={className}>
      <dt className="text-xs uppercase tracking-wider text-[rgb(var(--muted))]">{label}</dt>
      <dd className="mt-1 flex items-center gap-2">
        <span
          className={cn(
            "text-sm text-[rgb(var(--fg))]",
            mono && "font-mono",
            !value && "text-[rgb(var(--muted))] italic"
          )}
        >
          {value || "Non renseigné"}
        </span>
        {badge}
      </dd>
    </div>
  );
}

function ActionLink({ href, icon, label }: { href: string; icon: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-xl border border-[rgb(var(--border))] bg-white/50 px-4 py-3 text-sm font-medium transition hover:border-[rgb(var(--primary))]/30 hover:bg-[rgb(var(--primary))]/[0.04]"
    >
      <span className="flex items-center gap-3">
        <span className="text-base">{icon}</span>
        {label}
      </span>
      <span className="text-[rgb(var(--muted))]">→</span>
    </Link>
  );
}

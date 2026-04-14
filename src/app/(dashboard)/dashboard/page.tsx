"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Brand } from "@/components/ui/Brand";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";

interface Vendor {
  id: string;
  name: string;
  email: string;
  status: string;
  onboardingStep: number;
  companyName: string | null;
  createdAt: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const vendorId = localStorage.getItem("vendorId");
    if (!vendorId) { router.push("/login"); return; }
    fetch(`/api/vendor/me?id=${vendorId}`)
      .then(r => r.json())
      .then(data => { setVendor(data.vendor); setLoading(false); })
      .catch(() => { router.push("/login"); });
  }, [router]);

  if (loading)
    return (
      <div className="portal-page grid min-h-screen place-items-center">
        <div className="text-sm text-[rgb(var(--muted))]">Chargement...</div>
      </div>
    );

  const steps = [
    { label: "Compte", done: true },
    { label: "Societe", done: (vendor?.onboardingStep ?? 0) > 1 },
    { label: "Documents", done: (vendor?.onboardingStep ?? 0) > 2 },
    { label: "Certifications", done: (vendor?.onboardingStep ?? 0) > 3 },
    { label: "Logistique", done: (vendor?.onboardingStep ?? 0) > 4 },
    { label: "Validation", done: vendor?.status === "submitted" },
  ];

  const progress = Math.round((steps.filter(s => s.done).length / steps.length) * 100);

  const statusColor = vendor?.status === "submitted" ? "#22a06b" :
                      vendor?.status === "active" ? "#E87A30" : "#888";
  const statusLabel = vendor?.status === "submitted" ? "Dossier soumis" :
                      vendor?.status === "active" ? "Compte actif" : "En cours";

  return (
    <div className="portal-page min-h-screen">
      <div className="sticky top-0 z-10 border-b border-[rgb(var(--border))] bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-[980px] items-center justify-between px-4 py-3">
          <Brand variant="compact" />
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-[rgb(var(--muted))] sm:inline">
              {vendor?.name}
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                localStorage.removeItem("vendorId");
                router.push("/login");
              }}
            >
              Déconnexion
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[980px] px-4 py-10">
        <h1 className="text-xl font-semibold tracking-tight">
          Bonjour, {vendor?.name} !
        </h1>
        <p className="mt-1 text-sm text-[rgb(var(--muted))]">
          Voici l’état de votre dossier vendeur Carlow.
        </p>

        <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Card className="p-5">
            <div className="text-xs font-medium text-[rgb(var(--muted))]">
              Statut dossier
            </div>
            <div
              className="mt-1 text-lg font-semibold"
              style={{ color: statusColor }}
            >
              {statusLabel}
            </div>
          </Card>
          <Card className="p-5">
            <div className="text-xs font-medium text-[rgb(var(--muted))]">
              Progression
            </div>
            <div className="mt-1 text-lg font-semibold text-[rgb(var(--primary))]">
              {progress}%
            </div>
          </Card>
          <Card className="p-5">
            <div className="text-xs font-medium text-[rgb(var(--muted))]">
              Société
            </div>
            <div className="mt-1 text-sm font-semibold text-[rgb(var(--fg))]">
              {vendor?.companyName || "Non renseignée"}
            </div>
          </Card>
        </div>

        <Card className="mt-5 p-6">
          <div className="text-sm font-semibold">Progression du dossier</div>
          <div className="mt-4 h-2 w-full rounded-full bg-black/5">
            <div
              className="h-2 rounded-full bg-[rgb(var(--primary))] transition-[width] duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-3">
            {steps.map((step, i) => (
              <div
                key={i}
                className={cn(
                  "flex items-center gap-2 rounded-xl border px-3 py-2.5",
                  step.done
                    ? "border-[rgb(var(--primary))]/40 bg-[rgb(var(--primary))]/[0.06]"
                    : "border-[rgb(var(--border))] bg-white/40",
                )}
              >
                <div
                  className={cn(
                    "grid h-6 w-6 place-items-center rounded-full text-[11px] font-bold",
                    step.done
                      ? "bg-[rgb(var(--primary))] text-white"
                      : "bg-black/10 text-[rgb(var(--muted))]",
                  )}
                >
                  {step.done ? "✓" : i + 1}
                </div>
                <span
                  className={cn(
                    "text-xs font-medium",
                    step.done
                      ? "text-[rgb(var(--primary))]"
                      : "text-[rgb(var(--muted))]",
                  )}
                >
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {(vendor?.onboardingStep ?? 0) < 6 && vendor?.status !== "submitted" && (
          <div className="mt-5 flex flex-col gap-3 rounded-[var(--radius)] border border-[rgb(var(--primary))]/40 bg-[rgb(var(--primary))]/[0.06] p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm font-semibold text-[rgb(var(--primary))]">
                Dossier incomplet
              </div>
              <div className="mt-0.5 text-sm text-[rgb(var(--muted))]">
                Complétez votre dossier pour activer votre compte vendeur.
              </div>
            </div>
            <Button onClick={() => router.push("/step-2-company")}>
              Continuer
            </Button>
          </div>
        )}

        {vendor?.status === "submitted" && (
          <div className="mt-5 rounded-[var(--radius)] border border-[rgb(var(--success))]/35 bg-[rgb(var(--success))]/[0.06] p-5">
            <div className="text-sm font-semibold text-[rgb(var(--success))]">
              Dossier en cours de vérification
            </div>
            <div className="mt-0.5 text-sm text-[rgb(var(--muted))]">
              Notre équipe vérifie votre dossier sous 24-48h. Vous recevrez un
              email de confirmation.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
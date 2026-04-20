"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { StepperBar } from "@/components/onboarding/StepperBar";
import { Brand } from "@/components/ui/Brand";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";

interface VendorInfo {
  id: string;
  name: string;
  email: string;
  status: string;
  companyName: string | null;
  siret: string | null;
  vatNumber: string | null;
  vatValid: boolean;
  legalForm: string | null;
  address: string | null;
  incoterms: string | null;
}

interface DocInfo {
  id: string;
  type: string;
  filename: string;
  status: string;
}

interface CertInfo {
  id: string;
  certType: string;
  category: string;
  filename: string;
}

const DOC_LABELS: Record<string, string> = {
  kbis: "K-Bis",
  statuts: "Statuts de la société",
  id: "Pièce d'identité",
  rib: "RIB bancaire",
};

const INCOTERMS_LABELS: Record<string, string> = {
  DDP: "DDP — Droits acquittés",
  EXW: "EXW — À l'usine",
  DAP: "DAP — Destination",
  FCA: "FCA — Franco transporteur",
};

export default function StepConfirmationPage() {
  const router = useRouter();
  const [vendor, setVendor] = useState<VendorInfo | null>(null);
  const [documents, setDocuments] = useState<DocInfo[]>([]);
  const [certifications, setCertifications] = useState<CertInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const vendorId = localStorage.getItem("vendorId");
    if (!vendorId) { router.replace("/login"); return; }

    Promise.all([
      fetch(`/api/vendor/me?vendorId=${vendorId}`).then(r => r.json()),
      fetch(`/api/vendor/documents?vendorId=${vendorId}`).then(r => r.json()),
      fetch(`/api/vendor/certifications?vendorId=${vendorId}`).then(r => r.json()),
    ]).then(([vendorData, docsData, certsData]) => {
      if (vendorData.vendor) setVendor(vendorData.vendor);
      if (docsData.documents) setDocuments(docsData.documents);
      if (certsData.certifications) setCertifications(certsData.certifications);
      setLoading(false);
    }).catch(() => {
      setError("Impossible de charger vos données.");
      setLoading(false);
    });
  }, [router]);

  async function handleConfirm() {
    setSubmitting(true);
    setError("");
    const vendorId = localStorage.getItem("vendorId");

    try {
      const res = await fetch("/api/vendor/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendorId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data?.error || "Erreur lors de la soumission.");
        setSubmitting(false);
        return;
      }
      router.push("/dashboard");
    } catch {
      setError("Erreur réseau.");
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="portal-page grid min-h-screen place-items-center">
        <p className="text-sm text-[rgb(var(--muted))]">Chargement de votre dossier...</p>
      </div>
    );
  }

  const allDocsDone = ["kbis", "statuts", "id", "rib"].every((type) =>
    documents.some((d) => d.type === type)
  );

  return (
    <div className="portal-page grid min-h-screen place-items-center px-4 py-10">
      <Card className="w-full max-w-[720px] p-8 sm:p-10">
        <Brand className="mb-5" />
        <StepperBar current={5} />

        <h1 className="mt-4 text-2xl font-semibold tracking-tight">
          Récapitulatif du dossier
        </h1>
        <p className="mt-1 text-sm text-[rgb(var(--muted))]">
          Vérifiez vos informations avant de soumettre votre candidature.
        </p>

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Société */}
        <Section title="Société">
          <Row label="Nom de la société" value={vendor?.companyName} />
          <Row label="Forme juridique" value={vendor?.legalForm} />
          <Row label="SIRET" value={vendor?.siret} mono />
          <Row
            label="Numéro de TVA"
            value={vendor?.vatNumber}
            mono
            badge={
              vendor?.vatValid ? { label: "✓ Validé VIES", variant: "success" } : undefined
            }
          />
          <Row label="Adresse d'expédition" value={vendor?.address} />
          <Row
            label="Incoterms"
            value={vendor?.incoterms ? INCOTERMS_LABELS[vendor.incoterms] ?? vendor.incoterms : undefined}
          />
        </Section>

        {/* Documents */}
        <Section title="Documents réglementaires">
          {["kbis", "statuts", "id", "rib"].map((type) => {
            const uploaded = documents.find((d) => d.type === type);
            return (
              <div
                key={type}
                className="flex items-center justify-between border-b border-[rgb(var(--border))]/60 py-2 last:border-0"
              >
                <span className="text-sm text-[rgb(var(--fg))]">{DOC_LABELS[type]}</span>
                {uploaded ? (
                  <Badge variant="success">Déposé</Badge>
                ) : (
                  <Badge variant="danger">Manquant</Badge>
                )}
              </div>
            );
          })}
        </Section>

        {/* Certifications */}
        <Section title={`Certifications (${certifications.length})`}>
          {certifications.length === 0 ? (
            <p className="py-2 text-sm text-[rgb(var(--muted))]">Aucune certification ajoutée</p>
          ) : (
            certifications.map((cert) => (
              <div
                key={cert.id}
                className="flex items-center justify-between border-b border-[rgb(var(--border))]/60 py-2 last:border-0"
              >
                <div>
                  <span className="text-sm text-[rgb(var(--fg))]">{cert.category}</span>
                  <span className="ml-2 text-xs text-[rgb(var(--muted))]">
                    {cert.certType === "ce" ? "Certificat CE" : "Fiche Certisolis"}
                  </span>
                </div>
                <Badge variant="success">Déposé</Badge>
              </div>
            ))
          )}
        </Section>

        {/* Contact */}
        <Section title="Contact">
          <Row label="Nom" value={vendor?.name} />
          <Row label="Email" value={vendor?.email} mono />
        </Section>

        {/* Warning docs manquants */}
        {!allDocsDone && (
          <div className="mt-6 rounded-xl border border-[rgb(var(--primary))]/30 bg-[rgb(var(--primary))]/[0.06] p-4">
            <div className="flex items-start gap-3">
              <div className="text-base">⚠️</div>
              <div>
                <p className="text-sm font-semibold text-[rgb(var(--primary))]">
                  Documents manquants
                </p>
                <p className="mt-0.5 text-xs text-[rgb(var(--muted))]">
                  Des documents réglementaires sont manquants. Votre dossier sera soumis mais l'activation pourra être retardée.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.push("/step-5-logistics")}
            className="sm:flex-1"
          >
            Retour
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={submitting}
            className={cn("sm:flex-[2]", submitting && "opacity-60")}
          >
            {submitting ? "Envoi en cours..." : "Soumettre le dossier ✓"}
          </Button>
        </div>
      </Card>
    </div>
  );
}

/* ---- Composants internes ---- */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-6">
      <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[rgb(var(--primary))]">
        {title}
      </p>
      <div className="rounded-xl border border-[rgb(var(--border))] bg-white/50 px-4 py-1">
        {children}
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  mono = false,
  badge,
}: {
  label: string;
  value?: string | null;
  mono?: boolean;
  badge?: { label: string; variant: "success" | "danger" };
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-[rgb(var(--border))]/60 py-2.5 last:border-0">
      <span className="text-xs text-[rgb(var(--muted))]">{label}</span>
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "text-right text-sm",
            value ? "text-[rgb(var(--fg))]" : "italic text-[rgb(var(--muted))]",
            mono && "font-mono"
          )}
        >
          {value || "Non renseigné"}
        </span>
        {badge && <Badge variant={badge.variant}>{badge.label}</Badge>}
      </div>
    </div>
  );
}

function Badge({
  children,
  variant = "success",
}: {
  children: React.ReactNode;
  variant?: "success" | "danger";
}) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[11px] font-semibold",
        variant === "success" && "bg-[rgb(var(--success))]/10 text-[rgb(var(--success))]",
        variant === "danger" && "bg-red-50 text-red-600"
      )}
    >
      {children}
    </span>
  );
}

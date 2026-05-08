"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { VendorShell, VendorPageHeader } from "@/components/vendor/VendorShell";
import { cn } from "@/lib/cn";

interface VendorProfile {
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
  iban: string | null;
  incoterms: string | null;
}

interface VendorMe {
  name: string;
  email: string;
  companyName: string | null;
}

const INCOTERMS_OPTIONS = [
  "EXW — Départ usine",
  "FCA — Franco transporteur",
  "CPT — Port payé jusqu'à",
  "CIP — Port payé, assurance comprise",
  "DAP — Rendu au lieu de destination",
  "DPU — Rendu au lieu de destination déchargé",
  "DDP — Rendu droits acquittés",
];

const LEGAL_FORMS = [
  "SARL",
  "SAS",
  "SASU",
  "EURL",
  "SA",
  "SCI",
  "Auto-entrepreneur",
  "EI",
  "Autre",
];

export default function VendorCompanyPage() {
  const router = useRouter();
  const [vendor, setVendor] = useState<VendorProfile | null>(null);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // États contrôlés du formulaire (initialisés depuis vendor)
  const [companyName, setCompanyName] = useState("");
  const [legalForm, setLegalForm] = useState("");
  const [siret, setSiret] = useState("");
  const [vatNumber, setVatNumber] = useState("");
  const [address, setAddress] = useState("");
  const [iban, setIban] = useState("");
  const [incoterms, setIncoterms] = useState("");

  const fetchVendor = useCallback(async () => {
    const vendorId =
      typeof window !== "undefined" ? localStorage.getItem("vendorId") : null;
    if (!vendorId) {
      router.push("/login");
      return;
    }

    try {
      const [meRes, notifsRes] = await Promise.all([
        fetch(`/api/vendor/me?vendorId=${vendorId}`),
        fetch(`/api/vendor/notifications?id=${vendorId}`),
      ]);
      const meData = await meRes.json();
      const notifsData = await notifsRes.json();

      if (meRes.ok && meData.success) {
        const v = meData.vendor as VendorProfile;
        setVendor(v);
        setCompanyName(v.companyName ?? "");
        setLegalForm(v.legalForm ?? "");
        setSiret(v.siret ?? "");
        setVatNumber(v.vatNumber ?? "");
        setAddress(v.address ?? "");
        setIban(v.iban ?? "");
        setIncoterms(v.incoterms ?? "");
      } else {
        router.push("/login");
        return;
      }
      if (notifsRes.ok && notifsData.success) {
        setUnreadNotifs(notifsData.unreadCount ?? 0);
      }
    } catch {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchVendor();
  }, [fetchVendor]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!vendor) return;

    setSaving(true);
    try {
      const res = await fetch("/api/vendor/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorId: vendor.id,
          companyName,
          legalForm,
          siret,
          vatNumber,
          address,
          iban,
          incoterms,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error ?? "Erreur lors de la mise à jour");
        return;
      }
      setSuccess("Informations mises à jour avec succès.");
      // Re-sync l'état local avec ce que la DB a réellement enregistré.
      setVendor({ ...vendor, ...data.vendor });
    } catch {
      setError("Erreur réseau, réessayez.");
    } finally {
      setSaving(false);
    }
  }

  const meForShell: VendorMe | null = vendor
    ? {
        name: vendor.name,
        email: vendor.email,
        companyName: vendor.companyName,
      }
    : null;

  return (
    <VendorShell vendorUser={meForShell} unreadNotifsCount={unreadNotifs}>
      <VendorPageHeader
        breadcrumb={["Vendeur", "Mon entreprise"]}
        title="Mon entreprise"
        subtitle="Informations légales, bancaires et logistiques de votre société."
      />

      {loading || !vendor ? (
        <Card className="p-10 text-center text-sm text-[rgb(var(--muted))]">
          Chargement…
        </Card>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Bandeau statut */}
          <Card className="flex items-center gap-4 p-5">
            <div
              className={cn(
                "grid h-14 w-14 place-items-center rounded-2xl text-2xl",
                vendor.status === "active"
                  ? "bg-[rgb(var(--success))]/10 text-[rgb(var(--success))]"
                  : "bg-[rgb(var(--primary))]/10 text-[rgb(var(--primary))]"
              )}
            >
              🏢
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-semibold">
                {vendor.companyName ?? vendor.name}
              </p>
              <p className="truncate text-xs text-[rgb(var(--muted))]">
                {vendor.email}
              </p>
            </div>
            <span
              className={cn(
                "rounded-full border px-3 py-1 text-[11px] font-semibold",
                vendor.status === "active"
                  ? "border-[rgb(var(--success))]/30 bg-[rgb(var(--success))]/10 text-[rgb(var(--success))]"
                  : vendor.status === "submitted"
                    ? "border-amber-200 bg-amber-50 text-amber-700"
                    : "border-[rgb(var(--border))] bg-black/[0.03] text-[rgb(var(--muted))]"
              )}
            >
              ●{" "}
              {vendor.status === "active"
                ? "Actif"
                : vendor.status === "submitted"
                  ? "En validation"
                  : "En cours"}
            </span>
          </Card>

          {/* Bloc identité légale */}
          <Card className="p-6">
            <h2 className="text-base font-semibold">Identité légale</h2>
            <p className="text-xs text-[rgb(var(--muted))]">
              Ces informations apparaissent sur les factures et auprès des
              acheteurs.
            </p>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="Raison sociale" required>
                <Input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Solelh Energie"
                />
              </Field>

              <Field label="Forme juridique">
                <select
                  value={legalForm}
                  onChange={(e) => setLegalForm(e.target.value)}
                  className="h-11 w-full rounded-xl border border-[rgb(var(--border))] bg-white px-3 text-sm outline-none transition focus:border-[rgb(var(--primary))]/60 focus:ring-4 focus:ring-[rgb(var(--primary))]/15"
                >
                  <option value="">— Sélectionner —</option>
                  {LEGAL_FORMS.map((lf) => (
                    <option key={lf} value={lf}>
                      {lf}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="SIRET / SIREN">
                <Input
                  value={siret}
                  onChange={(e) => setSiret(e.target.value)}
                  placeholder="123 456 789 00012"
                  inputMode="numeric"
                />
              </Field>

              <Field
                label="N° TVA intracommunautaire"
                hint={
                  vendor.vatNumber === vatNumber && vendor.vatValid
                    ? "✓ Validé via VIES"
                    : vatNumber !== (vendor.vatNumber ?? "")
                      ? "Sera revalidé après enregistrement"
                      : undefined
                }
              >
                <Input
                  value={vatNumber}
                  onChange={(e) => setVatNumber(e.target.value)}
                  placeholder="FR12345678901"
                />
              </Field>

              <Field label="Adresse complète" className="sm:col-span-2">
                <Input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="12 rue Example, 75000 Paris"
                />
              </Field>
            </div>
          </Card>

          {/* Bloc bancaire */}
          <Card className="p-6">
            <h2 className="text-base font-semibold">Coordonnées bancaires</h2>
            <p className="text-xs text-[rgb(var(--muted))]">
              IBAN utilisé pour le versement de vos paiements (uniquement
              visible par vous et l&apos;équipe Carlow).
            </p>

            <div className="mt-5">
              <Field label="IBAN">
                <Input
                  value={iban}
                  onChange={(e) => setIban(e.target.value)}
                  placeholder="FR76 1234 5678 9012 3456 789"
                  className="font-mono"
                />
              </Field>
            </div>
          </Card>

          {/* Bloc logistique */}
          <Card className="p-6">
            <h2 className="text-base font-semibold">Logistique</h2>
            <p className="text-xs text-[rgb(var(--muted))]">
              Conditions de livraison appliquées à vos expéditions par défaut.
            </p>

            <div className="mt-5">
              <Field label="Incoterm par défaut">
                <select
                  value={incoterms}
                  onChange={(e) => setIncoterms(e.target.value)}
                  className="h-11 w-full rounded-xl border border-[rgb(var(--border))] bg-white px-3 text-sm outline-none transition focus:border-[rgb(var(--primary))]/60 focus:ring-4 focus:ring-[rgb(var(--primary))]/15"
                >
                  <option value="">— Aucun —</option>
                  {INCOTERMS_OPTIONS.map((inc) => (
                    <option key={inc} value={inc}>
                      {inc}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </Card>

          {/* Messages */}
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-xl border border-[rgb(var(--success))]/30 bg-[rgb(var(--success))]/10 px-4 py-3 text-sm text-[rgb(var(--success))]">
              {success}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap items-center justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => fetchVendor()}
              disabled={saving}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Enregistrement…" : "Enregistrer les modifications"}
            </Button>
          </div>
        </form>
      )}
    </VendorShell>
  );
}

function Field({
  label,
  hint,
  required,
  className,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-[rgb(var(--fg))]">
        {label}
        {required && <span className="text-[rgb(var(--primary))]">*</span>}
      </span>
      {children}
      {hint && (
        <span className="mt-1 block text-[11px] text-[rgb(var(--muted))]">
          {hint}
        </span>
      )}
    </label>
  );
}

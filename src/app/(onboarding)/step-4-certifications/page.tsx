"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { StepperBar } from "@/components/onboarding/StepperBar";
import { Brand } from "@/components/ui/Brand";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";

const CATEGORIES = [
  "Photovoltaïque",
  "Pompes à chaleur",
  "Biomasse",
  "Mobilité IRVE",
  "Solaire thermique",
  "GTB",
];

const CERT_TYPES = [
  { key: "ce",        label: "Certificat CE" },
  { key: "certisolis", label: "Fiche Certisolis" },
];

type CertEntry = {
  id: string;
  filename: string;
  certType: string;
  category: string;
  publicUrl?: string;
};

type UploadState = "idle" | "uploading" | "error";

export default function StepCertificationsPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [certs, setCerts] = useState<CertEntry[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(["Photovoltaïque"]);
  const [selectedCertType, setSelectedCertType] = useState<string>("ce");
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [globalError, setGlobalError] = useState<string>("");

  // Charger les certifications existantes
  useEffect(() => {
    const vendorId = localStorage.getItem("vendorId");
    if (!vendorId) return;

    (async () => {
      try {
        const res = await fetch(`/api/vendor/certifications?vendorId=${encodeURIComponent(vendorId)}`);
        const data = await res.json();
        if (!res.ok || !data.success) return;
        setCerts(
          data.certifications.map((c: CertEntry) => ({
            id: c.id,
            filename: c.filename,
            certType: c.certType,
            category: c.category,
            publicUrl: c.publicUrl,
          }))
        );
      } catch {
        // silencieux
      }
    })();
  }, []);

  function toggleCategory(cat: string) {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.currentTarget.value = "";
    if (!file) return;

    const vendorId = localStorage.getItem("vendorId");
    if (!vendorId) { alert("Reconnectez-vous"); return; }
    if (selectedCategories.length === 0) {
      setGlobalError("Sélectionnez au moins une catégorie avant d'uploader.");
      return;
    }

    setGlobalError("");
    setUploadState("uploading");

    try {
      // 1. Upload du fichier vers Supabase
      const formData = new FormData();
      formData.append("file", file);
      formData.append("vendorId", vendorId);
      formData.append("type", `cert_${selectedCertType}`);

      const uploadRes = await fetch("/api/vendor/upload", { method: "POST", body: formData });
      const uploadData = await uploadRes.json();

      if (!uploadRes.ok || !uploadData.success) {
        setGlobalError(uploadData?.error || "Upload impossible.");
        setUploadState("error");
        return;
      }

      // 2. Enregistrement en DB (une entrée par catégorie sélectionnée)
      const newCerts: CertEntry[] = [];
      for (const cat of selectedCategories) {
        const certRes = await fetch("/api/vendor/certifications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            vendorId,
            certType: selectedCertType,
            filename: uploadData.filename,
            s3Key: uploadData.key,
            category: cat,
          }),
        });
        const certData = await certRes.json();
        if (certRes.ok && certData.success) {
          newCerts.push({
            id: certData.certification.id,
            filename: uploadData.filename,
            certType: selectedCertType,
            category: cat,
            publicUrl: uploadData.publicUrl,
          });
        }
      }

      setCerts((prev) => [...prev, ...newCerts]);
      setUploadState("idle");
    } catch {
      setGlobalError("Erreur réseau pendant l'upload.");
      setUploadState("idle");
    }
  }

  async function handleDelete(id: string) {
    try {
      await fetch(`/api/vendor/certifications?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      setCerts((prev) => prev.filter((c) => c.id !== id));
    } catch {
      // silencieux
    }
  }

  return (
    <div className="portal-page grid min-h-screen place-items-center px-4 py-10">
      <Card className="w-full max-w-[640px] p-8 sm:p-10">
        <Brand className="mb-5" />
        <StepperBar current={3} />

        <h1 className="mt-4 text-2xl font-semibold tracking-tight">
          Certifications produits EnR
        </h1>
        <p className="mt-1 text-sm text-[rgb(var(--muted))]">
          Déposez vos certificats CE et fiches Certisolis (optionnel).
        </p>

        {/* Bandeau info */}
        <div className="mt-4 rounded-xl border border-[rgb(var(--primary))]/25 bg-[rgb(var(--primary))]/[0.06] px-3 py-2 text-sm text-[rgb(var(--primary))]">
          Certificats CE et fiches Certisolis PPE2 requis pour les produits concernés.
        </div>

        {globalError && (
          <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {globalError}
          </div>
        )}

        {/* Type de certificat */}
        <div className="mt-6">
          <p className="mb-2 text-sm font-medium text-[rgb(var(--fg))]">Type de certificat</p>
          <div className="flex gap-3">
            {CERT_TYPES.map((ct) => (
              <button
                key={ct.key}
                type="button"
                onClick={() => setSelectedCertType(ct.key)}
                className={cn(
                  "rounded-xl border-2 px-4 py-2 text-sm font-medium transition",
                  selectedCertType === ct.key
                    ? "border-[rgb(var(--primary))] bg-[rgb(var(--primary))]/10 text-[rgb(var(--primary))]"
                    : "border-[rgb(var(--border))] bg-white text-[rgb(var(--muted))]"
                )}
              >
                {ct.label}
              </button>
            ))}
          </div>
        </div>

        {/* Catégories */}
        <div className="mt-5">
          <p className="mb-2 text-sm font-medium text-[rgb(var(--fg))]">Catégories concernées</p>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => {
              const active = selectedCategories.includes(cat);
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleCategory(cat)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium transition",
                    active
                      ? "border-[rgb(var(--primary))] bg-[rgb(var(--primary))]/10 text-[rgb(var(--primary))]"
                      : "border-[rgb(var(--border))] bg-white text-[rgb(var(--muted))] hover:border-[rgb(var(--primary))]/40"
                  )}
                >
                  {active ? "✓ " : ""}{cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Zone d'upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.zip,.jpg,.jpeg,.png"
          className="hidden"
          onChange={handleFileChange}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadState === "uploading"}
          className={cn(
            "mt-5 w-full rounded-2xl border-2 border-dashed px-4 py-8 text-center transition",
            "hover:bg-black/[0.02] active:bg-black/[0.03]",
            uploadState === "uploading"
              ? "border-[rgb(var(--primary))]/40 bg-[rgb(var(--primary))]/5"
              : "border-[rgb(var(--border))] bg-white/50"
          )}
        >
          <div className="text-2xl mb-1">{uploadState === "uploading" ? "⏳" : "+"}</div>
          <div className="text-sm font-medium text-[rgb(var(--fg))]">
            {uploadState === "uploading" ? "Upload en cours..." : "Cliquer pour ajouter un fichier"}
          </div>
          <div className="text-xs text-[rgb(var(--muted))] mt-1">PDF, ZIP acceptés</div>
        </button>

        {/* Liste des certifications uploadées */}
        {certs.length > 0 && (
          <div className="mt-5 space-y-2">
            <p className="text-sm font-medium text-[rgb(var(--fg))]">
              Fichiers ajoutés ({certs.length})
            </p>
            {certs.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between rounded-xl border border-[rgb(var(--success))]/40 bg-[rgb(var(--success))]/[0.06] px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-[rgb(var(--success))]">{c.filename}</p>
                  <p className="text-xs text-[rgb(var(--muted))]">
                    {CERT_TYPES.find((t) => t.key === c.certType)?.label} — {c.category}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {c.publicUrl && (
                    <a
                      href={c.publicUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-semibold text-[rgb(var(--primary))]"
                    >
                      Voir
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDelete(c.id)}
                    className="text-xs text-red-400 hover:text-red-600 transition"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Navigation */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button
            variant="secondary"
            onClick={() => router.push("/step-3-documents")}
            className="sm:flex-1"
          >
            Retour
          </Button>
          <Button
            onClick={() => router.push("/step-5-logistics")}
            className="sm:flex-[2]"
          >
            {certs.length > 0 ? "Continuer →" : "Passer cette étape →"}
          </Button>
        </div>
      </Card>
    </div>
  );
}

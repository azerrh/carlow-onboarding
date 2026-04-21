"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { StepperBar } from "@/components/onboarding/StepperBar";
import { Brand } from "@/components/ui/Brand";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";

const INCOTERMS = [
  { key: "DDP", label: "DDP", desc: "Droits acquittés" },
  { key: "EXW", label: "EXW", desc: "À l'usine" },
  { key: "DAP", label: "DAP", desc: "Destination" },
  { key: "FCA", label: "FCA", desc: "Franco transporteur" },
];

type MatrixState = "idle" | "uploading" | "done" | "error";

export default function StepLogisticsPage() {
  const router = useRouter();
  const matrixInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    address: "",
    days: "3",
    weight: "800",
    incoterms: "DDP",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [matrixState, setMatrixState] = useState<MatrixState>("idle");
  const [matrixFilename, setMatrixFilename] = useState<string>("");

  // Pré-remplissage depuis la DB si existant
  useEffect(() => {
    const vendorId = localStorage.getItem("vendorId");
    if (!vendorId) {
      router.replace("/login");
      return;
    }
    (async () => {
      try {
        const [meRes, docsRes] = await Promise.all([
          fetch(`/api/vendor/me?id=${encodeURIComponent(vendorId)}`),
          fetch(`/api/vendor/documents?vendorId=${encodeURIComponent(vendorId)}`),
        ]);
        const meData = await meRes.json();
        const docsData = await docsRes.json();

        if (meRes.ok && meData.vendor) {
          setForm((f) => ({
            ...f,
            address: meData.vendor.address ?? "",
            incoterms: meData.vendor.incoterms ?? "DDP",
          }));
        }

        // Récupérer la matrice de transport si déjà uploadée
        if (docsRes.ok && docsData.success && Array.isArray(docsData.documents)) {
          const matrix = docsData.documents.find(
            (d: { type: string; filename: string }) => d.type === "transport_matrix"
          );
          if (matrix) {
            setMatrixState("done");
            setMatrixFilename(matrix.filename);
          }
        }
      } catch {
        // silencieux
      }
    })();
  }, [router]);

  async function handleMatrixUpload(file: File) {
    const vendorId = localStorage.getItem("vendorId");
    if (!vendorId) {
      router.replace("/login");
      return;
    }

    setError("");
    setMatrixState("uploading");
    setMatrixFilename(file.name);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("vendorId", vendorId);
    formData.append("type", "transport_matrix");

    try {
      const res = await fetch("/api/vendor/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setMatrixState("error");
        setError(data?.error || "Upload de la matrice impossible.");
        return;
      }
      setMatrixState("done");
    } catch {
      setMatrixState("error");
      setError("Erreur réseau pendant l'upload de la matrice.");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const vendorId = localStorage.getItem("vendorId");
    if (!vendorId) {
      setError("Session expirée. Reconnectez-vous.");
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/vendor/logistics", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorId,
          address: form.address,
          days: form.days,
          weight: form.weight,
          incoterms: form.incoterms,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data?.error || "Erreur lors de l'enregistrement.");
        setSubmitting(false);
        return;
      }
      router.push("/step-6-confirmation");
    } catch {
      setError("Erreur réseau.");
      setSubmitting(false);
    }
  }

  return (
    <div className="portal-page grid min-h-screen place-items-center px-4 py-10">
      <Card className="w-full max-w-[640px] p-8 sm:p-10">
        <Brand className="mb-5" />
        <StepperBar current={4} />

        <h1 className="mt-4 text-2xl font-semibold tracking-tight">
          Logistique et transport
        </h1>
        <p className="mt-1 text-sm text-[rgb(var(--muted))]">
          Configurez vos capacités de livraison et vos incoterms.
        </p>

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          {/* Adresse & délai */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-[rgb(var(--muted))]">
                Adresse d'expédition
              </label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Entrepôt principal, 75000 Paris"
                required
                className="h-11 w-full rounded-xl border border-[rgb(var(--border))] bg-white px-3 text-sm focus:border-[rgb(var(--primary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-[rgb(var(--muted))]">
                Délai de préparation
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={form.days}
                  onChange={(e) => setForm({ ...form, days: e.target.value })}
                  className="h-11 w-full rounded-xl border border-[rgb(var(--border))] bg-white px-3 pr-16 text-sm focus:border-[rgb(var(--primary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]/20"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[rgb(var(--muted))]">
                  jours
                </span>
              </div>
            </div>
          </div>

          {/* Matrice de transport */}
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-[rgb(var(--muted))]">
              Matrice de transport <span className="font-normal normal-case text-[rgb(var(--muted))]/70">(optionnel)</span>
            </label>
            <input
              ref={matrixInputRef}
              type="file"
              accept=".xlsx,.xls,.csv,.ods"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleMatrixUpload(file);
                e.currentTarget.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => matrixInputRef.current?.click()}
              disabled={matrixState === "uploading"}
              className={cn(
                "w-full rounded-xl border-2 border-dashed p-5 text-center transition",
                "hover:bg-black/[0.02] active:bg-black/[0.03]",
                matrixState === "done"
                  ? "border-[rgb(var(--success))]/50 bg-[rgb(var(--success))]/[0.06]"
                  : matrixState === "error"
                    ? "border-red-300 bg-red-50"
                    : matrixState === "uploading"
                      ? "border-[rgb(var(--primary))]/40 bg-[rgb(var(--primary))]/5"
                      : "border-[rgb(var(--border))] bg-white/50"
              )}
            >
              <div className="text-xl">
                {matrixState === "done" ? "✅" : matrixState === "uploading" ? "⏳" : matrixState === "error" ? "❌" : "📊"}
              </div>
              <p
                className={cn(
                  "mt-1 text-sm font-medium",
                  matrixState === "done" && "text-[rgb(var(--success))]",
                  matrixState === "error" && "text-red-700"
                )}
              >
                {matrixState === "done"
                  ? matrixFilename
                  : matrixState === "uploading"
                    ? "Upload en cours..."
                    : matrixState === "error"
                      ? "Erreur — cliquez pour réessayer"
                      : "Fichier Excel ou CSV"}
              </p>
              <p className="mt-0.5 text-xs text-[rgb(var(--muted))]">
                {matrixState === "done"
                  ? "Cliquez pour remplacer"
                  : "Déposez votre grille tarifaire par zone et poids"}
              </p>
            </button>
          </div>

          {/* Poids max & incoterms */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-[rgb(var(--muted))]">
                Poids max palette
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={form.weight}
                  onChange={(e) => setForm({ ...form, weight: e.target.value })}
                  placeholder="800"
                  className="h-11 w-full rounded-xl border border-[rgb(var(--border))] bg-white px-3 pr-12 text-sm focus:border-[rgb(var(--primary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]/20"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[rgb(var(--muted))]">
                  kg
                </span>
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-[rgb(var(--muted))]">
                Incoterms
              </label>
              <select
                value={form.incoterms}
                onChange={(e) => setForm({ ...form, incoterms: e.target.value })}
                className="h-11 w-full cursor-pointer rounded-xl border border-[rgb(var(--border))] bg-white px-3 text-sm focus:border-[rgb(var(--primary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]/20"
              >
                {INCOTERMS.map((ic) => (
                  <option key={ic.key} value={ic.key}>
                    {ic.label} — {ic.desc}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Carte explicative incoterms */}
          <div className="rounded-xl border border-[rgb(var(--primary))]/20 bg-[rgb(var(--primary))]/[0.05] p-4">
            <div className="flex items-start gap-3">
              <div className="text-base">💡</div>
              <div>
                <p className="text-sm font-semibold text-[rgb(var(--primary))]">
                  Incoterm sélectionné : {form.incoterms}
                </p>
                <p className="mt-0.5 text-xs text-[rgb(var(--muted))]">
                  {INCOTERMS.find((i) => i.key === form.incoterms)?.desc} — définit la répartition des frais et responsabilités de livraison.
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.push("/step-4-certifications")}
              className="sm:flex-1"
            >
              Retour
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className={cn("sm:flex-[2]", submitting && "opacity-60")}
            >
              {submitting ? "Enregistrement..." : "Continuer →"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

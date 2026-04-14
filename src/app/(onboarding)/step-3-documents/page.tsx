"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { StepperBar } from "@/components/onboarding/StepperBar";
import { Brand } from "@/components/ui/Brand";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";

const DOCS = [
  { key: "kbis",    label: "K-Bis (moins de 3 mois)",  desc: "Cliquer pour deposer" },
  { key: "statuts", label: "Statuts de la societe",     desc: "Cliquer pour deposer" },
  { key: "id",      label: "Piece identite dirigeant",  desc: "Cliquer pour deposer" },
  { key: "rib",     label: "RIB bancaire",              desc: "Cliquer pour deposer" },
];

export default function StepDocumentsPage() {
  const router = useRouter();
  const [uploads, setUploads] = useState<Record<string, "idle"|"uploading"|"done"|"error">>({});
  const [fileNames, setFileNames] = useState<Record<string, string>>({});
  const [fileUrls, setFileUrls] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState<string>("");
  const kbisRef = useRef<HTMLInputElement>(null);
  const statutsRef = useRef<HTMLInputElement>(null);
  const idRef = useRef<HTMLInputElement>(null);
  const ribRef = useRef<HTMLInputElement>(null);

  const refs: Record<string, React.RefObject<HTMLInputElement | null>> = {
    kbis: kbisRef,
    statuts: statutsRef,
    id: idRef,
    rib: ribRef,
  };

  useEffect(() => {
    const vendorId = localStorage.getItem("vendorId");
    if (!vendorId) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/vendor/documents?vendorId=${encodeURIComponent(vendorId)}`);
        const data = await res.json();
        if (!res.ok || !data.success) return;
        if (cancelled) return;

        const nextUploads: Record<string, "done"> = {};
        const nextNames: Record<string, string> = {};
        const nextUrls: Record<string, string> = {};

        for (const d of data.documents as Array<{ type: string; filename: string; publicUrl?: string }>) {
          if (!DOCS.some((x) => x.key === d.type)) continue;
          nextUploads[d.type] = "done";
          nextNames[d.type] = d.filename;
          if (d.publicUrl) nextUrls[d.type] = d.publicUrl;
        }

        setUploads((u) => ({ ...u, ...nextUploads }));
        setFileNames((f) => ({ ...f, ...nextNames }));
        setFileUrls((f) => ({ ...f, ...nextUrls }));
      } catch {
        // silencieux: step doit rester utilisable même si listing down
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleFile(key: string, file: File) {
    const vendorId = localStorage.getItem("vendorId");
    if (!vendorId) { alert("Reconnectez-vous"); return; }

    setGlobalError("");
    setUploads(u => ({ ...u, [key]: "uploading" }));
    setFileNames(f => ({ ...f, [key]: file.name }));

    const formData = new FormData();
    formData.append("file", file);
    formData.append("vendorId", vendorId);
    formData.append("type", key);

    try {
      const res = await fetch("/api/vendor/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setUploads((u) => ({ ...u, [key]: "error" }));
        setGlobalError(data?.error || "Upload impossible. Vérifiez la configuration du stockage.");
        return;
      }

      setUploads((u) => ({ ...u, [key]: "done" }));
      if (data.publicUrl) setFileUrls((f) => ({ ...f, [key]: data.publicUrl }));
    } catch {
      setUploads(u => ({ ...u, [key]: "error" }));
      setGlobalError("Erreur réseau pendant l’upload.");
    }
  }

  const allDone = DOCS.every(d => uploads[d.key] === "done");

  return (
    <div className="portal-page grid min-h-screen place-items-center px-4 py-10">
      <Card className="w-full max-w-[640px] p-8 sm:p-10">
        <Brand className="mb-5" />
        <StepperBar current={2} />

        <h1 className="mt-4 text-2xl font-semibold tracking-tight">
          Documents réglementaires
        </h1>
        <p className="mt-1 text-sm text-[rgb(var(--muted))]">
          Déposez les 4 documents obligatoires.
        </p>

        {globalError && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {globalError}
          </div>
        )}

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {DOCS.map((doc) => {
            const status = uploads[doc.key] || "idle";
            const isDone = status === "done";
            const isUploading = status === "uploading";
            const isError = status === "error";

            return (
              <div key={doc.key} className="space-y-2">
                <input
                  ref={refs[doc.key]}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void handleFile(doc.key, file);
                    // permet de re-uploader le même fichier
                    e.currentTarget.value = "";
                  }}
                />

                <button
                  type="button"
                  onClick={() => refs[doc.key].current?.click()}
                  className={cn(
                    "w-full rounded-2xl border-2 px-4 py-5 text-left transition",
                    "hover:bg-black/[0.02] active:bg-black/[0.03]",
                    isDone
                      ? "border-[rgb(var(--success))]/50 bg-[rgb(var(--success))]/[0.06]"
                      : isError
                        ? "border-red-300 bg-red-50"
                        : "border-[rgb(var(--border))] border-dashed bg-white/50",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div
                        className={cn(
                          "text-sm font-semibold",
                          isDone
                            ? "text-[rgb(var(--success))]"
                            : isError
                              ? "text-red-700"
                              : "text-[rgb(var(--fg))]",
                        )}
                      >
                        {doc.label}
                      </div>
                      <div className="mt-1 text-xs text-[rgb(var(--muted))]">
                        {isUploading
                          ? "Upload en cours..."
                          : isDone
                            ? fileNames[doc.key]
                            : isError
                              ? "Erreur — cliquez pour réessayer"
                              : doc.desc}
                      </div>
                    </div>

                    <div
                      className={cn(
                        "grid h-9 w-9 place-items-center rounded-xl text-base font-bold",
                        isDone
                          ? "bg-[rgb(var(--success))] text-white"
                          : isUploading
                            ? "bg-black/10 text-[rgb(var(--muted))]"
                            : isError
                              ? "bg-red-600 text-white"
                              : "bg-black/10 text-[rgb(var(--muted))]",
                      )}
                    >
                      {isDone ? "✓" : isUploading ? "…" : isError ? "!" : "+"}
                    </div>
                  </div>
                </button>

                {isDone && fileUrls[doc.key] && (
                  <a
                    className="inline-flex text-xs font-semibold text-[rgb(var(--primary))]"
                    href={fileUrls[doc.key]}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Voir / télécharger
                  </a>
                )}
              </div>
            );
          })}
        </div>

        {!allDone && (
          <div className="mt-6 rounded-xl border border-[rgb(var(--primary))]/25 bg-[rgb(var(--primary))]/[0.06] px-3 py-2 text-center text-sm text-[rgb(var(--primary))]">
            Déposez les 4 documents pour continuer
          </div>
        )}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button
            variant="secondary"
            onClick={() => router.push("/step-2-company")}
            className="sm:flex-1"
          >
            Retour
          </Button>
          <Button
            onClick={() => {
              if (allDone) router.push("/step-4-certifications");
            }}
            disabled={!allDone}
            className="sm:flex-[2]"
          >
            {allDone ? "Continuer →" : "Déposez tous les documents"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
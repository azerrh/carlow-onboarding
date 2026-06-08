"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { StepperBar } from "@/components/onboarding/StepperBar";
import { Brand } from "@/components/ui/Brand";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";

const DOCS = [
  { key: "kbis",    label: "K-Bis (moins de 3 mois)",  desc: "PDF, JPG ou PNG",  icon: "🏢" },
  { key: "statuts", label: "Statuts de la société",     desc: "PDF, JPG ou PNG",  icon: "📜" },
  { key: "id",      label: "Pièce d'identité dirigeant", desc: "PDF, JPG ou PNG", icon: "🪪" },
  { key: "rib",     label: "RIB bancaire",              desc: "PDF, JPG ou PNG",  icon: "🏦" },
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

  const doneCount = DOCS.filter((d) => uploads[d.key] === "done").length;
  const allDone = doneCount === DOCS.length;
  const progressPct = Math.round((doneCount / DOCS.length) * 100);

  return (
    <div className="portal-page grid min-h-screen place-items-center px-4 py-10">
      <Card className="w-full max-w-[640px] animate-fade-in overflow-hidden p-0">
        {/* Bande dégradée */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[rgb(var(--primary))] via-[#e8923a] to-[#c05510]" />

        <div className="p-8 sm:p-10">
          <Brand className="mb-6" />
          <StepperBar current={2} />

          <div className="mt-2 flex items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Documents réglementaires
              </h1>
              <p className="mt-1 text-sm text-[rgb(var(--muted))]">
                Déposez les 4 documents obligatoires (PDF ou image).
              </p>
            </div>
            {/* Compteur circulaire */}
            <div className="relative grid h-14 w-14 shrink-0 place-items-center">
              <svg viewBox="0 0 56 56" className="absolute inset-0 -rotate-90">
                <circle cx="28" cy="28" r="24" stroke="rgb(var(--border))" strokeWidth="4" fill="none" />
                <circle
                  cx="28" cy="28" r="24"
                  stroke={allDone ? "rgb(var(--success))" : "rgb(var(--primary))"}
                  strokeWidth="4" fill="none" strokeLinecap="round"
                  strokeDasharray={`${(2 * Math.PI * 24 * progressPct) / 100} ${2 * Math.PI * 24}`}
                  className="transition-all duration-500"
                />
              </svg>
              <span className="text-xs font-bold">
                {doneCount}/{DOCS.length}
              </span>
            </div>
          </div>

          {globalError && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700 animate-fade-in">
              ⚠️ {globalError}
            </div>
          )}

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {DOCS.map((doc) => {
              const status = uploads[doc.key] || "idle";
              const isDone = status === "done";
              const isUploading = status === "uploading";
              const isError = status === "error";

              return (
                <div key={doc.key} className="space-y-1.5">
                  <input
                    ref={refs[doc.key]}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void handleFile(doc.key, file);
                      e.currentTarget.value = "";
                    }}
                  />

                  <button
                    type="button"
                    onClick={() => refs[doc.key].current?.click()}
                    className={cn(
                      "group w-full rounded-2xl border-2 p-4 text-left transition-all duration-200",
                      isDone
                        ? "border-[rgb(var(--success))]/50 bg-[rgb(var(--success))]/[0.06]"
                        : isError
                          ? "border-red-300 bg-red-50"
                          : "border-dashed border-[rgb(var(--border))] bg-[rgb(var(--bg))]/40 hover:border-[rgb(var(--primary))]/40 hover:bg-[rgb(var(--primary))]/[0.03]",
                    )}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icône type doc */}
                      <span
                        className={cn(
                          "grid h-10 w-10 shrink-0 place-items-center rounded-xl text-lg transition-transform group-hover:scale-110",
                          isDone
                            ? "bg-[rgb(var(--success))]/15"
                            : isError
                              ? "bg-red-100"
                              : "bg-[rgb(var(--primary))]/10",
                        )}
                      >
                        {isUploading ? (
                          <svg className="h-5 w-5 animate-spin text-[rgb(var(--primary))]" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                        ) : (
                          doc.icon
                        )}
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={cn(
                              "text-sm font-bold",
                              isDone ? "text-[rgb(var(--success))]" : isError ? "text-red-700" : "text-[rgb(var(--fg))]",
                            )}
                          >
                            {doc.label}
                          </span>
                          {isDone && (
                            <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[rgb(var(--success))] text-[10px] text-white">
                              ✓
                            </span>
                          )}
                        </div>
                        <div className="mt-0.5 truncate text-xs text-[rgb(var(--muted))]">
                          {isUploading
                            ? "Upload en cours…"
                            : isDone
                              ? fileNames[doc.key]
                              : isError
                                ? "Erreur — cliquez pour réessayer"
                                : doc.desc}
                        </div>
                      </div>
                    </div>
                  </button>

                  {isDone && fileUrls[doc.key] && (
                    <a
                      className="inline-flex items-center gap-1 pl-1 text-xs font-semibold text-[rgb(var(--primary))] hover:underline"
                      href={fileUrls[doc.key]}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3 w-3">
                        <path d="M15 3h6v6M10 14L21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      </svg>
                      Voir le document
                    </a>
                  )}
                </div>
              );
            })}
          </div>

          {!allDone && (
            <div className="mt-6 flex items-center gap-2 rounded-xl border border-[rgb(var(--primary))]/25 bg-[rgb(var(--primary))]/[0.06] px-4 py-2.5 text-sm font-medium text-[rgb(var(--primary))]">
              <span>📋</span>
              Il reste {DOCS.length - doneCount} document{DOCS.length - doneCount > 1 ? "s" : ""} à déposer
            </div>
          )}

          {allDone && (
            <div className="mt-6 flex items-center gap-2 rounded-xl border border-[rgb(var(--success))]/30 bg-[rgb(var(--success))]/8 px-4 py-2.5 text-sm font-semibold text-[rgb(var(--success))] animate-fade-in">
              <span>🎉</span>
              Tous les documents sont déposés ! Vous pouvez continuer.
            </div>
          )}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button
              variant="secondary"
              onClick={() => router.push("/step-2-company")}
              className="sm:flex-1"
            >
              ← Retour
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
        </div>
      </Card>
    </div>
  );
}
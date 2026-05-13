"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { VendorShell, VendorPageHeader } from "@/components/vendor/VendorShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

/**
 * Import en masse de produits depuis un fichier CSV.
 *
 * Flow utilisateur :
 *   1. Choisir un catalogue de destination
 *   2. Télécharger le template CSV (modèle pré-rempli)
 *   3. Glisser-déposer ou sélectionner son CSV rempli
 *   4. Voir la prévisualisation (premières lignes valides + erreurs)
 *   5. Confirmer l'import → création en masse
 *
 * Pas de progression streaming pour rester simple (l'API insère via
 * createMany, c'est instantané même pour 500 lignes).
 */

interface Catalog {
  id: string;
  name: string | null;
  productCount: number;
}

interface PreviewResult {
  headers: string[];
  unknownHeaders: string[];
  delimiter: string;
  totalRows: number;
  validCount: number;
  errorCount: number;
  sample: Array<{
    name: string;
    reference: string | null;
    description: string | null;
    price: number;
    stock: number;
    category: string | null;
  }>;
  errors: { rowIndex: number; field?: string; message: string }[];
}

interface CommitResult {
  created: number;
  skipped: number;
  totalRows: number;
  errors: { rowIndex: number; field?: string; message: string }[];
}

const CSV_TEMPLATE = `name,reference,description,price,stock,weightKg,dimensions,category
Panneau solaire 450W,PV-450-MONO,Module photovoltaïque monocristallin haut rendement,199.00,120,22.5,1762x1134x30 mm,Photovoltaïque
Onduleur hybride 5kW,INV-HYB-5K,Onduleur triphasé avec couplage batterie lithium,1290.00,25,18,470x350x180 mm,Onduleurs
Batterie LiFePO4 10kWh,BAT-LFP-10K,Stockage stationnaire haute densité 6000 cycles,3490.00,8,95,600x480x200 mm,Stockage
`;

export default function ImportCsvPage() {
  const router = useRouter();
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [catalogs, setCatalogs] = useState<Catalog[]>([]);
  const [catalogId, setCatalogId] = useState<string>("");
  const [csvContent, setCsvContent] = useState("");
  const [fileName, setFileName] = useState("");
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [committed, setCommitted] = useState<CommitResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const id = localStorage.getItem("vendorId");
    if (!id) {
      router.replace("/login");
      return;
    }
    setVendorId(id);
    // Charge la liste des catalogues du vendeur
    fetch(`/api/vendor/catalogs?vendorId=${encodeURIComponent(id)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.catalogs)) {
          const cats: Catalog[] = data.catalogs.map(
            (c: { id: string; name?: string; _count?: { products: number } }) => ({
              id: c.id,
              name: c.name ?? "Catalogue sans nom",
              productCount: c._count?.products ?? 0,
            })
          );
          setCatalogs(cats);
          if (cats.length > 0) setCatalogId(cats[0]!.id);
        }
      })
      .catch(() => {
        setError("Impossible de charger vos catalogues.");
      });
  }, [router]);

  const handleFile = useCallback((file: File) => {
    setError("");
    setPreview(null);
    setCommitted(null);
    if (file.size > 2 * 1024 * 1024) {
      setError("Fichier trop volumineux (max 2 Mo).");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = String(e.target?.result ?? "");
      setCsvContent(text);
      setFileName(file.name);
    };
    reader.onerror = () => setError("Impossible de lire le fichier.");
    reader.readAsText(file, "UTF-8");
  }, []);

  function downloadTemplate() {
    const blob = new Blob([CSV_TEMPLATE], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "carlow-template-produits.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function runPreview() {
    if (!vendorId || !catalogId || !csvContent) return;
    setLoading(true);
    setError("");
    setPreview(null);
    setCommitted(null);
    try {
      const res = await fetch("/api/vendor/products/import-csv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorId,
          catalogId,
          csv: csvContent,
          mode: "preview",
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data?.error ?? "Erreur lors de la prévisualisation");
        return;
      }
      setPreview(data as PreviewResult);
    } catch {
      setError("Erreur réseau.");
    } finally {
      setLoading(false);
    }
  }

  async function runCommit() {
    if (!vendorId || !catalogId || !csvContent) return;
    if (!preview || preview.validCount === 0) return;
    if (
      !confirm(
        `Confirmer l'import de ${preview.validCount} produit${preview.validCount > 1 ? "s" : ""} dans le catalogue ?`
      )
    ) {
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/vendor/products/import-csv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorId,
          catalogId,
          csv: csvContent,
          mode: "commit",
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data?.error ?? "Erreur lors de l'import");
        return;
      }
      setCommitted(data as CommitResult);
      setPreview(null);
    } catch {
      setError("Erreur réseau.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <VendorShell>
      <VendorPageHeader
        breadcrumb={["Vendeur", "Catalogue", "Import CSV"]}
        title="Import en masse de produits"
        subtitle="Importez jusqu'à 500 produits depuis un fichier CSV (Excel, Numbers, Google Sheets)"
        action={
          <Link href="/dashboard/produits">
            <Button variant="ghost" size="sm">
              ← Retour aux produits
            </Button>
          </Link>
        }
      />

      {/* Étape 1 : Catalogue de destination */}
      <Card className="mt-4 p-5">
        <h2 className="text-base font-semibold">
          1. Catalogue de destination
        </h2>
        <p className="mt-1 text-xs text-[rgb(var(--muted))]">
          Tous les produits importés seront créés dans ce catalogue.
        </p>
        {catalogs.length === 0 ? (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Vous n&apos;avez pas encore de catalogue.{" "}
            <Link
              href="/dashboard/catalogues"
              className="font-semibold underline"
            >
              Créez-en un d&apos;abord
            </Link>
            .
          </div>
        ) : (
          <select
            value={catalogId}
            onChange={(e) => setCatalogId(e.target.value)}
            className="mt-3 h-10 w-full max-w-md cursor-pointer rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 text-sm"
          >
            {catalogs.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.productCount} produits)
              </option>
            ))}
          </select>
        )}
      </Card>

      {/* Étape 2 : Template */}
      <Card className="mt-4 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">2. Télécharger le template</h2>
            <p className="mt-1 text-xs text-[rgb(var(--muted))]">
              Modèle CSV avec les colonnes attendues + 3 exemples. À ouvrir
              dans Excel, Google Sheets ou Numbers.
            </p>
          </div>
          <Button onClick={downloadTemplate} variant="secondary" size="sm">
            📥 Télécharger le template
          </Button>
        </div>
        <div className="mt-3 overflow-x-auto rounded-lg border border-[rgb(var(--border))]/60 bg-[rgb(var(--bg))]/40 p-3">
          <pre className="text-[11px] font-mono text-[rgb(var(--muted))]">
{`Colonnes attendues (header sur la 1ère ligne) :
  name         : nom du produit (REQUIS)
  reference    : référence interne / SKU (optionnel)
  description  : description longue (optionnel)
  price        : prix unitaire en € (REQUIS, ex 199.00 ou 199,00)
  stock        : quantité disponible (optionnel, default 0)
  weightKg     : poids en kg (optionnel)
  dimensions   : dimensions au format libre (optionnel)
  category     : catégorie (Photovoltaïque, Onduleurs, etc.)`}
          </pre>
        </div>
      </Card>

      {/* Étape 3 : Upload */}
      <Card className="mt-4 p-5">
        <h2 className="text-base font-semibold">3. Charger votre fichier</h2>
        <p className="mt-1 text-xs text-[rgb(var(--muted))]">
          Formats acceptés : .csv (UTF-8 recommandé). Max 500 lignes, 2 Mo.
        </p>

        <label
          className={cn(
            "mt-4 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-center transition",
            csvContent
              ? "border-[rgb(var(--success))]/30 bg-[rgb(var(--success))]/[0.04]"
              : "border-[rgb(var(--border))] bg-[rgb(var(--bg))]/30 hover:border-[rgb(var(--primary))]/40 hover:bg-[rgb(var(--primary))]/[0.03]"
          )}
        >
          <input
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
          {csvContent ? (
            <>
              <span className="text-2xl">📄</span>
              <p className="text-sm font-semibold">{fileName}</p>
              <p className="text-xs text-[rgb(var(--muted))]">
                {csvContent.length.toLocaleString()} caractères chargés —
                cliquez pour changer
              </p>
            </>
          ) : (
            <>
              <span className="text-2xl">📁</span>
              <p className="text-sm font-semibold">
                Cliquez pour choisir un fichier CSV
              </p>
              <p className="text-xs text-[rgb(var(--muted))]">
                ou glissez-déposez le fichier ici
              </p>
            </>
          )}
        </label>

        {csvContent && (
          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={runPreview} disabled={loading || !catalogId}>
              {loading ? "Analyse…" : "🔍 Prévisualiser"}
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setCsvContent("");
                setFileName("");
                setPreview(null);
                setCommitted(null);
                setError("");
              }}
            >
              Annuler
            </Button>
          </div>
        )}
      </Card>

      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Étape 4 : Prévisualisation */}
      {preview && !committed && (
        <Card className="mt-4 p-5">
          <h2 className="text-base font-semibold">4. Prévisualisation</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-4">
            <Stat label="Lignes lues" value={preview.totalRows} color="muted" />
            <Stat label="Valides" value={preview.validCount} color="success" />
            <Stat label="Erreurs" value={preview.errorCount} color="warning" />
            <Stat label="Headers détectés" value={preview.headers.length} color="muted" />
          </div>

          {preview.unknownHeaders.length > 0 && (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
              ⚠ Colonnes inconnues ignorées :{" "}
              <code>{preview.unknownHeaders.join(", ")}</code>
            </div>
          )}

          {preview.sample.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-xs font-semibold text-[rgb(var(--muted))]">
                Aperçu des 10 premières lignes valides :
              </p>
              <div className="overflow-x-auto rounded-lg border border-[rgb(var(--border))]/60">
                <table className="w-full text-xs">
                  <thead className="bg-[rgb(var(--bg))]/40">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold">Nom</th>
                      <th className="px-3 py-2 text-left font-semibold">Réf.</th>
                      <th className="px-3 py-2 text-right font-semibold">Prix</th>
                      <th className="px-3 py-2 text-right font-semibold">Stock</th>
                      <th className="px-3 py-2 text-left font-semibold">Catégorie</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.sample.map((p, i) => (
                      <tr
                        key={i}
                        className="border-t border-[rgb(var(--border))]/40"
                      >
                        <td className="px-3 py-2">{p.name}</td>
                        <td className="px-3 py-2 font-mono text-[10px]">
                          {p.reference ?? "—"}
                        </td>
                        <td className="px-3 py-2 text-right font-semibold">
                          {p.price.toLocaleString("fr-FR", {
                            style: "currency",
                            currency: "EUR",
                          })}
                        </td>
                        <td className="px-3 py-2 text-right">{p.stock}</td>
                        <td className="px-3 py-2">{p.category ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {preview.errors.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-xs font-semibold text-red-700">
                {preview.errorCount} erreur{preview.errorCount > 1 ? "s" : ""}{" "}
                détectée{preview.errorCount > 1 ? "s" : ""}
                {preview.errors.length < preview.errorCount &&
                  ` (50 premières affichées)`}
                :
              </p>
              <div className="max-h-48 overflow-y-auto rounded-lg border border-red-200 bg-red-50 p-3 text-[11px]">
                {preview.errors.map((e, i) => (
                  <div key={i} className="text-red-800">
                    Ligne {e.rowIndex + 1}{e.field ? ` · ${e.field}` : ""} :{" "}
                    {e.message}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-5 flex flex-wrap gap-2">
            <Button
              onClick={runCommit}
              disabled={loading || preview.validCount === 0}
            >
              {loading
                ? "Import en cours…"
                : `✓ Importer les ${preview.validCount} produits valides`}
            </Button>
            <Button
              variant="ghost"
              onClick={() => setPreview(null)}
              disabled={loading}
            >
              Refaire l&apos;analyse
            </Button>
          </div>
        </Card>
      )}

      {/* Étape 5 : Résultat */}
      {committed && (
        <Card className="mt-4 p-5">
          <div className="flex items-start gap-3">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[rgb(var(--success))]/10 text-2xl">
              ✓
            </span>
            <div>
              <h2 className="text-base font-semibold">
                Import terminé avec succès
              </h2>
              <p className="mt-1 text-sm text-[rgb(var(--muted))]">
                <strong>{committed.created}</strong> produit
                {committed.created > 1 ? "s" : ""} créé
                {committed.created > 1 ? "s" : ""} dans le catalogue.
                {committed.skipped > 0 && (
                  <>
                    {" "}
                    <strong className="text-amber-700">
                      {committed.skipped}
                    </strong>{" "}
                    ligne{committed.skipped > 1 ? "s" : ""} ignorée
                    {committed.skipped > 1 ? "s" : ""} pour erreurs.
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/dashboard/produits">
              <Button>Voir mes produits →</Button>
            </Link>
            <Button
              variant="secondary"
              onClick={() => {
                setCommitted(null);
                setCsvContent("");
                setFileName("");
              }}
            >
              Importer un autre fichier
            </Button>
          </div>
        </Card>
      )}
    </VendorShell>
  );
}

function Stat({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: "success" | "warning" | "muted";
}) {
  return (
    <div className="rounded-xl border border-[rgb(var(--border))]/60 bg-[rgb(var(--bg))]/40 px-4 py-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-[rgb(var(--muted))]">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 text-xl font-bold tracking-tight",
          color === "success" && "text-[rgb(var(--success))]",
          color === "warning" && "text-amber-700",
          color === "muted" && "text-[rgb(var(--fg))]"
        )}
      >
        {value}
      </p>
    </div>
  );
}

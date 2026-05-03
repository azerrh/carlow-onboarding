"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminShell, AdminPageHeader } from "@/components/admin/AdminShell";
import { cn } from "@/lib/cn";

interface Doc {
  id: string;
  vendorId: string;
  type: string;
  filename: string;
  status: string;
  uploadedAt: string;
  vendorName?: string | null;
}

const DOC_LABELS: Record<string, string> = {
  kbis: "K-Bis",
  statuts: "Statuts",
  id: "Pièce d'identité",
  rib: "RIB",
  transport_matrix: "Matrice transport",
};

export default function AdminDocumentsPage() {
  const router = useRouter();
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/documents");
        if (res.status === 401) {
          router.replace("/admin/login");
          return;
        }
        const data = await res.json();
        if (res.ok && data.success) {
          setDocs(data.documents ?? []);
        } else {
          setError(data?.error || "Impossible de charger les documents.");
        }
      } catch {
        setError("Erreur réseau.");
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  return (
    <AdminShell documentsCount={docs.length}>
      <AdminPageHeader
        breadcrumb={["Dashboard", "Vendeurs", "Documents"]}
        title="Documents déposés"
        subtitle={`${docs.length} document${docs.length > 1 ? "s" : ""} au total`}
      />

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-[rgb(var(--border))] bg-white p-4">
        {loading ? (
          <p className="py-8 text-center text-sm text-[rgb(var(--muted))]">Chargement…</p>
        ) : docs.length === 0 ? (
          <p className="py-8 text-center text-sm text-[rgb(var(--muted))]">
            Aucun document déposé.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-[rgb(var(--border))] text-left text-[11px] font-semibold uppercase tracking-wider text-[rgb(var(--muted))]">
                  <th className="py-3 pr-3">Fichier</th>
                  <th className="py-3 pr-3">Type</th>
                  <th className="py-3 pr-3">Vendeur</th>
                  <th className="py-3 pr-3">Statut</th>
                  <th className="py-3 pr-3">Déposé le</th>
                </tr>
              </thead>
              <tbody>
                {docs.map((d) => (
                  <tr
                    key={d.id}
                    className="border-b border-[rgb(var(--border))]/60 last:border-0 hover:bg-black/[0.015]"
                  >
                    <td className="py-3 pr-3 font-medium">{d.filename}</td>
                    <td className="py-3 pr-3">
                      <span className="inline-flex rounded-md bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700">
                        {DOC_LABELS[d.type] ?? d.type}
                      </span>
                    </td>
                    <td className="py-3 pr-3 text-[rgb(var(--muted))]">
                      {d.vendorName ?? d.vendorId.slice(0, 8)}
                    </td>
                    <td className="py-3 pr-3">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold",
                          d.status === "validated"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700"
                        )}
                      >
                        {d.status === "validated" ? "Validé" : "En attente"}
                      </span>
                    </td>
                    <td className="py-3 pr-3 text-[rgb(var(--muted))]">
                      {new Date(d.uploadedAt).toLocaleDateString("fr-FR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminShell>
  );
}

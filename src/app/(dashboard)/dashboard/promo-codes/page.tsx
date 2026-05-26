"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Field } from "@/components/ui/Field";
import { VendorShell, VendorPageHeader } from "@/components/vendor/VendorShell";
import { cn } from "@/lib/cn";

interface PromoCode {
  id: string;
  code: string;
  type: "PERCENT" | "FIXED";
  discountValue: number;
  minSubtotalCents: number;
  maxUsages: number | null;
  usageCount: number;
  expiresAt: string | null;
  active: boolean;
  createdAt: string;
  isExpired: boolean;
  isExhausted: boolean;
}

interface VendorMe {
  name: string;
  email: string;
  companyName: string | null;
}

function formatDate(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatEuros(cents: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

export default function VendorPromoCodesPage() {
  const router = useRouter();
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [vendor, setVendor] = useState<VendorMe | null>(null);
  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
  const [toast, setToast] = useState("");

  const loadData = useCallback(async () => {
    const vid =
      typeof window !== "undefined" ? localStorage.getItem("vendorId") : null;
    if (!vid) {
      router.replace("/login");
      return;
    }
    setVendorId(vid);

    try {
      const [codesRes, meRes] = await Promise.all([
        fetch(`/api/vendor/promo-codes?vendorId=${vid}`),
        fetch(`/api/vendor/me?vendorId=${vid}`),
      ]);
      const codesData = await codesRes.json();
      const meData = await meRes.json();
      if (codesRes.ok && codesData.success) setCodes(codesData.codes ?? []);
      if (meRes.ok && meData.success) {
        setVendor({
          name: meData.vendor.name,
          email: meData.vendor.email,
          companyName: meData.vendor.companyName ?? null,
        });
      }
    } catch {
      /* silencieux */
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleToggleActive(code: PromoCode) {
    if (!vendorId) return;
    setCodes((cs) =>
      cs.map((c) => (c.id === code.id ? { ...c, active: !c.active } : c))
    );
    await fetch("/api/vendor/promo-codes", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: code.id, vendorId, active: !code.active }),
    });
  }

  async function handleDelete(code: PromoCode) {
    if (!vendorId) return;
    if (!confirm(`Supprimer définitivement le code "${code.code}" ?`)) return;
    setCodes((cs) => cs.filter((c) => c.id !== code.id));
    await fetch(
      `/api/vendor/promo-codes?id=${code.id}&vendorId=${vendorId}`,
      { method: "DELETE" }
    );
    setToast("Code supprimé.");
    setTimeout(() => setToast(""), 2500);
  }

  function copyToClipboard(code: string) {
    navigator.clipboard?.writeText(code);
    setToast(`Code "${code}" copié dans le presse-papier ✓`);
    setTimeout(() => setToast(""), 2500);
  }

  const filtered = useMemo(() => {
    if (filter === "active") return codes.filter((c) => c.active && !c.isExpired && !c.isExhausted);
    if (filter === "inactive") return codes.filter((c) => !c.active || c.isExpired || c.isExhausted);
    return codes;
  }, [codes, filter]);

  const stats = useMemo(() => {
    const total = codes.length;
    const active = codes.filter((c) => c.active && !c.isExpired && !c.isExhausted).length;
    const usages = codes.reduce((s, c) => s + c.usageCount, 0);
    return { total, active, usages };
  }, [codes]);

  return (
    <VendorShell vendorUser={vendor}>
      <VendorPageHeader
        breadcrumb={["Vendeur", "Codes promo"]}
        title="Codes promo"
        subtitle="Créez des codes de réduction que vos acheteurs appliqueront au panier."
        action={
          <Button onClick={() => setShowCreate(true)}>+ Nouveau code</Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <KpiCard label="Codes créés" value={String(stats.total)} icon="🎟️" />
        <KpiCard
          label="Actifs maintenant"
          value={String(stats.active)}
          icon="✅"
          highlight
        />
        <KpiCard
          label="Utilisations totales"
          value={String(stats.usages)}
          icon="📈"
        />
      </div>

      {/* Filters */}
      <div className="mt-6 flex flex-wrap gap-2">
        {(
          [
            { v: "all", l: "Tous" },
            { v: "active", l: "Actifs" },
            { v: "inactive", l: "Inactifs / expirés" },
          ] as const
        ).map((f) => (
          <button
            key={f.v}
            onClick={() => setFilter(f.v)}
            className={cn(
              "rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all duration-150",
              filter === f.v
                ? "bg-[rgb(var(--primary))] text-white shadow-sm"
                : "bg-[rgb(var(--card))] border border-[rgb(var(--border))]/70 text-[rgb(var(--muted))] hover:border-[rgb(var(--primary))]/30 hover:text-[rgb(var(--fg))]"
            )}
          >
            {f.l}
          </button>
        ))}
      </div>

      {/* Liste */}
      {loading ? (
        <Card className="mt-6 p-10 text-center text-sm text-[rgb(var(--muted))]">
          Chargement…
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="mt-6 p-10 text-center">
          <div className="text-4xl">🎟️</div>
          <p className="mt-4 text-sm font-semibold">
            {codes.length === 0
              ? "Aucun code promo pour le moment"
              : "Aucun code dans cette catégorie"}
          </p>
          <p className="mt-1 text-xs text-[rgb(var(--muted))]">
            {codes.length === 0
              ? "Créez votre premier code de réduction pour fidéliser vos acheteurs."
              : "Changez de filtre pour voir les autres codes."}
          </p>
          {codes.length === 0 && (
            <Button className="mt-5" onClick={() => setShowCreate(true)}>
              + Créer un code
            </Button>
          )}
        </Card>
      ) : (
        <div className="mt-6 space-y-3">
          {filtered.map((c) => {
            const status = !c.active
              ? "Désactivé"
              : c.isExpired
                ? "Expiré"
                : c.isExhausted
                  ? "Épuisé"
                  : "Actif";
            const isOk = status === "Actif";
            return (
              <Card
                key={c.id}
                className={cn(
                  "p-5 transition-all duration-200",
                  !isOk && "opacity-70"
                )}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-4">
                    {/* Code badge */}
                    <button
                      onClick={() => copyToClipboard(c.code)}
                      title="Copier le code"
                      className="group relative shrink-0 rounded-xl border-2 border-dashed border-[rgb(var(--primary))]/40 bg-gradient-to-br from-[rgb(var(--primary))]/10 to-[rgb(var(--primary))]/5 px-4 py-3 text-left transition hover:border-[rgb(var(--primary))] hover:from-[rgb(var(--primary))]/15"
                    >
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[rgb(var(--primary))]/70">
                        Code
                      </p>
                      <p className="font-mono text-base font-bold tracking-wider text-[rgb(var(--primary))]">
                        {c.code}
                      </p>
                      <span className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-[rgb(var(--card))] text-[10px] opacity-0 shadow-sm transition group-hover:opacity-100">
                        📋
                      </span>
                    </button>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xl font-bold tracking-tight text-[rgb(var(--success))]">
                          {c.type === "PERCENT"
                            ? `-${c.discountValue}%`
                            : `-${formatEuros(c.discountValue)}`}
                        </span>
                        <span
                          className={cn(
                            "rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                            isOk
                              ? "border-[rgb(var(--success))]/30 bg-[rgb(var(--success))]/10 text-[rgb(var(--success))]"
                              : "border-red-200 bg-red-50 text-red-600"
                          )}
                        >
                          {status}
                        </span>
                      </div>
                      <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[rgb(var(--muted))]">
                        {c.minSubtotalCents > 0 && (
                          <span>
                            🛒 Minimum {formatEuros(c.minSubtotalCents)}
                          </span>
                        )}
                        <span>
                          📊 {c.usageCount}
                          {c.maxUsages !== null ? ` / ${c.maxUsages}` : ""} utilisation
                          {c.usageCount > 1 ? "s" : ""}
                        </span>
                        {c.expiresAt && (
                          <span>📅 Expire le {formatDate(c.expiresAt)}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <label
                      className="flex cursor-pointer items-center gap-2 rounded-lg border border-[rgb(var(--border))]/80 bg-[rgb(var(--card))] px-3 py-1.5 text-xs font-semibold transition hover:bg-black/[0.02]"
                      title={c.active ? "Désactiver" : "Activer"}
                    >
                      <input
                        type="checkbox"
                        checked={c.active}
                        onChange={() => handleToggleActive(c)}
                        className="h-4 w-4 rounded border-[rgb(var(--border))] text-[rgb(var(--primary))] focus:ring-[rgb(var(--primary))]/30"
                      />
                      <span>{c.active ? "Actif" : "Inactif"}</span>
                    </label>
                    <button
                      onClick={() => handleDelete(c)}
                      className="rounded-lg px-3 py-1.5 text-xs font-semibold text-red-500 transition hover:bg-red-500/10"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal création */}
      {showCreate && vendorId && (
        <CreateCodeModal
          vendorId={vendorId}
          onClose={() => setShowCreate(false)}
          onCreated={(c) => {
            setCodes((cs) => [c, ...cs]);
            setShowCreate(false);
            setToast(`Code "${c.code}" créé avec succès ✓`);
            setTimeout(() => setToast(""), 3000);
          }}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="animate-fade-in fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl border border-[rgb(var(--success))]/30 bg-[rgb(var(--card))] px-4 py-3 text-sm font-medium shadow-lg">
          {toast}
        </div>
      )}
    </VendorShell>
  );
}

/* ---------------- KPI Card ---------------- */

function KpiCard({
  label,
  value,
  icon,
  highlight,
}: {
  label: string;
  value: string;
  icon: string;
  highlight?: boolean;
}) {
  return (
    <Card
      className={cn(
        "p-5 transition-all duration-200 hover:-translate-y-0.5",
        highlight &&
          "border-[rgb(var(--primary))]/25 bg-gradient-to-br from-[rgb(var(--primary))]/8 to-transparent"
      )}
    >
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-lg",
            highlight
              ? "bg-gradient-to-br from-[rgb(var(--primary))]/20 to-[rgb(var(--primary))]/10"
              : "bg-gradient-to-br from-[rgb(var(--primary))]/15 to-[rgb(var(--primary))]/8"
          )}
        >
          {icon}
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[rgb(var(--muted))]">
            {label}
          </p>
          <p className="truncate text-xl font-bold tracking-tight">{value}</p>
        </div>
      </div>
    </Card>
  );
}

/* ---------------- Modal de création ---------------- */

function CreateCodeModal({
  vendorId,
  onClose,
  onCreated,
}: {
  vendorId: string;
  onClose: () => void;
  onCreated: (code: PromoCode) => void;
}) {
  const [code, setCode] = useState("");
  const [type, setType] = useState<"PERCENT" | "FIXED">("PERCENT");
  const [discountValue, setDiscountValue] = useState("10");
  const [minEuros, setMinEuros] = useState("");
  const [maxUsages, setMaxUsages] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      // Conversion : pour FIXED, on saisit en euros mais on stocke en centimes
      const valueNumber = Number(discountValue);
      const finalDiscountValue =
        type === "FIXED" ? Math.round(valueNumber * 100) : valueNumber;

      const res = await fetch("/api/vendor/promo-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorId,
          code,
          type,
          discountValue: finalDiscountValue,
          minSubtotalCents: minEuros ? Math.round(Number(minEuros) * 100) : 0,
          maxUsages: maxUsages ? Number(maxUsages) : null,
          expiresAt: expiresAt || null,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data?.error ?? "Erreur lors de la création");
        return;
      }
      // L'API renvoie le code sans les flags isExpired/isExhausted, on les ajoute
      onCreated({
        ...data.code,
        isExpired: false,
        isExhausted: false,
      });
    } catch {
      setError("Erreur réseau.");
    } finally {
      setBusy(false);
    }
  }

  function generateRandomCode() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let result = "";
    for (let i = 0; i < 8; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
    setCode(result);
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <Card
        className="animate-scale-in m-4 w-full max-w-lg overflow-hidden p-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-1.5 w-full bg-gradient-to-r from-[rgb(var(--primary))] via-[#e8923a] to-[#c05510]" />
        <form onSubmit={handleSubmit} className="p-7">
          <h2 className="text-xl font-bold tracking-tight">🎟️ Nouveau code promo</h2>
          <p className="mt-1 text-sm text-[rgb(var(--muted))]">
            Le code sera appliqué uniquement sur les produits de votre catalogue.
          </p>

          <div className="mt-5 space-y-4">
            {/* Code */}
            <Field label="Code (3-32 caractères, lettres/chiffres)">
              <div className="flex gap-2">
                <Input
                  value={code}
                  onChange={(e) =>
                    setCode(
                      e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, "")
                    )
                  }
                  placeholder="SUMMER25"
                  maxLength={32}
                  required
                  className="font-mono uppercase tracking-wider"
                />
                <button
                  type="button"
                  onClick={generateRandomCode}
                  className="shrink-0 rounded-xl border border-[rgb(var(--border))]/80 bg-[rgb(var(--card))] px-3 text-xs font-semibold transition hover:border-[rgb(var(--primary))]/30 hover:bg-[rgb(var(--primary))]/8"
                  title="Générer aléatoirement"
                >
                  🎲
                </button>
              </div>
            </Field>

            {/* Type & valeur */}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Type de remise">
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as typeof type)}
                  className="h-11 w-full cursor-pointer rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3.5 text-sm"
                >
                  <option value="PERCENT">Pourcentage (%)</option>
                  <option value="FIXED">Montant fixe (€)</option>
                </select>
              </Field>
              <Field label={type === "PERCENT" ? "Pourcentage (1-100)" : "Montant (€)"}>
                <Input
                  type="number"
                  min="1"
                  max={type === "PERCENT" ? "100" : undefined}
                  step={type === "PERCENT" ? "1" : "0.01"}
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  required
                />
              </Field>
            </div>

            {/* Conditions */}
            <Field label="Montant minimum du panier (€) — optionnel">
              <Input
                type="number"
                min="0"
                step="0.01"
                value={minEuros}
                onChange={(e) => setMinEuros(e.target.value)}
                placeholder="0 = pas de minimum"
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Utilisations max — optionnel">
                <Input
                  type="number"
                  min="1"
                  value={maxUsages}
                  onChange={(e) => setMaxUsages(e.target.value)}
                  placeholder="Illimité"
                />
              </Field>
              <Field label="Date d'expiration — optionnel">
                <Input
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  min={new Date().toISOString().slice(0, 10)}
                />
              </Field>
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
                ⚠️ {error}
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={busy || !code}>
              {busy ? "Création…" : "Créer le code"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

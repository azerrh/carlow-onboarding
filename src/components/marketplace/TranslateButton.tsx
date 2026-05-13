"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Bouton de traduction de description produit (FR → EN/DE/ES via Claude).
 *
 * Affiche un bouton compact qui ouvre un sélecteur de langues. Au clic,
 * appelle /api/ai/translate?productId=... qui cache le résultat en DB
 * pour les visiteurs suivants (gratuit pour les hits).
 *
 * Auto-suggest selon `navigator.language` : si le visiteur est en EN/DE/ES,
 * on lui pré-affiche un CTA "Translate to English" plutôt que de cacher
 * la feature dans un menu.
 */

type Lang = "en" | "de" | "es";

const LANG_LABELS: Record<Lang, { flag: string; native: string; verb: string }> = {
  en: { flag: "🇬🇧", native: "English", verb: "Translate" },
  de: { flag: "🇩🇪", native: "Deutsch", verb: "Übersetzen" },
  es: { flag: "🇪🇸", native: "Español", verb: "Traducir" },
};

function detectSuggestedLang(): Lang | null {
  if (typeof navigator === "undefined") return null;
  const raw = (navigator.language || "").toLowerCase().slice(0, 2);
  if (raw === "en" || raw === "de" || raw === "es") return raw;
  return null;
}

export function TranslateButton({
  productId,
  originalText,
  onTranslated,
}: {
  productId: string;
  originalText: string;
  onTranslated?: (translated: string, lang: Lang) => void;
}) {
  const [selectedLang, setSelectedLang] = useState<Lang | null>(null);
  const [translated, setTranslated] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [suggestion, setSuggestion] = useState<Lang | null>(null);

  useEffect(() => {
    setSuggestion(detectSuggestedLang());
  }, []);

  const fetchTranslation = useCallback(
    async (lang: Lang) => {
      setBusy(true);
      setError("");
      try {
        const res = await fetch("/api/ai/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId, targetLang: lang }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          setError(data?.error ?? "Traduction indisponible.");
          return;
        }
        setTranslated(data.translation);
        setSelectedLang(lang);
        setOpen(false);
        onTranslated?.(data.translation, lang);
      } catch {
        setError("Erreur réseau.");
      } finally {
        setBusy(false);
      }
    },
    [productId, onTranslated]
  );

  // Si une langue est sélectionnée, on affiche le texte traduit + un
  // bouton pour revenir au FR.
  if (selectedLang && translated) {
    const meta = LANG_LABELS[selectedLang];
    return (
      <div className="rounded-xl border border-[rgb(var(--primary))]/30 bg-[rgb(var(--primary))]/[0.03] p-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[rgb(var(--primary))]">
            ✨ {meta.flag} {meta.native} (Claude AI)
          </span>
          <button
            onClick={() => {
              setSelectedLang(null);
              setTranslated(null);
            }}
            className="text-[11px] font-medium text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]"
          >
            ← Original (FR)
          </button>
        </div>
        <p className="whitespace-pre-line text-sm leading-relaxed">
          {translated}
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="flex flex-wrap items-center gap-2">
        {suggestion && !open && (
          <button
            onClick={() => fetchTranslation(suggestion)}
            disabled={busy}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[rgb(var(--primary))]/30 bg-white px-3 text-xs font-semibold text-[rgb(var(--primary))] hover:bg-[rgb(var(--primary))]/[0.06] disabled:opacity-50"
          >
            {LANG_LABELS[suggestion].flag} ✨{" "}
            {busy
              ? "…"
              : `${LANG_LABELS[suggestion].verb} (${LANG_LABELS[suggestion].native})`}
          </button>
        )}
        <button
          onClick={() => setOpen((v) => !v)}
          disabled={busy}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[rgb(var(--border))] bg-white px-3 text-xs font-medium text-[rgb(var(--muted))] hover:border-[rgb(var(--primary))]/30 hover:text-[rgb(var(--primary))] disabled:opacity-50"
        >
          🌍 Traduire
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-3 w-3"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
      </div>

      {open && (
        <div className="absolute left-0 top-full z-20 mt-1.5 w-48 overflow-hidden rounded-xl border border-[rgb(var(--border))] bg-white shadow-lg">
          {(["en", "de", "es"] as Lang[]).map((l) => (
            <button
              key={l}
              onClick={() => fetchTranslation(l)}
              disabled={busy}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition hover:bg-[rgb(var(--primary))]/[0.04] disabled:opacity-50"
            >
              <span className="text-base">{LANG_LABELS[l].flag}</span>
              <span className="flex-1 font-medium">{LANG_LABELS[l].native}</span>
            </button>
          ))}
        </div>
      )}

      {error && (
        <p className="mt-2 text-[11px] text-red-600">{error}</p>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

/**
 * Bouton de traduction de description produit (FR → EN/DE/ES via Claude).
 *
 * - Le résultat est mis en cache côté serveur dans `Product.translations`
 *   (JSON map { lang: text }) → un second clic sur la même langue est
 *   instantané.
 * - Compact UI : 3 puces langue alignées, état "loading" par langue active.
 */

type Lang = "en" | "de" | "es";

const LANG_INFO: Record<Lang, { flag: string; label: string }> = {
  en: { flag: "🇬🇧", label: "English" },
  de: { flag: "🇩🇪", label: "Deutsch" },
  es: { flag: "🇪🇸", label: "Español" },
};

export function TranslateButton({
  productId,
  originalText,
  onTranslated,
}: {
  productId: string;
  originalText: string;
  onTranslated?: (translated: string, lang: Lang) => void;
}) {
  const [busy, setBusy] = useState<Lang | null>(null);
  const [activeLang, setActiveLang] = useState<Lang | null>(null);
  const [translation, setTranslation] = useState<string>("");
  const [error, setError] = useState("");

  async function translate(lang: Lang) {
    // Si on reclique sur la même langue déjà affichée, on referme.
    if (activeLang === lang) {
      setActiveLang(null);
      setTranslation("");
      return;
    }
    setBusy(lang);
    setError("");
    try {
      const res = await fetch("/api/ai/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          text: originalText,
          targetLang: lang,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data?.error ?? "Traduction impossible.");
        return;
      }
      setTranslation(data.translation);
      setActiveLang(lang);
      onTranslated?.(data.translation, lang);
    } catch {
      setError("Erreur réseau.");
    } finally {
      setBusy(null);
    }
  }

  if (!originalText || originalText.trim().length === 0) {
    return null;
  }

  return (
    <div className="mt-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[rgb(var(--muted))]">
          ✨ Traduire :
        </span>
        {(Object.keys(LANG_INFO) as Lang[]).map((lang) => {
          const isLoading = busy === lang;
          const isActive = activeLang === lang;
          return (
            <button
              key={lang}
              onClick={() => translate(lang)}
              disabled={busy !== null}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-all duration-150",
                isActive
                  ? "border-[rgb(var(--primary))] bg-[rgb(var(--primary))]/10 text-[rgb(var(--primary))]"
                  : "border-[rgb(var(--border))]/80 bg-[rgb(var(--card))] text-[rgb(var(--muted))] hover:border-[rgb(var(--primary))]/40 hover:text-[rgb(var(--primary))]",
                isLoading && "animate-pulse",
                busy !== null && !isLoading && "cursor-not-allowed opacity-50"
              )}
              title={`Traduire en ${LANG_INFO[lang].label}`}
            >
              <span>{LANG_INFO[lang].flag}</span>
              <span>{LANG_INFO[lang].label}</span>
              {isLoading && (
                <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
            </button>
          );
        })}
      </div>

      {error && (
        <div className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs text-red-700">
          ⚠️ {error}
        </div>
      )}

      {activeLang && translation && (
        <div className="mt-3 animate-fade-in rounded-xl border border-[rgb(var(--primary))]/25 bg-gradient-to-br from-[rgb(var(--primary))]/[0.04] to-transparent p-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[rgb(var(--primary))]">
              <span>{LANG_INFO[activeLang].flag}</span>
              <span>Traduction · {LANG_INFO[activeLang].label}</span>
            </span>
            <button
              onClick={() => {
                setActiveLang(null);
                setTranslation("");
              }}
              className="text-xs text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]"
              title="Masquer la traduction"
            >
              ✕
            </button>
          </div>
          <p className="whitespace-pre-line text-sm leading-relaxed text-[rgb(var(--fg))]/90">
            {translation}
          </p>
          <p className="mt-2 text-[10px] italic text-[rgb(var(--muted))]">
            Traduit automatiquement par IA (Claude). Pour usage informatif.
          </p>
        </div>
      )}
    </div>
  );
}

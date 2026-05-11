"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

/**
 * Toggle dark/light mode.
 *
 * Architecture :
 *  - Le thème vit dans `<html data-theme="dark|light">` (manipulé par
 *    `ThemeScript` côté serveur pour éviter le flash blanc au chargement,
 *    et par ce toggle côté client).
 *  - Le choix utilisateur prend toujours le pas sur la préférence système.
 *  - Persisté en localStorage sous la clé `carlow-theme`.
 *
 * Le composant ne rend rien pendant l'hydratation (`mounted=false`) pour
 * éviter les warnings React de mismatch SSR/CSR (le thème côté client
 * dépend de localStorage qui n'existe pas en SSR).
 */

const STORAGE_KEY = "carlow-theme";
type Theme = "light" | "dark";

function readStored(): Theme | null {
  if (typeof window === "undefined") return null;
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "light" || v === "dark") return v;
    return null;
  } catch {
    return null;
  }
}

function detectSystem(): Theme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", theme);
}

export function ThemeToggle({
  className,
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md";
}) {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = readStored() ?? detectSystem();
    setTheme(stored);
    applyTheme(stored);
    setMounted(true);

    // Écoute des changements système pour les utilisateurs qui n'ont pas
    // fait de choix manuel (on suit le système). Si l'utilisateur a déjà
    // toggle, on respecte son choix.
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => {
      if (readStored() !== null) return; // choix manuel = ne pas écraser
      const next: Theme = e.matches ? "dark" : "light";
      setTheme(next);
      applyTheme(next);
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // localStorage indisponible (mode privé Safari, etc.) — on continue
    }
  }

  if (!mounted) {
    // Placeholder de taille identique pour éviter le layout shift
    return (
      <div
        aria-hidden="true"
        className={cn(
          size === "sm" ? "h-8 w-8" : "h-9 w-9",
          "rounded-lg",
          className
        )}
      />
    );
  }

  const isDark = theme === "dark";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Activer le mode clair" : "Activer le mode sombre"}
      aria-pressed={isDark}
      title={isDark ? "Mode clair" : "Mode sombre"}
      className={cn(
        "grid place-items-center rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] text-[rgb(var(--muted))] transition hover:text-[rgb(var(--fg))]",
        size === "sm" ? "h-8 w-8" : "h-9 w-9",
        className
      )}
    >
      {isDark ? (
        // Soleil (mode clair)
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      ) : (
        // Lune (mode sombre)
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  );
}

/**
 * Script inline injecté en SSR dans le <head> pour appliquer le thème
 * AVANT le premier paint et éviter le flash blanc.
 * À insérer dans le layout.tsx via `<Script strategy="beforeInteractive">`.
 */
export const THEME_INIT_SCRIPT = `
  (function() {
    try {
      var stored = localStorage.getItem('${STORAGE_KEY}');
      var theme;
      if (stored === 'light' || stored === 'dark') {
        theme = stored;
      } else {
        theme = window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark' : 'light';
      }
      document.documentElement.setAttribute('data-theme', theme);
    } catch (e) {
      document.documentElement.setAttribute('data-theme', 'light');
    }
  })();
`;

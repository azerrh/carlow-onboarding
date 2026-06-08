"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

/**
 * Bouton flottant "Remonter en haut".
 *
 * Apparaît dès qu'on a scrollé de plus de 300px. Au clic, remonte en haut
 * de la page en douceur. Pratique sur les longues pages (dashboards, listes)
 * pour ne pas avoir à remonter à la molette.
 *
 * Positionné en bas à gauche pour ne pas chevaucher le chatbot (bas à droite).
 */
export function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 300);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function scrollTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <button
      onClick={scrollTop}
      aria-label="Remonter en haut de la page"
      className={cn(
        "fixed bottom-6 left-6 z-40 grid h-11 w-11 place-items-center rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] text-[rgb(var(--fg))] shadow-lg transition-all duration-300 hover:border-[rgb(var(--primary))]/40 hover:bg-[rgb(var(--primary))]/8 hover:text-[rgb(var(--primary))]",
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-4 opacity-0"
      )}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
      >
        <path d="M18 15l-6-6-6 6" />
      </svg>
    </button>
  );
}

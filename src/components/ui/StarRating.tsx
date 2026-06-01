"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

/**
 * Composant étoiles cliquables (mode interactif) ou en lecture seule.
 *
 * - mode="display" → affichage uniquement (utilisé pour montrer la moyenne
 *   ou un avis existant). Supporte les valeurs fractionnaires via gradient.
 * - mode="input"   → cliquable, hover preview, callback onChange.
 */
export function StarRating({
  value,
  onChange,
  size = "md",
  mode = "display",
  className,
}: {
  value: number;
  onChange?: (v: number) => void;
  size?: "sm" | "md" | "lg";
  mode?: "display" | "input";
  className?: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const dim =
    size === "sm" ? "h-3.5 w-3.5" : size === "lg" ? "h-6 w-6" : "h-4 w-4";

  return (
    <div
      className={cn("inline-flex items-center gap-0.5", className)}
      role={mode === "input" ? "radiogroup" : undefined}
      aria-label={mode === "display" ? `Note : ${value.toFixed(1)} sur 5` : undefined}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        // En mode input, on utilise hover preview ; sinon valeur réelle.
        const effective = mode === "input" && hover !== null ? hover : value;
        const isFull = effective >= star;
        const fraction = effective > star - 1 && effective < star ? effective - (star - 1) : 0;

        if (mode === "input") {
          const isActive = effective >= star;
          return (
            <button
              key={star}
              type="button"
              role="radio"
              aria-checked={value === star}
              aria-label={`${star} étoile${star > 1 ? "s" : ""}`}
              onClick={() => onChange?.(star)}
              onMouseEnter={() => setHover(star)}
              onMouseLeave={() => setHover(null)}
              className={cn(
                "transition",
                isActive ? "text-amber-400" : "text-[rgb(var(--border))]",
                "hover:scale-110"
              )}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className={dim}>
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </button>
          );
        }

        // mode display : étoile pleine, vide, ou demi
        return (
          <span key={star} className="relative inline-block">
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className={cn(dim, "text-[rgb(var(--border))]")}
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            {(isFull || fraction > 0) && (
              <span
                className="absolute inset-0 overflow-hidden"
                style={{ width: isFull ? "100%" : `${fraction * 100}%` }}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className={cn(dim, "text-amber-400")}
                >
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}

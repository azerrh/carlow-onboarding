"use client";

import { cn } from "@/lib/cn";

/**
 * Spinner — composant de chargement unifié.
 *
 * Variantes :
 *   - "circle" (défaut) : cercle qui tourne
 *   - "dots" : 3 points qui pulsent
 *   - "bars" : 3 barres qui s'allongent
 *
 * Utilisation :
 *   <Spinner />
 *   <Spinner size="lg" variant="dots" />
 *   <Spinner label="Chargement…" />  // label visuel à côté
 */
export function Spinner({
  size = "md",
  variant = "circle",
  label,
  className,
}: {
  size?: "sm" | "md" | "lg";
  variant?: "circle" | "dots" | "bars";
  label?: string;
  className?: string;
}) {
  const dim =
    size === "sm" ? "h-4 w-4" : size === "lg" ? "h-8 w-8" : "h-5 w-5";
  const labelSize =
    size === "sm" ? "text-xs" : size === "lg" ? "text-base" : "text-sm";

  let spinner: React.ReactNode;

  if (variant === "circle") {
    spinner = (
      <svg
        className={cn("animate-spin text-[rgb(var(--primary))]", dim)}
        viewBox="0 0 24 24"
        fill="none"
        aria-label="Chargement"
        role="status"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="3"
        />
        <path
          className="opacity-90"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
        />
      </svg>
    );
  } else if (variant === "dots") {
    const dotSize =
      size === "sm" ? "h-1.5 w-1.5" : size === "lg" ? "h-3 w-3" : "h-2 w-2";
    spinner = (
      <div className="flex items-center gap-1" role="status" aria-label="Chargement">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={cn(
              "inline-block rounded-full bg-[rgb(var(--primary))]",
              dotSize
            )}
            style={{
              animation: "pulse-ring 1.2s ease-in-out infinite",
              animationDelay: `${i * 0.15}s`,
            }}
          />
        ))}
      </div>
    );
  } else {
    // bars
    const barWidth =
      size === "sm" ? "w-0.5" : size === "lg" ? "w-1.5" : "w-1";
    const barHeight =
      size === "sm" ? "h-3" : size === "lg" ? "h-6" : "h-4";
    spinner = (
      <div className="flex items-end gap-0.5" role="status" aria-label="Chargement">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={cn(
              "inline-block rounded-sm bg-[rgb(var(--primary))]",
              barWidth,
              barHeight
            )}
            style={{
              animation: "pulse-ring 0.9s ease-in-out infinite",
              animationDelay: `${i * 0.12}s`,
            }}
          />
        ))}
      </div>
    );
  }

  if (label) {
    return (
      <div className={cn("inline-flex items-center gap-2", className)}>
        {spinner}
        <span className={cn("font-medium text-[rgb(var(--muted))]", labelSize)}>
          {label}
        </span>
      </div>
    );
  }

  return <span className={cn("inline-flex", className)}>{spinner}</span>;
}

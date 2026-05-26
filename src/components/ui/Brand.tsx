"use client";

import { cn } from "@/lib/cn";

type BrandVariant = "default" | "compact" | "marketplace";

export function Brand({
  variant = "default",
  className,
}: {
  variant?: BrandVariant;
  className?: string;
}) {
  const isCompact = variant === "compact" || variant === "marketplace";

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      {/* Logo C avec dégradé */}
      <div
        className={cn(
          "grid shrink-0 place-items-center rounded-xl font-bold text-white",
          "bg-gradient-to-br from-[rgb(var(--primary))] to-[#c05510]",
          "shadow-[0_2px_8px_rgb(var(--primary)/0.35)]",
          isCompact ? "h-8 w-8 text-sm" : "h-10 w-10 text-base",
        )}
      >
        C
      </div>

      {/* Texte */}
      <div className="flex items-baseline gap-2">
        <span
          className={cn(
            "font-bold tracking-tight",
            isCompact ? "text-base" : "text-lg",
          )}
        >
          Carlow
        </span>

        {variant === "default" && (
          <span className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
            Vendeur
          </span>
        )}

        {variant === "marketplace" && (
          <span className="rounded-full bg-[rgb(var(--primary))]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[rgb(var(--primary))]">
            Marketplace
          </span>
        )}
      </div>
    </div>
  );
}

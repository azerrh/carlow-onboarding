"use client";

import { cn } from "@/lib/cn";

export function Brand({
  variant = "default",
  className,
}: {
  variant?: "default" | "compact";
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className={cn(
          "grid place-items-center rounded-lg bg-[rgb(var(--primary))] text-white font-semibold",
          variant === "compact" ? "h-7 w-7 text-sm" : "h-9 w-9 text-base",
        )}
      >
        C
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-lg font-semibold tracking-tight">arlow</span>
        {variant === "default" && (
          <span className="rounded-full border border-[rgb(var(--border))] bg-white/70 px-2 py-0.5 text-[11px] font-medium text-[rgb(var(--muted))]">
            Portail vendeur
          </span>
        )}
      </div>
    </div>
  );
}


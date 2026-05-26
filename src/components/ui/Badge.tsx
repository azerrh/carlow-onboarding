"use client";

import { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Tone =
  | "neutral"
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "info";

type Size = "sm" | "md";

/**
 * Badge — composant unifié pour tous les statuts/labels colorés.
 *
 * Tones supportés : neutral, primary (orange Carlow), success, warning, danger, info.
 *
 * Utilisation :
 *   <Badge tone="success">Livrée</Badge>
 *   <Badge tone="warning" size="sm" dot>En attente</Badge>
 *   <Badge tone="primary" outline>Premium</Badge>
 */
export function Badge({
  tone = "neutral",
  size = "md",
  dot = false,
  outline = false,
  className,
  children,
  ...props
}: HTMLAttributes<HTMLSpanElement> & {
  tone?: Tone;
  size?: Size;
  dot?: boolean;
  outline?: boolean;
}) {
  const toneClasses: Record<Tone, { solid: string; outline: string; dotColor: string }> = {
    neutral: {
      solid: "bg-black/[0.06] text-[rgb(var(--fg))]/80",
      outline: "border-[rgb(var(--border))] bg-transparent text-[rgb(var(--muted))]",
      dotColor: "bg-[rgb(var(--muted))]",
    },
    primary: {
      solid: "bg-[rgb(var(--primary))]/10 text-[rgb(var(--primary))]",
      outline: "border-[rgb(var(--primary))]/40 bg-transparent text-[rgb(var(--primary))]",
      dotColor: "bg-[rgb(var(--primary))]",
    },
    success: {
      solid: "bg-[rgb(var(--success))]/10 text-[rgb(var(--success))]",
      outline: "border-[rgb(var(--success))]/40 bg-transparent text-[rgb(var(--success))]",
      dotColor: "bg-[rgb(var(--success))]",
    },
    warning: {
      solid: "bg-amber-100 text-amber-700",
      outline: "border-amber-300 bg-transparent text-amber-700",
      dotColor: "bg-amber-500",
    },
    danger: {
      solid: "bg-red-100 text-red-700",
      outline: "border-red-300 bg-transparent text-red-700",
      dotColor: "bg-red-500",
    },
    info: {
      solid: "bg-blue-100 text-blue-700",
      outline: "border-blue-300 bg-transparent text-blue-700",
      dotColor: "bg-blue-500",
    },
  };

  const toneStyle = toneClasses[tone];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-bold uppercase tracking-wide",
        outline ? cn("border", toneStyle.outline) : toneStyle.solid,
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-0.5 text-[11px]",
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn(
            "relative inline-flex h-1.5 w-1.5 rounded-full",
            toneStyle.dotColor
          )}
        >
          <span
            className={cn(
              "absolute inset-0 inline-flex h-full w-full animate-ping rounded-full opacity-60",
              toneStyle.dotColor
            )}
            style={{ animationDuration: "2s" }}
          />
        </span>
      )}
      {children}
    </span>
  );
}

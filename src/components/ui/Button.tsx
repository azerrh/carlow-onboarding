"use client";

import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md";

export function Button({
  className,
  variant = "primary",
  size = "md",
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
}) {
  return (
    <button
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--primary))]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
        disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer",
        size === "sm" ? "h-9 px-3 text-sm" : "h-11 px-4 text-sm",
        variant === "primary" &&
          "bg-[rgb(var(--primary))] text-[rgb(var(--primary-contrast))] hover:brightness-[0.98] active:brightness-[0.95]",
        variant === "secondary" &&
          "border border-[rgb(var(--border))] bg-white text-[rgb(var(--fg))] hover:bg-black/[0.02]",
        variant === "ghost" &&
          "text-[rgb(var(--muted))] hover:bg-black/[0.03]",
        className,
      )}
      {...props}
    />
  );
}


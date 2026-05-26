"use client";

import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

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
        "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--primary))]/40 focus-visible:ring-offset-2",
        disabled ? "cursor-not-allowed opacity-55" : "cursor-pointer",
        /* Tailles */
        size === "sm" && "h-9 px-3.5 text-sm",
        size === "md" && "h-11 px-4 text-sm",
        size === "lg" && "h-12 px-6 text-base",
        /* Variantes */
        variant === "primary" &&
          cn(
            "bg-[rgb(var(--primary))] text-[rgb(var(--primary-contrast))]",
            "shadow-[0_1px_3px_rgb(var(--primary)/0.3),0_4px_14px_rgb(var(--primary)/0.25)]",
            !disabled && "hover:brightness-[1.06] active:brightness-[0.96] active:scale-[0.99]",
          ),
        variant === "secondary" &&
          cn(
            "border border-[rgb(var(--border))] bg-white text-[rgb(var(--fg))]",
            !disabled && "hover:bg-black/[0.025] hover:border-[rgb(var(--border))]/80 active:bg-black/[0.04]",
          ),
        variant === "ghost" &&
          cn(
            "text-[rgb(var(--muted))]",
            !disabled && "hover:bg-black/[0.04] hover:text-[rgb(var(--fg))] active:bg-black/[0.06]",
          ),
        variant === "danger" &&
          cn(
            "bg-[rgb(var(--danger))] text-white",
            "shadow-[0_1px_3px_rgb(var(--danger)/0.25),0_4px_14px_rgb(var(--danger)/0.2)]",
            !disabled && "hover:brightness-[1.06] active:brightness-[0.94] active:scale-[0.99]",
          ),
        className,
      )}
      {...props}
    />
  );
}

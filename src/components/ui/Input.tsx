"use client";

import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3.5 text-sm text-[rgb(var(--fg))]",
        "placeholder:text-[rgb(var(--muted))]/60",
        "outline-none transition-all duration-150",
        "focus:border-[rgb(var(--primary))]/50 focus:ring-3 focus:ring-[rgb(var(--primary))]/12",
        "hover:border-[rgb(var(--border))]/80",
        className,
      )}
      {...props}
    />
  );
}

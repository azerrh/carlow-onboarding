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
        "h-11 w-full rounded-xl border border-[rgb(var(--border))] bg-white px-3 text-sm text-[rgb(var(--fg))]",
        "placeholder:text-[rgb(var(--muted))]/70",
        "outline-none transition",
        "focus:border-[rgb(var(--primary))]/60 focus:ring-4 focus:ring-[rgb(var(--primary))]/15",
        className,
      )}
      {...props}
    />
  );
}


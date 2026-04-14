"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <label className="text-xs font-medium text-[rgb(var(--muted))]">
          {label}
        </label>
        {hint && (
          <span className="text-xs text-[rgb(var(--muted))]/80">{hint}</span>
        )}
      </div>
      {children}
    </div>
  );
}


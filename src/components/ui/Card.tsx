"use client";

import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "card-shadow rounded-[var(--radius)] border border-[rgb(var(--border))] bg-white",
        className,
      )}
      {...props}
    />
  );
}


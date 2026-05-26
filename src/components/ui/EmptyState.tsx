"use client";

import { ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";

/**
 * EmptyState — composant unifié pour tous les états "aucune donnée".
 *
 * Utilisation :
 *   <EmptyState
 *     icon="📦"
 *     title="Aucun produit"
 *     description="Ajoutez votre premier produit pour commencer."
 *     action={<Button>+ Nouveau produit</Button>}
 *   />
 *
 * Variantes :
 *   - "default" : grande carte centrée
 *   - "compact" : petite version inline
 *   - "highlight" : avec dégradé orange pour insister sur l'action
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  variant = "default",
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  variant?: "default" | "compact" | "highlight";
  className?: string;
}) {
  if (variant === "compact") {
    return (
      <div
        className={cn(
          "rounded-xl border border-dashed border-[rgb(var(--border))] bg-[rgb(var(--card))]/50 px-4 py-8 text-center",
          className
        )}
      >
        {icon && <div className="mb-2 text-2xl">{icon}</div>}
        <p className="text-sm font-semibold">{title}</p>
        {description && (
          <p className="mt-1 text-xs text-[rgb(var(--muted))]">{description}</p>
        )}
        {action && <div className="mt-4">{action}</div>}
      </div>
    );
  }

  return (
    <Card
      className={cn(
        "relative overflow-hidden p-10 text-center sm:p-12",
        variant === "highlight" &&
          "border-[rgb(var(--primary))]/25 bg-gradient-to-br from-[rgb(var(--primary))]/[0.04] via-transparent to-[rgb(var(--success))]/[0.03]",
        className
      )}
    >
      {/* Décor de fond */}
      {variant === "highlight" && (
        <>
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[rgb(var(--primary))]/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-[rgb(var(--success))]/10 blur-2xl" />
        </>
      )}

      <div className="relative">
        {icon && (
          <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-[rgb(var(--primary))]/15 to-[rgb(var(--primary))]/8 text-3xl animate-bounce-in">
            {icon}
          </div>
        )}
        <h3 className="text-base font-bold tracking-tight sm:text-lg">
          {title}
        </h3>
        {description && (
          <p className="mx-auto mt-2 max-w-md text-sm text-[rgb(var(--muted))]">
            {description}
          </p>
        )}
        {action && <div className="mt-6 flex justify-center gap-3">{action}</div>}
      </div>
    </Card>
  );
}

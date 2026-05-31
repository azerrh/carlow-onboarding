"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

export interface BadgeData {
  id: string;
  label: string;
  description: string;
  icon: string;
  color: "primary" | "success" | "warning" | "info" | "premium";
}

/**
 * Affichage des badges vendeur.
 *
 * Variantes :
 *  - "full" : badges complets avec label visible (page vendeur, fiche produit)
 *  - "compact" : juste icônes (cartes produits, listes denses)
 *  - "single" : un seul badge mis en avant (champion)
 *
 * Tooltip affiché au survol pour expliquer chaque badge.
 */

export function VendorBadges({
  badges,
  variant = "full",
  className,
  size = "md",
}: {
  badges: BadgeData[];
  variant?: "full" | "compact" | "single";
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  if (!badges || badges.length === 0) return null;

  if (variant === "single") {
    // On prend le badge le plus prestigieux (déjà trié côté serveur)
    const b = badges[0];
    return (
      <BadgePill
        badge={b}
        size={size}
        className={cn("inline-flex", className)}
      />
    );
  }

  if (variant === "compact") {
    return (
      <div className={cn("inline-flex items-center gap-1", className)}>
        {badges.map((b) => (
          <CompactBadgeIcon key={b.id} badge={b} size={size} />
        ))}
      </div>
    );
  }

  // full
  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {badges.map((b) => (
        <BadgePill key={b.id} badge={b} size={size} />
      ))}
    </div>
  );
}

/* ---------------- Sous-composants ---------------- */

function CompactBadgeIcon({
  badge,
  size = "md",
}: {
  badge: BadgeData;
  size?: "sm" | "md" | "lg";
}) {
  const [hover, setHover] = useState(false);
  const dim =
    size === "sm" ? "h-5 w-5 text-[10px]" : size === "lg" ? "h-9 w-9 text-base" : "h-7 w-7 text-sm";

  return (
    <span
      className="relative inline-block"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <span
        className={cn(
          "grid shrink-0 place-items-center rounded-full border shadow-sm transition-transform hover:scale-110",
          dim,
          colorClasses(badge.color)
        )}
        aria-label={badge.label}
        title={badge.label}
      >
        {badge.icon}
      </span>
      {hover && (
        <span className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-[rgb(var(--fg))] px-2.5 py-1.5 text-[11px] font-semibold text-[rgb(var(--bg))] shadow-lg animate-fade-in">
          {badge.label}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-t-[rgb(var(--fg))] border-x-transparent border-b-transparent" />
        </span>
      )}
    </span>
  );
}

function BadgePill({
  badge,
  size = "md",
  className,
}: {
  badge: BadgeData;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizeClass =
    size === "sm"
      ? "h-6 px-2 text-[10px]"
      : size === "lg"
        ? "h-9 px-3.5 text-sm"
        : "h-7 px-2.5 text-[11px]";

  return (
    <span
      className={cn(
        "group relative inline-flex items-center gap-1.5 rounded-full border font-bold transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md",
        sizeClass,
        colorClasses(badge.color),
        badge.color === "premium" && "animate-gradient bg-[length:200%_200%]",
        className
      )}
      title={badge.description}
    >
      <span className={size === "sm" ? "text-xs" : "text-sm"}>{badge.icon}</span>
      <span className="whitespace-nowrap">{badge.label}</span>
    </span>
  );
}

function colorClasses(color: BadgeData["color"]): string {
  switch (color) {
    case "success":
      return "border-[rgb(var(--success))]/40 bg-[rgb(var(--success))]/10 text-[rgb(var(--success))]";
    case "warning":
      return "border-amber-300 bg-gradient-to-br from-amber-50 to-amber-100 text-amber-700";
    case "info":
      return "border-blue-300 bg-blue-50 text-blue-700";
    case "premium":
      return "border-transparent bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 text-white shadow-[0_2px_8px_rgb(251_146_60_/0.4)]";
    case "primary":
    default:
      return "border-[rgb(var(--primary))]/30 bg-[rgb(var(--primary))]/10 text-[rgb(var(--primary))]";
  }
}

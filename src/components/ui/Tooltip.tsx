"use client";

import { ReactNode, useState } from "react";
import { cn } from "@/lib/cn";

/**
 * Tooltip — bulle d'aide au survol.
 *
 * Utilisation :
 *   <Tooltip content="Cliquez pour exporter en CSV">
 *     <Button>Export</Button>
 *   </Tooltip>
 *
 * Pas de portail / pas de positionnement intelligent côté JS : la bulle
 * est positionnée en CSS pur via absolute. Pour des positions complexes
 * (overflow-hidden), envisager Floating UI.
 */
export function Tooltip({
  content,
  position = "top",
  children,
  className,
}: {
  content: ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  children: ReactNode;
  className?: string;
}) {
  const [visible, setVisible] = useState(false);

  const positionClasses: Record<typeof position, string> = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  const arrowClasses: Record<typeof position, string> = {
    top: "top-full left-1/2 -translate-x-1/2 border-t-[rgb(var(--fg))] border-x-transparent border-b-transparent",
    bottom:
      "bottom-full left-1/2 -translate-x-1/2 border-b-[rgb(var(--fg))] border-x-transparent border-t-transparent",
    left: "left-full top-1/2 -translate-y-1/2 border-l-[rgb(var(--fg))] border-y-transparent border-r-transparent",
    right:
      "right-full top-1/2 -translate-y-1/2 border-r-[rgb(var(--fg))] border-y-transparent border-l-transparent",
  };

  return (
    <span
      className={cn("relative inline-block", className)}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      {visible && (
        <span
          role="tooltip"
          className={cn(
            "pointer-events-none absolute z-50 whitespace-nowrap rounded-lg bg-[rgb(var(--fg))] px-2.5 py-1.5 text-[11px] font-medium text-[rgb(var(--bg))] shadow-lg animate-fade-in",
            positionClasses[position]
          )}
        >
          {content}
          {/* Flèche */}
          <span
            className={cn(
              "absolute h-0 w-0 border-[5px]",
              arrowClasses[position]
            )}
          />
        </span>
      )}
    </span>
  );
}

import Image from "next/image";
import { cn } from "@/lib/cn";

/**
 * Image produit optimisée.
 *
 * Sur les URLs Supabase Storage (whitelistées dans next.config), on délègue à
 * `next/image` : Vercel redimensionne l'image à la taille réellement affichée
 * et la sert en WebP/AVIF (les originaux uploadés peuvent peser plusieurs Mo).
 * Tout autre hôte — ou une URL invalide — retombe sur un `<img>` classique en
 * lazy-loading, pour ne JAMAIS planter le rendu si une image vient d'ailleurs.
 *
 * ⚠️ En mode optimisé on utilise `fill`, donc le parent DOIT être positionné
 * (`relative`) et avoir une taille définie (ex. `relative aspect-[4/3]` ou
 * `relative h-16 w-16`).
 *
 * Props :
 *  - `sizes`    : largeur d'affichage estimée (aide Vercel à choisir la bonne
 *                 résolution). Défaut adapté à une grille de cartes.
 *  - `priority` : `true` pour l'image principale au-dessus de la ligne de
 *                 flottaison (désactive le lazy-loading → meilleur LCP).
 */

const SUPABASE_HOST = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").host;
  } catch {
    return "";
  }
})();

function isOptimizable(src: string): boolean {
  try {
    return SUPABASE_HOST !== "" && new URL(src).host === SUPABASE_HOST;
  } catch {
    return false; // URL relative / invalide → on ne tente pas l'optimisation
  }
}

export function SmartImage({
  src,
  alt,
  className,
  sizes = "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 320px",
  priority = false,
}: {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  if (!isOptimizable(src)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        className={className}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      className={cn("object-cover", className)}
    />
  );
}

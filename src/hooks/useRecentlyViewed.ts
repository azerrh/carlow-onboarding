"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

/**
 * Hook produits récemment consultés.
 *
 * Stocke jusqu'à 20 derniers IDs vus en localStorage (sous `carlow-recent`).
 * Le hook `useRecentlyViewedDetails` fait un fetch côté API pour récupérer
 * les détails à jour (prix, stock, etc.) plutôt que de stocker un snapshot
 * potentiellement périmé.
 *
 * Pattern volontairement client-only — pas de tracking côté serveur (donc
 * pas de RGPD à gérer en plus, c'est juste une commodité locale).
 */

const STORAGE_KEY = "carlow-recent";
const MAX_ITEMS = 20;

function read(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed) && parsed.every((v) => typeof v === "string")) {
      return parsed;
    }
    return [];
  } catch {
    return [];
  }
}

function write(ids: string[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // localStorage indisponible (private browsing Safari) — fail silencieux
  }
}

/**
 * Track une vue de produit. À appeler depuis la fiche produit dans un
 * useEffect au chargement.
 */
export function trackView(productId: string): void {
  if (!productId || typeof window === "undefined") return;
  const current = read();
  // Si déjà en tête, ne touche pas (évite des writes inutiles)
  if (current[0] === productId) return;
  const next = [productId, ...current.filter((id) => id !== productId)].slice(
    0,
    MAX_ITEMS
  );
  write(next);
  // Notifie les composants d'affichage (autres onglets / autres hooks)
  window.dispatchEvent(new CustomEvent("carlow:recent-updated"));
}

/**
 * Hook lecture des IDs récemment vus (réactif aux changements).
 * Option `exclude` pour ne pas retourner le produit courant (utile sur la
 * fiche produit pour ne pas s'afficher soi-même dans la liste).
 */
export function useRecentlyViewed(exclude?: string): string[] {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    setIds(read());

    function onUpdate() {
      setIds(read());
    }
    window.addEventListener("carlow:recent-updated", onUpdate);
    window.addEventListener("storage", onUpdate); // sync inter-onglets
    return () => {
      window.removeEventListener("carlow:recent-updated", onUpdate);
      window.removeEventListener("storage", onUpdate);
    };
  }, []);

  // ⚠️ useMemo OBLIGATOIRE : sans ça, `ids.filter()` renvoie un nouveau tableau
  // à chaque render → relance fetchDetails en boucle → "loading" bloqué (cartes
  // vides) + spam de l'API. La mémoïsation rend la référence stable.
  return useMemo(
    () => (exclude ? ids.filter((id) => id !== exclude) : ids),
    [ids, exclude]
  );
}

/**
 * Hook combiné : retourne les détails produits (récupérés via API) des
 * derniers IDs vus. Cap à `limit` (default 4) pour ne pas surcharger
 * la page.
 */
export interface RecentProduct {
  id: string;
  name: string;
  price: number;
  imageUrl: string | null;
  category: string | null;
  vendor: { name: string };
}

export function useRecentlyViewedDetails(opts?: {
  exclude?: string;
  limit?: number;
}): { products: RecentProduct[]; loading: boolean } {
  const exclude = opts?.exclude;
  const limit = opts?.limit ?? 4;
  const ids = useRecentlyViewed(exclude);
  const [products, setProducts] = useState<RecentProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDetails = useCallback(async () => {
    const targetIds = ids.slice(0, limit);
    if (targetIds.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }
    try {
      // On utilise l'API marketplace existante puis on filtre côté JS.
      // Pour éviter de charger toute la marketplace, on appelle l'API
      // unitaire en parallèle pour chaque ID.
      const results = await Promise.all(
        targetIds.map(async (id) => {
          try {
            const res = await fetch(`/api/marketplace/products/${id}`);
            if (!res.ok) return null;
            const data = await res.json();
            if (!data.success) return null;
            const p = data.product;
            const vendor = p.vendor;
            return {
              id: p.id,
              name: p.name,
              price: p.price,
              imageUrl: p.photos?.[0]?.url ?? p.imageUrl ?? null,
              category: p.category ?? null,
              vendor: {
                name: vendor.companyName ?? vendor.name ?? "Vendeur",
              },
            } as RecentProduct;
          } catch {
            return null;
          }
        })
      );
      // Ordre des targetIds préservé (Promise.all garde l'ordre).
      setProducts(results.filter((p): p is RecentProduct => !!p));
    } finally {
      setLoading(false);
    }
  }, [ids, limit]);

  useEffect(() => {
    setLoading(true);
    fetchDetails();
  }, [fetchDetails]);

  return { products, loading };
}

"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Hook simple pour gérer les favoris côté client.
 *
 * Stratégie :
 *  1. Si un buyerId est en localStorage → sync avec l'API (source de vérité)
 *  2. Sinon → fallback localStorage seul (les favoris seront migrés vers le
 *     compte au prochain login, ou perdus si l'utilisateur ne s'inscrit pas)
 *
 * Volontairement minimal : on garde juste un Set d'IDs côté client. La page
 * `/buyer/favoris` fait un GET propre pour afficher les détails produit.
 *
 * Limitation connue : pas de migration auto localStorage → DB au moment du
 * login. On considère que l'utilisateur a peu de favoris avant inscription
 * et qu'il les rajoutera après. À améliorer si nécessaire.
 */
const LS_KEY = "carlow-favorites";

function readLocal(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed) && parsed.every((v) => typeof v === "string")) {
      return new Set(parsed);
    }
    return new Set();
  } catch {
    return new Set();
  }
}

function writeLocal(set: Set<string>): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(Array.from(set)));
  } catch {
    // localStorage plein ou bloqué — on ignore silencieusement.
  }
}

export function useFavorites() {
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [buyerId, setBuyerId] = useState<string | null>(null);

  // Initialisation : on lit le buyerId, puis on tente un GET API. Si pas
  // de buyer connecté on tombe sur localStorage.
  useEffect(() => {
    const id = typeof window !== "undefined" ? localStorage.getItem("buyerId") : null;
    setBuyerId(id);

    let cancelled = false;
    (async () => {
      if (!id) {
        setFavoriteIds(readLocal());
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`/api/buyer/favorites?buyerId=${encodeURIComponent(id)}`);
        const data = await res.json();
        if (cancelled) return;
        if (res.ok && data.success && Array.isArray(data.productIds)) {
          setFavoriteIds(new Set(data.productIds));
        } else {
          setFavoriteIds(readLocal());
        }
      } catch {
        if (!cancelled) setFavoriteIds(readLocal());
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const isFavorite = useCallback(
    (productId: string) => favoriteIds.has(productId),
    [favoriteIds]
  );

  const toggle = useCallback(
    async (productId: string): Promise<{ favorited: boolean; needLogin?: boolean }> => {
      // Update optimiste : on bascule l'état immédiatement, puis on appelle
      // l'API. Si l'API échoue on revert.
      const wasFavorited = favoriteIds.has(productId);
      const next = new Set(favoriteIds);
      if (wasFavorited) next.delete(productId);
      else next.add(productId);
      setFavoriteIds(next);

      if (!buyerId) {
        // Pas connecté : juste localStorage.
        writeLocal(next);
        return { favorited: !wasFavorited, needLogin: true };
      }

      try {
        const res = await fetch("/api/buyer/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ buyerId, productId }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error();
        return { favorited: !!data.favorited };
      } catch {
        // Revert sur échec.
        setFavoriteIds(favoriteIds);
        return { favorited: wasFavorited };
      }
    },
    [buyerId, favoriteIds]
  );

  return {
    favoriteIds,
    isFavorite,
    toggle,
    loading,
    isLoggedIn: !!buyerId,
  };
}

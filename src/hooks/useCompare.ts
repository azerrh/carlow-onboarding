"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Store comparateur de produits.
 *
 * Limitation volontaire à 4 produits max (au-delà la table de comparaison
 * devient illisible sur desktop et impossible sur mobile).
 *
 * Persisté localStorage pour que l'utilisateur ne perde pas sa sélection
 * en naviguant. Le store stocke uniquement les IDs ; la page /comparer
 * fait un fetch pour récupérer les détails complets à jour.
 */
const MAX_COMPARE = 4;

export interface CompareStore {
  productIds: string[];
  /** Ajoute si pas déjà présent, retourne false si limite atteinte. */
  add: (productId: string) => boolean;
  remove: (productId: string) => void;
  /** Toggle pratique pour les boutons "Comparer" sur les cartes. */
  toggle: (productId: string) => { added: boolean; full?: boolean };
  has: (productId: string) => boolean;
  clear: () => void;
}

export const useCompare = create<CompareStore>()(
  persist(
    (set, get) => ({
      productIds: [],
      add: (productId) => {
        const ids = get().productIds;
        if (ids.includes(productId)) return true;
        if (ids.length >= MAX_COMPARE) return false;
        set({ productIds: [...ids, productId] });
        return true;
      },
      remove: (productId) =>
        set((s) => ({ productIds: s.productIds.filter((id) => id !== productId) })),
      toggle: (productId) => {
        const ids = get().productIds;
        if (ids.includes(productId)) {
          set({ productIds: ids.filter((id) => id !== productId) });
          return { added: false };
        }
        if (ids.length >= MAX_COMPARE) {
          return { added: false, full: true };
        }
        set({ productIds: [...ids, productId] });
        return { added: true };
      },
      has: (productId) => get().productIds.includes(productId),
      clear: () => set({ productIds: [] }),
    }),
    {
      name: "carlow-compare",
      partialize: (state) => ({ productIds: state.productIds }),
    }
  )
);

export const COMPARE_MAX = MAX_COMPARE;

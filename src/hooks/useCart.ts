import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  vendorId: string;
  vendorName: string;
  imageUrl?: string;
  /**
   * Stock connu au moment où l'utilisateur a ajouté le produit. Sert de
   * garde-fou côté UI pour empêcher un utilisateur d'augmenter la quantité
   * au-delà du stock visible. La validation faisant autorité reste serveur
   * (api/checkout/stripe relit les stocks en DB).
   */
  maxStock?: number;
}

interface CartStore {
  items: CartItem[];
  /** Ajoute (ou incrémente) un produit. Limite à `maxStock` si fourni. */
  addItem: (item: CartItem) => void;
  removeItem: (productId: string) => void;
  /** Met à jour la quantité ; clamp [1, maxStock] ou supprime si <= 0. */
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
}

function getTotalItems(items: CartItem[]) {
  return items.reduce((sum, i) => sum + i.quantity, 0);
}

function getTotalPrice(items: CartItem[]) {
  return items.reduce((sum, i) => sum + i.price * i.quantity, 0);
}

function clampQuantity(qty: number, maxStock?: number): number {
  if (qty < 1) return 0; // < 1 → suppression côté caller
  if (typeof maxStock === "number" && maxStock >= 0) {
    return Math.min(qty, maxStock);
  }
  return qty;
}

export const useCart = create<CartStore>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item) =>
        set((state) => {
          const existing = state.items.find(
            (i) => i.productId === item.productId
          );
          // Si le produit est déjà dans le panier on incrémente, sinon on insère.
          if (existing) {
            const max = item.maxStock ?? existing.maxStock;
            const requested = existing.quantity + (item.quantity || 1);
            const next = clampQuantity(requested, max);
            return {
              items: state.items.map((i) =>
                i.productId === item.productId
                  ? { ...i, quantity: next, maxStock: max }
                  : i
              ),
            };
          }
          const initial = clampQuantity(item.quantity || 1, item.maxStock);
          // Si stock = 0 on n'ajoute simplement pas.
          if (initial === 0) return state;
          return { items: [...state.items, { ...item, quantity: initial }] };
        }),
      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((i) => i.productId !== productId),
        })),
      updateQuantity: (productId, quantity) =>
        set((state) => {
          const target = state.items.find((i) => i.productId === productId);
          if (!target) return state;
          const next = clampQuantity(quantity, target.maxStock);
          if (next === 0) {
            return {
              items: state.items.filter((i) => i.productId !== productId),
            };
          }
          return {
            items: state.items.map((i) =>
              i.productId === productId ? { ...i, quantity: next } : i
            ),
          };
        }),
      clearCart: () => set({ items: [] }),
    }),
    {
      name: "carlow-cart",
      partialize: (state) => ({ items: state.items }),
    }
  )
);

export function useCartSummary() {
  const items = useCart((s) => s.items);
  return {
    totalItems: getTotalItems(items),
    totalPrice: getTotalPrice(items),
  };
}

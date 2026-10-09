import { create } from "zustand";
import type { Product } from "../../db/schema";
import { calculateTotals, type DiscountInput, type TotalsResult } from "../../lib/transactions";

export interface CartItem {
  product: Product;
  qty: number;
  subtotal: number;
}

export interface CartState {
  items: CartItem[];
  discount: DiscountInput | null;
  totals: TotalsResult;
  itemCount: number;

  // Actions
  addItem: (product: Product) => boolean;
  increment: (productId: string) => boolean;
  decrement: (productId: string) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  setDiscount: (discount: DiscountInput | null) => void;
  getItemQty: (productId: string) => number;
}

function computeStateTotals(
  items: CartItem[],
  discount: DiscountInput | null
): { totals: TotalsResult; itemCount: number } {
  const totals = calculateTotals(
    items.map((i) => ({ price: i.product.price, qty: i.qty })),
    discount ?? undefined
  );
  const itemCount = items.reduce((sum, item) => sum + item.qty, 0);
  return { totals, itemCount };
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  discount: null,
  totals: { subtotal: 0, discount: 0, total: 0 },
  itemCount: 0,

  addItem: (product: Product) => {
    // If product has 0 stock or inactive, cannot add
    if (product.stock <= 0 || !product.isActive) {
      return false;
    }

    const { items, discount } = get();
    const existingIndex = items.findIndex((i) => i.product.id === product.id);

    if (existingIndex >= 0) {
      const existing = items[existingIndex];
      if (existing.qty >= product.stock) {
        return false; // Reached stock limit
      }

      const updatedItems = [...items];
      const newQty = existing.qty + 1;
      updatedItems[existingIndex] = {
        ...existing,
        product, // Keep latest product info
        qty: newQty,
        subtotal: product.price * newQty,
      };

      const { totals, itemCount } = computeStateTotals(updatedItems, discount);
      set({ items: updatedItems, totals, itemCount });
      return true;
    }

    // New item in cart
    const newItem: CartItem = {
      product,
      qty: 1,
      subtotal: product.price,
    };
    const updatedItems = [...items, newItem];
    const { totals, itemCount } = computeStateTotals(updatedItems, discount);
    set({ items: updatedItems, totals, itemCount });
    return true;
  },

  increment: (productId: string) => {
    const { items, discount } = get();
    const index = items.findIndex((i) => i.product.id === productId);
    if (index === -1) return false;

    const item = items[index];
    if (item.qty >= item.product.stock) {
      return false; // Reached stock limit
    }

    const updatedItems = [...items];
    const newQty = item.qty + 1;
    updatedItems[index] = {
      ...item,
      qty: newQty,
      subtotal: item.product.price * newQty,
    };

    const { totals, itemCount } = computeStateTotals(updatedItems, discount);
    set({ items: updatedItems, totals, itemCount });
    return true;
  },

  decrement: (productId: string) => {
    const { items, discount } = get();
    const index = items.findIndex((i) => i.product.id === productId);
    if (index === -1) return;

    const item = items[index];
    if (item.qty <= 1) {
      // Remove item if decremented to 0
      const updatedItems = items.filter((i) => i.product.id !== productId);
      const { totals, itemCount } = computeStateTotals(updatedItems, discount);
      set({ items: updatedItems, totals, itemCount });
      return;
    }

    const updatedItems = [...items];
    const newQty = item.qty - 1;
    updatedItems[index] = {
      ...item,
      qty: newQty,
      subtotal: item.product.price * newQty,
    };

    const { totals, itemCount } = computeStateTotals(updatedItems, discount);
    set({ items: updatedItems, totals, itemCount });
  },

  removeItem: (productId: string) => {
    const { items, discount } = get();
    const updatedItems = items.filter((i) => i.product.id !== productId);
    const { totals, itemCount } = computeStateTotals(updatedItems, discount);
    set({ items: updatedItems, totals, itemCount });
  },

  clearCart: () => {
    set({
      items: [],
      discount: null,
      totals: { subtotal: 0, discount: 0, total: 0 },
      itemCount: 0,
    });
  },

  setDiscount: (discount: DiscountInput | null) => {
    const { items } = get();
    const { totals, itemCount } = computeStateTotals(items, discount);
    set({ discount, totals, itemCount });
  },

  getItemQty: (productId: string) => {
    const { items } = get();
    const item = items.find((i) => i.product.id === productId);
    return item ? item.qty : 0;
  },
}));

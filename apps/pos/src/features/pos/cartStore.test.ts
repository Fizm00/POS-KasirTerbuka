import { beforeEach, describe, expect, it } from "vitest";
import { useCartStore } from "./cartStore";
import type { Product } from "../../db/schema";
import { calculateTotals } from "../../lib/transactions";

const mockProductA: Product = {
  id: "prod-a",
  name: "Kopi Susu",
  sku: "KOP-001",
  categoryId: "cat-1",
  price: 15000,
  cost: 8000,
  stock: 3,
  lowStockThreshold: 2,
  isActive: true,
};

const mockProductB: Product = {
  id: "prod-b",
  name: "Roti Bakar",
  sku: "ROT-001",
  categoryId: "cat-2",
  price: 12000,
  cost: 6000,
  stock: 1,
  lowStockThreshold: 1,
  isActive: true,
};

const mockOutOfStock: Product = {
  id: "prod-c",
  name: "Es Teh Manis",
  sku: "TEH-001",
  categoryId: "cat-1",
  price: 5000,
  cost: 2000,
  stock: 0,
  lowStockThreshold: 5,
  isActive: true,
};

describe("useCartStore", () => {
  beforeEach(() => {
    useCartStore.getState().clearCart();
  });

  it("initializes with empty items and zero totals", () => {
    const state = useCartStore.getState();
    expect(state.items).toHaveLength(0);
    expect(state.itemCount).toBe(0);
    expect(state.totals).toEqual({ subtotal: 0, discount: 0, total: 0 });
    expect(state.discount).toBeNull();
  });

  it("adds an item to cart and calculates line total", () => {
    const success = useCartStore.getState().addItem(mockProductA);
    expect(success).toBe(true);

    const state = useCartStore.getState();
    expect(state.items).toHaveLength(1);
    expect(state.items[0].qty).toBe(1);
    expect(state.items[0].subtotal).toBe(15000);
    expect(state.totals.subtotal).toBe(15000);
    expect(state.totals.total).toBe(15000);
    expect(state.itemCount).toBe(1);
  });

  it("increments quantity on duplicate add and updates totals", () => {
    useCartStore.getState().addItem(mockProductA);
    useCartStore.getState().addItem(mockProductA);

    const state = useCartStore.getState();
    expect(state.items).toHaveLength(1);
    expect(state.items[0].qty).toBe(2);
    expect(state.items[0].subtotal).toBe(30000);
    expect(state.totals.subtotal).toBe(30000);
    expect(state.itemCount).toBe(2);
  });

  it("does not allow quantity to exceed available stock", () => {
    // mockProductA stock is 3
    expect(useCartStore.getState().addItem(mockProductA)).toBe(true); // qty 1
    expect(useCartStore.getState().addItem(mockProductA)).toBe(true); // qty 2
    expect(useCartStore.getState().addItem(mockProductA)).toBe(true); // qty 3
    // 4th add should fail
    expect(useCartStore.getState().addItem(mockProductA)).toBe(false);

    expect(useCartStore.getState().items[0].qty).toBe(3);

    // Direct increment should also fail at stock limit
    expect(useCartStore.getState().increment(mockProductA.id)).toBe(false);
    expect(useCartStore.getState().items[0].qty).toBe(3);
  });

  it("does not allow adding out of stock product", () => {
    expect(useCartStore.getState().addItem(mockOutOfStock)).toBe(false);
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it("decrements quantity and removes item when decremented below 1", () => {
    useCartStore.getState().addItem(mockProductA);
    useCartStore.getState().addItem(mockProductA); // qty 2

    useCartStore.getState().decrement(mockProductA.id); // qty 1
    expect(useCartStore.getState().items[0].qty).toBe(1);
    expect(useCartStore.getState().totals.total).toBe(15000);

    useCartStore.getState().decrement(mockProductA.id); // removes item
    expect(useCartStore.getState().items).toHaveLength(0);
    expect(useCartStore.getState().totals.total).toBe(0);
  });

  it("removes item directly using removeItem", () => {
    useCartStore.getState().addItem(mockProductA);
    useCartStore.getState().addItem(mockProductB);

    expect(useCartStore.getState().items).toHaveLength(2);
    useCartStore.getState().removeItem(mockProductA.id);

    expect(useCartStore.getState().items).toHaveLength(1);
    expect(useCartStore.getState().items[0].product.id).toBe(mockProductB.id);
    expect(useCartStore.getState().totals.total).toBe(12000);
  });

  it("clears all items and discount on clearCart", () => {
    useCartStore.getState().addItem(mockProductA);
    useCartStore.getState().setDiscount({ type: "nominal", value: 5000 });

    useCartStore.getState().clearCart();
    const state = useCartStore.getState();
    expect(state.items).toHaveLength(0);
    expect(state.discount).toBeNull();
    expect(state.totals).toEqual({ subtotal: 0, discount: 0, total: 0 });
    expect(state.itemCount).toBe(0);
  });

  it("calculates nominal discount correctly matching calculateTotals", () => {
    useCartStore.getState().addItem(mockProductA); // 15000
    useCartStore.getState().addItem(mockProductB); // 12000
    // subtotal = 27000

    useCartStore.getState().setDiscount({ type: "nominal", value: 5000 });

    const state = useCartStore.getState();
    const expected = calculateTotals(
      [
        { price: 15000, qty: 1 },
        { price: 12000, qty: 1 },
      ],
      { type: "nominal", value: 5000 }
    );

    expect(state.totals).toEqual(expected);
    expect(state.totals.subtotal).toBe(27000);
    expect(state.totals.discount).toBe(5000);
    expect(state.totals.total).toBe(22000);
  });

  it("calculates percentage discount correctly matching calculateTotals", () => {
    useCartStore.getState().addItem(mockProductA); // 15000
    useCartStore.getState().addItem(mockProductA); // 15000
    // subtotal = 30000

    useCartStore.getState().setDiscount({ type: "percent", value: 10 }); // 10% = 3000

    const state = useCartStore.getState();
    const expected = calculateTotals([{ price: 15000, qty: 2 }], {
      type: "percent",
      value: 10,
    });

    expect(state.totals).toEqual(expected);
    expect(state.totals.subtotal).toBe(30000);
    expect(state.totals.discount).toBe(3000);
    expect(state.totals.total).toBe(27000);
  });
});

import { describe, expect, it } from "vitest";
import {
  buildInvoiceNo,
  calculateChange,
  calculateTotals,
  getDailyCounterKey,
} from "./transactions";

describe("calculateTotals", () => {
  it("calculates subtotal correctly without discount", () => {
    const items = [
      { price: 15000, qty: 2 },
      { price: 22000, qty: 1 },
    ];
    const result = calculateTotals(items);
    expect(result.subtotal).toBe(52000);
    expect(result.discount).toBe(0);
    expect(result.total).toBe(52000);
  });

  it("applies nominal discount capped at subtotal", () => {
    const items = [{ price: 50000, qty: 1 }];
    const normalDiscount = calculateTotals(items, { type: "nominal", value: 10000 });
    expect(normalDiscount.discount).toBe(10000);
    expect(normalDiscount.total).toBe(40000);

    const excessiveDiscount = calculateTotals(items, { type: "nominal", value: 60000 });
    expect(excessiveDiscount.discount).toBe(50000);
    expect(excessiveDiscount.total).toBe(0);
  });

  it("applies percentage discount rounded to integer Rupiah", () => {
    const items = [{ price: 33333, qty: 1 }];
    const result = calculateTotals(items, { type: "percent", value: 10 });
    expect(result.discount).toBe(3333);
    expect(result.total).toBe(30000);
  });

  it("handles empty items array", () => {
    const result = calculateTotals([]);
    expect(result.subtotal).toBe(0);
    expect(result.discount).toBe(0);
    expect(result.total).toBe(0);
  });
});

describe("calculateChange", () => {
  it("calculates correct change for sufficient payment", () => {
    const result = calculateChange(47000, 50000);
    expect(result.isSufficient).toBe(true);
    expect(result.change).toBe(3000);
  });

  it("handles exact payment", () => {
    const result = calculateChange(47000, 47000);
    expect(result.isSufficient).toBe(true);
    expect(result.change).toBe(0);
  });

  it("detects insufficient payment", () => {
    const result = calculateChange(47000, 45000);
    expect(result.isSufficient).toBe(false);
    expect(result.change).toBe(0);
  });
});

describe("buildInvoiceNo and getDailyCounterKey", () => {
  it("formats daily counter key correctly", () => {
    const date = new Date(2026, 9, 9); // Oct 9, 2026
    expect(getDailyCounterKey(date)).toBe("INV-20261009");
  });

  it("formats invoice number with 4-digit sequence", () => {
    const date = new Date(2026, 9, 9);
    expect(buildInvoiceNo(date, 1)).toBe("INV-20261009-0001");
    expect(buildInvoiceNo(date, 42)).toBe("INV-20261009-0042");
    expect(buildInvoiceNo(date, 1250)).toBe("INV-20261009-1250");
  });
});

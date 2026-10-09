import { describe, expect, it } from "vitest";
import { getQuickAmounts } from "./paymentUtils";

describe("paymentUtils", () => {
  it("returns [0] for total <= 0", () => {
    expect(getQuickAmounts(0)).toEqual([0]);
    expect(getQuickAmounts(-1000)).toEqual([0]);
  });

  it("returns exact amount and sensible banknote bill ceilings for 47.000", () => {
    const amounts = getQuickAmounts(47000);
    // Should include 47000, 50000, 100000
    expect(amounts[0]).toBe(47000);
    expect(amounts).toContain(50000);
    expect(amounts).toContain(100000);
    expect(amounts.every((a) => a >= 47000)).toBe(true);
  });

  it("returns exact amount and bill ceilings for 22.000", () => {
    const amounts = getQuickAmounts(22000);
    expect(amounts[0]).toBe(22000);
    expect(amounts).toContain(25000);
    expect(amounts).toContain(30000);
    expect(amounts).toContain(50000);
  });

  it("returns exact amount for 50.000 with next 100.000", () => {
    const amounts = getQuickAmounts(50000);
    expect(amounts[0]).toBe(50000);
    expect(amounts).toContain(100000);
  });
});

/**
 * Pure functions for POS transaction calculations and invoice generation.
 * All amounts are integer Rupiah.
 */

export type DiscountType = "nominal" | "percent";

export interface DiscountInput {
  type: DiscountType;
  value: number;
}

export interface TotalsItem {
  price: number;
  qty: number;
}

export interface TotalsResult {
  subtotal: number;
  discount: number;
  total: number;
}

/**
 * Calculates subtotal, discount amount, and final total.
 * - subtotal: sum of (price * qty)
 * - discount: nominal (capped at subtotal) or percent (rounded to integer Rupiah)
 * - total: subtotal - discount (never negative)
 */
export function calculateTotals(items: TotalsItem[], discount?: DiscountInput): TotalsResult {
  const subtotal = items.reduce((sum, item) => {
    const itemPrice = Math.round(item.price);
    const itemQty = Math.round(item.qty);
    return sum + itemPrice * itemQty;
  }, 0);

  let discountAmount = 0;
  if (discount && discount.value > 0) {
    if (discount.type === "nominal") {
      discountAmount = Math.min(Math.round(discount.value), subtotal);
    } else if (discount.type === "percent") {
      const percentage = Math.min(100, Math.max(0, discount.value));
      discountAmount = Math.round((subtotal * percentage) / 100);
    }
  }

  const total = Math.max(0, subtotal - discountAmount);

  return {
    subtotal,
    discount: discountAmount,
    total,
  };
}

/**
 * Calculates change from payment.
 */
export function calculateChange(
  total: number,
  amountPaid: number
): { change: number; isSufficient: boolean } {
  const roundedTotal = Math.max(0, Math.round(total));
  const roundedPaid = Math.max(0, Math.round(amountPaid));

  const isSufficient = roundedPaid >= roundedTotal;
  const change = isSufficient ? roundedPaid - roundedTotal : 0;

  return {
    change,
    isSufficient,
  };
}

/**
 * Generates the counter key for a given date: e.g. "INV-20261009"
 */
export function getDailyCounterKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `INV-${year}${month}${day}`;
}

/**
 * Generates the invoice number string from a date and daily sequence.
 * Format: INV-YYYYMMDD-0001
 */
export function buildInvoiceNo(date: Date, seq: number): string {
  const prefix = getDailyCounterKey(date);
  const sequenceStr = String(Math.max(1, Math.round(seq))).padStart(4, "0");
  return `${prefix}-${sequenceStr}`;
}

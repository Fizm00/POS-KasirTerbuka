import { describe, expect, it } from "vitest";
import { buildReceiptModel, padCenter, padTwoColumns } from "./receipt";
import type { StoreSettings, Transaction } from "../db/schema";

const mockSettings: StoreSettings = {
  id: "default",
  storeName: "Toko Berkah",
  address: "Jl. Mawar No. 12, Magelang",
  phone: "0812-3456-7890",
  receiptFooter: "Terima kasih, sampai\njumpa lagi!",
  paperWidth: 58,
  currency: "IDR",
};

const mockTransaction: Transaction = {
  id: "tx-sample-01",
  invoiceNo: "INV-20261009-0012",
  cashierId: "cashier-01",
  createdAt: "2026-10-09T14:32:00.000Z",
  items: [
    {
      productId: "prod-1",
      name: "Kopi Susu Gula Aren",
      sku: "KOP-001",
      price: 15000,
      cost: 8000,
      qty: 2,
      subtotal: 30000,
    },
    {
      productId: "prod-2",
      name: "Nasi Goreng Spesial",
      sku: "NAS-001",
      price: 22000,
      cost: 12000,
      qty: 1,
      subtotal: 22000,
    },
  ],
  subtotal: 52000,
  discount: 5000,
  total: 47000,
  paymentMethod: "cash",
  amountPaid: 50000,
  change: 3000,
  status: "completed",
};

describe("receipt model builder", () => {
  it("pads center correctly", () => {
    const centered = padCenter("Toko Berkah", 32);
    expect(centered.length).toBe(32);
    expect(centered.trim()).toBe("Toko Berkah");
  });

  it("pads two columns correctly to exact width", () => {
    const line = padTwoColumns("Subtotal", "52.000", 32);
    expect(line.length).toBe(32);
    expect(line.startsWith("Subtotal")).toBe(true);
    expect(line.endsWith("52.000")).toBe(true);
  });

  it("builds 58mm (32 chars) receipt matching snapshot structure", () => {
    const model = buildReceiptModel({
      transaction: mockTransaction,
      settings: mockSettings,
      cashierName: "Rina",
      paperWidth: 58,
    });

    expect(model.paperWidth).toBe(58);
    expect(model.columnWidth).toBe(32);

    // Verify each line is within 32 characters
    const lines = model.rawText.split("\n");
    for (const line of lines) {
      expect(line.length).toBeLessThanOrEqual(32);
    }

    expect(model.rawText).toContain("Toko Berkah");
    expect(model.rawText).toContain("INV-20261009-0012");
    expect(model.rawText).toContain("Kasir: Rina");
    expect(model.rawText).toContain("Kopi Susu Gula Aren");
    expect(model.rawText).toContain("2 x 15.000");
    expect(model.rawText).toContain("30.000");
    expect(model.rawText).toContain("Subtotal");
    expect(model.rawText).toContain("Diskon");
    expect(model.rawText).toContain("TOTAL");
    expect(model.rawText).toContain("47.000");
    expect(model.rawText).toContain("Tunai");
    expect(model.rawText).toContain("Kembalian");
    expect(model.rawText).toContain("Terima kasih, sampai");

    expect(model.rawText).toMatchSnapshot();
  });

  it("builds 80mm (48 chars) receipt matching snapshot structure", () => {
    const model = buildReceiptModel({
      transaction: mockTransaction,
      settings: { ...mockSettings, paperWidth: 80 },
      cashierName: "Rina",
      paperWidth: 80,
    });

    expect(model.paperWidth).toBe(80);
    expect(model.columnWidth).toBe(48);

    const lines = model.rawText.split("\n");
    for (const line of lines) {
      expect(line.length).toBeLessThanOrEqual(48);
    }

    expect(model.rawText).toContain("Toko Berkah");
    expect(model.rawText).toContain("INV-20261009-0012");
    expect(model.rawText).toMatchSnapshot();
  });
});

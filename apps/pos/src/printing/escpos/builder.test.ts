import { describe, expect, it } from "vitest";
import { buildReceiptModel } from "../receipt";
import { buildEscPosBytes, buildCashDrawerBytes, buildTestPrintBytes } from "./builder";
import type { StoreSettings, Transaction } from "../../db/schema";

describe("ESC/POS Byte Builder", () => {
  const sampleSettings: StoreSettings = {
    id: "default",
    storeName: "Toko Berkah",
    address: "Jl. Mawar No. 12, Magelang",
    phone: "0812-3456-7890",
    receiptFooter: "Terima kasih, sampai jumpa lagi!",
    paperWidth: 58,
    currency: "IDR",
  };

  const sampleTransaction: Transaction = {
    id: "tx-sample-01",
    invoiceNo: "INV-20261009-0012",
    cashierId: "u-1",
    items: [
      {
        productId: "p-1",
        name: "Kopi Susu Gula Aren",
        sku: "KOP-01",
        price: 15000,
        cost: 9000,
        qty: 2,
        subtotal: 30000,
      },
      {
        productId: "p-2",
        name: "Nasi Goreng Spesial",
        sku: "NAS-01",
        price: 22000,
        cost: 13000,
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
    createdAt: "2026-10-09T07:32:00.000Z",
  };

  it("builds correct ESC/POS bytes for 58mm receipt and matches snapshot", () => {
    const receipt58 = buildReceiptModel({
      transaction: sampleTransaction,
      settings: sampleSettings,
      cashierName: "Rina",
      paperWidth: 58,
    });

    const bytes = buildEscPosBytes(receipt58, {
      codepage: 0,
      openCashDrawer: true,
      cut: true,
    });

    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(bytes.length).toBeGreaterThan(100);

    // Initial ESC @ sequence
    expect(bytes[0]).toBe(0x1b);
    expect(bytes[1]).toBe(0x40);

    // Snapshot byte array values
    expect(Array.from(bytes)).toMatchSnapshot();
  });

  it("builds correct ESC/POS bytes for 80mm receipt and matches snapshot", () => {
    const settings80: StoreSettings = {
      ...sampleSettings,
      paperWidth: 80,
    };

    const receipt80 = buildReceiptModel({
      transaction: sampleTransaction,
      settings: settings80,
      cashierName: "Rina",
      paperWidth: 80,
    });

    const bytes = buildEscPosBytes(receipt80, {
      codepage: 0,
      openCashDrawer: false,
      cut: true,
    });

    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(bytes.length).toBeGreaterThan(100);

    // Initial ESC @ sequence
    expect(bytes[0]).toBe(0x1b);
    expect(bytes[1]).toBe(0x40);

    // Snapshot byte array values
    expect(Array.from(bytes)).toMatchSnapshot();
  });

  it("builds cash drawer kick pulse bytes correctly", () => {
    const drawerBytes = buildCashDrawerBytes();
    // INIT (0x1B, 0x40) + DRAWER_PULSE_PIN2 (0x1B, 0x70, 0x00, 0x19, 0x7D)
    expect(drawerBytes).toEqual(new Uint8Array([0x1b, 0x40, 0x1b, 0x70, 0x00, 0x19, 0x7d]));
  });

  it("builds test print bytes with cut command", () => {
    const testBytes = buildTestPrintBytes(58, "Warung Uji");
    expect(testBytes).toBeInstanceOf(Uint8Array);
    expect(testBytes.length).toBeGreaterThan(50);
    // Ends with FEED_AND_PARTIAL_CUT [0x1D, 0x56, 0x41, 0x03]
    const len = testBytes.length;
    expect(testBytes[len - 4]).toBe(0x1d);
    expect(testBytes[len - 3]).toBe(0x56);
    expect(testBytes[len - 2]).toBe(0x41);
    expect(testBytes[len - 1]).toBe(0x03);
  });
});

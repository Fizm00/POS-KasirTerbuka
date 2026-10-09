import { describe, expect, it } from "vitest";
import { escapeCsvValue, generateTransactionsCsv } from "./csv";
import type { Transaction } from "../db/schema";

describe("CSV generator", () => {
  it("escapes CSV values properly per RFC 4180", () => {
    expect(escapeCsvValue("Normal text")).toBe("Normal text");
    expect(escapeCsvValue("Text with, comma")).toBe('"Text with, comma"');
    expect(escapeCsvValue('Text with "quote"')).toBe('"Text with ""quote"""');
    expect(escapeCsvValue("Line 1\nLine 2")).toBe('"Line 1\nLine 2"');
    expect(escapeCsvValue(15000)).toBe("15000");
    expect(escapeCsvValue(null)).toBe("");
  });

  it("generates correct CSV structure and content with one row per item", () => {
    const transactions: Transaction[] = [
      {
        id: "tx-1",
        invoiceNo: "INV-20261009-0001",
        cashierId: "u-1",
        items: [
          {
            productId: "p-1",
            name: 'Kopi, Susu "Spesial"',
            sku: "KOP-01",
            price: 15000,
            cost: 10000,
            qty: 2,
            subtotal: 30000,
          },
          {
            productId: "p-2",
            name: "Pisang Goreng",
            sku: "PSG-01",
            price: 10000,
            cost: 6000,
            qty: 1,
            subtotal: 10000,
          },
        ],
        subtotal: 40000,
        discount: 5000,
        total: 35000,
        paymentMethod: "cash",
        amountPaid: 40000,
        change: 5000,
        status: "completed",
        createdAt: "2026-10-09T03:00:00.000Z", // 10:00 WIB
      },
    ];

    const usersMap = new Map([["u-1", "Budi Admin"]]);
    const csv = generateTransactionsCsv(transactions, usersMap);

    // Starts with UTF-8 BOM
    expect(csv.startsWith("\uFEFF")).toBe(true);

    const lines = csv.replace("\uFEFF", "").split("\r\n");
    expect(lines).toHaveLength(3); // 1 header + 2 items

    // Header verification
    expect(lines[0]).toBe(
      "No Invoice,Waktu (WIB),Kasir,Metode Pembayaran,SKU,Nama Produk,Harga Satuan,Harga Modal,Jumlah,Subtotal Item,Laba Item,Diskon Transaksi,Total Transaksi,Status"
    );

    // Item 1 verification (has comma and quotes in name)
    expect(lines[1]).toContain("INV-20261009-0001");
    expect(lines[1]).toContain('"Kopi, Susu ""Spesial"""');
    expect(lines[1]).toContain("Budi Admin");
    expect(lines[1]).toContain("Tunai");
    expect(lines[1]).toContain("15000,10000,2,30000,10000,5000,35000,Selesai");

    // Item 2 verification
    expect(lines[2]).toContain("Pisang Goreng");
    expect(lines[2]).toContain("10000,6000,1,10000,4000,5000,35000,Selesai");
  });
});

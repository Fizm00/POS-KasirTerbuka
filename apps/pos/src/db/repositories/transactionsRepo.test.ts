import { beforeEach, describe, expect, it } from "vitest";
import { PosDatabase } from "../schema";
import {
  InsufficientStockError,
  SaleAlreadyVoidedError,
  TransactionNotFoundError,
  transactionsRepo,
} from "./transactionsRepo";

describe("transactionsRepo", () => {
  let testDb: PosDatabase;
  let sampleProductId1: string;
  let sampleProductId2: string;

  beforeEach(async () => {
    testDb = new PosDatabase(`test-tx-${crypto.randomUUID()}`);

    sampleProductId1 = crypto.randomUUID();
    sampleProductId2 = crypto.randomUUID();

    await testDb.products.bulkAdd([
      {
        id: sampleProductId1,
        name: "Kopi Susu Gula Aren",
        sku: "KOP-001",
        categoryId: "cat-1",
        price: 15000,
        cost: 8000,
        stock: 10,
        lowStockThreshold: 2,
        isActive: true,
      },
      {
        id: sampleProductId2,
        name: "Roti Bakar",
        sku: "ROT-001",
        categoryId: "cat-1",
        price: 12000,
        cost: 6000,
        stock: 5,
        lowStockThreshold: 1,
        isActive: true,
      },
    ]);
  });

  it("successfully creates a sale, decrements stock, and stores item snapshots", async () => {
    const saleDate = new Date(2026, 9, 9, 10, 0, 0); // Oct 9, 2026

    const tx = await transactionsRepo.createSale(
      {
        cashierId: "cashier-1",
        items: [
          { productId: sampleProductId1, qty: 2 },
          { productId: sampleProductId2, qty: 1 },
        ],
        paymentMethod: "cash",
        amountPaid: 50000,
        customDate: saleDate,
      },
      testDb
    );

    // Verify transaction details
    expect(tx.status).toBe("completed");
    expect(tx.invoiceNo).toBe("INV-20261009-0001");
    expect(tx.subtotal).toBe(42000); // (15000 * 2) + (12000 * 1)
    expect(tx.total).toBe(42000);
    expect(tx.amountPaid).toBe(50000);
    expect(tx.change).toBe(8000);
    expect(tx.items).toHaveLength(2);

    // Verify snapshots
    expect(tx.items[0]).toEqual({
      productId: sampleProductId1,
      name: "Kopi Susu Gula Aren",
      sku: "KOP-001",
      price: 15000,
      cost: 8000,
      qty: 2,
      subtotal: 30000,
    });

    // Verify stock decrements in DB
    const p1 = await testDb.products.get(sampleProductId1);
    const p2 = await testDb.products.get(sampleProductId2);
    expect(p1?.stock).toBe(8); // 10 - 2
    expect(p2?.stock).toBe(4); // 5 - 1
  });

  it("aborts the whole sale and leaves stock untouched when stock is insufficient", async () => {
    const saleDate = new Date(2026, 9, 9, 10, 0, 0);

    await expect(
      transactionsRepo.createSale(
        {
          cashierId: "cashier-1",
          items: [
            { productId: sampleProductId1, qty: 2 }, // valid (has 10)
            { productId: sampleProductId2, qty: 10 }, // invalid (only has 5)
          ],
          paymentMethod: "cash",
          amountPaid: 150000,
          customDate: saleDate,
        },
        testDb
      )
    ).rejects.toThrow(InsufficientStockError);

    // Stocks must be COMPLETELY untouched
    const p1 = await testDb.products.get(sampleProductId1);
    const p2 = await testDb.products.get(sampleProductId2);
    expect(p1?.stock).toBe(10);
    expect(p2?.stock).toBe(5);

    // No transaction or counter saved
    const txCount = await testDb.transactions.count();
    expect(txCount).toBe(0);
  });

  it("handles two competing sales for the last unit (only one succeeds, stock reaches 0)", async () => {
    // Set stock to exactly 1
    await testDb.products.update(sampleProductId1, { stock: 1 });

    const sale1 = transactionsRepo.createSale(
      {
        cashierId: "cashier-1",
        items: [{ productId: sampleProductId1, qty: 1 }],
        paymentMethod: "cash",
        amountPaid: 15000,
      },
      testDb
    );

    const sale2 = transactionsRepo.createSale(
      {
        cashierId: "cashier-2",
        items: [{ productId: sampleProductId1, qty: 1 }],
        paymentMethod: "cash",
        amountPaid: 15000,
      },
      testDb
    );

    const results = await Promise.allSettled([sale1, sale2]);

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);

    const remainingProduct = await testDb.products.get(sampleProductId1);
    expect(remainingProduct?.stock).toBe(0);
  });

  it("increments daily invoice sequence per day and resets on another day", async () => {
    const day1 = new Date(2026, 9, 9);
    const day2 = new Date(2026, 9, 10);

    const tx1 = await transactionsRepo.createSale(
      {
        cashierId: "cashier-1",
        items: [{ productId: sampleProductId1, qty: 1 }],
        paymentMethod: "cash",
        amountPaid: 15000,
        customDate: day1,
      },
      testDb
    );

    const tx2 = await transactionsRepo.createSale(
      {
        cashierId: "cashier-1",
        items: [{ productId: sampleProductId1, qty: 1 }],
        paymentMethod: "cash",
        amountPaid: 15000,
        customDate: day1,
      },
      testDb
    );

    const tx3 = await transactionsRepo.createSale(
      {
        cashierId: "cashier-1",
        items: [{ productId: sampleProductId1, qty: 1 }],
        paymentMethod: "cash",
        amountPaid: 15000,
        customDate: day2,
      },
      testDb
    );

    expect(tx1.invoiceNo).toBe("INV-20261009-0001");
    expect(tx2.invoiceNo).toBe("INV-20261009-0002");
    expect(tx3.invoiceNo).toBe("INV-20261010-0001");
  });

  it("voids a sale and restores stock exactly once; rejects second void", async () => {
    const sale = await transactionsRepo.createSale(
      {
        cashierId: "cashier-1",
        items: [{ productId: sampleProductId1, qty: 3 }],
        paymentMethod: "cash",
        amountPaid: 45000,
      },
      testDb
    );

    expect((await testDb.products.get(sampleProductId1))?.stock).toBe(7); // 10 - 3

    // First void
    const voidedTx = await transactionsRepo.voidSale(
      sale.id,
      {
        voidedBy: "admin-1",
        voidReason: "Salah input jumlah",
      },
      testDb
    );

    expect(voidedTx.status).toBe("void");
    expect(voidedTx.voidedBy).toBe("admin-1");
    expect(voidedTx.voidReason).toBe("Salah input jumlah");
    expect(voidedTx.voidedAt).toBeDefined();

    // Stock must be restored back to 10
    expect((await testDb.products.get(sampleProductId1))?.stock).toBe(10);

    // Second void must be rejected and stock must stay at 10 (not double restored)
    await expect(
      transactionsRepo.voidSale(
        sale.id,
        {
          voidedBy: "admin-1",
          voidReason: "Coba void lagi",
        },
        testDb
      )
    ).rejects.toThrow(SaleAlreadyVoidedError);

    expect((await testDb.products.get(sampleProductId1))?.stock).toBe(10);
  });

  it("throws TransactionNotFoundError when voiding non-existent sale", async () => {
    await expect(
      transactionsRepo.voidSale("non-existent-id", { voidedBy: "admin-1" }, testDb)
    ).rejects.toThrow(TransactionNotFoundError);
  });
});

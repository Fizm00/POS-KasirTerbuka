import { beforeEach, describe, expect, it } from "vitest";
import { PosDatabase } from "../schema";
import { transactionsRepo } from "./transactionsRepo";
import { reportsRepo } from "./reportsRepo";

describe("reportsRepo", () => {
  let testDb: PosDatabase;
  let p1Id: string;
  let p2Id: string;

  beforeEach(async () => {
    testDb = new PosDatabase(`test-rep-${crypto.randomUUID()}`);
    p1Id = crypto.randomUUID();
    p2Id = crypto.randomUUID();

    await testDb.products.bulkAdd([
      {
        id: p1Id,
        name: "Kopi Susu",
        sku: "KOP-001",
        categoryId: "cat-1",
        price: 15000,
        cost: 10000, // profit per item: 5000
        stock: 50,
        lowStockThreshold: 5,
        isActive: true,
      },
      {
        id: p2Id,
        name: "Nasi Goreng",
        sku: "NAS-001",
        categoryId: "cat-1",
        price: 20000,
        cost: 12000, // profit per item: 8000
        stock: 50,
        lowStockThreshold: 5,
        isActive: true,
      },
    ]);
  });

  it("calculates summary, top products, and daily sales while strictly excluding void transactions", async () => {
    const day1 = new Date("2026-10-08T12:00:00Z");
    const day2 = new Date("2026-10-09T14:00:00Z");

    // Sale 1: completed, Day 1
    // 2 Kopi (rev 30000, cost 20000, profit 10000)
    await transactionsRepo.createSale(
      {
        cashierId: "cashier-1",
        items: [{ productId: p1Id, qty: 2 }],
        paymentMethod: "cash",
        amountPaid: 30000,
        customDate: day1,
      },
      testDb
    );

    // Sale 2: completed, Day 2
    // 1 Kopi (rev 15000, profit 5000) + 2 Nasi Goreng (rev 40000, profit 16000)
    // subtotal 55000, discount 5000 -> total 50000, profit: (5000 + 16000) - 5000 = 16000
    await transactionsRepo.createSale(
      {
        cashierId: "cashier-1",
        items: [
          { productId: p1Id, qty: 1 },
          { productId: p2Id, qty: 2 },
        ],
        discount: { type: "nominal", value: 5000 },
        paymentMethod: "cash",
        amountPaid: 50000,
        customDate: day2,
      },
      testDb
    );

    // Sale 3: completed then VOIDED, Day 2
    // 5 Nasi Goreng (rev 100000)
    const sale3 = await transactionsRepo.createSale(
      {
        cashierId: "cashier-1",
        items: [{ productId: p2Id, qty: 5 }],
        paymentMethod: "cash",
        amountPaid: 100000,
        customDate: day2,
      },
      testDb
    );

    await transactionsRepo.voidSale(
      sale3.id,
      { voidedBy: "admin-1", voidReason: "Salah input" },
      testDb
    );

    // 1. Verify Summary
    const summary = await reportsRepo.getSummary(undefined, testDb);
    expect(summary.transactionCount).toBe(2); // Sale 1 and Sale 2 (Sale 3 is excluded)
    expect(summary.totalSales).toBe(80000); // 30000 + 50000
    expect(summary.averagePerTransaction).toBe(40000); // 80000 / 2
    expect(summary.grossProfit).toBe(26000); // 10000 + 16000

    // 2. Verify Top Products
    const topProducts = await reportsRepo.getTopProducts(undefined, 10, testDb);
    expect(topProducts).toHaveLength(2);
    // Kopi sold: 2 in sale1 + 1 in sale2 = 3 units, rev = 30000 + 15000 = 45000
    // Nasi sold: 2 in sale2 = 2 units, rev = 40000 (sale3's 5 units are excluded!)
    expect(topProducts[0]).toEqual({
      productId: p1Id,
      name: "Kopi Susu",
      sku: "KOP-001",
      unitsSold: 3,
      revenue: 45000,
    });
    expect(topProducts[1]).toEqual({
      productId: p2Id,
      name: "Nasi Goreng",
      sku: "NAS-001",
      unitsSold: 2,
      revenue: 40000,
    });

    // 3. Verify Daily Sales
    const dailySales = await reportsRepo.getDailySales(undefined, testDb);
    expect(dailySales).toHaveLength(2);
    expect(dailySales[0]).toEqual({
      date: "2026-10-08",
      totalSales: 30000,
      transactionCount: 1,
    });
    expect(dailySales[1]).toEqual({
      date: "2026-10-09",
      totalSales: 50000,
      transactionCount: 1,
    });
  });

  it("handles empty range gracefully", async () => {
    const summary = await reportsRepo.getSummary(undefined, testDb);
    expect(summary).toEqual({
      totalSales: 0,
      transactionCount: 0,
      averagePerTransaction: 0,
      grossProfit: 0,
    });

    const top = await reportsRepo.getTopProducts(undefined, 5, testDb);
    expect(top).toEqual([]);

    const daily = await reportsRepo.getDailySales(undefined, testDb);
    expect(daily).toEqual([]);
  });

  it("groups daily sales using Asia/Jakarta day boundaries for 23:30 and 00:30 WIB sales", async () => {
    // 2026-10-09 23:30 WIB -> 2026-10-09 16:30 UTC
    const date2330Wib = new Date("2026-10-09T16:30:00.000Z");
    // 2026-10-10 00:30 WIB -> 2026-10-09 17:30 UTC (same UTC date, but different Jakarta date!)
    const date0030Wib = new Date("2026-10-09T17:30:00.000Z");

    await transactionsRepo.createSale(
      {
        cashierId: "cashier-1",
        items: [{ productId: p1Id, qty: 1 }],
        paymentMethod: "cash",
        amountPaid: 15000,
        customDate: date2330Wib,
      },
      testDb
    );

    await transactionsRepo.createSale(
      {
        cashierId: "cashier-1",
        items: [{ productId: p1Id, qty: 2 }],
        paymentMethod: "cash",
        amountPaid: 30000,
        customDate: date0030Wib,
      },
      testDb
    );

    const dailySales = await reportsRepo.getDailySales(undefined, testDb);
    expect(dailySales).toHaveLength(2);
    expect(dailySales[0]).toEqual({
      date: "2026-10-09",
      totalSales: 15000,
      transactionCount: 1,
    });
    expect(dailySales[1]).toEqual({
      date: "2026-10-10",
      totalSales: 30000,
      transactionCount: 1,
    });
  });
});

import { describe, expect, it } from "vitest";
import Dexie from "dexie";
import { PosDatabase, type Product, type Transaction } from "./schema";
import { reportsRepo } from "./repositories/reportsRepo";

describe("Performance & Scale Benchmark (5,000 products, 50,000 transactions)", () => {
  it("searches 5,000 products under 100ms and calculates reports over 50,000 transactions in <3s", async () => {
    const dbName = `PerfBenchDB_${Date.now()}`;
    const benchDb = new PosDatabase(dbName);
    await benchDb.open();

    // 1. Seed 5,000 products in bulk
    const products: Product[] = [];
    const categories = ["cat-sembako", "cat-minuman", "cat-makanan", "cat-kebersihan", "cat-rokok"];

    for (let i = 1; i <= 5000; i++) {
      const cat = categories[i % categories.length];
      products.push({
        id: `prod-${i}`,
        name: `Produk Toko Serba Ada Nomor ${i}`,
        sku: `SKU-${String(i).padStart(6, "0")}`,
        categoryId: cat,
        price: 10000 + (i % 50) * 1000,
        cost: 8000 + (i % 50) * 800,
        stock: (i % 100) + 1,
        lowStockThreshold: 5,
        isActive: i % 100 !== 0, // 99% active
      });
    }

    await benchDb.products.bulkAdd(products);
    const productCount = await benchDb.products.count();
    expect(productCount).toBe(5000);

    // --- Benchmark Product Search ---
    const activeProducts = await benchDb.products.filter((p) => p.isActive).toArray();
    const searchQuery = "nomor 4821";

    const startSearch = performance.now();
    const searchResults = activeProducts.filter(
      (p) => p.name.toLowerCase().includes(searchQuery) || p.sku.toLowerCase().includes(searchQuery)
    );
    const searchDuration = performance.now() - startSearch;

    // Requirement: Search must complete in under 100ms
    expect(searchDuration).toBeLessThan(100);
    expect(searchResults.length).toBeGreaterThanOrEqual(1);

    // 2. Seed 50,000 transactions in batches of 5,000
    const totalTxCount = 50000;
    const batchSize = 5000;
    const baseDate = new Date("2026-10-01T00:00:00.000Z").getTime();

    for (let batch = 0; batch < totalTxCount / batchSize; batch++) {
      const txBatch: Transaction[] = [];
      for (let i = 0; i < batchSize; i++) {
        const index = batch * batchSize + i;
        // Distribute across 30 days
        const txTime = new Date(
          baseDate + (index % 30) * 86400000 + (index % 86400000)
        ).toISOString();
        const isVoid = index % 50 === 0; // 2% voided

        txBatch.push({
          id: `tx-${index}`,
          invoiceNo: `INV-202610${String((index % 30) + 1).padStart(2, "0")}-${String(index).padStart(4, "0")}`,
          cashierId: index % 2 === 0 ? "usr-admin" : "usr-kasir",
          items: [
            {
              productId: `prod-${(index % 5000) + 1}`,
              name: `Produk ${(index % 5000) + 1}`,
              sku: `SKU-${String((index % 5000) + 1).padStart(6, "0")}`,
              price: 15000,
              cost: 12000,
              qty: (index % 3) + 1,
              subtotal: 15000 * ((index % 3) + 1),
            },
          ],
          subtotal: 15000 * ((index % 3) + 1),
          discount: 0,
          total: 15000 * ((index % 3) + 1),
          paymentMethod: index % 3 === 0 ? "cash" : index % 3 === 1 ? "qris" : "transfer",
          amountPaid: 20000 * ((index % 3) + 1),
          change: 5000 * ((index % 3) + 1),
          status: isVoid ? "void" : "completed",
          createdAt: txTime,
        });
      }
      await benchDb.transactions.bulkAdd(txBatch);
    }

    const txCount = await benchDb.transactions.count();
    expect(txCount).toBe(50000);

    // --- Benchmark Reports Calculation ---
    // Query 7-day range report using compound index
    const startReport = performance.now();
    const reportRange = {
      startDate: "2026-10-05T00:00:00.000Z",
      endDate: "2026-10-12T23:59:59.999Z",
    };

    const summary = await reportsRepo.getSummary(reportRange, benchDb);
    const topProducts = await reportsRepo.getTopProducts(reportRange, 10, benchDb);
    const reportDuration = performance.now() - startReport;

    // Requirement: Reports calculation must finish within a few seconds (<3000ms)
    expect(reportDuration).toBeLessThan(3000);
    expect(summary.transactionCount).toBeGreaterThan(0);
    expect(summary.totalSales).toBeGreaterThan(0);
    expect(summary.grossProfit).toBeGreaterThan(0);
    expect(topProducts.length).toBeGreaterThan(0);

    // Clean up
    benchDb.close();
    await Dexie.delete(dbName);
  }, 45000); // Test timeout budget
});

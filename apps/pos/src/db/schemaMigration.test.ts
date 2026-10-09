import { describe, expect, it } from "vitest";
import Dexie from "dexie";
import { PosDatabase } from "./schema";

describe("Dexie Schema Migration", () => {
  it("upgrades database from version 1 to version 2 and preserves existing data", async () => {
    const dbName = `MigrationTestDB_${Date.now()}`;

    // 1. Create and populate a database at Version 1
    const v1Db = new Dexie(dbName);
    v1Db.version(1).stores({
      settings: "id",
      users: "id, role, isActive",
      categories: "id, name",
      products: "id, &sku, name, categoryId, isActive",
      transactions: "id, &invoiceNo, cashierId, status, createdAt",
      counters: "id",
    });

    await v1Db.open();

    const sampleProductId = "prod-v1-001";
    await v1Db.table("products").add({
      id: sampleProductId,
      name: "Beras Rojolele 5kg",
      sku: "BRS-5KG",
      categoryId: "cat-sembako",
      price: 75000,
      cost: 65000,
      stock: 20,
      lowStockThreshold: 5,
      isActive: true,
    });

    const sampleTxId = "tx-v1-001";
    await v1Db.table("transactions").add({
      id: sampleTxId,
      invoiceNo: "INV-20261009-0001",
      cashierId: "usr-admin-1",
      items: [
        {
          productId: sampleProductId,
          name: "Beras Rojolele 5kg",
          sku: "BRS-5KG",
          price: 75000,
          cost: 65000,
          qty: 1,
          subtotal: 75000,
        },
      ],
      subtotal: 75000,
      discount: 0,
      total: 75000,
      paymentMethod: "cash",
      amountPaid: 80000,
      change: 5000,
      status: "completed",
      createdAt: "2026-10-09T08:00:00.000Z",
    });

    // Close Version 1 DB
    v1Db.close();

    // 2. Open using the app's PosDatabase (which defines version 2)
    const upgradedDb = new PosDatabase(dbName);
    await upgradedDb.open();

    expect(upgradedDb.verno).toBe(2);

    // Verify existing data is preserved
    const product = await upgradedDb.products.get(sampleProductId);
    expect(product).toBeDefined();
    expect(product?.name).toBe("Beras Rojolele 5kg");

    const transaction = await upgradedDb.transactions.get(sampleTxId);
    expect(transaction).toBeDefined();
    expect(transaction?.total).toBe(75000);

    // Verify querying with the new compound index
    const compoundResults = await upgradedDb.transactions
      .where("[status+createdAt]")
      .between(["completed", "2026-10-09T00:00:00.000Z"], ["completed", "2026-10-09T23:59:59.999Z"], true, true)
      .toArray();

    expect(compoundResults.length).toBe(1);
    expect(compoundResults[0].id).toBe(sampleTxId);

    // Clean up
    upgradedDb.close();
    await Dexie.delete(dbName);
  });
});

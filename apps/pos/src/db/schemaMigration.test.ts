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

    // 2. Open using the app's PosDatabase (which defines version 3)
    const upgradedDb = new PosDatabase(dbName);
    await upgradedDb.open();

    expect(upgradedDb.verno).toBe(5);

    // Verify existing data is preserved
    const product = await upgradedDb.products.get(sampleProductId);
    expect(product).toBeDefined();
    expect(product?.name).toBe("Beras Rojolele 5kg");

    const transaction = await upgradedDb.transactions.get(sampleTxId);
    expect(transaction).toBeDefined();
    expect(transaction?.total).toBe(75000);

    // Verify querying with the compound index
    const compoundResults = await upgradedDb.transactions
      .where("[status+createdAt]")
      .between(
        ["completed", "2026-10-09T00:00:00.000Z"],
        ["completed", "2026-10-09T23:59:59.999Z"],
        true,
        true
      )
      .toArray();

    expect(compoundResults.length).toBe(1);
    expect(compoundResults[0].id).toBe(sampleTxId);

    // Clean up
    upgradedDb.close();
    await Dexie.delete(dbName);
  });

  it("upgrades database from version 2 to version 3 with businessType = custom and all features = false", async () => {
    const dbName = `MigrationV2toV3_${Date.now()}`;

    // 1. Create a database at Version 2 with pre-existing settings
    const v2Db = new Dexie(dbName);
    v2Db.version(1).stores({
      settings: "id",
      users: "id, role, isActive",
      categories: "id, name",
      products: "id, &sku, name, categoryId, isActive",
      transactions: "id, &invoiceNo, cashierId, status, createdAt",
      counters: "id",
    });
    v2Db.version(2).stores({
      products: "id, &sku, name, categoryId, isActive, [isActive+categoryId]",
      transactions:
        "id, &invoiceNo, cashierId, status, createdAt, [status+createdAt], [cashierId+createdAt]",
    });

    await v2Db.open();

    // Populate with existing v2 store settings (without businessType or features)
    await v2Db.table("settings").add({
      id: "default",
      storeName: "Warung Bu Siti",
      address: "Jl. Malioboro No. 45",
      phone: "08123456789",
      receiptFooter: "Terima kasih!",
      paperWidth: 58,
      currency: "IDR",
      autoLockMinutes: 5,
    });

    v2Db.close();

    // 2. Open using the app's PosDatabase (which defines version 3 with upgrade)
    const upgradedDb = new PosDatabase(dbName);
    await upgradedDb.open();

    expect(upgradedDb.verno).toBe(5);

    // Verify that settings were upgraded with businessType = custom and all features = false
    const settings = await upgradedDb.settings.get("default");
    expect(settings).toBeDefined();
    expect(settings?.storeName).toBe("Warung Bu Siti");
    expect(settings?.businessType).toBe("custom");
    expect(settings?.productView).toBe("compact");
    expect(settings?.features).toBeDefined();
    expect(settings?.features?.photos).toBe(false);
    expect(settings?.features?.stockIn).toBe(false);
    expect(settings?.features?.csvImport).toBe(false);
    expect(settings?.features?.shifts).toBe(false);
    expect(settings?.features?.expenses).toBe(false);
    expect(settings?.features?.holdOrders).toBe(false);
    expect(settings?.features?.tables).toBe(false);
    expect(settings?.features?.variants).toBe(false);
    expect(settings?.features?.receivables).toBe(false);
    expect(settings?.features?.tax).toBe(false);
    expect(settings?.features?.serviceCharge).toBe(false);

    // Clean up
    upgradedDb.close();
    await Dexie.delete(dbName);
  });

  it("migrates from schema version 3 to version 4 adding productImages table", async () => {
    const dbName = `test-v3-to-v4-${crypto.randomUUID()}`;

    // 1. Create a DB simulated at version 3
    const v3Db = new Dexie(dbName);
    v3Db.version(1).stores({
      settings: "id",
      users: "id, role, isActive",
      categories: "id, name",
      products: "id, &sku, name, categoryId, isActive",
      transactions: "id, &invoiceNo, cashierId, status, createdAt",
      counters: "id",
    });
    v3Db.version(2).stores({
      products: "id, &sku, name, categoryId, isActive, [isActive+categoryId]",
      transactions:
        "id, &invoiceNo, cashierId, status, createdAt, [status+createdAt], [cashierId+createdAt]",
    });
    v3Db.version(3).stores({});

    await v3Db.open();

    // Populate with existing product
    await v3Db.table("products").add({
      id: "prod-v3",
      name: "Es Teh Manis",
      sku: "EST-01",
      categoryId: "cat-1",
      price: 5000,
      cost: 2000,
      stock: 100,
      lowStockThreshold: 10,
      isActive: true,
    });

    v3Db.close();

    // 2. Open with PosDatabase (version 4)
    const upgradedDb = new PosDatabase(dbName);
    await upgradedDb.open();

    expect(upgradedDb.verno).toBe(5);

    // Existing product untouched
    const product = await upgradedDb.products.get("prod-v3");
    expect(product).toBeDefined();
    expect(product?.name).toBe("Es Teh Manis");

    // productImages table exists and is empty
    const imageCount = await upgradedDb.productImages.count();
    expect(imageCount).toBe(0);

    // Can add product image to upgraded DB
    const imageBlob = new Blob([new Uint8Array([1, 2, 3])], { type: "image/webp" });
    await upgradedDb.productImages.add({
      id: "img-1",
      productId: "prod-v3",
      blob: imageBlob,
      mime: "image/webp",
      width: 480,
      height: 480,
      createdAt: new Date().toISOString(),
    });

    expect(await upgradedDb.productImages.count()).toBe(1);

    // Clean up
    upgradedDb.close();
    await Dexie.delete(dbName);
  });

  it("upgrades database from version 4 to version 5 and adds stockMovements table without backfilling", async () => {
    const dbName = `MigrationV4toV5_${Date.now()}`;

    // 1. Create DB at Version 4
    const v4Db = new Dexie(dbName);
    v4Db.version(1).stores({
      settings: "id",
      users: "id, role, isActive",
      categories: "id, name",
      products: "id, &sku, name, categoryId, isActive",
      transactions: "id, &invoiceNo, cashierId, status, createdAt",
      counters: "id",
    });
    v4Db.version(2).stores({
      products: "id, &sku, name, categoryId, isActive, [isActive+categoryId]",
      transactions:
        "id, &invoiceNo, cashierId, status, createdAt, [status+createdAt], [cashierId+createdAt]",
    });
    v4Db.version(3).stores({});
    v4Db.version(4).stores({
      productImages: "id, &productId, createdAt",
    });

    await v4Db.open();

    // Add existing product at v4
    await v4Db.table("products").add({
      id: "prod-v4-01",
      name: "Kopi Hitam",
      sku: "KOP-01",
      categoryId: "cat-minuman",
      price: 10000,
      cost: 4000,
      stock: 50,
      lowStockThreshold: 10,
      isActive: true,
    });

    v4Db.close();

    // 2. Open with PosDatabase (version 5)
    const upgradedDb = new PosDatabase(dbName);
    await upgradedDb.open();

    expect(upgradedDb.verno).toBe(5);

    // Existing product untouched
    const product = await upgradedDb.products.get("prod-v4-01");
    expect(product).toBeDefined();
    expect(product?.name).toBe("Kopi Hitam");
    expect(product?.stock).toBe(50);

    // stockMovements table exists, is accessible, and starts empty (no history backfilled)
    const movementCount = await upgradedDb.stockMovements.count();
    expect(movementCount).toBe(0);

    // Can record a new stock movement
    await upgradedDb.stockMovements.add({
      id: "sm-test-1",
      productId: "prod-v4-01",
      type: "in",
      qty: 25,
      resultingStock: 75,
      note: "Barang masuk supplier",
      userId: "usr-admin",
      createdAt: new Date().toISOString(),
    });

    expect(await upgradedDb.stockMovements.count()).toBe(1);
    const recorded = await upgradedDb.stockMovements.get("sm-test-1");
    expect(recorded?.qty).toBe(25);
    expect(recorded?.resultingStock).toBe(75);

    // Clean up
    upgradedDb.close();
    await Dexie.delete(dbName);
  });
});

import { beforeEach, describe, expect, it } from "vitest";
import { PosDatabase } from "../schema";
import { stockMovementsRepo } from "./stockMovementsRepo";

describe("stockMovementsRepo", () => {
  let testDb: PosDatabase;

  beforeEach(async () => {
    testDb = new PosDatabase(`StockMovementsTestDB_${Date.now()}_${Math.random()}`);
    await testDb.open();

    // Seed test products
    await testDb.products.bulkAdd([
      {
        id: "prod-1",
        name: "Kopi Hitam",
        sku: "KOP-01",
        categoryId: "cat-1",
        price: 15000,
        cost: 6000,
        stock: 20,
        lowStockThreshold: 5,
        isActive: true,
      },
      {
        id: "prod-2",
        name: "Teh Tarik",
        sku: "TEH-01",
        categoryId: "cat-1",
        price: 12000,
        cost: 5000,
        stock: 10,
        lowStockThreshold: 3,
        isActive: true,
      },
    ]);
  });

  describe("recordStockIn", () => {
    it("increments stock, updates cost if provided, and writes movement atomically", async () => {
      const movement = await stockMovementsRepo.recordStockIn(
        {
          productId: "prod-1",
          qty: 15,
          cost: 6500,
          note: "Faktur Supplier A",
          userId: "usr-admin-1",
        },
        testDb
      );

      expect(movement.id).toBeDefined();
      expect(movement.type).toBe("in");
      expect(movement.qty).toBe(15);
      expect(movement.resultingStock).toBe(35);
      expect(movement.note).toBe("Faktur Supplier A");
      expect(movement.userId).toBe("usr-admin-1");

      const product = await testDb.products.get("prod-1");
      expect(product?.stock).toBe(35);
      expect(product?.cost).toBe(6500);

      const movements = await testDb.stockMovements.toArray();
      expect(movements.length).toBe(1);
      expect(movements[0].resultingStock).toBe(35);
    });

    it("leaves cost unchanged if optional cost is not provided", async () => {
      await stockMovementsRepo.recordStockIn(
        {
          productId: "prod-1",
          qty: 5,
          userId: "usr-admin-1",
        },
        testDb
      );

      const product = await testDb.products.get("prod-1");
      expect(product?.stock).toBe(25);
      expect(product?.cost).toBe(6000); // unchanged
    });

    it("rejects invalid quantity (zero or negative)", async () => {
      await expect(
        stockMovementsRepo.recordStockIn({ productId: "prod-1", qty: 0, userId: "usr-1" }, testDb)
      ).rejects.toThrow("bilangan bulat positif");

      await expect(
        stockMovementsRepo.recordStockIn({ productId: "prod-1", qty: -5, userId: "usr-1" }, testDb)
      ).rejects.toThrow("bilangan bulat positif");
    });
  });

  describe("recordBulkStockIn", () => {
    it("updates multiple products and records movements in ONE atomic transaction", async () => {
      const movements = await stockMovementsRepo.recordBulkStockIn(
        [
          { productId: "prod-1", qty: 10, cost: 7000 },
          { productId: "prod-2", qty: 20 },
        ],
        "Pengiriman Gudang Pusat",
        "usr-admin",
        testDb
      );

      expect(movements.length).toBe(2);

      const p1 = await testDb.products.get("prod-1");
      expect(p1?.stock).toBe(30);
      expect(p1?.cost).toBe(7000);

      const p2 = await testDb.products.get("prod-2");
      expect(p2?.stock).toBe(30);
      expect(p2?.cost).toBe(5000);

      const storedMovements = await testDb.stockMovements.toArray();
      expect(storedMovements.length).toBe(2);
      expect(storedMovements[0].note).toBe("Pengiriman Gudang Pusat");
    });

    it("rolls back entirely if any product in bulk list fails", async () => {
      await expect(
        stockMovementsRepo.recordBulkStockIn(
          [
            { productId: "prod-1", qty: 10 },
            { productId: "non-existent-prod", qty: 5 },
          ],
          "Batch Error",
          "usr-admin",
          testDb
        )
      ).rejects.toThrow();

      // Verify prod-1 was NOT modified due to rollback
      const p1 = await testDb.products.get("prod-1");
      expect(p1?.stock).toBe(20);

      const storedMovements = await testDb.stockMovements.toArray();
      expect(storedMovements.length).toBe(0);
    });
  });

  describe("recordAdjustment", () => {
    it("adjusts stock upwards, calculates positive difference, and records adjust movement", async () => {
      const movement = await stockMovementsRepo.recordAdjustment(
        {
          productId: "prod-1",
          actualCount: 28,
          reason: "Ditemukan stok terselip di rak",
          userId: "usr-admin",
          userRole: "admin",
        },
        testDb
      );

      expect(movement.type).toBe("adjust");
      expect(movement.qty).toBe(8); // 28 - 20
      expect(movement.resultingStock).toBe(28);
      expect(movement.note).toBe("Ditemukan stok terselip di rak");

      const p1 = await testDb.products.get("prod-1");
      expect(p1?.stock).toBe(28);
    });

    it("adjusts stock downwards, calculates negative difference, and records adjust movement", async () => {
      const movement = await stockMovementsRepo.recordAdjustment(
        {
          productId: "prod-1",
          actualCount: 15,
          reason: "Barang rusak / bocor 5 bungkus",
          userId: "usr-admin",
          userRole: "admin",
        },
        testDb
      );

      expect(movement.type).toBe("adjust");
      expect(movement.qty).toBe(-5); // 15 - 20
      expect(movement.resultingStock).toBe(15);

      const p1 = await testDb.products.get("prod-1");
      expect(p1?.stock).toBe(15);
    });

    it("rejects adjustment if user is not admin", async () => {
      await expect(
        stockMovementsRepo.recordAdjustment(
          {
            productId: "prod-1",
            actualCount: 15,
            reason: "Kasir mencoba ubah stok",
            userId: "usr-kasir",
            userRole: "kasir",
          },
          testDb
        )
      ).rejects.toThrow("Hanya admin");

      const p1 = await testDb.products.get("prod-1");
      expect(p1?.stock).toBe(20); // unchanged
    });

    it("rejects adjustment if reason is empty", async () => {
      await expect(
        stockMovementsRepo.recordAdjustment(
          {
            productId: "prod-1",
            actualCount: 15,
            reason: "   ",
            userId: "usr-admin",
            userRole: "admin",
          },
          testDb
        )
      ).rejects.toThrow("Alasan penyesuaian stok wajib diisi");
    });
  });

  describe("getByProduct", () => {
    it("returns movements sorted chronologically descending (newest first)", async () => {
      await stockMovementsRepo.recordStockIn(
        { productId: "prod-1", qty: 5, note: "Batch 1", userId: "usr-1" },
        testDb
      );

      await stockMovementsRepo.recordStockIn(
        { productId: "prod-1", qty: 10, note: "Batch 2", userId: "usr-1" },
        testDb
      );

      const history = await stockMovementsRepo.getByProduct("prod-1", testDb);
      expect(history.length).toBe(2);
      expect(history[0].note).toBe("Batch 2");
      expect(history[1].note).toBe("Batch 1");
    });
  });

  describe("getTotalStockValue", () => {
    it("calculates sum of product.stock * product.cost accurately", async () => {
      // prod-1: 20 * 6000 = 120,000
      // prod-2: 10 * 5000 = 50,000
      // Total = 170,000
      const totalVal = await stockMovementsRepo.getTotalStockValue(testDb);
      expect(totalVal).toBe(170000);
    });
  });
});

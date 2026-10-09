import { beforeEach, describe, expect, it } from "vitest";
import { PosDatabase } from "../schema";
import { settingsRepo } from "./settingsRepo";
import { usersRepo } from "./usersRepo";
import { categoriesRepo } from "./categoriesRepo";
import { productsRepo } from "./productsRepo";

describe("entities repositories", () => {
  let testDb: PosDatabase;

  beforeEach(() => {
    testDb = new PosDatabase(`test-entities-${crypto.randomUUID()}`);
  });

  describe("settingsRepo", () => {
    it("returns default settings when none exist and updates settings", async () => {
      const initial = await settingsRepo.getSettings(testDb);
      expect(initial.storeName).toBe("Toko Berkah");
      expect(initial.currency).toBe("IDR");

      const updated = await settingsRepo.updateSettings(
        { storeName: "Toko Berkah Maju", paperWidth: 80 },
        testDb
      );
      expect(updated.storeName).toBe("Toko Berkah Maju");
      expect(updated.paperWidth).toBe(80);

      const fetched = await settingsRepo.getSettings(testDb);
      expect(fetched.storeName).toBe("Toko Berkah Maju");
    });
  });

  describe("usersRepo", () => {
    it("creates, updates, and counts admin users", async () => {
      const user = await usersRepo.createUser(
        {
          name: "Admin",
          role: "admin",
          pinHash: "hash123",
          isActive: true,
        },
        testDb
      );

      expect(user.id).toBeDefined();
      expect(await usersRepo.countAdmins(testDb)).toBe(1);

      const updated = await usersRepo.updateUser(user.id, { name: "Super Admin" }, testDb);
      expect(updated.name).toBe("Super Admin");

      const fetched = await usersRepo.getUserById(user.id, testDb);
      expect(fetched?.name).toBe("Super Admin");

      await expect(usersRepo.updateUser("invalid-id", { name: "Test" }, testDb)).rejects.toThrow();
    });
  });

  describe("categoriesRepo", () => {
    it("performs CRUD operations on categories", async () => {
      const cat = await categoriesRepo.create({ name: "Makanan" }, testDb);
      expect(cat.id).toBeDefined();
      expect(cat.name).toBe("Makanan");

      const all = await categoriesRepo.getAll(testDb);
      expect(all).toHaveLength(1);

      const updated = await categoriesRepo.update(cat.id, { name: "Makanan Ringan" }, testDb);
      expect(updated.name).toBe("Makanan Ringan");

      const fetched = await categoriesRepo.getById(cat.id, testDb);
      expect(fetched?.name).toBe("Makanan Ringan");

      await categoriesRepo.delete(cat.id, testDb);
      expect(await categoriesRepo.getAll(testDb)).toHaveLength(0);

      await expect(categoriesRepo.update("invalid-id", { name: "Test" }, testDb)).rejects.toThrow();
    });
  });

  describe("productsRepo", () => {
    it("manages products, enforces unique SKU, and filters low stock", async () => {
      const p1 = await productsRepo.create(
        {
          name: "Kopi Susu",
          sku: "KOP-001",
          categoryId: "cat-1",
          price: 15000,
          cost: 8000,
          stock: 3,
          lowStockThreshold: 5,
          isActive: true,
        },
        testDb
      );

      // Duplicate SKU rejection on create
      await expect(
        productsRepo.create(
          {
            name: "Kopi Hitam",
            sku: "KOP-001",
            categoryId: "cat-1",
            price: 10000,
            cost: 5000,
            stock: 10,
            lowStockThreshold: 2,
            isActive: true,
          },
          testDb
        )
      ).rejects.toThrow(/already exists/);

      const p2 = await productsRepo.create(
        {
          name: "Teh Tarik",
          sku: "TEH-001",
          categoryId: "cat-1",
          price: 10000,
          cost: 5000,
          stock: 20,
          lowStockThreshold: 5,
          isActive: true,
        },
        testDb
      );

      // Low stock check
      const lowStock = await productsRepo.getLowStock(testDb);
      expect(lowStock).toHaveLength(1);
      expect(lowStock[0].id).toBe(p1.id);

      // Duplicate SKU rejection on update
      await expect(productsRepo.update(p2.id, { sku: "KOP-001" }, testDb)).rejects.toThrow(
        /already exists/
      );

      // Valid update
      const updatedP2 = await productsRepo.update(p2.id, { price: 12000 }, testDb);
      expect(updatedP2.price).toBe(12000);

      // Fetch by SKU
      expect((await productsRepo.getBySku("KOP-001", testDb))?.id).toBe(p1.id);

      // Delete
      await productsRepo.delete(p1.id, testDb);
      expect(await productsRepo.getAll(testDb)).toHaveLength(1);

      await expect(productsRepo.update("invalid-id", { name: "Test" }, testDb)).rejects.toThrow();
    });
  });
});

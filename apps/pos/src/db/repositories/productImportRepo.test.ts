import { beforeEach, describe, expect, it } from "vitest";
import { db } from "../schema";
import { productImportRepo } from "./productImportRepo";
import type { ParsedProductRow } from "../../lib/productCsvImport";

describe("productImportRepo", () => {
  beforeEach(async () => {
    await db.products.clear();
    await db.categories.clear();
  });

  it("creates missing categories and inserts products atomically", async () => {
    const rows: ParsedProductRow[] = [
      {
        rowNumber: 2,
        name: "Kopi Susu",
        sku: "KOP-001",
        categoryName: "Minuman Kopi",
        price: 15000,
        cost: 8000,
        stock: 50,
        lowStockThreshold: 5,
      },
      {
        rowNumber: 3,
        name: "Nasi Goreng",
        sku: "NAS-001",
        categoryName: "Makanan Utama",
        price: 22000,
        cost: 12000,
        stock: 25,
        lowStockThreshold: 5,
      },
    ];

    const summary = await productImportRepo.importProducts(rows, "skip", db);

    expect(summary.created).toBe(2);
    expect(summary.updated).toBe(0);
    expect(summary.skipped).toBe(0);
    expect(summary.total).toBe(2);

    // Verify categories created
    const categories = await db.categories.toArray();
    expect(categories).toHaveLength(2);
    expect(categories.some((c) => c.name === "Minuman Kopi")).toBe(true);
    expect(categories.some((c) => c.name === "Makanan Utama")).toBe(true);

    // Verify products created with correct category IDs
    const products = await db.products.toArray();
    expect(products).toHaveLength(2);
    const kopi = products.find((p) => p.sku === "KOP-001");
    expect(kopi?.price).toBe(15000);
    expect(kopi?.categoryId).toBe(categories.find((c) => c.name === "Minuman Kopi")?.id);
  });

  it("handles conflict strategy 'skip' by preserving existing products", async () => {
    // Existing product in DB
    const cat = { id: "cat-1", name: "Minuman" };
    await db.categories.add(cat);
    await db.products.add({
      id: "prod-existing",
      name: "Kopi Tubruk Lama",
      sku: "KOP-001",
      categoryId: "cat-1",
      price: 10000,
      cost: 5000,
      stock: 10,
      lowStockThreshold: 3,
      isActive: true,
    });

    const rows: ParsedProductRow[] = [
      {
        rowNumber: 2,
        name: "Kopi Tubruk Baru",
        sku: "KOP-001",
        categoryName: "Minuman",
        price: 15000,
        cost: 8000,
        stock: 99,
        lowStockThreshold: 5,
      },
      {
        rowNumber: 3,
        name: "Teh Tarik",
        sku: "TEH-001",
        categoryName: "Minuman",
        price: 8000,
        cost: 4000,
        stock: 20,
        lowStockThreshold: 5,
      },
    ];

    const summary = await productImportRepo.importProducts(rows, "skip", db);

    expect(summary.created).toBe(1); // TEH-001
    expect(summary.skipped).toBe(1); // KOP-001
    expect(summary.updated).toBe(0);

    const kopi = await db.products.where("sku").equals("KOP-001").first();
    expect(kopi?.name).toBe("Kopi Tubruk Lama"); // Untouched!
    expect(kopi?.price).toBe(10000);
    expect(kopi?.stock).toBe(10);
  });

  it("handles conflict strategy 'update' by updating existing products", async () => {
    // Existing product in DB
    const cat = { id: "cat-1", name: "Minuman" };
    await db.categories.add(cat);
    await db.products.add({
      id: "prod-existing",
      name: "Kopi Tubruk Lama",
      sku: "KOP-001",
      categoryId: "cat-1",
      price: 10000,
      cost: 5000,
      stock: 10,
      lowStockThreshold: 3,
      isActive: true,
    });

    const rows: ParsedProductRow[] = [
      {
        rowNumber: 2,
        name: "Kopi Tubruk Baru",
        sku: "KOP-001",
        categoryName: "Minuman",
        price: 15000,
        cost: 8000,
        stock: 99,
        lowStockThreshold: 5,
      },
    ];

    const summary = await productImportRepo.importProducts(rows, "update", db);

    expect(summary.created).toBe(0);
    expect(summary.updated).toBe(1);
    expect(summary.skipped).toBe(0);

    const kopi = await db.products.where("sku").equals("KOP-001").first();
    expect(kopi?.name).toBe("Kopi Tubruk Baru");
    expect(kopi?.price).toBe(15000);
    expect(kopi?.cost).toBe(8000);
    expect(kopi?.stock).toBe(99);
  });

  it("rolls back atomically if an error occurs mid-transaction", async () => {
    await db.categories.add({ id: "cat-1", name: "Minuman" });
    await db.products.add({
      id: "p-initial",
      name: "Produk Awal",
      sku: "AWAL-001",
      categoryId: "cat-1",
      price: 5000,
      cost: 2000,
      stock: 5,
      lowStockThreshold: 2,
      isActive: true,
    });

    const initialProductCount = await db.products.count();
    const initialCategoryCount = await db.categories.count();

    const rows: ParsedProductRow[] = [
      {
        rowNumber: 2,
        name: "Item Valid",
        sku: "VAL-001",
        categoryName: "Kategori Baru",
        price: 10000,
        cost: 5000,
        stock: 10,
        lowStockThreshold: 2,
      },
    ];

    // Mock an error inside transaction by temporarily monkey-patching or passing invalid db call
    const failingPromise = db.transaction("rw", [db.products, db.categories], async () => {
      await productImportRepo.importProducts(rows, "skip", db);
      throw new Error("Simulated unexpected failure during import");
    });

    await expect(failingPromise).rejects.toThrow("Simulated unexpected failure during import");

    // All changes must be rolled back
    expect(await db.products.count()).toBe(initialProductCount);
    expect(await db.categories.count()).toBe(initialCategoryCount);
    expect(await db.products.where("sku").equals("VAL-001").first()).toBeUndefined();
  });

  it("imports a large dataset (5,000 rows) correctly within atomic transaction", async () => {
    const rows: ParsedProductRow[] = Array.from({ length: 5000 }).map((_, i) => ({
      rowNumber: i + 2,
      name: `Produk Bulk ${i}`,
      sku: `BULK-${i.toString().padStart(5, "0")}`,
      categoryName: `Kategori ${i % 10}`,
      price: 10000 + (i % 50) * 1000,
      cost: 5000,
      stock: 100,
      lowStockThreshold: 10,
    }));

    const summary = await productImportRepo.importProducts(rows, "skip", db);

    expect(summary.created).toBe(5000);
    expect(summary.total).toBe(5000);

    const totalInDb = await db.products.count();
    expect(totalInDb).toBe(5000);

    const catCount = await db.categories.count();
    expect(catCount).toBe(10);
  });
});

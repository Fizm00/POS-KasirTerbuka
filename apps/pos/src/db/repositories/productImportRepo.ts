import { db, PosDatabase, type Category, type Product } from "../schema";
import type { ParsedProductRow } from "../../lib/productCsvImport";

export type SkuConflictStrategy = "skip" | "update";

export interface ImportSummary {
  created: number;
  updated: number;
  skipped: number;
  total: number;
}

export const productImportRepo = {
  /**
   * Executes atomic bulk product import.
   * Runs inside a single database read-write transaction over products and categories.
   * If any error occurs, the entire transaction is rolled back (all-or-nothing).
   */
  async importProducts(
    rows: ParsedProductRow[],
    conflictStrategy: SkuConflictStrategy = "skip",
    database: PosDatabase = db
  ): Promise<ImportSummary> {
    if (rows.length === 0) {
      return { created: 0, updated: 0, skipped: 0, total: 0 };
    }

    return database.transaction("rw", [database.products, database.categories], async () => {
      // 1. Load existing categories into memory map (case-insensitive name -> Category)
      const existingCategories = await database.categories.toArray();
      const categoryMap = new Map<string, Category>();
      for (const cat of existingCategories) {
        categoryMap.set(cat.name.trim().toLowerCase(), cat);
      }

      // 2. Load existing products into memory map (case-insensitive SKU -> Product)
      const existingProducts = await database.products.toArray();
      const productSkuMap = new Map<string, Product>();
      for (const prod of existingProducts) {
        productSkuMap.set(prod.sku.trim().toLowerCase(), prod);
      }

      let created = 0;
      let updated = 0;
      let skipped = 0;

      // New categories and products to insert/update
      for (const row of rows) {
        // Resolve or create category
        const catKey = row.categoryName.trim().toLowerCase();
        let category = categoryMap.get(catKey);

        if (!category) {
          category = {
            id: crypto.randomUUID(),
            name: row.categoryName.trim(),
          };
          await database.categories.add(category);
          categoryMap.set(catKey, category);
        }

        const skuKey = row.sku.trim().toLowerCase();
        const existing = productSkuMap.get(skuKey);

        if (existing) {
          if (conflictStrategy === "skip") {
            skipped++;
          } else {
            // Update existing product
            const updatedProduct: Product = {
              ...existing,
              name: row.name.trim(),
              categoryId: category.id,
              cost: row.cost,
              price: row.price,
              stock: row.stock,
              lowStockThreshold: row.lowStockThreshold,
              isActive: true,
            };
            await database.products.put(updatedProduct);
            productSkuMap.set(skuKey, updatedProduct);
            updated++;
          }
        } else {
          // Create new product
          const newProduct: Product = {
            id: crypto.randomUUID(),
            name: row.name.trim(),
            sku: row.sku.trim(),
            categoryId: category.id,
            cost: row.cost,
            price: row.price,
            stock: row.stock,
            lowStockThreshold: row.lowStockThreshold,
            isActive: true,
          };
          await database.products.add(newProduct);
          productSkuMap.set(skuKey, newProduct);
          created++;
        }
      }

      return {
        created,
        updated,
        skipped,
        total: rows.length,
      };
    });
  },
};

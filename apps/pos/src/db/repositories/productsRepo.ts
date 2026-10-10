import { db, PosDatabase, type Product } from "../schema";
import { productImagesRepo } from "./productImagesRepo";

export const productsRepo = {
  async getAll(database: PosDatabase = db): Promise<Product[]> {
    return database.products.toArray();
  },

  async getActive(database: PosDatabase = db): Promise<Product[]> {
    return database.products.filter((p) => p.isActive).toArray();
  },

  async getById(id: string, database: PosDatabase = db): Promise<Product | undefined> {
    return database.products.get(id);
  },

  async getBySku(sku: string, database: PosDatabase = db): Promise<Product | undefined> {
    return database.products.where("sku").equals(sku).first();
  },

  async create(productData: Omit<Product, "id">, database: PosDatabase = db): Promise<Product> {
    const existingSku = await this.getBySku(productData.sku, database);
    if (existingSku) {
      throw new Error(`SKU ${productData.sku} already exists`);
    }

    const newProduct: Product = {
      ...productData,
      id: crypto.randomUUID(),
    };
    await database.products.add(newProduct);
    return newProduct;
  },

  async update(
    id: string,
    updates: Partial<Omit<Product, "id">>,
    database: PosDatabase = db
  ): Promise<Product> {
    const existing = await database.products.get(id);
    if (!existing) {
      throw new Error(`Product with ID ${id} not found`);
    }

    if (updates.sku && updates.sku !== existing.sku) {
      const existingSku = await this.getBySku(updates.sku, database);
      if (existingSku && existingSku.id !== id) {
        throw new Error(`SKU ${updates.sku} already exists`);
      }
    }

    const updated: Product = { ...existing, ...updates };
    await database.products.put(updated);
    return updated;
  },

  async delete(id: string, database: PosDatabase = db): Promise<void> {
    await database.products.delete(id);
    await productImagesRepo.removeProductImage(id, database);
  },

  async getLowStock(database: PosDatabase = db): Promise<Product[]> {
    return database.products.filter((p) => p.isActive && p.stock <= p.lowStockThreshold).toArray();
  },
};

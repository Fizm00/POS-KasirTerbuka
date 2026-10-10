import { db, PosDatabase, type StockMovement, type UserRole } from "../schema";

export interface StockInItemInput {
  productId: string;
  qty: number;
  cost?: number;
}

export interface StockInInput {
  productId: string;
  qty: number;
  cost?: number;
  note?: string;
  userId: string;
}

export interface StockAdjustmentInput {
  productId: string;
  actualCount: number;
  reason: string;
  userId: string;
  userRole?: UserRole;
}

export const stockMovementsRepo = {
  /**
   * Records a single stock in event atomically.
   * Increments stock, optionally updates unit cost, and inserts a movement record.
   */
  async recordStockIn(input: StockInInput, database: PosDatabase = db): Promise<StockMovement> {
    if (!Number.isInteger(input.qty) || input.qty <= 0) {
      throw new Error("Jumlah barang masuk harus berupa bilangan bulat positif.");
    }

    if (input.cost !== undefined && (!Number.isInteger(input.cost) || input.cost < 0)) {
      throw new Error("Harga modal harus berupa bilangan bulat positif atau nol.");
    }

    return database.transaction("rw", [database.products, database.stockMovements], async () => {
      const product = await database.products.get(input.productId);
      if (!product) {
        throw new Error(`Produk dengan ID "${input.productId}" tidak ditemukan.`);
      }

      const newStock = product.stock + input.qty;
      const updates: { stock: number; cost?: number } = { stock: newStock };

      if (input.cost !== undefined) {
        updates.cost = input.cost;
      }

      await database.products.update(product.id, updates);

      const movement: StockMovement = {
        id: crypto.randomUUID(),
        productId: product.id,
        type: "in",
        qty: input.qty,
        resultingStock: newStock,
        note: input.note?.trim() || undefined,
        userId: input.userId,
        createdAt: new Date().toISOString(),
      };

      await database.stockMovements.add(movement);
      return movement;
    });
  },

  /**
   * Records bulk stock in for multiple products in ONE atomic transaction.
   * If any item is invalid or fails, the whole operation rolls back.
   */
  async recordBulkStockIn(
    items: StockInItemInput[],
    note: string | undefined,
    userId: string,
    database: PosDatabase = db
  ): Promise<StockMovement[]> {
    if (!items || items.length === 0) {
      throw new Error("Daftar barang masuk tidak boleh kosong.");
    }

    const trimmedNote = note?.trim() || undefined;
    const nowIso = new Date().toISOString();

    return database.transaction("rw", [database.products, database.stockMovements], async () => {
      const createdMovements: StockMovement[] = [];

      for (const item of items) {
        if (!Number.isInteger(item.qty) || item.qty <= 0) {
          throw new Error(`Jumlah masuk untuk produk ${item.productId} harus lebih dari 0.`);
        }

        if (item.cost !== undefined && (!Number.isInteger(item.cost) || item.cost < 0)) {
          throw new Error(`Harga modal untuk produk ${item.productId} tidak valid.`);
        }

        const product = await database.products.get(item.productId);
        if (!product) {
          throw new Error(`Produk ${item.productId} tidak ditemukan.`);
        }

        const newStock = product.stock + item.qty;
        const updates: { stock: number; cost?: number } = { stock: newStock };
        if (item.cost !== undefined) {
          updates.cost = item.cost;
        }

        await database.products.update(product.id, updates);

        const movement: StockMovement = {
          id: crypto.randomUUID(),
          productId: product.id,
          type: "in",
          qty: item.qty,
          resultingStock: newStock,
          note: trimmedNote,
          userId,
          createdAt: nowIso,
        };

        await database.stockMovements.add(movement);
        createdMovements.push(movement);
      }

      return createdMovements;
    });
  },

  /**
   * Records an inventory stock adjustment.
   * - Restricted to admin role only.
   * - Reason is required.
   * - Calculates and stores the signed difference between actualCount and current stock.
   */
  async recordAdjustment(
    input: StockAdjustmentInput,
    database: PosDatabase = db
  ): Promise<StockMovement> {
    if (input.userRole && input.userRole !== "admin") {
      throw new Error("Akses ditolak: Hanya admin yang dapat melakukan penyesuaian stok.");
    }

    if (!input.reason || input.reason.trim().length === 0) {
      throw new Error("Alasan penyesuaian stok wajib diisi.");
    }

    if (!Number.isInteger(input.actualCount) || input.actualCount < 0) {
      throw new Error("Stok fisik aktual harus berupa bilangan bulat positif atau nol.");
    }

    return database.transaction("rw", [database.products, database.stockMovements], async () => {
      const product = await database.products.get(input.productId);
      if (!product) {
        throw new Error(`Produk dengan ID "${input.productId}" tidak ditemukan.`);
      }

      const difference = input.actualCount - product.stock;
      await database.products.update(product.id, { stock: input.actualCount });

      const movement: StockMovement = {
        id: crypto.randomUUID(),
        productId: product.id,
        type: "adjust",
        qty: difference,
        resultingStock: input.actualCount,
        note: input.reason.trim(),
        userId: input.userId,
        createdAt: new Date().toISOString(),
      };

      await database.stockMovements.add(movement);
      return movement;
    });
  },

  /**
   * Retrieves all stock movements for a product, ordered by createdAt descending (newest first).
   */
  async getByProduct(productId: string, database: PosDatabase = db): Promise<StockMovement[]> {
    const movements = await database.stockMovements.where("productId").equals(productId).toArray();

    return movements.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  /**
   * Calculates total valuation of all stock currently on hand (sum of product.stock * product.cost).
   */
  async getTotalStockValue(database: PosDatabase = db): Promise<number> {
    const products = await database.products.toArray();
    let totalValue = 0;
    for (const p of products) {
      if (p.stock > 0 && p.cost > 0) {
        totalValue += p.stock * p.cost;
      }
    }
    return Math.round(totalValue);
  },
};

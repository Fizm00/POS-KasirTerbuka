import { z } from "zod";
import {
  type Category,
  type DailyCounter,
  db,
  PosDatabase,
  type Product,
  type StoreSettings,
  type Transaction,
  type User,
} from "../schema";

const StoreSettingsSchema = z.object({
  id: z.string(),
  storeName: z.string(),
  address: z.string(),
  phone: z.string(),
  receiptFooter: z.string(),
  paperWidth: z.union([z.literal(58), z.literal(80)]),
  currency: z.string(),
  printer: z
    .object({
      type: z.string().optional(),
      target: z.string().optional(),
    })
    .optional(),
  lastBackupAt: z.string().optional(),
  autoLockMinutes: z.number().int().optional(),
});

const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.enum(["admin", "kasir"]),
  pinHash: z.string(),
  isActive: z.boolean(),
});

const CategorySchema = z.object({
  id: z.string(),
  name: z.string(),
});

const ProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  sku: z.string(),
  categoryId: z.string(),
  price: z.number().int(),
  cost: z.number().int(),
  stock: z.number().int(),
  lowStockThreshold: z.number().int(),
  isActive: z.boolean(),
});

const TransactionItemSnapshotSchema = z.object({
  productId: z.string(),
  name: z.string(),
  sku: z.string(),
  price: z.number().int(),
  cost: z.number().int(),
  qty: z.number().int(),
  subtotal: z.number().int(),
});

const TransactionSchema = z.object({
  id: z.string(),
  invoiceNo: z.string(),
  cashierId: z.string(),
  items: z.array(TransactionItemSnapshotSchema),
  subtotal: z.number().int(),
  discount: z.number().int(),
  total: z.number().int(),
  paymentMethod: z.enum(["cash", "qris", "transfer"]),
  amountPaid: z.number().int(),
  change: z.number().int(),
  status: z.enum(["completed", "void"]),
  voidedBy: z.string().optional(),
  voidedAt: z.string().optional(),
  voidReason: z.string().optional(),
  createdAt: z.string(),
});

const DailyCounterSchema = z.object({
  id: z.string(),
  seq: z.number().int(),
});

export const BackupSchema = z.object({
  version: z.literal(1),
  appName: z.literal("Kasir Terbuka"),
  exportedAt: z.string(),
  data: z.object({
    settings: z.array(StoreSettingsSchema),
    users: z.array(UserSchema),
    categories: z.array(CategorySchema),
    products: z.array(ProductSchema),
    transactions: z.array(TransactionSchema),
    counters: z.array(DailyCounterSchema),
  }),
});

export type BackupFile = z.infer<typeof BackupSchema>;

export class InvalidBackupFileError extends Error {
  constructor(message: string) {
    super(`Berkas cadangan tidak valid: ${message}`);
    this.name = "InvalidBackupFileError";
  }
}

export const backupRepo = {
  /**
   * Exports all database data to a validated backup object.
   */
  async exportAll(database: PosDatabase = db): Promise<BackupFile> {
    const settings = await database.settings.toArray();
    const users = await database.users.toArray();
    const categories = await database.categories.toArray();
    const products = await database.products.toArray();
    const transactions = await database.transactions.toArray();
    const counters = await database.counters.toArray();

    const backup: BackupFile = {
      version: 1,
      appName: "Kasir Terbuka",
      exportedAt: new Date().toISOString(),
      data: {
        settings: settings as StoreSettings[],
        users: users as User[],
        categories: categories as Category[],
        products: products as Product[],
        transactions: transactions as Transaction[],
        counters: counters as DailyCounter[],
      },
    };

    return BackupSchema.parse(backup);
  },

  /**
   * Validates a JSON string or object without touching the database.
   * Throws InvalidBackupFileError if malformed.
   */
  validateBackup(input: string | unknown): BackupFile {
    let parsed: unknown;
    if (typeof input === "string") {
      try {
        parsed = JSON.parse(input);
      } catch {
        throw new InvalidBackupFileError("Format JSON tidak valid");
      }
    } else {
      parsed = input;
    }

    const validationResult = BackupSchema.safeParse(parsed);
    if (!validationResult.success) {
      const issueMessage = validationResult.error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join("; ");
      throw new InvalidBackupFileError(issueMessage);
    }

    return validationResult.data;
  },

  /**
   * Returns item counts of a backup file for confirmation dialog.
   */
  getBackupSummary(backup: BackupFile): {
    productCount: number;
    transactionCount: number;
    userCount: number;
    categoryCount: number;
    storeName: string;
    exportedAt: string;
  } {
    return {
      productCount: backup.data.products.length,
      transactionCount: backup.data.transactions.length,
      userCount: backup.data.users.length,
      categoryCount: backup.data.categories.length,
      storeName: backup.data.settings[0]?.storeName || "Toko",
      exportedAt: backup.exportedAt,
    };
  },

  /**
   * Imports database data from a JSON string or object.
   * Strictly validates with Zod beforehand; if malformed, aborts without modifying existing data.
   */
  async importAll(input: string | unknown, database: PosDatabase = db): Promise<BackupFile> {
    const backup = this.validateBackup(input);

    // Atomically replace all data across all tables
    await database.transaction(
      "rw",
      [
        database.settings,
        database.users,
        database.categories,
        database.products,
        database.transactions,
        database.counters,
      ],
      async () => {
        await database.settings.clear();
        await database.users.clear();
        await database.categories.clear();
        await database.products.clear();
        await database.transactions.clear();
        await database.counters.clear();

        if (backup.data.settings.length > 0) {
          await database.settings.bulkAdd(backup.data.settings);
        }
        if (backup.data.users.length > 0) {
          await database.users.bulkAdd(backup.data.users);
        }
        if (backup.data.categories.length > 0) {
          await database.categories.bulkAdd(backup.data.categories);
        }
        if (backup.data.products.length > 0) {
          await database.products.bulkAdd(backup.data.products);
        }
        if (backup.data.transactions.length > 0) {
          await database.transactions.bulkAdd(backup.data.transactions);
        }
        if (backup.data.counters.length > 0) {
          await database.counters.bulkAdd(backup.data.counters);
        }
      }
    );

    return backup;
  },
};

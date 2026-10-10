import { z } from "zod";
import { strFromU8, strToU8, unzipSync, zipSync, type Zippable } from "fflate";
import {
  type Category,
  type DailyCounter,
  db,
  PosDatabase,
  type Product,
  type ProductImage,
  type StockMovement,
  type StoreSettings,
  type Transaction,
  type User,
} from "../schema";
import { revokeAllTrackedObjectUrls } from "../../lib/images";

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
  businessType: z.enum(["retail", "cafe", "custom"]).optional(),
  productView: z.enum(["photo", "compact"]).optional(),
  features: z
    .object({
      photos: z.boolean().optional(),
      stockIn: z.boolean().optional(),
      csvImport: z.boolean().optional(),
      shifts: z.boolean().optional(),
      expenses: z.boolean().optional(),
      holdOrders: z.boolean().optional(),
      tables: z.boolean().optional(),
      variants: z.boolean().optional(),
      receivables: z.boolean().optional(),
      tax: z.boolean().optional(),
      serviceCharge: z.boolean().optional(),
    })
    .optional(),
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

export const StockMovementSchema = z.object({
  id: z.string(),
  productId: z.string(),
  type: z.enum(["in", "adjust", "sale", "void"]),
  qty: z.number().int(),
  resultingStock: z.number().int().optional(),
  note: z.string().optional(),
  userId: z.string(),
  createdAt: z.string(),
});

// ---------------------------------------------------------------------------
// Backup Schemas
// ---------------------------------------------------------------------------

export const BackupV1Schema = z.object({
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

export const BackupV2DataJsonSchema = z.object({
  formatVersion: z.literal(2),
  appName: z.literal("Kasir Terbuka"),
  exportedAt: z.string(),
  data: z.object({
    settings: z.array(StoreSettingsSchema),
    users: z.array(UserSchema),
    categories: z.array(CategorySchema),
    products: z.array(ProductSchema),
    transactions: z.array(TransactionSchema),
    counters: z.array(DailyCounterSchema),
    stockMovements: z.array(StockMovementSchema).optional().default([]),
    shifts: z.array(z.unknown()).optional().default([]),
    expenses: z.array(z.unknown()).optional().default([]),
  }),
});

export type BackupFileV1 = z.infer<typeof BackupV1Schema>;
export type BackupV2DataJson = z.infer<typeof BackupV2DataJsonSchema>;

// Alias for backwards compatibility
export const BackupSchema = BackupV1Schema;

export interface BackupImagePayload {
  productId: string;
  blob: Blob;
  mime: string;
}

export interface ValidatedBackup {
  version?: 1;
  formatVersion: 1 | 2;
  appName: "Kasir Terbuka";
  exportedAt: string;
  data: {
    settings: StoreSettings[];
    users: User[];
    categories: Category[];
    products: Product[];
    transactions: Transaction[];
    counters: DailyCounter[];
    stockMovements?: StockMovement[];
    shifts?: unknown[];
    expenses?: unknown[];
  };
  images: BackupImagePayload[];
}

export type BackupFile = BackupFileV1 | ValidatedBackup;

export class InvalidBackupFileError extends Error {
  constructor(message: string) {
    super(`Berkas cadangan tidak valid: ${message}`);
    this.name = "InvalidBackupFileError";
  }
}

/**
 * Safely converts a Blob to Uint8Array, falling back to FileReader if .arrayBuffer() is unavailable (e.g. fake-indexeddb).
 */
export async function blobToUint8Array(blob: Blob): Promise<Uint8Array> {
  if (typeof blob.arrayBuffer === "function") {
    try {
      const buf = await blob.arrayBuffer();
      return new Uint8Array(buf);
    } catch {
      // Fallback to FileReader
    }
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(new Uint8Array(reader.result as ArrayBuffer));
    };
    reader.onerror = () => {
      reject(new Error("Gagal membaca blob ke array buffer."));
    };
    reader.readAsArrayBuffer(blob);
  });
}

function isBlobOrFile(val: unknown): val is Blob {
  return (
    typeof val === "object" &&
    val !== null &&
    (val instanceof Blob ||
      (typeof (val as Blob).size === "number" &&
        (typeof (val as Blob).arrayBuffer === "function" ||
          typeof (val as Blob).slice === "function")))
  );
}

/**
 * Checks whether a Uint8Array begins with the ZIP magic number (PK\x03\x04).
 */
function isZipBuffer(bytes: Uint8Array): boolean {
  return bytes.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4b;
}

export const backupRepo = {
  /**
   * Exports all database data to a validated v1 backup object (JSON).
   */
  async exportAll(database: PosDatabase = db): Promise<BackupFileV1> {
    const settings = await database.settings.toArray();
    const users = await database.users.toArray();
    const categories = await database.categories.toArray();
    const products = await database.products.toArray();
    const transactions = await database.transactions.toArray();
    const counters = await database.counters.toArray();

    const backup: BackupFileV1 = {
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

    return BackupV1Schema.parse(backup);
  },

  /**
   * Exports backup v2 as a ZIP archive (.zip) containing data.json and images/<productId>.<ext>.
   */
  async exportV2Zip(database: PosDatabase = db): Promise<{
    blob: Blob;
    uint8Array: Uint8Array;
    fileName: string;
    data: BackupV2DataJson["data"];
    imageCount: number;
  }> {
    const settings = await database.settings.toArray();
    const users = await database.users.toArray();
    const categories = await database.categories.toArray();
    const products = await database.products.toArray();
    const transactions = await database.transactions.toArray();
    const counters = await database.counters.toArray();
    const productImages = await database.productImages.toArray();
    const stockMovements = await database.stockMovements.toArray();

    const exportedAt = new Date().toISOString();
    const rawDataJson = {
      appName: "Kasir Terbuka" as const,
      formatVersion: 2 as const,
      exportedAt,
      data: {
        settings: settings as StoreSettings[],
        users: users as User[],
        categories: categories as Category[],
        products: products as Product[],
        transactions: transactions as Transaction[],
        counters: counters as DailyCounter[],
        stockMovements: stockMovements as StockMovement[],
        shifts: [],
        expenses: [],
      },
    };

    const validatedData = BackupV2DataJsonSchema.parse(rawDataJson);
    const dataJsonStr = JSON.stringify(validatedData, null, 2);

    const zippable: Zippable = {
      "data.json": strToU8(dataJsonStr),
    };

    for (const img of productImages) {
      const ext = img.mime === "image/webp" ? "webp" : img.mime === "image/png" ? "png" : "jpg";
      const bytes = await blobToUint8Array(img.blob);
      zippable[`images/${img.productId}.${ext}`] = bytes;
    }

    const zipBytes = zipSync(zippable);
    const blob = new Blob([zipBytes], { type: "application/zip" });
    const dateStr = exportedAt.slice(0, 10).replace(/-/g, "");
    const fileName = `cadangan-kasir-terbuka-${dateStr}.zip`;

    return {
      blob,
      uint8Array: zipBytes,
      fileName,
      data: validatedData.data,
      imageCount: productImages.length,
    };
  },

  /**
   * Validates a JSON string, JSON object, ArrayBuffer, Uint8Array, or Blob without modifying the database.
   * Throws InvalidBackupFileError if malformed or invalid.
   */
  async validateBackup(input: unknown): Promise<ValidatedBackup> {
    if (!input) {
      throw new InvalidBackupFileError("Berkas cadangan kosong atau tidak valid.");
    }

    // 1. Handle Blob / File input
    let bufferBytes: Uint8Array | null = null;
    if (isBlobOrFile(input)) {
      bufferBytes = await blobToUint8Array(input);
    } else if (input instanceof ArrayBuffer) {
      bufferBytes = new Uint8Array(input);
    } else if (input instanceof Uint8Array) {
      bufferBytes = input;
    }

    // 2. Handle ZIP archive input
    if (bufferBytes && isZipBuffer(bufferBytes)) {
      let unzipped: Record<string, Uint8Array>;
      try {
        unzipped = unzipSync(bufferBytes);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Arsip ZIP rusak";
        throw new InvalidBackupFileError(`Gagal membaca arsip ZIP: ${msg}`);
      }

      if (!unzipped["data.json"]) {
        throw new InvalidBackupFileError("Berkas data.json tidak ditemukan di dalam arsip ZIP.");
      }

      let parsedDataJson: unknown;
      try {
        const text = strFromU8(unzipped["data.json"]);
        parsedDataJson = JSON.parse(text);
      } catch {
        throw new InvalidBackupFileError(
          "Format berkas data.json di dalam ZIP bukan JSON yang valid."
        );
      }

      const v2Parsed = BackupV2DataJsonSchema.safeParse(parsedDataJson);
      if (!v2Parsed.success) {
        const issues = v2Parsed.error.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join("; ");
        throw new InvalidBackupFileError(issues);
      }

      // Extract images from images/ directory
      const images: BackupImagePayload[] = [];
      for (const [filePath, fileData] of Object.entries(unzipped)) {
        if (!filePath.startsWith("images/") || fileData.length === 0) continue;
        const fileName = filePath.slice("images/".length);
        if (fileName.startsWith(".") || fileName.includes("/")) continue;

        const dotIdx = fileName.lastIndexOf(".");
        const productId = dotIdx > 0 ? fileName.slice(0, dotIdx) : fileName;
        const ext = dotIdx > 0 ? fileName.slice(dotIdx + 1).toLowerCase() : "webp";
        const mime = ext === "webp" ? "image/webp" : ext === "png" ? "image/png" : "image/jpeg";

        const blob = new Blob([fileData as unknown as BlobPart], { type: mime });
        images.push({ productId, blob, mime });
      }

      return {
        formatVersion: 2,
        appName: "Kasir Terbuka",
        exportedAt: v2Parsed.data.exportedAt,
        data: v2Parsed.data.data as ValidatedBackup["data"],
        images,
      };
    }

    // 3. Handle JSON string or parsed JSON object input
    let parsed: unknown = input;
    if (typeof input === "string") {
      try {
        parsed = JSON.parse(input);
      } catch {
        throw new InvalidBackupFileError("Format JSON tidak valid");
      }
    } else if (bufferBytes) {
      // Non-zip buffer (e.g. JSON bytes)
      try {
        const text = strFromU8(bufferBytes);
        parsed = JSON.parse(text);
      } catch {
        throw new InvalidBackupFileError("Format JSON tidak valid");
      }
    }

    if (typeof parsed !== "object" || parsed === null) {
      throw new InvalidBackupFileError("Struktur data cadangan tidak valid.");
    }

    // Check if it's Backup v2 (JSON object without zip)
    if ("formatVersion" in parsed && (parsed as { formatVersion: unknown }).formatVersion === 2) {
      const v2Result = BackupV2DataJsonSchema.safeParse(parsed);
      if (!v2Result.success) {
        const issueMessage = v2Result.error.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join("; ");
        throw new InvalidBackupFileError(issueMessage);
      }
      return {
        formatVersion: 2,
        appName: "Kasir Terbuka",
        exportedAt: v2Result.data.exportedAt,
        data: v2Result.data.data as ValidatedBackup["data"],
        images: [],
      };
    }

    // Check if it's Backup v1
    const v1Result = BackupV1Schema.safeParse(parsed);
    if (!v1Result.success) {
      const issueMessage = v1Result.error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join("; ");
      throw new InvalidBackupFileError(issueMessage);
    }

    return {
      version: 1,
      formatVersion: 1,
      appName: "Kasir Terbuka",
      exportedAt: v1Result.data.exportedAt,
      data: v1Result.data.data as ValidatedBackup["data"],
      images: [],
    };
  },

  /**
   * Returns item counts of a validated backup file for confirmation modal.
   */
  getBackupSummary(backup: ValidatedBackup): {
    formatVersion: 1 | 2;
    productCount: number;
    transactionCount: number;
    userCount: number;
    categoryCount: number;
    imageCount: number;
    storeName: string;
    exportedAt: string;
  } {
    return {
      formatVersion: backup.formatVersion,
      productCount: backup.data.products.length,
      transactionCount: backup.data.transactions.length,
      userCount: backup.data.users.length,
      categoryCount: backup.data.categories.length,
      imageCount: backup.images ? backup.images.length : 0,
      storeName: backup.data.settings[0]?.storeName || "Toko",
      exportedAt: backup.exportedAt,
    };
  },

  /**
   * Atomically replaces all database tables and productImages with the validated backup.
   * If any step fails or is invalid, the entire operation is rolled back safely.
   */
  async importAll(
    input: ValidatedBackup | string | ArrayBuffer | Uint8Array | Blob | unknown,
    database: PosDatabase = db
  ): Promise<ValidatedBackup> {
    const backup: ValidatedBackup =
      typeof input === "object" && input !== null && "formatVersion" in input && "data" in input
        ? (input as ValidatedBackup)
        : await this.validateBackup(input);

    await database.transaction(
      "rw",
      [
        database.settings,
        database.users,
        database.categories,
        database.products,
        database.transactions,
        database.counters,
        database.productImages,
        database.stockMovements,
      ],
      async () => {
        await database.settings.clear();
        await database.users.clear();
        await database.categories.clear();
        await database.products.clear();
        await database.transactions.clear();
        await database.counters.clear();
        await database.productImages.clear();
        await database.stockMovements.clear();

        if (backup.data.settings.length > 0) {
          const sanitizedSettings: StoreSettings[] = backup.data.settings.map((s) => ({
            ...s,
            businessType: s.businessType ?? "custom",
            productView: s.productView ?? "compact",
            features: {
              photos: false,
              stockIn: false,
              csvImport: false,
              shifts: false,
              expenses: false,
              holdOrders: false,
              tables: false,
              variants: false,
              receivables: false,
              tax: false,
              serviceCharge: false,
              ...(s.features || {}),
            },
          }));
          await database.settings.bulkAdd(sanitizedSettings);
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

        // Insert stockMovements if present in Backup v2
        if (backup.data.stockMovements && backup.data.stockMovements.length > 0) {
          await database.stockMovements.bulkAdd(backup.data.stockMovements as StockMovement[]);
        }

        // Insert productImages if present in Backup v2
        if (backup.images && backup.images.length > 0) {
          const nowIso = new Date().toISOString();
          const productImagesToInsert: ProductImage[] = backup.images.map((img) => ({
            id: crypto.randomUUID(),
            productId: img.productId,
            blob: img.blob,
            mime: img.mime,
            width: 480,
            height: 480,
            createdAt: nowIso,
          }));
          await database.productImages.bulkAdd(productImagesToInsert);
        }
      }
    );

    // Clean up memory from any previously held object URLs
    revokeAllTrackedObjectUrls();

    return backup;
  },
};

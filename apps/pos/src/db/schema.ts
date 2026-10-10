import Dexie, { type Table } from "dexie";

export type UserRole = "admin" | "kasir";
export type PaymentMethod = "cash" | "qris" | "transfer";
export type TransactionStatus = "completed" | "void";
export type PaperWidth = 58 | 80;
export type BusinessType = "retail" | "cafe" | "custom";
export type ProductViewMode = "photo" | "compact";

export interface FeatureFlags {
  photos: boolean;
  stockIn: boolean;
  csvImport: boolean;
  shifts: boolean;
  expenses: boolean;
  holdOrders: boolean;
  tables: boolean;
  variants: boolean;
  receivables: boolean;
  tax: boolean;
  serviceCharge: boolean;
}

export type FeatureKey = keyof FeatureFlags;

export interface StoreSettings {
  id: string; // e.g. "default"
  storeName: string;
  address: string;
  phone: string;
  receiptFooter: string;
  paperWidth: PaperWidth;
  currency: string;
  printer?: {
    type?: string;
    target?: string;
    cashDrawer?: boolean;
  };
  lastBackupAt?: string;
  autoLockMinutes?: number;
  businessType?: BusinessType;
  productView?: ProductViewMode;
  features?: FeatureFlags;
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  pinHash: string;
  isActive: boolean;
}

export interface Category {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  categoryId: string;
  price: number; // Integer Rupiah
  cost: number; // Integer Rupiah
  stock: number;
  lowStockThreshold: number;
  isActive: boolean;
}

export interface TransactionItemSnapshot {
  productId: string;
  name: string;
  sku: string;
  price: number; // Integer Rupiah
  cost: number; // Integer Rupiah
  qty: number;
  subtotal: number; // Integer Rupiah
}

export interface Transaction {
  id: string;
  invoiceNo: string;
  cashierId: string;
  items: TransactionItemSnapshot[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  amountPaid: number;
  change: number;
  status: TransactionStatus;
  voidedBy?: string;
  voidedAt?: string;
  voidReason?: string;
  createdAt: string; // ISO UTC string
}

export interface DailyCounter {
  id: string; // e.g. "INV-20261009"
  seq: number;
}

export interface ProductImage {
  id: string;
  productId: string;
  blob: Blob;
  mime: string;
  width: number;
  height: number;
  createdAt: string; // ISO string
}

export type StockMovementType = "in" | "adjust" | "sale" | "void";

export interface StockMovement {
  id: string;
  productId: string;
  type: StockMovementType;
  qty: number; // Signed delta (+ for in/void, - for sale, difference for adjust)
  resultingStock?: number;
  note?: string;
  userId: string;
  createdAt: string; // ISO UTC string
}

export class PosDatabase extends Dexie {
  settings!: Table<StoreSettings, string>;
  users!: Table<User, string>;
  categories!: Table<Category, string>;
  products!: Table<Product, string>;
  transactions!: Table<Transaction, string>;
  counters!: Table<DailyCounter, string>;
  productImages!: Table<ProductImage, string>;
  stockMovements!: Table<StockMovement, string>;

  constructor(databaseName = "KasirTerbukaDB") {
    super(databaseName);

    this.version(1).stores({
      settings: "id",
      users: "id, role, isActive",
      categories: "id, name",
      products: "id, &sku, name, categoryId, isActive",
      transactions: "id, &invoiceNo, cashierId, status, createdAt",
      counters: "id",
    });

    this.version(2)
      .stores({
        products: "id, &sku, name, categoryId, isActive, [isActive+categoryId]",
        transactions:
          "id, &invoiceNo, cashierId, status, createdAt, [status+createdAt], [cashierId+createdAt]",
      })
      .upgrade(() => {
        // Version 2 upgrade adds compound indexes for fast date queries and cashier filtering
      });

    this.version(3)
      .stores({})
      .upgrade(async (tx) => {
        await tx
          .table("settings")
          .toCollection()
          .modify((s: StoreSettings) => {
            s.businessType = s.businessType ?? "custom";
            s.productView = s.productView ?? "compact";
            s.features = {
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
            };
          });
      });

    this.version(4)
      .stores({
        productImages: "id, &productId, createdAt",
      })
      .upgrade(() => {
        // Version 4 adds productImages table for native binary image Blobs
      });

    this.version(5)
      .stores({
        stockMovements: "id, productId, type, createdAt, [productId+createdAt]",
      })
      .upgrade(() => {
        // Version 5 adds stockMovements table without backfilling history
      });
  }
}

export const db = new PosDatabase();

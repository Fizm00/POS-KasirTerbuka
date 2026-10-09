import Dexie, { type Table } from "dexie";

export type UserRole = "admin" | "kasir";
export type PaymentMethod = "cash" | "qris" | "transfer";
export type TransactionStatus = "completed" | "void";
export type PaperWidth = 58 | 80;

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

export class PosDatabase extends Dexie {
  settings!: Table<StoreSettings, string>;
  users!: Table<User, string>;
  categories!: Table<Category, string>;
  products!: Table<Product, string>;
  transactions!: Table<Transaction, string>;
  counters!: Table<DailyCounter, string>;

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
  }
}

export const db = new PosDatabase();

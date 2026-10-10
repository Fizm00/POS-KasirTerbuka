import {
  db,
  type PaymentMethod,
  PosDatabase,
  type Transaction,
  type TransactionItemSnapshot,
  type TransactionStatus,
  type UserRole,
} from "../schema";
import {
  buildInvoiceNo,
  calculateChange,
  calculateTotals,
  type DiscountInput,
  getDailyCounterKey,
} from "../../lib/transactions";

export class InsufficientStockError extends Error {
  productId: string;
  productName: string;
  requested: number;
  available: number;

  constructor(productId: string, productName: string, requested: number, available: number) {
    super(
      `Insufficient stock for "${productName}". Requested: ${requested}, Available: ${available}`
    );
    this.name = "InsufficientStockError";
    this.productId = productId;
    this.productName = productName;
    this.requested = requested;
    this.available = available;
  }
}

export class SaleAlreadyVoidedError extends Error {
  constructor(invoiceNo: string) {
    super(`Transaction "${invoiceNo}" has already been voided.`);
    this.name = "SaleAlreadyVoidedError";
  }
}

export class TransactionNotFoundError extends Error {
  constructor(id: string) {
    super(`Transaction with ID "${id}" was not found.`);
    this.name = "TransactionNotFoundError";
  }
}

export interface CreateSaleItemInput {
  productId: string;
  qty: number;
}

export interface CreateSaleInput {
  cashierId: string;
  items: CreateSaleItemInput[];
  discount?: DiscountInput;
  paymentMethod: PaymentMethod;
  amountPaid: number;
  customDate?: Date; // For testing or explicit date specification
}

export interface VoidSaleInput {
  voidedBy: string;
  voidReason?: string;
  customDate?: Date;
  userRole?: UserRole;
}

export const transactionsRepo = {
  /**
   * Creates a sale atomically in ONE Dexie read-write transaction.
   * - Validates item stocks.
   * - Aborts and leaves stock untouched if any item is insufficient.
   * - Decrements stock for each item.
   * - Increments the daily sequence in counters.
   * - Stores snapshot items.
   * - Saves and returns the completed transaction.
   */
  async createSale(input: CreateSaleInput, database: PosDatabase = db): Promise<Transaction> {
    if (!input.items || input.items.length === 0) {
      throw new Error("Sale must contain at least one item.");
    }

    const saleDate = input.customDate || new Date();

    return database.transaction(
      "rw",
      [database.products, database.transactions, database.counters, database.stockMovements],
      async () => {
        // 1. Fetch and validate each product
        const itemSnapshots: TransactionItemSnapshot[] = [];
        const productsToUpdate: Array<{ id: string; qty: number; newStock: number }> = [];

        for (const inputItem of input.items) {
          if (inputItem.qty <= 0) {
            throw new Error(
              `Quantity must be greater than zero for product ${inputItem.productId}`
            );
          }

          const product = await database.products.get(inputItem.productId);
          if (!product) {
            throw new Error(`Product ${inputItem.productId} not found.`);
          }

          if (product.stock < inputItem.qty) {
            // Insufficient stock: abort whole transaction by throwing
            throw new InsufficientStockError(
              product.id,
              product.name,
              inputItem.qty,
              product.stock
            );
          }

          const subtotal = product.price * inputItem.qty;
          itemSnapshots.push({
            productId: product.id,
            name: product.name,
            sku: product.sku,
            price: product.price,
            cost: product.cost,
            qty: inputItem.qty,
            subtotal,
          });

          productsToUpdate.push({
            id: product.id,
            qty: inputItem.qty,
            newStock: product.stock - inputItem.qty,
          });
        }

        // 2. Decrement stock for all items
        for (const update of productsToUpdate) {
          await database.products.update(update.id, { stock: update.newStock });
        }

        // 3. Atomically increment daily invoice sequence
        const counterKey = getDailyCounterKey(saleDate);
        const existingCounter = await database.counters.get(counterKey);
        const nextSeq = existingCounter ? existingCounter.seq + 1 : 1;
        await database.counters.put({ id: counterKey, seq: nextSeq });

        const invoiceNo = buildInvoiceNo(saleDate, nextSeq);

        // 4. Calculate totals and payment change
        const totalsResult = calculateTotals(itemSnapshots, input.discount);
        const changeResult = calculateChange(totalsResult.total, input.amountPaid);

        if (!changeResult.isSufficient) {
          throw new Error(
            `Amount paid (${input.amountPaid}) is insufficient for total (${totalsResult.total}).`
          );
        }

        // 5. Assemble transaction record
        const transaction: Transaction = {
          id: crypto.randomUUID(),
          invoiceNo,
          cashierId: input.cashierId,
          items: itemSnapshots,
          subtotal: totalsResult.subtotal,
          discount: totalsResult.discount,
          total: totalsResult.total,
          paymentMethod: input.paymentMethod,
          amountPaid: input.amountPaid,
          change: changeResult.change,
          status: "completed",
          createdAt: saleDate.toISOString(),
        };

        await database.transactions.add(transaction);

        // 6. Record stock movements for all sold items atomically
        for (const update of productsToUpdate) {
          await database.stockMovements.add({
            id: crypto.randomUUID(),
            productId: update.id,
            type: "sale",
            qty: -update.qty,
            resultingStock: update.newStock,
            note: `Invoice ${invoiceNo}`,
            userId: input.cashierId,
            createdAt: saleDate.toISOString(),
          });
        }

        return transaction;
      }
    );
  },

  /**
   * Voids a completed sale atomically.
   * - Only completed sales can be voided.
   * - Restores stock for all snapshot items.
   * - Records voidedBy, voidedAt, and voidReason.
   * - Records void stock movements for each restored product atomically.
   * - Rejects second void attempt on the same transaction.
   */
  async voidSale(
    transactionId: string,
    voidData: VoidSaleInput,
    database: PosDatabase = db
  ): Promise<Transaction> {
    if (voidData.userRole && voidData.userRole !== "admin") {
      throw new Error("Unauthorized: Only admins can void transactions.");
    }

    const voidDate = voidData.customDate || new Date();

    return database.transaction(
      "rw",
      [database.products, database.transactions, database.stockMovements],
      async () => {
        const transaction = await database.transactions.get(transactionId);
        if (!transaction) {
          throw new TransactionNotFoundError(transactionId);
        }

        if (transaction.status === "void") {
          throw new SaleAlreadyVoidedError(transaction.invoiceNo);
        }

        // Restore stock and record stock movements for all items
        for (const item of transaction.items) {
          const product = await database.products.get(item.productId);
          if (product) {
            const newStock = product.stock + item.qty;
            await database.products.update(product.id, {
              stock: newStock,
            });

            await database.stockMovements.add({
              id: crypto.randomUUID(),
              productId: item.productId,
              type: "void",
              qty: item.qty,
              resultingStock: newStock,
              note: voidData.voidReason
                ? `Void ${transaction.invoiceNo}: ${voidData.voidReason}`
                : `Void ${transaction.invoiceNo}`,
              userId: voidData.voidedBy,
              createdAt: voidDate.toISOString(),
            });
          }
        }

        // Update transaction status
        const updatedTransaction: Transaction = {
          ...transaction,
          status: "void",
          voidedBy: voidData.voidedBy,
          voidedAt: voidDate.toISOString(),
          voidReason: voidData.voidReason,
        };

        await database.transactions.put(updatedTransaction);
        return updatedTransaction;
      }
    );
  },

  /**
   * Retrieves transactions filtered by user role.
   * Cashiers can only query their own transactions; admins can see all or filter.
   */
  async getForUser(
    user: { id: string; role: UserRole },
    filters?: {
      startDate?: string;
      endDate?: string;
      cashierId?: string;
      status?: TransactionStatus;
    },
    database: PosDatabase = db
  ): Promise<Transaction[]> {
    const effectiveCashierId = user.role === "kasir" ? user.id : filters?.cashierId;

    return this.getAll(
      {
        ...filters,
        cashierId: effectiveCashierId,
      },
      database
    );
  },

  async getAll(
    filters?: {
      startDate?: string;
      endDate?: string;
      cashierId?: string;
      status?: TransactionStatus;
    },
    database: PosDatabase = db
  ): Promise<Transaction[]> {
    let collection = database.transactions.toCollection();

    if (filters?.status) {
      collection = database.transactions.where("status").equals(filters.status);
    }

    let results = await collection.sortBy("createdAt");
    results.reverse(); // Newest first

    if (filters?.startDate) {
      results = results.filter((tx) => tx.createdAt >= filters.startDate!);
    }
    if (filters?.endDate) {
      results = results.filter((tx) => tx.createdAt <= filters.endDate!);
    }
    if (filters?.cashierId) {
      results = results.filter((tx) => tx.cashierId === filters.cashierId);
    }

    return results;
  },

  async getById(id: string, database: PosDatabase = db): Promise<Transaction | undefined> {
    return database.transactions.get(id);
  },

  async getByInvoiceNo(
    invoiceNo: string,
    database: PosDatabase = db
  ): Promise<Transaction | undefined> {
    return database.transactions.where("invoiceNo").equals(invoiceNo).first();
  },
};

import { db, PosDatabase, type Transaction } from "../schema";
import { getJakartaDateString } from "../../lib/dates";

export interface ReportDateRange {
  startDate?: string; // ISO string
  endDate?: string; // ISO string
}

export interface SalesSummary {
  totalSales: number; // Integer Rupiah
  transactionCount: number;
  averagePerTransaction: number; // Integer Rupiah
  grossProfit: number; // Integer Rupiah
}

export interface TopProductItem {
  productId: string;
  name: string;
  sku: string;
  unitsSold: number;
  revenue: number; // Integer Rupiah
}

export interface DailySalesItem {
  date: string; // YYYY-MM-DD
  totalSales: number; // Integer Rupiah
  transactionCount: number;
}

export const reportsRepo = {
  /**
   * Helper to retrieve completed transactions within the given date range.
   * Strictly excludes void transactions.
   */
  async getCompletedTransactions(
    range?: ReportDateRange,
    database: PosDatabase = db
  ): Promise<Transaction[]> {
    if (range?.startDate && range?.endDate) {
      return database.transactions
        .where("[status+createdAt]")
        .between(["completed", range.startDate], ["completed", range.endDate], true, true)
        .toArray();
    }
    if (range?.startDate) {
      return database.transactions
        .where("[status+createdAt]")
        .between(["completed", range.startDate], ["completed", "\uffff"], true, true)
        .toArray();
    }
    if (range?.endDate) {
      return database.transactions
        .where("[status+createdAt]")
        .between(["completed", ""], ["completed", range.endDate], true, true)
        .toArray();
    }

    return database.transactions.where("status").equals("completed").toArray();
  },

  /**
   * Calculates overall sales summary: totalSales, transactionCount, averagePerTransaction, grossProfit.
   * Strictly excludes void transactions.
   */
  async getSummary(range?: ReportDateRange, database: PosDatabase = db): Promise<SalesSummary> {
    const transactions = await this.getCompletedTransactions(range, database);

    const transactionCount = transactions.length;
    if (transactionCount === 0) {
      return {
        totalSales: 0,
        transactionCount: 0,
        averagePerTransaction: 0,
        grossProfit: 0,
      };
    }

    let totalSales = 0;
    let totalProfit = 0;

    for (const tx of transactions) {
      totalSales += tx.total;

      // Calculate gross profit for this transaction:
      // sum of ((price - cost) * qty) - discount
      let itemProfit = 0;
      for (const item of tx.items) {
        itemProfit += (item.price - item.cost) * item.qty;
      }
      totalProfit += itemProfit - tx.discount;
    }

    const averagePerTransaction = Math.round(totalSales / transactionCount);

    return {
      totalSales,
      transactionCount,
      averagePerTransaction,
      grossProfit: totalProfit,
    };
  },

  /**
   * Returns top products ranked by units sold and revenue.
   * Strictly excludes void transactions.
   */
  async getTopProducts(
    range?: ReportDateRange,
    limit = 10,
    database: PosDatabase = db
  ): Promise<TopProductItem[]> {
    const transactions = await this.getCompletedTransactions(range, database);

    const productMap = new Map<
      string,
      { name: string; sku: string; unitsSold: number; revenue: number }
    >();

    for (const tx of transactions) {
      for (const item of tx.items) {
        const existing = productMap.get(item.productId) || {
          name: item.name,
          sku: item.sku,
          unitsSold: 0,
          revenue: 0,
        };

        existing.unitsSold += item.qty;
        existing.revenue += item.subtotal;
        productMap.set(item.productId, existing);
      }
    }

    const list: TopProductItem[] = Array.from(productMap.entries()).map(([productId, data]) => ({
      productId,
      name: data.name,
      sku: data.sku,
      unitsSold: data.unitsSold,
      revenue: data.revenue,
    }));

    // Sort by units sold descending, then revenue descending
    list.sort((a, b) => b.unitsSold - a.unitsSold || b.revenue - a.revenue);

    return list.slice(0, limit);
  },

  /**
   * Returns daily sales totals for charting.
   * Strictly excludes void transactions.
   */
  async getDailySales(
    range?: ReportDateRange,
    database: PosDatabase = db
  ): Promise<DailySalesItem[]> {
    const transactions = await this.getCompletedTransactions(range, database);

    const dayMap = new Map<string, { totalSales: number; transactionCount: number }>();

    for (const tx of transactions) {
      const dateKey = getJakartaDateString(tx.createdAt);
      const existing = dayMap.get(dateKey) || { totalSales: 0, transactionCount: 0 };
      existing.totalSales += tx.total;
      existing.transactionCount += 1;
      dayMap.set(dateKey, existing);
    }

    const sortedDays = Array.from(dayMap.keys()).sort();
    return sortedDays.map((date) => ({
      date,
      totalSales: dayMap.get(date)!.totalSales,
      transactionCount: dayMap.get(date)!.transactionCount,
    }));
  },

  /**
   * Calculates total valuation of all stock on hand (sum of product.stock * product.cost).
   */
  async getTotalStockValue(database: PosDatabase = db): Promise<number> {
    const products = await database.products.toArray();
    let total = 0;
    for (const p of products) {
      if (p.stock > 0 && p.cost > 0) {
        total += p.stock * p.cost;
      }
    }
    return Math.round(total);
  },
};

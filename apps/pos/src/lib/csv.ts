import type { Transaction } from "../db/schema";
import { formatJakartaDisplayDateTime } from "./dates";
import { formatPaymentMethodName } from "../printing/receipt";

/**
 * Escapes a single CSV value according to RFC 4180.
 * If the string contains comma, quote, or newline, it is enclosed in quotes
 * and existing quotes are escaped as `""`.
 */
export function escapeCsvValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Converts a list of transactions to CSV format with one row per transaction item.
 * Line-item granularity enables comprehensive inventory and accounting analysis.
 */
export function generateTransactionsCsv(
  transactions: Transaction[],
  usersMap?: Map<string, string>
): string {
  const headers = [
    "No Invoice",
    "Waktu (WIB)",
    "Kasir",
    "Metode Pembayaran",
    "SKU",
    "Nama Produk",
    "Harga Satuan",
    "Harga Modal",
    "Jumlah",
    "Subtotal Item",
    "Laba Item",
    "Diskon Transaksi",
    "Total Transaksi",
    "Status",
  ];

  const rows: string[] = [headers.map(escapeCsvValue).join(",")];

  for (const tx of transactions) {
    const cashierName = usersMap?.get(tx.cashierId) || tx.cashierId;
    const waktu = formatJakartaDisplayDateTime(tx.createdAt);
    const paymentMethod = formatPaymentMethodName(tx.paymentMethod);
    const statusText = tx.status === "completed" ? "Selesai" : "Dibatalkan";

    for (const item of tx.items) {
      const itemProfit = (item.price - item.cost) * item.qty;

      const row = [
        tx.invoiceNo,
        waktu,
        cashierName,
        paymentMethod,
        item.sku,
        item.name,
        item.price,
        item.cost,
        item.qty,
        item.subtotal,
        itemProfit,
        tx.discount,
        tx.total,
        statusText,
      ];

      rows.push(row.map(escapeCsvValue).join(","));
    }
  }

  // Prepend UTF-8 BOM (\uFEFF) for Microsoft Excel compatibility on Windows
  return "\uFEFF" + rows.join("\r\n");
}

/**
 * Initiates browser download of a CSV string.
 */
export function downloadCsvFile(filename: string, csvContent: string): void {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

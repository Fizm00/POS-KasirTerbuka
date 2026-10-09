import type { PaperWidth, StoreSettings, Transaction } from "../db/schema";
import { formatDigits } from "../lib/money";

export type ReceiptLineType = "header" | "text" | "two-column" | "divider" | "total" | "footer";

export interface ReceiptLine {
  type: ReceiptLineType;
  align?: "left" | "center" | "right";
  text?: string;
  left?: string;
  right?: string;
  isBold?: boolean;
  isDoubleHeight?: boolean;
}

export interface ReceiptModel {
  paperWidth: PaperWidth;
  columnWidth: number;
  lines: ReceiptLine[];
  rawText: string;
}

export interface BuildReceiptOptions {
  transaction: Transaction;
  settings: StoreSettings;
  cashierName?: string;
  paperWidth?: PaperWidth;
}

/**
 * Centers text within a given column width using spaces.
 */
export function padCenter(text: string, width: number): string {
  const trimmed = text.trim();
  if (trimmed.length >= width) {
    return trimmed.slice(0, width);
  }
  const totalPadding = width - trimmed.length;
  const leftPadding = Math.floor(totalPadding / 2);
  const rightPadding = totalPadding - leftPadding;
  return " ".repeat(leftPadding) + trimmed + " ".repeat(rightPadding);
}

/**
 * Creates a two-column left-and-right justified string of exact width.
 * e.g. padTwoColumns("Subtotal", "52.000", 32)
 */
export function padTwoColumns(left: string, right: string, width: number): string {
  const spaceCount = width - (left.length + right.length);
  if (spaceCount <= 0) {
    // Truncate left string if overflowing
    const maxLeftLength = Math.max(1, width - right.length - 1);
    const truncatedLeft = left.slice(0, maxLeftLength);
    return `${truncatedLeft} ${right}`;
  }
  return `${left}${" ".repeat(spaceCount)}${right}`;
}

/**
 * Formats ISO date string into DD/MM/YYYY and HH:mm
 */
export function formatReceiptDateTime(isoString: string): {
  date: string;
  time: string;
  full: string;
} {
  const d = new Date(isoString);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");

  const date = `${day}/${month}/${year}`;
  const time = `${hours}:${minutes}`;
  return { date, time, full: `${date} ${time}` };
}

/**
 * Translates payment method internal code to Indonesian display text.
 */
export function formatPaymentMethodName(method: string): string {
  switch (method) {
    case "cash":
      return "Tunai";
    case "qris":
      return "QRIS";
    case "transfer":
      return "Transfer";
    default:
      return method;
  }
}

/**
 * Converts a transaction + store settings into a printer-agnostic receipt model.
 * Column widths: 58mm = 32 chars, 80mm = 48 chars.
 */
export function buildReceiptModel(options: BuildReceiptOptions): ReceiptModel {
  const { transaction, settings, cashierName = "Kasir" } = options;
  const paperWidth: PaperWidth = options.paperWidth || settings.paperWidth || 58;
  const columnWidth = paperWidth === 80 ? 48 : 32;

  const lines: ReceiptLine[] = [];
  const textLines: string[] = [];
  const dividerString = "-".repeat(columnWidth);

  const addLine = (line: ReceiptLine, raw: string) => {
    lines.push(line);
    textLines.push(raw);
  };

  const addDivider = () => {
    addLine({ type: "divider", text: dividerString }, dividerString);
  };

  // 1. Header: Store info
  if (settings.storeName) {
    addLine(
      {
        type: "header",
        align: "center",
        text: settings.storeName,
        isBold: true,
      },
      padCenter(settings.storeName, columnWidth)
    );
  }

  if (settings.address) {
    // If address is long, wrap it nicely
    const addressWords = settings.address.split(" ");
    let currentAddressLine = "";
    for (const word of addressWords) {
      if ((currentAddressLine + " " + word).trim().length <= columnWidth) {
        currentAddressLine = (currentAddressLine + " " + word).trim();
      } else {
        if (currentAddressLine) {
          addLine(
            { type: "header", align: "center", text: currentAddressLine },
            padCenter(currentAddressLine, columnWidth)
          );
        }
        currentAddressLine = word;
      }
    }
    if (currentAddressLine) {
      addLine(
        { type: "header", align: "center", text: currentAddressLine },
        padCenter(currentAddressLine, columnWidth)
      );
    }
  }

  if (settings.phone) {
    addLine(
      { type: "header", align: "center", text: settings.phone },
      padCenter(settings.phone, columnWidth)
    );
  }

  // 2. Divider
  addDivider();

  // 3. Invoice & Cashier info
  const dateTime = formatReceiptDateTime(transaction.createdAt);
  addLine({ type: "text", align: "left", text: transaction.invoiceNo }, transaction.invoiceNo);

  const cashierInfo = `Kasir: ${cashierName}`;
  const dateCashierLine = padTwoColumns(dateTime.full, cashierInfo, columnWidth);
  addLine(
    {
      type: "two-column",
      left: dateTime.full,
      right: cashierInfo,
    },
    dateCashierLine
  );

  // 4. Divider
  addDivider();

  // 5. Items list
  for (const item of transaction.items) {
    // Item name
    addLine({ type: "text", align: "left", text: item.name }, item.name);

    // Qty x price subtotal line (indented by 2 spaces)
    const qtyPrice = `  ${item.qty} x ${formatDigits(item.price)}`;
    const itemSubtotal = formatDigits(item.subtotal);
    const itemLineRaw = padTwoColumns(qtyPrice, itemSubtotal, columnWidth);

    addLine(
      {
        type: "two-column",
        left: qtyPrice,
        right: itemSubtotal,
      },
      itemLineRaw
    );
  }

  // 6. Divider
  addDivider();

  // 7. Totals & Payment
  // Subtotal
  const subtotalRaw = padTwoColumns("Subtotal", formatDigits(transaction.subtotal), columnWidth);
  addLine(
    {
      type: "two-column",
      left: "Subtotal",
      right: formatDigits(transaction.subtotal),
    },
    subtotalRaw
  );

  // Discount (if any)
  if (transaction.discount > 0) {
    const discountRaw = padTwoColumns("Diskon", formatDigits(transaction.discount), columnWidth);
    addLine(
      {
        type: "two-column",
        left: "Diskon",
        right: formatDigits(transaction.discount),
      },
      discountRaw
    );
  }

  // TOTAL (bold, double height on printer)
  const totalRaw = padTwoColumns("TOTAL", formatDigits(transaction.total), columnWidth);
  addLine(
    {
      type: "total",
      left: "TOTAL",
      right: formatDigits(transaction.total),
      isBold: true,
      isDoubleHeight: true,
    },
    totalRaw
  );

  // Payment method
  const paymentLabel = formatPaymentMethodName(transaction.paymentMethod);
  const paymentRaw = padTwoColumns(paymentLabel, formatDigits(transaction.amountPaid), columnWidth);
  addLine(
    {
      type: "two-column",
      left: paymentLabel,
      right: formatDigits(transaction.amountPaid),
    },
    paymentRaw
  );

  // Change
  const changeRaw = padTwoColumns("Kembalian", formatDigits(transaction.change), columnWidth);
  addLine(
    {
      type: "two-column",
      left: "Kembalian",
      right: formatDigits(transaction.change),
    },
    changeRaw
  );

  // 8. Divider
  addDivider();

  // 9. Footer
  if (settings.receiptFooter) {
    const footerLines = settings.receiptFooter.split("\n");
    for (const fLine of footerLines) {
      if (fLine.trim()) {
        addLine(
          { type: "footer", align: "center", text: fLine.trim() },
          padCenter(fLine.trim(), columnWidth)
        );
      }
    }
  }

  return {
    paperWidth,
    columnWidth,
    lines,
    rawText: textLines.join("\n"),
  };
}

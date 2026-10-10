import Papa from "papaparse";
import { downloadCsvFile } from "./csv";
import { t } from "../i18n";

export interface CsvValidationError {
  row: number; // 1-indexed row number (data row starts at 2)
  field: string;
  message: string;
}

export type ProductTargetField =
  "name" | "sku" | "category" | "cost" | "price" | "stock" | "lowStockThreshold" | "unmapped";

export type ColumnMapping = Record<string, ProductTargetField>;

export interface ParsedProductRow {
  rowNumber: number;
  name: string;
  sku: string;
  categoryName: string;
  price: number;
  cost: number;
  stock: number;
  lowStockThreshold: number;
}

export interface CsvParseResult {
  headers: string[];
  rawRows: Record<string, string>[];
  totalRows: number;
  previewRows: Record<string, string>[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: CsvValidationError[];
  parsedProducts: ParsedProductRow[];
}

export const MAX_CSV_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_CSV_ROWS = 5000;

export const STANDARD_IMPORT_COLUMNS = [
  "nama",
  "sku",
  "kategori",
  "harga_modal",
  "harga_jual",
  "stok",
  "batas_stok_menipis",
] as const;

/**
 * Generates the official product CSV import template with UTF-8 BOM.
 */
export function generateProductTemplateCsv(): string {
  const headerLine = STANDARD_IMPORT_COLUMNS.join(",");
  const sampleRows = [
    "Kopi Susu Gula Aren,KOP-001,Minuman,8000,15000,50,5",
    "Nasi Goreng Spesial,NAS-001,Makanan,12000,22000,30,5",
    "Es Teh Manis,TEH-001,Minuman,2000,5000,100,10",
  ];
  return "\uFEFF" + [headerLine, ...sampleRows].join("\r\n");
}

/**
 * Downloads the official product CSV template to user's computer.
 */
export function downloadProductTemplateCsv(): void {
  const content = generateProductTemplateCsv();
  downloadCsvFile("template-impor-produk-kasir-terbuka.csv", content);
}

/**
 * Normalizes number strings from Indonesian/US formats into integer Rupiah.
 * Handles "15.000", "15,000", "15000", "15.000,00", "Rp 15.000", etc.
 */
export function parseIntegerRupiah(val: unknown): { num: number; isValid: boolean } {
  if (val === null || val === undefined) return { num: NaN, isValid: false };
  if (typeof val === "number") {
    return { num: Math.round(val), isValid: !isNaN(val) };
  }

  let str = String(val).trim();
  if (!str) return { num: NaN, isValid: false };

  // Strip currency prefixes and whitespace
  str = str
    .replace(/^Rp\.?\s*/i, "")
    .replace(/^IDR\s*/i, "")
    .trim();

  // If both . and , are present
  if (str.includes(".") && str.includes(",")) {
    if (str.lastIndexOf(",") > str.lastIndexOf(".")) {
      // Dot thousands, comma decimal: "15.000,00" -> "15000.00"
      str = str.replace(/\./g, "").replace(",", ".");
    } else {
      // Comma thousands, dot decimal: "15,000.00" -> "15000.00"
      str = str.replace(/,/g, "");
    }
  } else if (str.includes(".")) {
    // Only dots: check if thousands separator pattern
    if (/^\d{1,3}(\.\d{3})+$/.test(str)) {
      str = str.replace(/\./g, "");
    } else {
      const parts = str.split(".");
      if (parts.length === 2 && parts[1].length === 3) {
        str = parts[0] + parts[1];
      }
    }
  } else if (str.includes(",")) {
    // Only commas: check if thousands separator pattern
    if (/^\d{1,3}(,\d{3})+$/.test(str)) {
      str = str.replace(/,/g, "");
    } else {
      const parts = str.split(",");
      if (parts.length === 2 && parts[1].length === 3) {
        str = parts[0] + parts[1];
      } else {
        str = str.replace(",", ".");
      }
    }
  }

  const parsed = parseFloat(str);
  if (isNaN(parsed)) {
    return { num: NaN, isValid: false };
  }
  return { num: Math.round(parsed), isValid: true };
}

/**
 * Proposes initial column mapping based on standard header patterns.
 */
export function guessColumnMapping(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {};

  for (const h of headers) {
    const clean = h.trim().toLowerCase().replace(/[-_]/g, " ");

    if (
      [
        "nama",
        "name",
        "nama produk",
        "product name",
        "nama barang",
        "item name",
        "produk",
      ].includes(clean)
    ) {
      mapping[h] = "name";
    } else if (
      ["sku", "barcode", "kode", "kode produk", "kode barang", "sku / barcode"].includes(clean)
    ) {
      mapping[h] = "sku";
    } else if (["kategori", "category", "kategori produk", "kelompok", "jenis"].includes(clean)) {
      mapping[h] = "category";
    } else if (["harga modal", "cost", "modal", "harga beli", "hpp"].includes(clean)) {
      mapping[h] = "cost";
    } else if (["harga jual", "price", "harga", "jual", "selling price"].includes(clean)) {
      mapping[h] = "price";
    } else if (["stok", "stock", "stok awal", "jumlah", "qty", "quantity"].includes(clean)) {
      mapping[h] = "stock";
    } else if (
      ["batas stok menipis", "low stock", "threshold", "batas stok", "min stock"].includes(clean)
    ) {
      mapping[h] = "lowStockThreshold";
    } else {
      mapping[h] = "unmapped";
    }
  }

  return mapping;
}

/**
 * Parses raw CSV text or File using PapaParse.
 */
export function parseProductCsv(fileContent: string): Promise<CsvParseResult> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(fileContent, {
      header: true,
      skipEmptyLines: "greedy",
      transformHeader: (h) => h.trim(),
      complete: (results) => {
        const headers = results.meta.fields || [];
        const rawRows = results.data;
        resolve({
          headers,
          rawRows,
          totalRows: rawRows.length,
          previewRows: rawRows.slice(0, 20),
        });
      },
      error: (err: Error) => {
        reject(err);
      },
    });
  });
}

/**
 * Validates parsed rows against mapped product fields.
 */
export function validateCsvRows(
  rows: Record<string, string>[],
  mapping: ColumnMapping
): ValidationResult {
  const errors: CsvValidationError[] = [];
  const parsedProducts: ParsedProductRow[] = [];

  // Check required target fields mapped
  const mappedTargets = Object.values(mapping);
  const requiredTargets: ProductTargetField[] = ["name", "sku", "price"];

  for (const req of requiredTargets) {
    if (!mappedTargets.includes(req)) {
      errors.push({
        row: 1,
        field: t(`products.import.fields.${req}`),
        message: t("products.import.errors.missingRequiredHeader", {
          header: t(`products.import.fields.${req}`),
        }),
      });
    }
  }

  if (errors.length > 0) {
    return { isValid: false, errors, parsedProducts: [] };
  }

  // Reverse mapping: TargetField -> CSV Header
  const targetToHeader = new Map<ProductTargetField, string>();
  for (const [csvHeader, targetField] of Object.entries(mapping)) {
    if (targetField !== "unmapped" && !targetToHeader.has(targetField)) {
      targetToHeader.set(targetField, csvHeader);
    }
  }

  const nameHeader = targetToHeader.get("name")!;
  const skuHeader = targetToHeader.get("sku")!;
  const categoryHeader = targetToHeader.get("category");
  const priceHeader = targetToHeader.get("price")!;
  const costHeader = targetToHeader.get("cost");
  const stockHeader = targetToHeader.get("stock");
  const thresholdHeader = targetToHeader.get("lowStockThreshold");

  const seenSkus = new Map<string, number>();

  rows.forEach((row, index) => {
    const rowNumber = index + 2; // Row 1 is header, first data row is 2

    // 1. Name validation
    const rawName = row[nameHeader]?.trim() || "";
    if (!rawName) {
      errors.push({
        row: rowNumber,
        field: t("products.import.fields.name"),
        message: t("products.import.errors.missingName"),
      });
    }

    // 2. SKU validation
    const rawSku = row[skuHeader]?.trim() || "";
    if (!rawSku) {
      errors.push({
        row: rowNumber,
        field: t("products.import.fields.sku"),
        message: t("products.import.errors.missingSku"),
      });
    } else {
      const lowerSku = rawSku.toLowerCase();
      if (seenSkus.has(lowerSku)) {
        errors.push({
          row: rowNumber,
          field: t("products.import.fields.sku"),
          message: t("products.import.errors.duplicateSkuInCsv", {
            row: seenSkus.get(lowerSku)!,
          }),
        });
      } else {
        seenSkus.set(lowerSku, rowNumber);
      }
    }

    // 3. Price validation
    const rawPrice = row[priceHeader];
    const priceResult = parseIntegerRupiah(rawPrice);
    if (!priceResult.isValid || priceResult.num < 0) {
      errors.push({
        row: rowNumber,
        field: t("products.import.fields.price"),
        message: t("products.import.errors.invalidPrice"),
      });
    }

    // 4. Cost validation (optional, defaults to 0)
    let cost = 0;
    if (costHeader && row[costHeader] !== undefined && row[costHeader].trim() !== "") {
      const costResult = parseIntegerRupiah(row[costHeader]);
      if (!costResult.isValid || costResult.num < 0) {
        errors.push({
          row: rowNumber,
          field: t("products.import.fields.cost"),
          message: t("products.import.errors.invalidCost"),
        });
      } else {
        cost = costResult.num;
      }
    }

    // 5. Stock validation (optional, defaults to 0)
    let stock = 0;
    if (stockHeader && row[stockHeader] !== undefined && row[stockHeader].trim() !== "") {
      const stockResult = parseIntegerRupiah(row[stockHeader]);
      if (!stockResult.isValid || stockResult.num < 0) {
        errors.push({
          row: rowNumber,
          field: t("products.import.fields.stock"),
          message: t("products.import.errors.invalidStock"),
        });
      } else {
        stock = stockResult.num;
      }
    }

    // 6. Low stock threshold validation (optional, defaults to 5)
    let lowStockThreshold = 5;
    if (
      thresholdHeader &&
      row[thresholdHeader] !== undefined &&
      row[thresholdHeader].trim() !== ""
    ) {
      const threshResult = parseIntegerRupiah(row[thresholdHeader]);
      if (!threshResult.isValid || threshResult.num < 0) {
        errors.push({
          row: rowNumber,
          field: t("products.import.fields.lowStockThreshold"),
          message: t("products.import.errors.invalidThreshold"),
        });
      } else {
        lowStockThreshold = threshResult.num;
      }
    }

    // 7. Category name (optional, defaults to "Umum" if empty)
    const categoryName = categoryHeader ? row[categoryHeader]?.trim() || "Umum" : "Umum";

    parsedProducts.push({
      rowNumber,
      name: rawName,
      sku: rawSku,
      categoryName,
      price: priceResult.num || 0,
      cost,
      stock,
      lowStockThreshold,
    });
  });

  return {
    isValid: errors.length === 0,
    errors,
    parsedProducts: errors.length === 0 ? parsedProducts : [],
  };
}

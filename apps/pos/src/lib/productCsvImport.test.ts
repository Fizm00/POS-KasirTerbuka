import { describe, expect, it } from "vitest";
import {
  generateProductTemplateCsv,
  parseIntegerRupiah,
  guessColumnMapping,
  parseProductCsv,
  validateCsvRows,
  STANDARD_IMPORT_COLUMNS,
} from "./productCsvImport";

describe("productCsvImport", () => {
  describe("template round-trip", () => {
    it("generates template with standard columns and parses back identically", async () => {
      const template = generateProductTemplateCsv();
      expect(template.startsWith("\uFEFF")).toBe(true);

      const parsed = await parseProductCsv(template);
      expect(parsed.headers).toEqual([...STANDARD_IMPORT_COLUMNS]);
      expect(parsed.totalRows).toBe(3);

      const mapping = guessColumnMapping(parsed.headers);
      const validation = validateCsvRows(parsed.rawRows, mapping);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
      expect(validation.parsedProducts).toHaveLength(3);
      expect(validation.parsedProducts[0].name).toBe("Kopi Susu Gula Aren");
      expect(validation.parsedProducts[0].sku).toBe("KOP-001");
      expect(validation.parsedProducts[0].price).toBe(15000);
    });
  });

  describe("number formatting (thousand & decimal separators)", () => {
    it("parses plain integers", () => {
      expect(parseIntegerRupiah("15000")).toEqual({ num: 15000, isValid: true });
      expect(parseIntegerRupiah(25000)).toEqual({ num: 25000, isValid: true });
    });

    it("parses Indonesian dot thousand separators (15.000, 1.500.000)", () => {
      expect(parseIntegerRupiah("15.000")).toEqual({ num: 15000, isValid: true });
      expect(parseIntegerRupiah("1.500.000")).toEqual({ num: 1500000, isValid: true });
    });

    it("parses US comma thousand separators (15,000, 1,500,000)", () => {
      expect(parseIntegerRupiah("15,000")).toEqual({ num: 15000, isValid: true });
      expect(parseIntegerRupiah("1,500,000")).toEqual({ num: 1500000, isValid: true });
    });

    it("parses Indonesian decimal notation with dot thousands and comma decimal (15.000,50)", () => {
      expect(parseIntegerRupiah("15.000,50")).toEqual({ num: 15001, isValid: true });
      expect(parseIntegerRupiah("15.000,00")).toEqual({ num: 15000, isValid: true });
    });

    it("parses US decimal notation with comma thousands and dot decimal (15,000.50)", () => {
      expect(parseIntegerRupiah("15,000.50")).toEqual({ num: 15001, isValid: true });
      expect(parseIntegerRupiah("15,000.00")).toEqual({ num: 15000, isValid: true });
    });

    it("handles currency prefix (Rp, IDR) and whitespace", () => {
      expect(parseIntegerRupiah("Rp 25.000")).toEqual({ num: 25000, isValid: true });
      expect(parseIntegerRupiah(" Rp. 10.000 ")).toEqual({ num: 10000, isValid: true });
      expect(parseIntegerRupiah("IDR 50.000")).toEqual({ num: 50000, isValid: true });
    });

    it("detects invalid numbers and empty values", () => {
      expect(parseIntegerRupiah("abc").isValid).toBe(false);
      expect(parseIntegerRupiah("").isValid).toBe(false);
      expect(parseIntegerRupiah(null).isValid).toBe(false);
    });
  });

  describe("CSV row validation", () => {
    it("reports error when required fields are missing", async () => {
      const csv = `nama,sku,harga_jual\n,KOP-001,15000\nKopi Susu,,15000`;
      const parsed = await parseProductCsv(csv);
      const mapping = guessColumnMapping(parsed.headers);
      const result = validateCsvRows(parsed.rawRows, mapping);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(2);
      expect(result.errors[0].row).toBe(2); // row 2 missing name
      expect(result.errors[1].row).toBe(3); // row 3 missing sku
    });

    it("detects duplicate SKUs within the same CSV", async () => {
      const csv = `nama,sku,harga_jual\nKopi Susu,KOP-001,15000\nKopi Latte,kop-001,20000`;
      const parsed = await parseProductCsv(csv);
      const mapping = guessColumnMapping(parsed.headers);
      const result = validateCsvRows(parsed.rawRows, mapping);

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === "SKU")).toBe(true);
      expect(result.errors[0].row).toBe(3);
    });

    it("rejects rows with invalid price, cost, or stock", async () => {
      const csv = `nama,sku,harga_jual,harga_modal,stok\nKopi Susu,KOP-001,-5000,dua_ribu,minus_satu`;
      const parsed = await parseProductCsv(csv);
      const mapping = guessColumnMapping(parsed.headers);
      const result = validateCsvRows(parsed.rawRows, mapping);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(3);
    });

    it("applies defaults for optional fields when valid", async () => {
      const csv = `nama,sku,harga_jual\nTeh Botol,TEH-001,5000`;
      const parsed = await parseProductCsv(csv);
      const mapping = guessColumnMapping(parsed.headers);
      const result = validateCsvRows(parsed.rawRows, mapping);

      expect(result.isValid).toBe(true);
      expect(result.parsedProducts[0].categoryName).toBe("Umum");
      expect(result.parsedProducts[0].cost).toBe(0);
      expect(result.parsedProducts[0].stock).toBe(0);
      expect(result.parsedProducts[0].lowStockThreshold).toBe(5);
    });
  });
});

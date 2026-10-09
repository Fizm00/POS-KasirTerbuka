import { describe, expect, it } from "vitest";
import { formatDigits, formatRupiah, parseRupiah } from "./money";

describe("formatRupiah", () => {
  it("formats zero correctly", () => {
    expect(formatRupiah(0)).toBe("Rp 0");
  });

  it("formats standard amounts with dot separator", () => {
    expect(formatRupiah(25000)).toBe("Rp 25.000");
    expect(formatRupiah(1000000)).toBe("Rp 1.000.000");
    expect(formatRupiah(500)).toBe("Rp 500");
  });

  it("formats negative amounts", () => {
    expect(formatRupiah(-15000)).toBe("-Rp 15.000");
  });

  it("handles non-integer floats by rounding", () => {
    expect(formatRupiah(25000.4)).toBe("Rp 25.000");
    expect(formatRupiah(25000.6)).toBe("Rp 25.001");
  });

  it("handles invalid inputs gracefully", () => {
    expect(formatRupiah(NaN)).toBe("Rp 0");
  });
});

describe("formatDigits", () => {
  it("formats numbers with thousands separators", () => {
    expect(formatDigits(25000)).toBe("25.000");
    expect(formatDigits(0)).toBe("0");
    expect(formatDigits(1234567)).toBe("1.234.567");
  });
});

describe("parseRupiah", () => {
  it("parses empty or non-string to 0", () => {
    expect(parseRupiah("")).toBe(0);
    expect(parseRupiah("   ")).toBe(0);
  });

  it("parses raw numeric string", () => {
    expect(parseRupiah("25000")).toBe(25000);
  });

  it("parses formatted string with Rp and dots", () => {
    expect(parseRupiah("Rp 25.000")).toBe(25000);
    expect(parseRupiah("Rp 1.500.000")).toBe(1500000);
  });

  it("parses negative amounts", () => {
    expect(parseRupiah("-Rp 25.000")).toBe(-25000);
    expect(parseRupiah("-5000")).toBe(-5000);
  });

  it("handles numbers directly", () => {
    expect(parseRupiah(25000)).toBe(25000);
  });
});

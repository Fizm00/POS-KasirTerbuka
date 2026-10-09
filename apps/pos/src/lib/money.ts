/**
 * Money utilities for Indonesian Rupiah.
 * All amounts are stored and calculated as integer Rupiah.
 */

const formatter = new Intl.NumberFormat("id-ID", {
  maximumFractionDigits: 0,
});

/**
 * Formats an integer Rupiah amount into "Rp X.XXX".
 * Example: formatRupiah(25000) => "Rp 25.000"
 */
export function formatRupiah(amount: number): string {
  if (typeof amount !== "number" || Number.isNaN(amount)) {
    return "Rp 0";
  }

  const rounded = Math.round(amount);
  if (rounded < 0) {
    return `-Rp ${formatter.format(Math.abs(rounded))}`;
  }

  return `Rp ${formatter.format(rounded)}`;
}

/**
 * Formats a number with thousands separators (without "Rp" prefix).
 * Example: formatDigits(25000) => "25.000"
 */
export function formatDigits(amount: number): string {
  if (typeof amount !== "number" || Number.isNaN(amount)) {
    return "0";
  }
  return formatter.format(Math.round(amount));
}

/**
 * Parses a formatted or unformatted string into an integer Rupiah.
 * Strips non-digit characters.
 * Example: parseRupiah("Rp 25.000") => 25000
 */
export function parseRupiah(value: string | number): number {
  if (typeof value === "number") {
    return Number.isNaN(value) ? 0 : Math.round(value);
  }

  if (!value || typeof value !== "string") {
    return 0;
  }

  const isNegative = value.trim().startsWith("-");
  const digitsOnly = value.replace(/\D/g, "");

  if (!digitsOnly) {
    return 0;
  }

  const parsed = parseInt(digitsOnly, 10);
  return isNegative ? -parsed : parsed;
}

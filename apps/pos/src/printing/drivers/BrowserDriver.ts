import type { PrinterDriver, PrinterDriverId } from "./types";

/**
 * Universal fallback driver using standard browser print dialog.
 * Supported across 100% of browsers and platforms.
 */
export class BrowserDriver implements PrinterDriver {
  readonly id: PrinterDriverId = "browser";
  readonly name = "Dialog Cetak Browser (window.print)";

  isSupported(): boolean {
    return typeof window !== "undefined" && typeof window.print === "function";
  }

  async connect(): Promise<void> {
    // Browser print doesn't need physical port connection
    return Promise.resolve();
  }

  async write(bytes: Uint8Array): Promise<void> {
    void bytes;
    // When writing via browser print driver, invoke browser print dialog
    if (typeof window !== "undefined" && typeof window.print === "function") {
      window.print();
    }
  }

  async disconnect(): Promise<void> {
    return Promise.resolve();
  }

  isConnected(): boolean {
    return true;
  }

  getDeviceName(): string | null {
    return "Browser Print (Sistem)";
  }
}

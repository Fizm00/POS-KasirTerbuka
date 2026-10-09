import type { Transaction, StoreSettings } from "../db/schema";
import { settingsRepo } from "../db/repositories/settingsRepo";
import { buildReceiptModel } from "./receipt";
import { buildEscPosBytes, buildCashDrawerBytes, buildTestPrintBytes } from "./escpos/builder";
import type { PrinterDriver, PrinterDriverId } from "./drivers/types";
import { BrowserDriver } from "./drivers/BrowserDriver";
import { MockDriver } from "./drivers/MockDriver";
import { WebSerialDriver } from "./drivers/WebSerialDriver";
import { WebUsbDriver } from "./drivers/WebUsbDriver";
import { WebBluetoothDriver } from "./drivers/WebBluetoothDriver";
import { TauriDriver } from "./drivers/TauriDriver";
import { CapacitorBtDriver } from "./drivers/CapacitorBtDriver";

export interface PrintResult {
  success: boolean;
  error?: string;
}

export class PrinterService {
  private drivers: Map<PrinterDriverId, PrinterDriver> = new Map();
  private activeDriverId: PrinterDriverId = "browser";
  private lastTransaction: Transaction | null = null;

  constructor() {
    this.registerDriver(new BrowserDriver());
    this.registerDriver(new WebSerialDriver());
    this.registerDriver(new WebUsbDriver());
    this.registerDriver(new WebBluetoothDriver());
    this.registerDriver(new TauriDriver());
    this.registerDriver(new CapacitorBtDriver());
    this.registerDriver(new MockDriver());
  }

  registerDriver(driver: PrinterDriver): void {
    this.drivers.set(driver.id, driver);
  }

  getDriver(id: PrinterDriverId): PrinterDriver | undefined {
    return this.drivers.get(id);
  }

  getActiveDriver(): PrinterDriver {
    return this.drivers.get(this.activeDriverId) || this.drivers.get("browser")!;
  }

  getActiveDriverId(): PrinterDriverId {
    return this.activeDriverId;
  }

  getAvailableDrivers(): Array<{ id: PrinterDriverId; name: string; isSupported: boolean }> {
    const list: Array<{ id: PrinterDriverId; name: string; isSupported: boolean }> = [];
    for (const driver of this.drivers.values()) {
      if (driver.id !== "mock") {
        list.push({
          id: driver.id,
          name: driver.name,
          isSupported: driver.isSupported(),
        });
      }
    }
    return list;
  }

  private configureDriverFromSettings(settings: StoreSettings): void {
    const tauriDriver = this.drivers.get("tauri") as TauriDriver | undefined;
    if (tauriDriver && settings.printer?.target) {
      const target = settings.printer.target.trim();
      if (target.includes(":") || target.startsWith("tcp://")) {
        tauriDriver.configure({
          connectionType: "network",
          networkAddress: target.replace("tcp://", ""),
        });
      } else {
        tauriDriver.configure({
          connectionType: "serial",
          portName: target,
        });
      }
    }

    const capBtDriver = this.drivers.get("capacitor-bt") as CapacitorBtDriver | undefined;
    if (capBtDriver && settings.printer?.target) {
      capBtDriver.configure({ address: settings.printer.target.trim() });
    }
  }

  /**
   * Initializes printer driver from stored settings.
   */
  async initFromSettings(): Promise<void> {
    try {
      const settings = await settingsRepo.getSettings();
      const savedType = settings.printer?.type as PrinterDriverId | undefined;
      if (savedType && this.drivers.has(savedType)) {
        this.activeDriverId = savedType;
      }
      this.configureDriverFromSettings(settings);
    } catch {
      this.activeDriverId = "browser";
    }
  }

  /**
   * Sets active driver and persists choice to settings.
   */
  async setActiveDriver(id: PrinterDriverId, persist: boolean = true): Promise<void> {
    if (!this.drivers.has(id)) {
      throw new Error(`Driver dengan id '${id}' tidak terdaftar.`);
    }

    const previous = this.getActiveDriver();
    if (previous.id !== id && previous.isConnected?.()) {
      await previous.disconnect().catch(() => {});
    }

    this.activeDriverId = id;

    if (persist) {
      try {
        const currentSettings = await settingsRepo.getSettings();
        await settingsRepo.updateSettings({
          printer: {
            ...currentSettings.printer,
            type: id,
          },
        });
      } catch {
        // Non-blocking if settings update fails
      }
    }
  }

  /**
   * Connects the active driver.
   */
  async connect(): Promise<void> {
    const driver = this.getActiveDriver();
    await driver.connect();
  }

  /**
   * Disconnects the active driver.
   */
  async disconnect(): Promise<void> {
    const driver = this.getActiveDriver();
    await driver.disconnect();
  }

  /**
   * Prints a receipt for a transaction.
   * Never throws: returns { success, error } so sales are never blocked.
   */
  async printReceipt(
    transaction: Transaction,
    options: {
      cashierName?: string;
      customSettings?: StoreSettings;
    } = {}
  ): Promise<PrintResult> {
    this.lastTransaction = transaction;

    try {
      const settings = options.customSettings || (await settingsRepo.getSettings());
      this.configureDriverFromSettings(settings);
      const driver = this.getActiveDriver();
      const openDrawer = Boolean(settings.printer?.cashDrawer);

      if (driver.id === "browser") {
        // Fallback browser print (window.print)
        await driver.write(new Uint8Array(0));
        return { success: true };
      }

      // Raw ESC/POS drivers (serial, usb, bluetooth, mock)
      const receipt = buildReceiptModel({
        transaction,
        settings,
        cashierName: options.cashierName || "Kasir",
        paperWidth: settings.paperWidth || 58,
      });

      const bytes = buildEscPosBytes(receipt, {
        openCashDrawer: openDrawer,
        cut: true,
      });

      await driver.write(bytes);
      return { success: true };
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : "Terjadi kesalahan saat mencetak struk.";
      return { success: false, error: errorMsg };
    }
  }

  /**
   * Prints a diagnostic test page on the active driver.
   */
  async printTestPage(customSettings?: StoreSettings): Promise<PrintResult> {
    try {
      const settings = customSettings || (await settingsRepo.getSettings());
      this.configureDriverFromSettings(settings);
      const driver = this.getActiveDriver();

      if (driver.id === "browser") {
        await driver.write(new Uint8Array(0));
        return { success: true };
      }

      const bytes = buildTestPrintBytes(
        settings.paperWidth || 58,
        settings.storeName || "Kasir Terbuka"
      );
      await driver.write(bytes);
      return { success: true };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Gagal mencetak halaman tes.";
      return { success: false, error: errorMsg };
    }
  }

  /**
   * Triggers the cash drawer to open.
   */
  async openCashDrawer(): Promise<PrintResult> {
    try {
      const driver = this.getActiveDriver();
      if (driver.id === "browser") {
        return {
          success: false,
          error:
            "Buka laci otomatis membutuhkan koneksi printer ESC/POS fisik (USB/Serial/Bluetooth).",
        };
      }

      const bytes = buildCashDrawerBytes();
      await driver.write(bytes);
      return { success: true };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Gagal membuka laci kasir.";
      return { success: false, error: errorMsg };
    }
  }

  /**
   * Reprints the last completed transaction receipt.
   */
  async reprintLastReceipt(): Promise<PrintResult> {
    if (!this.lastTransaction) {
      return {
        success: false,
        error: "Belum ada transaksi sebelumnya untuk dicetak ulang.",
      };
    }
    return this.printReceipt(this.lastTransaction);
  }

  getLastTransaction(): Transaction | null {
    return this.lastTransaction;
  }
}

// Global singleton instance
export const printerService = new PrinterService();

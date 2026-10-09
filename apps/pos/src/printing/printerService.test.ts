import { beforeEach, describe, expect, it } from "vitest";
import { PrinterService } from "./printerService";
import { MockDriver } from "./drivers/MockDriver";
import { db, type StoreSettings, type Transaction } from "../db/schema";
import { settingsRepo } from "../db/repositories/settingsRepo";

describe("PrinterService", () => {
  let service: PrinterService;
  let mockDriver: MockDriver;

  const testSettings: StoreSettings = {
    id: "default",
    storeName: "Warung Kopi Jaya",
    address: "Jl. Pemuda No. 45",
    phone: "0812-9988-7766",
    receiptFooter: "Matur Nuwun",
    paperWidth: 58,
    currency: "IDR",
    printer: {
      type: "mock",
      cashDrawer: true,
    },
  };

  const testTx: Transaction = {
    id: "tx-service-01",
    invoiceNo: "INV-20261009-0005",
    cashierId: "u-1",
    items: [
      {
        productId: "p-1",
        name: "Es Teh Manis",
        sku: "ETH-01",
        price: 5000,
        cost: 2000,
        qty: 2,
        subtotal: 10000,
      },
    ],
    subtotal: 10000,
    discount: 0,
    total: 10000,
    paymentMethod: "cash",
    amountPaid: 10000,
    change: 0,
    status: "completed",
    createdAt: "2026-10-09T08:00:00.000Z",
  };

  beforeEach(async () => {
    await db.settings.clear();
    await settingsRepo.updateSettings(testSettings);

    service = new PrinterService();
    mockDriver = new MockDriver();
    service.registerDriver(mockDriver);
    await service.setActiveDriver("mock", false);
  });

  it("registers drivers and sets active driver", async () => {
    expect(service.getActiveDriverId()).toBe("mock");
    expect(service.getActiveDriver()).toBe(mockDriver);

    await service.setActiveDriver("browser", false);
    expect(service.getActiveDriverId()).toBe("browser");
  });

  it("prints transaction receipt cleanly via active driver without throwing", async () => {
    const res = await service.printReceipt(testTx, {
      cashierName: "Budi",
      customSettings: testSettings,
    });

    expect(res.success).toBe(true);
    expect(mockDriver.writtenChunks.length).toBeGreaterThan(0);

    const allBytes = mockDriver.getAllWrittenBytes();
    // Verify ESC @ (0x1B, 0x40) at start
    expect(allBytes[0]).toBe(0x1b);
    expect(allBytes[1]).toBe(0x40);

    // Verify last transaction recorded
    expect(service.getLastTransaction()).toEqual(testTx);
  });

  it("reprints last transaction receipt", async () => {
    await service.printReceipt(testTx, { customSettings: testSettings });
    mockDriver.clear();

    const reprintRes = await service.reprintLastReceipt();
    expect(reprintRes.success).toBe(true);
    expect(mockDriver.writtenChunks.length).toBeGreaterThan(0);
  });

  it("handles driver failure gracefully without failing or blocking sale", async () => {
    mockDriver.setShouldFail(true, "Kabel printer terputus");

    const res = await service.printReceipt(testTx, {
      customSettings: testSettings,
    });

    // Printing never throws: returns success: false with clear error message
    expect(res.success).toBe(false);
    expect(res.error).toContain("Kabel printer terputus");
  });

  it("opens cash drawer on ESC/POS driver", async () => {
    const res = await service.openCashDrawer();
    expect(res.success).toBe(true);
    expect(mockDriver.writtenChunks.length).toBeGreaterThan(0);

    const bytes = mockDriver.getAllWrittenBytes();
    expect(bytes).toContain(0x70); // pulse command
  });

  it("prints diagnostic test page", async () => {
    const res = await service.printTestPage(testSettings);
    expect(res.success).toBe(true);
    expect(mockDriver.writtenChunks.length).toBeGreaterThan(0);
  });

  it("falls back to browser print without errors when browser driver is active", async () => {
    await service.setActiveDriver("browser", false);
    const res = await service.printReceipt(testTx, {
      customSettings: testSettings,
    });
    expect(res.success).toBe(true);
  });

  it("registers TauriDriver by default and configures it from settings", async () => {
    const tauriDriver = service.getDriver("tauri");
    expect(tauriDriver).toBeDefined();
    expect(tauriDriver?.id).toBe("tauri");

    await settingsRepo.updateSettings({
      printer: {
        type: "tauri",
        target: "COM5",
      },
    });

    await service.initFromSettings();
    expect(service.getActiveDriverId()).toBe("tauri");
  });

  it("registers CapacitorBtDriver by default and configures it from settings", async () => {
    const capBtDriver = service.getDriver("capacitor-bt");
    expect(capBtDriver).toBeDefined();
    expect(capBtDriver?.id).toBe("capacitor-bt");

    await settingsRepo.updateSettings({
      printer: {
        type: "capacitor-bt",
        target: "00:11:22:33:44:55",
      },
    });

    await service.initFromSettings();
    expect(service.getActiveDriverId()).toBe("capacitor-bt");
  });
});

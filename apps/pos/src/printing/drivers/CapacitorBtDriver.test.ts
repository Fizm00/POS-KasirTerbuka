import { describe, it, expect, vi, beforeEach } from "vitest";
import { CapacitorBtDriver, BluetoothPrinter } from "./CapacitorBtDriver";
import * as platform from "../../lib/platform";

vi.mock("../../lib/platform", () => ({
  isCapacitor: vi.fn(),
  isAndroid: vi.fn(),
}));

vi.mock("@capacitor/core", () => ({
  registerPlugin: vi.fn(() => ({
    listBondedDevices: vi.fn(),
    printRaw: vi.fn(),
  })),
  Capacitor: {
    isNativePlatform: vi.fn(),
    getPlatform: vi.fn(),
  },
}));

describe("CapacitorBtDriver", () => {
  let driver: CapacitorBtDriver;

  beforeEach(() => {
    vi.clearAllMocks();
    driver = new CapacitorBtDriver();
  });

  it("checks platform support via isCapacitor() && isAndroid()", () => {
    vi.mocked(platform.isCapacitor).mockReturnValue(true);
    vi.mocked(platform.isAndroid).mockReturnValue(true);
    expect(driver.isSupported()).toBe(true);

    vi.mocked(platform.isAndroid).mockReturnValue(false);
    expect(driver.isSupported()).toBe(false);

    vi.mocked(platform.isCapacitor).mockReturnValue(false);
    expect(driver.isSupported()).toBe(false);
  });

  it("connects when supported and disconnects properly", async () => {
    vi.mocked(platform.isCapacitor).mockReturnValue(true);
    vi.mocked(platform.isAndroid).mockReturnValue(true);

    expect(driver.isConnected()).toBe(false);
    await driver.connect();
    expect(driver.isConnected()).toBe(true);

    await driver.disconnect();
    expect(driver.isConnected()).toBe(false);
  });

  it("throws on connect if not supported", async () => {
    vi.mocked(platform.isCapacitor).mockReturnValue(false);

    await expect(driver.connect()).rejects.toThrow(
      "Capacitor Bluetooth driver hanya didukung di aplikasi Android."
    );
  });

  it("lists bonded devices from native plugin", async () => {
    vi.mocked(platform.isCapacitor).mockReturnValue(true);
    vi.mocked(platform.isAndroid).mockReturnValue(true);

    vi.mocked(BluetoothPrinter.listBondedDevices).mockResolvedValueOnce({
      devices: [
        { name: "RPP02N", address: "66:22:33:44:55:66" },
        { name: "MPT-II", address: "11:22:33:44:55:66" },
      ],
    });

    const devices = await driver.listBondedDevices();
    expect(devices).toHaveLength(2);
    expect(devices[0].name).toBe("RPP02N");
    expect(BluetoothPrinter.listBondedDevices).toHaveBeenCalled();
  });

  it("returns empty array for listBondedDevices when unsupported or upon error", async () => {
    vi.mocked(platform.isCapacitor).mockReturnValue(false);
    expect(await driver.listBondedDevices()).toEqual([]);

    vi.mocked(platform.isCapacitor).mockReturnValue(true);
    vi.mocked(platform.isAndroid).mockReturnValue(true);
    vi.mocked(BluetoothPrinter.listBondedDevices).mockRejectedValueOnce(new Error("BT error"));
    expect(await driver.listBondedDevices()).toEqual([]);
  });

  it("writes bytes via printRaw with configured address", async () => {
    vi.mocked(platform.isCapacitor).mockReturnValue(true);
    vi.mocked(platform.isAndroid).mockReturnValue(true);
    vi.mocked(BluetoothPrinter.printRaw).mockResolvedValueOnce(undefined);

    driver.configure({
      address: "00:11:22:33:44:55",
      deviceName: "POS-58",
    });

    const bytes = new Uint8Array([0x1b, 0x40, 0x0a]);
    await driver.write(bytes);

    expect(BluetoothPrinter.printRaw).toHaveBeenCalledWith({
      address: "00:11:22:33:44:55",
      data: [27, 64, 10],
    });
  });

  it("auto-selects first bonded device if address is not specified", async () => {
    vi.mocked(platform.isCapacitor).mockReturnValue(true);
    vi.mocked(platform.isAndroid).mockReturnValue(true);

    vi.mocked(BluetoothPrinter.listBondedDevices).mockResolvedValueOnce({
      devices: [{ name: "Printer-58", address: "AA:BB:CC:DD:EE:FF" }],
    });
    vi.mocked(BluetoothPrinter.printRaw).mockResolvedValueOnce(undefined);

    const bytes = new Uint8Array([1, 2]);
    await driver.write(bytes);

    expect(BluetoothPrinter.printRaw).toHaveBeenCalledWith({
      address: "AA:BB:CC:DD:EE:FF",
      data: [1, 2],
    });
  });

  it("throws when writing without address and no paired devices found", async () => {
    vi.mocked(platform.isCapacitor).mockReturnValue(true);
    vi.mocked(platform.isAndroid).mockReturnValue(true);

    vi.mocked(BluetoothPrinter.listBondedDevices).mockResolvedValueOnce({
      devices: [],
    });

    const bytes = new Uint8Array([1]);
    await expect(driver.write(bytes)).rejects.toThrow(
      "Printer Bluetooth belum dipilih dan tidak ada perangkat yang terpasang (paired)."
    );
  });

  it("returns proper device names", () => {
    driver.configure({ deviceName: "Zjiang 58" });
    expect(driver.getDeviceName()).toBe("Bluetooth Printer (Zjiang 58)");

    driver.configure({ deviceName: "", address: "AA:BB:CC:DD:EE:FF" });
    expect(driver.getDeviceName()).toBe("Bluetooth Printer (AA:BB:CC:DD:EE:FF)");
  });
});

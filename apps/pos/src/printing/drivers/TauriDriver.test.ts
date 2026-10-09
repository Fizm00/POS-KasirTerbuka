import { describe, it, expect, vi, beforeEach } from "vitest";
import { TauriDriver } from "./TauriDriver";
import * as platform from "../../lib/platform";
import * as tauriCore from "@tauri-apps/api/core";

vi.mock("../../lib/platform", () => ({
  isTauri: vi.fn(),
  isBrowser: vi.fn(),
  getPlatform: vi.fn(),
}));

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
  isTauri: vi.fn(),
}));

describe("TauriDriver", () => {
  let driver: TauriDriver;

  beforeEach(() => {
    vi.clearAllMocks();
    driver = new TauriDriver();
  });

  it("checks platform support via isTauri()", () => {
    vi.mocked(platform.isTauri).mockReturnValue(true);
    expect(driver.isSupported()).toBe(true);

    vi.mocked(platform.isTauri).mockReturnValue(false);
    expect(driver.isSupported()).toBe(false);
  });

  it("connects when supported and disconnects properly", async () => {
    vi.mocked(platform.isTauri).mockReturnValue(true);

    expect(driver.isConnected()).toBe(false);
    await driver.connect();
    expect(driver.isConnected()).toBe(true);

    await driver.disconnect();
    expect(driver.isConnected()).toBe(false);
  });

  it("throws on connect if not supported", async () => {
    vi.mocked(platform.isTauri).mockReturnValue(false);

    await expect(driver.connect()).rejects.toThrow(
      "Tauri driver hanya didukung di aplikasi desktop Tauri."
    );
  });

  it("lists serial ports via invoke", async () => {
    vi.mocked(platform.isTauri).mockReturnValue(true);
    vi.mocked(tauriCore.invoke).mockResolvedValueOnce(["COM1", "COM3"]);

    const ports = await driver.listSerialPorts();
    expect(ports).toEqual(["COM1", "COM3"]);
    expect(tauriCore.invoke).toHaveBeenCalledWith("list_serial_ports");
  });

  it("returns empty array for listSerialPorts when unsupported or upon error", async () => {
    vi.mocked(platform.isTauri).mockReturnValue(false);
    expect(await driver.listSerialPorts()).toEqual([]);

    vi.mocked(platform.isTauri).mockReturnValue(true);
    vi.mocked(tauriCore.invoke).mockRejectedValueOnce(new Error("serial error"));
    expect(await driver.listSerialPorts()).toEqual([]);
  });

  it("writes bytes via print_raw_serial with configured port", async () => {
    vi.mocked(platform.isTauri).mockReturnValue(true);
    vi.mocked(tauriCore.invoke).mockResolvedValueOnce(undefined);

    driver.configure({
      connectionType: "serial",
      portName: "COM3",
      baudRate: 115200,
    });

    const bytes = new Uint8Array([0x1b, 0x40]);
    await driver.write(bytes);

    expect(tauriCore.invoke).toHaveBeenCalledWith("print_raw_serial", {
      portName: "COM3",
      baudRate: 115200,
      data: [27, 64],
    });
  });

  it("auto-selects first available port if portName is empty", async () => {
    vi.mocked(platform.isTauri).mockReturnValue(true);
    vi.mocked(tauriCore.invoke)
      .mockResolvedValueOnce(["COM4"]) // list_serial_ports
      .mockResolvedValueOnce(undefined); // print_raw_serial

    const bytes = new Uint8Array([1, 2, 3]);
    await driver.write(bytes);

    expect(tauriCore.invoke).toHaveBeenCalledWith("print_raw_serial", {
      portName: "COM4",
      baudRate: 9600,
      data: [1, 2, 3],
    });
  });

  it("throws when no serial ports are available and portName is empty", async () => {
    vi.mocked(platform.isTauri).mockReturnValue(true);
    vi.mocked(tauriCore.invoke).mockResolvedValueOnce([]); // list_serial_ports empty

    const bytes = new Uint8Array([1, 2, 3]);
    await expect(driver.write(bytes)).rejects.toThrow(
      "Port serial printer belum dipilih atau tidak ada printer terhubung."
    );
  });

  it("writes bytes via print_raw_network when configured for network", async () => {
    vi.mocked(platform.isTauri).mockReturnValue(true);
    vi.mocked(tauriCore.invoke).mockResolvedValueOnce(undefined);

    driver.configure({
      connectionType: "network",
      networkAddress: "192.168.1.200:9100",
    });

    const bytes = new Uint8Array([0x1b, 0x69]);
    await driver.write(bytes);

    expect(tauriCore.invoke).toHaveBeenCalledWith("print_raw_network", {
      address: "192.168.1.200:9100",
      data: [27, 105],
    });
  });

  it("throws if network address is empty in network mode", async () => {
    vi.mocked(platform.isTauri).mockReturnValue(true);

    driver.configure({
      connectionType: "network",
      networkAddress: "",
    });

    const bytes = new Uint8Array([1]);
    await expect(driver.write(bytes)).rejects.toThrow(
      "Alamat IP printer jaringan belum ditentukan."
    );
  });

  it("provides meaningful device names", () => {
    driver.configure({ connectionType: "serial", portName: "COM5" });
    expect(driver.getDeviceName()).toBe("Serial Printer (COM5)");

    driver.configure({ connectionType: "network", networkAddress: "192.168.1.50" });
    expect(driver.getDeviceName()).toBe("Network Printer (192.168.1.50)");
  });
});

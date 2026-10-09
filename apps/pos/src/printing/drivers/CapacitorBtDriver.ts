import type { PrinterDriver, PrinterDriverId } from "./types";
import { isCapacitor, isAndroid } from "../../lib/platform";
import { registerPlugin } from "@capacitor/core";

export interface BluetoothDeviceInfo {
  name: string;
  address: string;
}

export interface BluetoothPrinterPluginInterface {
  listBondedDevices(): Promise<{ devices: BluetoothDeviceInfo[] }>;
  printRaw(options: { address: string; data: number[] }): Promise<void>;
}

export const BluetoothPrinter = registerPlugin<BluetoothPrinterPluginInterface>("BluetoothPrinter");

export interface CapacitorBtDriverOptions {
  address?: string;
  deviceName?: string;
}

export class CapacitorBtDriver implements PrinterDriver {
  readonly id: PrinterDriverId = "capacitor-bt";
  readonly name = "Bluetooth Thermal Printer (Android)";

  private connected: boolean = false;
  private address: string = "";
  private deviceName: string = "";

  constructor(options: CapacitorBtDriverOptions = {}) {
    this.configure(options);
  }

  configure(options: CapacitorBtDriverOptions): void {
    if (options.address !== undefined) this.address = options.address;
    if (options.deviceName !== undefined) this.deviceName = options.deviceName;
  }

  isSupported(): boolean {
    return isCapacitor() && isAndroid();
  }

  async listBondedDevices(): Promise<BluetoothDeviceInfo[]> {
    if (!this.isSupported()) {
      return [];
    }
    try {
      const res = await BluetoothPrinter.listBondedDevices();
      return res.devices || [];
    } catch (err) {
      console.error("Gagal mendeteksi printer Bluetooth:", err);
      return [];
    }
  }

  async connect(): Promise<void> {
    if (!this.isSupported()) {
      throw new Error("Capacitor Bluetooth driver hanya didukung di aplikasi Android.");
    }
    this.connected = true;
  }

  async write(bytes: Uint8Array): Promise<void> {
    if (!this.isSupported()) {
      throw new Error("Capacitor Bluetooth driver hanya didukung di aplikasi Android.");
    }

    if (!this.address) {
      const devices = await this.listBondedDevices();
      if (devices.length > 0) {
        this.address = devices[0].address;
        this.deviceName = devices[0].name;
      } else {
        throw new Error(
          "Printer Bluetooth belum dipilih dan tidak ada perangkat yang terpasang (paired)."
        );
      }
    }

    const payload = Array.from(bytes);
    await BluetoothPrinter.printRaw({
      address: this.address,
      data: payload,
    });
  }

  async disconnect(): Promise<void> {
    this.connected = false;
  }

  isConnected(): boolean {
    return this.connected;
  }

  getDeviceName(): string | null {
    if (this.deviceName) {
      return `Bluetooth Printer (${this.deviceName})`;
    }
    if (this.address) {
      return `Bluetooth Printer (${this.address})`;
    }
    return "Bluetooth Thermal Printer";
  }
}
